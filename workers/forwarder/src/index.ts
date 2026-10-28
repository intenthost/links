export interface Env {
  LINK_METRICS?: AnalyticsEngineDataset;
  LINKS_KV?: KVNamespace;
  FALLBACK_URL?: string;
  APP_ORIGIN_URL?: string;
}

interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    indexes?: string[];
    blobs?: string[];
    doubles?: number[];
  }): void;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const slug = pathname.slice(1); // remove leading slash

    // 1. Skip static assets, health checks or root
    if (!slug || pathname === "/" || pathname === "/favicon.ico" || pathname === "/robots.txt") {
      const fallback = env.FALLBACK_URL || "https://links.intenthost.com";
      return Response.redirect(fallback, 302);
    }

    // 2. Lookup key: "domain:slug" or "slug"
    let targetUrl: string | null = null;
    let linkId: string | null = null;
    let workspaceId: string | null = null;

    if (env.LINKS_KV) {
      // First try domain-specific link: "go.intenthost.com:xxx"
      const linkRecord = await env.LINKS_KV.get<{
        url: string;
        id?: string;
        workspaceId?: string;
      }>(`${hostname}:${slug}`, "json");

      if (linkRecord) {
        targetUrl = linkRecord.url;
        linkId = linkRecord.id || null;
        workspaceId = linkRecord.workspaceId || null;
      } else {
        // Fallback to global slug
        const globalRecord = await env.LINKS_KV.get<{
          url: string;
          id?: string;
          workspaceId?: string;
        }>(slug, "json");
        if (globalRecord) {
          targetUrl = globalRecord.url;
          linkId = globalRecord.id || null;
          workspaceId = globalRecord.workspaceId || null;
        }
      }
    }

    // 3. If not in KV, optionally proxy or fallback to primary origin
    if (!targetUrl) {
      if (env.APP_ORIGIN_URL) {
        const originUrl = new URL(request.url);
        const upstream = new URL(env.APP_ORIGIN_URL);
        originUrl.protocol = upstream.protocol;
        originUrl.host = upstream.host;
        return fetch(originUrl.toString(), request);
      }
      return Response.redirect(env.FALLBACK_URL || "https://links.intenthost.com", 302);
    }

    // 4. Log to Cloudflare Workers Analytics Engine (Native metrics)
    const cf = (request as unknown as { cf?: Record<string, string> }).cf || {};
    const country = cf.country || "XX";
    const city = cf.city || "Unknown";
    const referer = request.headers.get("referer") || "direct";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (env.LINK_METRICS) {
      ctx.waitUntil(
        Promise.resolve().then(() => {
          try {
            env.LINK_METRICS!.writeDataPoint({
              indexes: [slug], // Primary index by shortcode
              blobs: [
                hostname,         // blob 1: domain
                country,          // blob 2: country code
                city,             // blob 3: city
                referer,          // blob 4: referer
                userAgent,        // blob 5: UA
                workspaceId || "",// blob 6: workspaceId
                linkId || "",     // blob 7: linkId
              ],
              doubles: [1], // double 1: 1 click
            });
          } catch (err) {
            console.error("Failed to write to Analytics Engine:", err);
          }
        }),
      );
    }

    // 5. Append query params if destination preserves them
    const destUrl = new URL(targetUrl);
    for (const [k, v] of url.searchParams.entries()) {
      if (!destUrl.searchParams.has(k)) {
        destUrl.searchParams.set(k, v);
      }
    }

    return new Response(null, {
      status: 302,
      headers: {
        Location: destUrl.toString(),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Powered-By": "Cloudflare-Worker-Links",
      },
    });
  },
};
