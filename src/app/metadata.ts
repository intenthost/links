import type { Metadata, Viewport } from "next";

const ROOT_DOMAIN = (process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || "slugy.co")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const IS_LOCAL = ROOT_DOMAIN.startsWith("localhost");
const BASE_URL = `${IS_LOCAL ? "http" : "https"}://${ROOT_DOMAIN}`;

// PNG/JPG at 1200x630 has the best scraper compatibility
const OG_IMAGE_URL = "https://files.slugy.co/slugy-og.png";

// Outcome-led, but keeps the "short link" head term so it still reads as a
// category match in search and on link previews. The differentiator is that
// Slugy attributes revenue, not just clicks — see hero.tsx for the same angle.
const TITLE = "Links — Intent Host";
const DESCRIPTION =
  "Minimal, high-performance link management and analytics by Intent Host.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITLE,
    template: "%s | Intent Host Links",
  },
  description: DESCRIPTION,
  applicationName: "Intent Host Links",
  authors: [
    { name: "Subh Mondal", url: "https://subhmondal.com" },
    { name: "Intent Host", url: "https://intenthost.com" },
  ],
  creator: "Intent Host",
  publisher: "Intent Host",
  category: "Technology",
  referrer: "origin-when-cross-origin",
  keywords: [
    "URL shortener",
    "short links",
    "link management",
    "link analytics",
    "custom domains",
    "branded links",
  ],
  icons: {
    icon: [
      { url: "https://cdn.intenthost.com/assets/brand/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "https://cdn.intenthost.com/assets/brand/favicon.ico" },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Intent Host Links",
    title: TITLE,
    description: DESCRIPTION,
    url: BASE_URL,
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};
