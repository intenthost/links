import { PrismaClient } from "@prisma/client";
import { PrismaIntentDB } from "./intentdb-adapter";

declare global {
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaIntentDB(process.env.DATABASE_URL);
  return new PrismaClient({ adapter, log: ["error"] });
}

/** Lazy singleton — only instantiated on first query, not at import time. */
export function getDb(): PrismaClient {
  if (!globalThis._prisma) {
    globalThis._prisma = createPrismaClient();
  }
  return globalThis._prisma;
}

/** Convenience proxy so existing `db.xyz` call-sites keep working. */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export async function safeQuery<T>(
  queryFn: () => Promise<T>,
): Promise<T | null> {
  try {
    return await queryFn();
  } catch (error) {
    console.error("Database query error:", error);
    return null;
  }
}
