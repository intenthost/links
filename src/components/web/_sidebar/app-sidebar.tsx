import type { ComponentProps } from "react";
import { NavMain } from "@/components/web/_sidebar/nav-main";
import { NavUser } from "@/components/web/_sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import AppLogo from "@/components/web/app-logo";

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
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2.5 px-1 py-1.5">
          <AppLogo />
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold tracking-tight">Links</span>
            <span className="truncate text-xs text-muted-foreground">Intent Host</span>
          </div>
        </div>
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
