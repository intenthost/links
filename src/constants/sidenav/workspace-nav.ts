import type { ComponentType } from "react";
import {
  Link01Icon,
  Globe02Icon,
  Analytics01Icon,
  Tag01Icon,
  Settings01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { createHugeIcon } from "@/components/web/huge-icon";

export type WorkspaceUserRole = "owner" | "admin" | "member" | null;

export type NavIcon = ComponentType<{
  className?: string;
  strokeWidth?: number;
  size?: number;
}>;

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem {
  title: string;
  url?: string;
  icon?: NavIcon;
  items?: NavSubItem[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const WORKSPACE_NAV_GROUPS: NavGroup[] = [
  {
    label: "Build",
    items: [
      { title: "Links", url: "/", icon: createHugeIcon(Link01Icon) },
      { title: "Domains", url: "/domains", icon: createHugeIcon(Globe02Icon) },
    ],
  },
  {
    label: "Analyze",
    items: [
      { title: "Analytics", url: "/analytics", icon: createHugeIcon(Analytics01Icon) },
    ],
  },
  {
    label: "Organize",
    items: [
      { title: "Tags", url: "/settings/library/tags", icon: createHugeIcon(Tag01Icon) },
      {
        title: "UTM Templates",
        url: "/settings/library/utm-template",
        icon: createHugeIcon(Add01Icon),
      },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        title: "Settings",
        icon: createHugeIcon(Settings01Icon),
        items: [
          { title: "General", url: "/settings" },
          { title: "API Keys", url: "/settings/api-keys" },
        ],
      },
    ],
  },
];

export const NAV_ACCESS_CONTROL = {
  restrictedSubItems: {
    "API key": ["owner", "admin"] as const,
    "API Keys": ["owner", "admin"] as const,
    General: ["owner", "admin"] as const,
  },
} as const;

const EXTRA_TITLES: Record<string, string> = {
  account: "Account",
};

const PARENT_TITLES: Record<string, string> = {
  library: "Library",
};

const SUB_TITLE_OVERRIDES: Record<string, string> = {
  General: "Settings",
};

export function getWorkspacePageTitle(
  pathname: string,
  workspaceslug?: string,
): string {
  if (!workspaceslug) return "Links";

  const rest = pathname.startsWith(`/${workspaceslug}`)
    ? pathname.slice(workspaceslug.length + 1)
    : pathname;
  const norm = rest === "" ? "/" : rest;

  for (const group of WORKSPACE_NAV_GROUPS) {
    for (const item of group.items) {
      if (item.url && item.url === norm) return item.title;
      const sub = item.items?.find((s) => s.url === norm);
      if (sub) return SUB_TITLE_OVERRIDES[sub.title] ?? sub.title;
    }
  }

  const segments = norm.split("/").filter(Boolean);
  const last = segments.at(-1) ?? "";
  const secondLast = segments.at(-2) ?? "";

  if (EXTRA_TITLES[last]) return EXTRA_TITLES[last];
  if (PARENT_TITLES[last]) return PARENT_TITLES[last];
  if (PARENT_TITLES[secondLast]) return PARENT_TITLES[secondLast];

  return "Links";
}
