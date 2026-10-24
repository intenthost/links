"use server";
import { db } from "@/server/db";

export async function checkWorkspaceAccessAndLimits(
  userId: string,
  workspaceslug: string,
) {
  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceslug,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      userId: true,
    },
  });

  return {
    success: true,
    message: "Access granted",
    workspace,
    canCreateLinks: true,
    currentLinks: 0,
    maxLinks: 99999999,
  };
}

export async function checkWorkspaceLimit(userId: string) {
  return {
    success: true,
    canCreateWorkspace: true,
    currentWorkspaces: 1,
    maxWorkspaces: 99999999,
  };
}

export async function getUserWorkspaceStats(userId: string) {
  return {
    success: true,
    stats: {
      currentWorkspaces: 1,
      maxWorkspaces: 99999999,
      canCreateMore: true,
    },
  };
}

export async function checkLinkLimit(userId: string, workspaceId: string) {
  return {
    success: true,
    canCreateLink: true,
    currentLinks: 0,
    maxLinks: 99999999,
  };
}

export async function checkBioGalleryLimit(userId: string) {
  return {
    success: true,
    canCreateBio: true,
    currentBios: 0,
    maxBios: 99999999,
  };
}

export async function checkBioGalleryLinkLimit(userId: string, bioId: string) {
  return {
    success: true,
    canCreateLink: true,
    currentLinks: 0,
    maxLinks: 99999999,
  };
}

export async function checkDomainLimit(
  workspaceId: string,
  maxDomains: number,
) {
  return {
    success: true,
    canAddDomain: true,
    currentDomains: 0,
    maxDomains: 99999999,
  };
}
