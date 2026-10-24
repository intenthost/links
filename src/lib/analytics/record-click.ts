import { primarySql } from "@/server/neon";
import { redis } from "@/lib/redis";

/**
 * Edge-safe click counter (no Prisma / no origin HTTP hop).
 * Increments link clicks + workspace usage via IntentDB.
 */
export async function recordLinkClick(input: {
  linkId: string;
  workspaceId: string;
  slug: string;
  domain: string;
}): Promise<{ ok: boolean; limited?: boolean }> {
  try {
    await primarySql`
      UPDATE "links"
      SET clicks = clicks + 1, "lastClicked" = NOW()
      WHERE id = ${input.linkId}
    `;

    await primarySql`
      UPDATE "workspaces"
      SET "clicksUsage" = "clicksUsage" + 1, "updatedAt" = NOW()
      WHERE id = ${input.workspaceId}
    `;

    // Optional secondary counter for dashboards / debugging
    void redis.incr(`clicks:link:${input.linkId}`).catch(() => undefined);

    return { ok: true };
  } catch (error) {
    console.error("[recordLinkClick]", error);
    return { ok: false };
  }
}
