import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaIntentDB } from "./intentdb-adapter";

declare global {
  var _prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL || "";
  let adapter;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    neonConfig.webSocketConstructor = ws;
    adapter = new PrismaNeon({ connectionString: url });
  } else {
    adapter = new PrismaIntentDB(url);
  }
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
