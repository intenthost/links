import "server-only";
import { db } from "@/server/db";

export async function checkWorkspaceAccessAndLimits(
  userId: string,
  workspaceslug: string,
) {
  try {
    const workspace = await db.workspace.findFirst({
      where: {
        slug: workspaceslug,
        deletedAt: null,
        userId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
      },
    });

    if (!workspace) {
      return {
        success: false,
        message: "Workspace not found",
        workspace: null,
        canCreateLinks: false,
        currentLinks: 0,
        maxLinks: 99999999,
      };
    }

    return {
      success: true,
      message: "Workspace access granted",
      workspace,
      canCreateLinks: true,
      currentLinks: 0,
      maxLinks: 99999999,
    };
  } catch (error) {
    console.error("Error checking workspace access:", error);
    return {
      success: false,
      message: "Internal server error",
      workspace: null,
      canCreateLinks: true,
      currentLinks: 0,
      maxLinks: 99999999,
    };
  }
}

export async function checkWorkspaceLimit(_userId: string) {
  return {
    success: true,
    canCreate: true,
    currentWorkspaces: 0,
    maxWorkspaces: 99999999,
  };
}

export async function getUserWorkspaceStats(_userId: string) {
  return {
    success: true,
    currentWorkspaces: 1,
    maxWorkspaces: 99999999,
    canCreate: true,
  };
}

export async function checkLinkLimit(_userId: string, _workspaceId: string) {
  return {
    success: true,
    canCreate: true,
    currentLinks: 0,
    maxLinks: 99999999,
  };
}

export async function checkBioGalleryLimit(_userId: string) {
  return {
    success: true,
    canCreate: true,
    currentGalleries: 0,
    maxGalleries: 99999999,
  };
}

export async function checkBioGalleryLinkLimit(_userId: string, _bioId: string) {
  return {
    success: true,
    canCreate: true,
    currentLinks: 0,
    maxLinks: 99999999,
  };
}

export async function checkDomainLimit(
  _userId: string,
  _workspaceId?: string,
) {
  return {
    success: true,
    canCreate: true,
    currentDomains: 0,
    maxDomains: 99999999,
  };
}
