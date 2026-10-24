"use server";
import { z } from "zod";
import { parseWorkspaceSlug } from "@/lib/workspace-cookie";
import { requireSelf } from "@/lib/require-self";

import { getAuthSession } from "@/lib/auth";
import { db } from "@/server/db";
import { checkWorkspaceLimit } from "@/server/actions/limit";
import { revalidateTag, revalidatePath } from "next/cache";
import {
  getAllWorkspacesCache,
  setAllWorkspacesCache,
  getWorkspaceValidationCache,
  setWorkspaceValidationCache,
  invalidateWorkspaceCache,
} from "@/lib/cache-utils/workspace-cache";

// Revalidate all workspace-related cache tags
async function revalidateWorkspaceTags() {
  try {
    await Promise.all([
      revalidateTag("workspaces", "max"),
      revalidateTag("all-workspaces", "max"),
      revalidateTag("workspace", "max"),
      revalidateTag("workspace-validation", "max"),
    ]);
  } catch {
    // ignore
  }
}

export async function createWorkspace({
  name,
  slug,
  logo,
  isDefault = false,
}: {
  name: string;
  slug: string;
  logo?: string;
  isDefault?: boolean;
}) {
  try {
    const authResult = await getAuthSession();
    if (!authResult.success) {
      return { success: false, error: "Unauthorized" };
    }

    const userId = authResult.session.user.id;

    // Validate inputs
    const validatedData = z
      .object({
        name: z.string().min(1).max(50),
        slug: z.string().min(1).max(50),
      })
      .parse({ name, slug });

    // Check slug availability
    const existing = await db.workspace.findUnique({
      where: { slug: validatedData.slug },
      select: { id: true },
    });
    if (existing) {
      return { success: false, error: "Workspace slug is already taken" };
    }

    const workspace = await db.$transaction(async (tx) => {
      const limitCheck = await checkWorkspaceLimit(userId);
      if (!limitCheck.canCreateWorkspace)
        throw new Error("Workspace limit reached");
      if (isDefault) {
        await tx.workspace.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const created = await tx.workspace.create({
        data: { userId, name, slug, logo, isDefault },
        select: { id: true, name: true, slug: true },
      });

      return created;
    });

    // Revalidate caches
    await Promise.all([
      invalidateWorkspaceCache(userId),
      revalidateWorkspaceTags(),
    ]);
    revalidatePath(`/${workspace.slug}`);

    return {
      success: true,
      workspace,
      message: "Workspace created successfully",
    };
  } catch (error) {
    console.error("Error creating workspace:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create workspace",
    };
  }
}

export async function getWorkspace() {
  try {
    const authResult = await getAuthSession();
    if (!authResult.success) {
      return { success: false, workspace: null };
    }

    const userId = authResult.session.user.id;

    const workspace = await db.workspace.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        isDefault: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, workspace };
  } catch (error) {
    console.error("Error fetching workspace:", error);
    return { success: false, workspace: null };
  }
}

export async function getRedirectWorkspace(userId: string) {
  try {
    await requireSelf(userId);
    const workspace = await db.workspace.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        userId: true,
        isDefault: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!workspace) {
      return { success: false, workspace: null };
    }

    const {
      userId: _owner,
      isDefault: _isDefault,
      ...redirectWorkspace
    } = workspace;
    return { success: true, workspace: redirectWorkspace };
  } catch (error) {
    console.error("Error getting redirect workspace:", error);
    return { success: false, workspace: null };
  }
}

export async function fetchAllWorkspaces(userId: string) {
  try {
    await requireSelf(userId);
    const cachedWorkspaces = await getAllWorkspacesCache(userId);
    if (cachedWorkspaces) {
      return { success: true, workspaces: cachedWorkspaces };
    }

    const workspaces = await db.workspace.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        userId: true,
        logo: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const workspacesWithRoles = workspaces.map((workspace) => {
      return {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        userId: workspace.userId,
        logo: workspace.logo,
        userRole: "owner" as const,
        role: "owner" as const,
      };
    });

    await setAllWorkspacesCache(userId, workspacesWithRoles);

    return { success: true, workspaces: workspacesWithRoles };
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return { success: false, workspaces: [] };
  }
}

export async function validateWorkspaceSlug(
  userId: string,
  rawSlug: string,
) {
  try {
    await requireSelf(userId);
    const slug = parseWorkspaceSlug(rawSlug);
    if (!slug) {
      return { success: false, workspace: null };
    }

    const cachedWorkspaceResult = await getWorkspaceValidationCache(
      userId,
      slug,
    );
    if (cachedWorkspaceResult.hasValue) {
      return {
        success: !!cachedWorkspaceResult.workspace,
        workspace: cachedWorkspaceResult.workspace,
      };
    }

    const workspace = await db.workspace.findFirst({
      where: {
        slug,
        userId,
        deletedAt: null,
      },
      select: { id: true, name: true, slug: true, logo: true },
    });

    await setWorkspaceValidationCache(userId, slug, workspace ?? null);

    return {
      success: !!workspace,
      workspace: workspace ?? null,
    };
  } catch (error) {
    console.error("Error validating workspace slug:", error);
    return { success: false, workspace: null };
  }
}

export async function getWorkspaceLogo(workspaceslug: string) {
  try {
    const authResult = await getAuthSession();
    if (!authResult.success) {
      return { success: false, logo: null as string | null };
    }

    const userId = authResult.session.user.id;

    const workspace = await db.workspace.findFirst({
      where: {
        slug: workspaceslug,
        userId,
      },
      select: { logo: true },
    });

    return { success: true, logo: workspace?.logo ?? null };
  } catch (error) {
    console.error("Error fetching workspace logo:", error);
    return { success: false, logo: null as string | null };
  }
}
