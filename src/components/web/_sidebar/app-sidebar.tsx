import type { ComponentProps } from "react";
import { NavMain } from "@/components/web/_sidebar/nav-main";
import { NavUser } from "@/components/web/_sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";

// ============================================================================
// Types
// ============================================================================

export interface WorkspaceMinimal {
  id: string;
  name: string;
  slug: string;
  userRole: "owner" | "admin" | "member" | null;
}

interface AppSidebarProps
  extends Omit<ComponentProps<typeof Sidebar>, "workspaces"> {
  workspaces: WorkspaceMinimal[];
  workspaceslug: string;
}

// ============================================================================
// Main Component
// ============================================================================

export default function AppSidebar({
  workspaceslug,
  workspaces,
  ...props
}: AppSidebarProps) {
  const currentWorkspace =
    workspaces.find((ws) => ws.slug === workspaceslug) ?? workspaces[0];
  const workspaceName = currentWorkspace?.name || "Workspace";
  const workspaceSlug = currentWorkspace?.slug || workspaceslug;
  const workspaceInitial = workspaceName.charAt(0).toUpperCase();

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="p-3">
        <Link
          href={`/${workspaceSlug}`}
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <div className="bg-primary/10 text-primary flex aspect-square size-8 items-center justify-center rounded-lg font-bold text-sm">
            {workspaceInitial}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold tracking-tight">
              {workspaceName}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {workspaceSlug}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="scrollbar-thin">
        <NavMain workspaces={workspaces} workspaceslug={workspaceslug} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
