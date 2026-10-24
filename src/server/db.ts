import { PrismaClient } from "@prisma/client";
import { PrismaIntentDB } from "./intentdb-adapter";

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaIntentDB(process.env.DATABASE_URL);
  return new PrismaClient({ adapter, log: ["error"] });
}

export const db: PrismaClient = globalThis.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

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
