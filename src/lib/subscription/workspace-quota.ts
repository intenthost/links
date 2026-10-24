import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";

export class WorkspaceQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkspaceQuotaError";
  }
}

export const PRO_PLAN = {
  id: "pro",
  planType: "pro",
  name: "Pro",
  maxLinks: 99999999,
  maxClicks: 99999999,
  maxCustomDomains: 99999999,
  maxTags: 99999999,
  maxTagsPerWorkspace: 99999999,
  maxUtmTemplates: 99999999,
  maxWorkspaces: 99999999,
  maxUsers: 99999999,
};

export async function withWorkspaceQuota<T>(
  workspaceId: string,
  write: (tx: Prisma.TransactionClient, plan: typeof PRO_PLAN) => Promise<T>,
): Promise<T> {
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
    select: { userId: true },
  });
  if (!workspace) throw new WorkspaceQuotaError("Workspace not found");
  return db.$transaction(async (tx) => {
    return write(tx, PRO_PLAN);
  });
}

export async function assertSeatAvailable(
  _tx: Prisma.TransactionClient,
  _workspaceId: string,
  _maxUsers: number,
  _includePending: boolean,
) {
  // Single internal user, no seat limits
}
