import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import {
  generateRandomSlug,
  isPrismaUniqueViolation,
  SlugConflictError,
} from "@/lib/link-slug";

export class QuotaExceededError extends Error {
  constructor(message = "Link limit reached.") {
    super(message);
    this.name = "QuotaExceededError";
  }
}

interface QuotaInput {
  workspaceId: string;
  ownerUserId: string;
  maxLinks: number;
  customSlug: string | null;
  maxAttempts?: number;
}

export async function createLinkWithQuota<T>(
  input: QuotaInput,
  create: (tx: Prisma.TransactionClient, slug: string) => Promise<T>,
): Promise<T> {
  const maxAttempts = input.customSlug ? 1 : (input.maxAttempts ?? 5);

  let lastError: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const slug = input.customSlug ?? generateRandomSlug();
    try {
      return await db.$transaction(async (tx) => {
        await tx.workspace.update({
          where: { id: input.workspaceId },
          data: { linksUsage: { increment: 1 } },
        });

        return create(tx, slug);
      });
    } catch (error) {
      if (error instanceof QuotaExceededError) throw error;
      if (isPrismaUniqueViolation(error)) {
        lastError = error;
        if (input.customSlug) throw new SlugConflictError();
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Failed to allocate a unique slug.");
}

export async function releaseLinkQuota(
  input: { workspaceId: string; count?: number },
): Promise<void> {
  const count = input.count ?? 1;
  if (count <= 0) return;

  await db.workspace.update({
    where: { id: input.workspaceId },
    data: { linksUsage: { decrement: count } },
  });
}
