import { db } from "@/server/db";
import {
  addDomainToCloudflareDns,
  removeDomainFromCloudflareDns,
  checkCloudflareDnsStatus,
} from "./cloudflare-dns";

interface ApiResult {
  success: boolean;
  error?: string;
}

/**
 * Add a custom domain automatically to Cloudflare DNS with edge proxy & SSL.
 */
export async function addDomainToCloudflare(domain: string): Promise<{
  success: boolean;
  error?: string;
  dnsRecordId?: string;
}> {
  try {
    const res = await addDomainToCloudflareDns(domain);
    return res;
  } catch (error) {
    console.error("Error adding domain to Cloudflare:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to add domain to Cloudflare",
    };
  }
}

/**
 * Remove a domain from Cloudflare DNS
 */
export async function removeDomainFromCloudflare(
  dnsRecordId: string,
): Promise<ApiResult> {
  try {
    return await removeDomainFromCloudflareDns(dnsRecordId);
  } catch (error) {
    console.error("Error removing domain from Cloudflare:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to remove domain from Cloudflare",
    };
  }
}

/**
 * Check if domain DNS resolves and is configured on Cloudflare
 */
export async function checkDnsConfiguration(domain: string): Promise<{
  success: boolean;
  configured: boolean;
  error?: string;
}> {
  try {
    return await checkCloudflareDnsStatus(domain);
  } catch (error) {
    return {
      success: false,
      configured: false,
      error: error instanceof Error ? error.message : "DNS check failed",
    };
  }
}

/**
 * Validate domain format
 */
export function validateDomain(domain: string): {
  valid: boolean;
  error?: string;
} {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const domainRegex =
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

  if (!domainRegex.test(cleanDomain)) {
    return { valid: false, error: "Invalid domain format" };
  }

  if (
    cleanDomain.includes("localhost") ||
    /^(\d{1,3}\.){3}\d{1,3}$/.test(cleanDomain)
  ) {
    return { valid: false, error: "Cannot use localhost or IP addresses" };
  }

  return { valid: true };
}

/**
 * Check if domain is already in use
 */
export async function isDomainInUse(domain: string): Promise<boolean> {
  try {
    const existing = await db.customDomain.findUnique({
      where: { domain },
    });
    return !!existing;
  } catch (error) {
    console.error("Error checking domain usage:", error);
    return false;
  }
}
