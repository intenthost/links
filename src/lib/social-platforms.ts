/**
 * Supported social media tracking codes, canonical hosts, and labels.
 * Formats:
 *   shortlink?=x or shortlink?x -> x.com
 *   shortlink?=ig or shortlink?ig -> instagram.com
 *   shortlink?=in or shortlink?in -> linkedin.com
 *   etc.
 */

export interface SocialPlatformInfo {
  code: string;
  name: string;
  domain: string;
  color?: string;
}

export const SOCIAL_PLATFORMS: Record<string, SocialPlatformInfo> = {
  x: {
    code: "x",
    name: "X (Twitter)",
    domain: "x.com",
    color: "#000000",
  },
  ig: {
    code: "ig",
    name: "Instagram",
    domain: "instagram.com",
    color: "#E1306C",
  },
  in: {
    code: "in",
    name: "LinkedIn",
    domain: "linkedin.com",
    color: "#0A66C2",
  },
  fb: {
    code: "fb",
    name: "Facebook",
    domain: "facebook.com",
    color: "#1877F2",
  },
  yt: {
    code: "yt",
    name: "YouTube",
    domain: "youtube.com",
    color: "#FF0000",
  },
  wa: {
    code: "wa",
    name: "WhatsApp",
    domain: "whatsapp.com",
    color: "#25D366",
  },
  tt: {
    code: "tt",
    name: "TikTok",
    domain: "tiktok.com",
    color: "#000000",
  },
  tg: {
    code: "tg",
    name: "Telegram",
    domain: "telegram.org",
    color: "#229ED9",
  },
  rd: {
    code: "rd",
    name: "Reddit",
    domain: "reddit.com",
    color: "#FF4500",
  },
  pi: {
    code: "pi",
    name: "Pinterest",
    domain: "pinterest.com",
    color: "#BD081C",
  },
  th: {
    code: "th",
    name: "Threads",
    domain: "threads.net",
    color: "#000000",
  },
};

// Aliases mapping common alternative shorthand / query values
export const SOCIAL_CODE_ALIASES: Record<string, string> = {
  x: "x",
  twitter: "x",
  tw: "x",
  tweet: "x",
  ig: "ig",
  insta: "ig",
  instagram: "ig",
  in: "in",
  li: "in",
  linkedin: "in",
  fb: "fb",
  facebook: "fb",
  yt: "yt",
  youtube: "yt",
  wa: "wa",
  whatsapp: "wa",
  tt: "tt",
  tiktok: "tt",
  tg: "tg",
  telegram: "tg",
  rd: "rd",
  reddit: "rd",
  pi: "pi",
  pin: "pi",
  pinterest: "pi",
  th: "th",
  threads: "th",
};

/**
 * Extracts social platform code from request search string (e.g. `?=x`, `?x`, `?=ig`, `?utm_source=x`).
 */
export function extractSocialPlatform(search: string): SocialPlatformInfo | null {
  if (!search) return null;
  const raw = search.startsWith("?") ? search.slice(1) : search;
  if (!raw) return null;

  const parts = raw.split("&");
  for (const part of parts) {
    if (!part) continue;
    const [k, v] = part.split("=");
    const key = decodeURIComponent(k || "").toLowerCase().trim();
    const val = decodeURIComponent(v || "").toLowerCase().trim();

    // Pattern 1: ?=x (empty key, value is platform code)
    if (key === "" && val && SOCIAL_CODE_ALIASES[val]) {
      const canonicalCode = SOCIAL_CODE_ALIASES[val];
      return SOCIAL_PLATFORMS[canonicalCode] || null;
    }

    // Pattern 2: ?x (key is platform code, no value or empty value)
    if (key && (v === undefined || val === "") && SOCIAL_CODE_ALIASES[key]) {
      const canonicalCode = SOCIAL_CODE_ALIASES[key];
      return SOCIAL_PLATFORMS[canonicalCode] || null;
    }

    // Pattern 3: ?social=x or ?platform=x or ?s=x
    if (["social", "platform", "s"].includes(key) && val && SOCIAL_CODE_ALIASES[val]) {
      const canonicalCode = SOCIAL_CODE_ALIASES[val];
      return SOCIAL_PLATFORMS[canonicalCode] || null;
    }
  }

  return null;
}
