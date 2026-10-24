"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createAuthClient } from "better-auth/react";
import {
  UserCheck01Icon,
  Sorting05Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/web/huge-icon";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { signOutAndRedirect } from "@/lib/auth-client";

// ─────────── Types ───────────

interface User {
  name: string;
  email: string;
  image: string | null;
}

// ─────────── Hooks ───────────

const { useSession } = createAuthClient();

export const NavUser = () => {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  const handleSignOut = async () => {
    await signOutAndRedirect("/login");
  };

  if (isPending) return <LoadingSkeleton />;
  if (!session) return null;

  const user: User = {
    name: session.user.name ?? "Intent Host",
    email: session.user.email ?? "",
    image: session.user.image ?? null,
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <UserAvatar user={user} />
              <UserInfo user={user} />
              <HugeIcon icon={Sorting05Icon} className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <UserAvatar user={user} />
                <UserInfo user={user} />
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/account" className="flex items-center gap-2">
                  <HugeIcon icon={UserCheck01Icon} className="size-4" />
                  Account
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer flex items-center gap-2"
            >
              <HugeIcon icon={Logout01Icon} className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

// ─────────── Sub-components ───────────

const UserAvatar = ({ user }: { user: User }) => (
  <Avatar className="h-8 w-8 rounded-lg">
    <AvatarImage src={user.image || undefined} alt={user.name} />
    <AvatarFallback className="rounded-lg">
      {user.name.slice(0, 2).toUpperCase()}
    </AvatarFallback>
  </Avatar>
);

const UserInfo = ({ user }: { user: User }) => (
  <div className="grid flex-1 text-left text-sm leading-tight">
    <span className="truncate font-medium">{user.name}</span>
    <span className="truncate text-xs">{user.email}</span>
  </div>
);

const LoadingSkeleton = () => (
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-colors duration-200"
          >
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 gap-1 text-left">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
            <HugeIcon icon={Sorting05Icon} className="text-sidebar-foreground/70 ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
);
