// Types for Cloudflare Worker environment and globals
export interface KVNamespace {
  get<T = unknown>(key: string, type?: "text" | "json" | "arrayBuffer" | "stream"): Promise<T | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expiration?: number; expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

export interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    indexes?: string[];
    blobs?: string[];
    doubles?: number[];
  }): void;
}

export interface Env {
  LINK_METRICS?: AnalyticsEngineDataset;
  LINKS_KV?: KVNamespace;
  FALLBACK_URL?: string;
  APP_ORIGIN_URL?: string;
}

// Social platform shortcodes mapping: ?=x, ?=ig, ?=in, etc.
const SOCIAL_CODE_ALIASES: Record<string, string> = {
  x: "x.com",
  twitter: "x.com",
  tw: "x.com",
  ig: "instagram.com",
  insta: "instagram.com",
  instagram: "instagram.com",
  in: "linkedin.com",
  li: "linkedin.com",
  linkedin: "linkedin.com",
  fb: "facebook.com",
  facebook: "facebook.com",
  yt: "youtube.com",
  youtube: "youtube.com",
  wa: "whatsapp.com",
  whatsapp: "whatsapp.com",
  tt: "tiktok.com",
  tiktok: "tiktok.com",
  tg: "telegram.org",
  telegram: "telegram.org",
  rd: "reddit.com",
  reddit: "reddit.com",
  pi: "pinterest.com",
  pinterest: "pinterest.com",
  th: "threads.net",
  threads: "threads.net",
};

function extractSocialSource(search: string): string | null {
  if (!search) return null;
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;

  for (const part of raw.split("&")) {
    if (!part) continue;
    const [k, v] = part.split("=");
    const key = (k || "").toLowerCase().trim();
    const val = (v || "").toLowerCase().trim();

    // Pattern 1: ?=x
    if (key === "" && val && SOCIAL_CODE_ALIASES[val]) {
      return SOCIAL_CODE_ALIASES[val];
    }
    // Pattern 2: ?x
    if (key && (v === undefined || val === "") && SOCIAL_CODE_ALIASES[key]) {
      return SOCIAL_CODE_ALIASES[key];
    }
    // Pattern 3: ?social=x or ?utm_source=x
    if (["social", "s", "utm_source"].includes(key) && val && SOCIAL_CODE_ALIASES[val]) {
      return SOCIAL_CODE_ALIASES[val];
    }
  }
  return null;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const slug = pathname.slice(1); // remove leading slash

    // 1. Skip static assets, health checks
    if (pathname === "/favicon.ico" || pathname === "/robots.txt") {
      return new Response(null, { status: 404 });
    }

    // 2. Lookup keys: check domain-specific root or short-link
    let targetUrl: string | null = null;
    let linkId: string | null = null;
    let workspaceId: string | null = null;

    if (env.LINKS_KV) {
      const lookupSlug = slug || "_root";
      // First try domain-specific link: "go.intenthost.com:xxx" or "go.intenthost.com:_root"
      const linkRecord = await env.LINKS_KV.get<{
        url: string;
        id?: string;
        workspaceId?: string;
      }>(`${hostname}:${lookupSlug}`, "json");

      if (linkRecord) {
        targetUrl = linkRecord.url;
        linkId = linkRecord.id || null;
        workspaceId = linkRecord.workspaceId || null;
      } else if (slug) {
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

    // 3. If not in KV, proxy to primary Next.js origin or fallback
    if (!targetUrl) {
      if (env.APP_ORIGIN_URL) {
        const originUrl = new URL(request.url);
        const upstream = new URL(env.APP_ORIGIN_URL);
        originUrl.protocol = upstream.protocol;
        originUrl.host = upstream.host;
        return fetch(originUrl.toString(), request);
      }

      if (pathname === "/" || !slug) {
        const fallback = env.FALLBACK_URL || "https://links.intenthost.com";
        return Response.redirect(fallback, 302);
      }

      return Response.redirect(env.FALLBACK_URL || "https://links.intenthost.com", 302);
    }

    // 4. Extract Social Tracking & Referrer
    const socialSource = extractSocialSource(url.search);
    const rawReferer = request.headers.get("referer") || "";
    const referer = socialSource || rawReferer || "direct";

    // 5. Log to Cloudflare Workers Analytics Engine (Native metrics)
    const cf = (request as unknown as { cf?: Record<string, string> }).cf || {};
    const country = cf.country || "XX";
    const city = cf.city || "Unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    if (env.LINK_METRICS) {
      ctx.waitUntil(
        Promise.resolve().then(() => {
          try {
            env.LINK_METRICS!.writeDataPoint({
              indexes: [slug || "_root"], // Primary index by shortcode
              blobs: [
                hostname,         // blob 1: domain
                country,          // blob 2: country code
                city,             // blob 3: city
                referer,          // blob 4: referer or social platform
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

    // 6. Append query params onto the destination
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
        "X-Powered-By": "IntentHost-Edge-Links",
      },
    });
  },
};
