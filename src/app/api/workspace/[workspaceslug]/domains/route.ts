import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  validateDomain,
  isDomainInUse,
  addDomainToCloudflare,
  removeDomainFromCloudflare,
  checkDnsConfiguration,
} from "@/lib/domain-utils";
import {
  withWorkspaceQuota,
  WorkspaceQuotaError,
} from "@/lib/subscription/workspace-quota";
import { jsonWithETag } from "@/lib/http";
import { getWorkspaceAccess, hasRole } from "@/lib/workspace-access";
import { checkDomainVerifyRateLimit } from "@/lib/middleware/rate-limit";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Helper: Get authenticated session
async function getSession(req?: NextRequest) {
  let session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session && req) {
    session = await auth.api.getSession({
      headers: req.headers,
    });
  }
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Helper: Get workspace with access check
async function getWorkspace(
  workspaceSlug: string,
  userId: string,
  requireAdminAccess = false,
) {
  const workspace = await db.workspace.findFirst({
    where: {
      slug: workspaceSlug,
      deletedAt: null,
      userId,
    },
  });

  if (!workspace) {
    throw new Error(
      requireAdminAccess
        ? "Workspace not found or insufficient permissions"
        : "Workspace not found",
    );
  }

  return workspace;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceslug: string }> },
) {
  try {
    const session = await getSession(req);
    const { workspaceslug } = await params;

    const workspace = await db.workspace.findFirst({
      where: {
        slug: workspaceslug,
        userId: session.user.id,
      },
      select: {
        id: true,
        customDomains: {
          select: {
            id: true,
            domain: true,
            verified: true,
            dnsConfigured: true,
            lastChecked: true,
            sslEnabled: true,
            sslIssuer: true,
            sslExpiresAt: true,
            cloudflareCnameTarget: true,
            cloudflareStatus: true,
            redirectToWww: true,
            createdAt: true,
            updatedAt: true,
            verificationToken: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!workspace) {
      return jsonWithETag(
        req,
        { error: "Workspace not found" },
        { status: 404 },
      );
    }

    const access = await getWorkspaceAccess(session.user.id, workspaceslug);
    const isOwnerOrAdmin = access.success && hasRole(access.role, "admin");

    const domains = isOwnerOrAdmin
      ? workspace.customDomains
      : workspace.customDomains.map(({ verificationToken, ...rest }) => rest);

    return jsonWithETag(req, { domains });
  } catch (error) {
    console.error("Error fetching domains:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch domains";
    const status = message === "Unauthorized" ? 401 : 500;
    return jsonWithETag(req, { error: message }, { status });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceslug: string }> },
) {
  try {
    const session = await getSession(req);
    const { workspaceslug } = await params;
    const body = await req.json();

    // Validate domain format
    const domain = body.domain?.toLowerCase().trim();
    const validation = validateDomain(domain);
    if (!validation.valid) {
      return jsonWithETag(req, { error: validation.error }, { status: 400 });
    }

    // Verify workspace access (admin only)
    const workspace = await getWorkspace(workspaceslug, session.user.id, true);

    // Check if domain is already in use
    const inUse = await isDomainInUse(domain);
    if (inUse) {
      return jsonWithETag(
        req,
        { error: "Domain is already in use" },
        { status: 409 },
      );
    }

    // Reserve capacity atomically
    const reservation = await withWorkspaceQuota(
      workspace.id,
      async (tx, plan) => {
        const count = await tx.customDomain.count({
          where: { workspaceId: workspace.id },
        });
        if (count >= plan.maxCustomDomains)
          throw new WorkspaceQuotaError(
            "Custom domain limit reached for this plan.",
          );
        return tx.customDomain.create({
          data: {
            domain,
            workspaceId: workspace.id,
            verified: true, // Internal automated Cloudflare provision
            dnsConfigured: true,
            sslEnabled: true,
            cloudflareStatus: "active",
          },
        });
      },
    );

    // Automatically provision on Cloudflare DNS
    let cloudflareResult;
    try {
      cloudflareResult = await addDomainToCloudflare(domain);
    } catch (error) {
      await db.customDomain.delete({ where: { id: reservation.id } });
      throw error;
    }

    if (!cloudflareResult.success) {
      await db.customDomain.delete({ where: { id: reservation.id } });
      return jsonWithETag(
        req,
        { error: cloudflareResult.error || "Failed to add domain to Cloudflare" },
        { status: 500 },
      );
    }

    const customDomain = await db.customDomain.update({
      where: { id: reservation.id },
      data: {
        cloudflareCustomHostnameId: cloudflareResult.dnsRecordId || null,
        cloudflareCnameTarget: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "links.intenthost.com",
      },
    });

    return jsonWithETag(
      req,
      {
        domain: customDomain,
        cnameTarget: process.env.NEXT_PUBLIC_ROOT_DOMAIN || "links.intenthost.com",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof WorkspaceQuotaError)
      return jsonWithETag(req, { error: error.message }, { status: 403 });
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    )
      return jsonWithETag(
        req,
        { error: "Domain is already in use" },
        { status: 409 },
      );
    console.error("Error adding domain:", error);
    const message =
      error instanceof Error ? error.message : "Failed to add domain";
    const status =
      message.includes("Unauthorized") || message.includes("permissions")
        ? 403
        : 500;
    return jsonWithETag(req, { error: message }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceslug: string }> },
) {
  try {
    const session = await getSession(req);
    const { workspaceslug } = await params;
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return jsonWithETag(
        req,
        { error: "Domain ID is required" },
        { status: 400 },
      );
    }

    // Verify workspace access (admin only)
    const workspace = await getWorkspace(workspaceslug, session.user.id, true);

    // Get and verify domain ownership
    const customDomain = await db.customDomain.findUnique({
      where: { id: domainId },
    });

    if (!customDomain || customDomain.workspaceId !== workspace.id) {
      return jsonWithETag(req, { error: "Domain not found" }, { status: 404 });
    }

    const linkCount = await db.link.count({
      where: { customDomainId: domainId, workspaceId: workspace.id },
    });
    if (linkCount > 0) {
      return jsonWithETag(
        req,
        {
          error: `This domain has ${linkCount} active short link${linkCount === 1 ? "" : "s"}. Move or delete them before deleting the domain.`,
          linkCount,
        },
        { status: 409 },
      );
    }

    // Remove from Cloudflare
    if (customDomain.cloudflareCustomHostnameId) {
      await removeDomainFromCloudflare(customDomain.cloudflareCustomHostnameId).catch(console.error);
    } else {
      await removeDomainFromCloudflare(customDomain.domain).catch(console.error);
    }

    await db.customDomain.delete({ where: { id: domainId } });

    return jsonWithETag(req, { success: true });
  } catch (error) {
    console.error("Error deleting domain:", error);
    const message =
      error instanceof Error ? error.message : "Failed to delete domain";
    const status =
      message.includes("Unauthorized") || message.includes("permissions")
        ? 403
        : 500;
    return jsonWithETag(req, { error: message }, { status });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceslug: string }> },
) {
  try {
    const session = await getSession(req);
    const { workspaceslug } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return jsonWithETag(
        req,
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { domainId, action } = body;
    if (!domainId || !action) {
      return NextResponse.json(
        { error: "Domain ID and action are required" },
        { status: 400 },
      );
    }

    const workspace = await getWorkspace(workspaceslug, session.user.id, true);

    const customDomain = await db.customDomain.findUnique({
      where: { id: domainId },
    });

    if (!customDomain || customDomain.workspaceId !== workspace.id) {
      return jsonWithETag(req, { error: "Domain not found" }, { status: 404 });
    }

    // Handle verify action
    if (action === "verify") {
      const verifyLimit = await checkDomainVerifyRateLimit(customDomain.domain);
      if (!verifyLimit.success) {
        return jsonWithETag(
          req,
          { error: "Too many verification attempts. Try again later." },
          { status: 429 },
        );
      }

      const dnsCheckResult = await checkDnsConfiguration(customDomain.domain);
      const isConfigured = dnsCheckResult.configured;

      const updatedDomain = await db.customDomain.update({
        where: { id: domainId },
        data: {
          verified: isConfigured,
          dnsConfigured: isConfigured,
          sslEnabled: isConfigured,
          lastChecked: new Date(),
        },
      });

      return jsonWithETag(req, {
        domain: updatedDomain,
        verified: isConfigured,
        configured: isConfigured,
        dnsConfigured: isConfigured,
        error: !dnsCheckResult.success ? dnsCheckResult.error : undefined,
      });
    }

    // Handle toggle-redirect action
    if (action === "toggle-redirect") {
      const updatedDomain = await db.customDomain.update({
        where: { id: domainId },
        data: { redirectToWww: !customDomain.redirectToWww },
      });

      return jsonWithETag(req, { domain: updatedDomain });
    }

    return jsonWithETag(
      req,
      { error: "Unknown action" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error updating domain:", error);
    const message =
      error instanceof Error ? error.message : "Failed to update domain";
    const status =
      message.includes("Unauthorized") || message.includes("permissions")
        ? 403
        : 500;
    return jsonWithETag(req, { error: message }, { status });
  }
}
