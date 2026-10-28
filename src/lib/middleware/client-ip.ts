import { normalizeIp } from "./rate-limit";

/**
 * Single client-IP extractor for rate limiting AND analytics.
 * Trust order: platform-injected values first (Cloudflare cf-connecting-ip when cf-ray is present),
 * then x-real-ip and x-forwarded-for.
 */
export function getClientIp(
  headers: Pick<Headers, "get">,
  fallback = "unknown",
): string {
  const hasCloudflare = Boolean(headers.get("cf-ray"));
  const forwarded = headers.get("x-forwarded-for");
  const hops = forwarded
    ?.split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  const ip =
    (hasCloudflare ? headers.get("cf-connecting-ip") : null) ||
    headers.get("x-real-ip") ||
    hops?.[0] ||
    fallback;

  return normalizeIp(ip);
}
