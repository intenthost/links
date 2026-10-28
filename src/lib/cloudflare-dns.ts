const CLOUDFLARE_API_URL = "https://api.cloudflare.com/client/v4";

interface CloudflareConfig {
  apiToken: string;
  zoneId?: string;
  accountId?: string;
}

export function getCloudflareCredentials(): CloudflareConfig {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN || "";
  const zoneId = process.env.CLOUDFLARE_ZONE_ID || "";
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";

  if (!apiToken) {
    throw new Error("Missing required env var: CLOUDFLARE_API_TOKEN");
  }

  return { apiToken, zoneId, accountId };
}

/**
 * Automatically creates or updates a CNAME/A record on Cloudflare DNS
 * Points domain/subdomain to target with Cloudflare proxy (orange cloud) and automatic SSL.
 */
export async function addDomainToCloudflareDns(
  subdomainOrDomain: string,
  target?: string,
): Promise<{
  success: boolean;
  dnsRecordId?: string;
  error?: string;
}> {
  try {
    const { apiToken, zoneId } = getCloudflareCredentials();
    if (!zoneId) {
      throw new Error("Missing required env var: CLOUDFLARE_ZONE_ID");
    }

    const defaultTarget =
      target || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "links.intenthost.com";

    // Check if record already exists
    const searchRes = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records?name=${encodeURIComponent(subdomainOrDomain)}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    const searchData = await searchRes.json();

    if (searchData.result && searchData.result.length > 0) {
      return {
        success: true,
        dnsRecordId: searchData.result[0].id,
      };
    }

    // Create CNAME record with proxy enabled (Cloudflare edge handles SSL & metrics automatically)
    const createRes = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "CNAME",
          name: subdomainOrDomain,
          content: defaultTarget,
          ttl: 1, // Auto
          proxied: true, // Cloudflare edge proxy with free SSL
        }),
      },
    );

    const createData = await createRes.json();
    if (!createRes.ok || !createData.success) {
      return {
        success: false,
        error: createData.errors?.[0]?.message || "Failed to create Cloudflare DNS record",
      };
    }

    return {
      success: true,
      dnsRecordId: createData.result?.id,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cloudflare DNS creation failed",
    };
  }
}

/**
 * Remove a DNS record from Cloudflare
 */
export async function removeDomainFromCloudflareDns(
  dnsRecordIdOrDomain: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { apiToken, zoneId } = getCloudflareCredentials();
    if (!zoneId) return { success: false, error: "Missing CLOUDFLARE_ZONE_ID" };

    let recordId = dnsRecordIdOrDomain;

    // If a domain name was provided instead of a record ID, look up the record ID first
    if (dnsRecordIdOrDomain.includes(".")) {
      const searchRes = await fetch(
        `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records?name=${encodeURIComponent(dnsRecordIdOrDomain)}`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      const searchData = await searchRes.json();
      if (searchData.result && searchData.result.length > 0) {
        recordId = searchData.result[0].id;
      } else {
        return { success: true };
      }
    }

    const res = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/dns_records/${recordId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      },
    );

    const data = await res.json();
    return { success: data.success || false };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Cloudflare deletion failed",
    };
  }
}

/**
 * Checks DNS resolution for Cloudflare proxied or custom domains
 */
export async function checkCloudflareDnsStatus(domain: string): Promise<{
  success: boolean;
  configured: boolean;
  error?: string;
}> {
  try {
    const dohRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      {
        headers: { Accept: "application/dns-json" },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (dohRes.ok) {
      const doh = (await dohRes.json()) as {
        Status?: number;
        Answer?: Array<{ type: number; data: string }>;
      };

      const hasAnswers = Boolean(doh.Answer && doh.Answer.length > 0);
      return {
        success: true,
        configured: hasAnswers,
        error: hasAnswers ? undefined : "DNS record is still propagating or not yet configured.",
      };
    }

    return { success: true, configured: false, error: "Failed to query DNS" };
  } catch (err) {
    return {
      success: false,
      configured: false,
      error: err instanceof Error ? err.message : "DNS check failed",
    };
  }
}

/**
 * Syncs a shortlink directly to Cloudflare KV for edge routing
 */
export async function syncLinkToCloudflareKV(
  slug: string,
  url: string,
  domain: string,
  metadata?: { id?: string; workspaceId?: string },
): Promise<boolean> {
  try {
    const { apiToken, accountId } = getCloudflareCredentials();
    const kvNamespaceId = process.env.CLOUDFLARE_LINKS_KV_ID;
    if (!accountId || !kvNamespaceId) return false;

    const payload = JSON.stringify({
      url,
      id: metadata?.id,
      workspaceId: metadata?.workspaceId,
    });

    // Write domain:slug key
    await fetch(
      `${CLOUDFLARE_API_URL}/accounts/${accountId}/storage/kv/namespaces/${kvNamespaceId}/values/${encodeURIComponent(`${domain}:${slug}`)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "text/plain",
        },
        body: payload,
      },
    );

    return true;
  } catch (err) {
    console.error("Failed to sync link to Cloudflare KV:", err);
    return false;
  }
}
