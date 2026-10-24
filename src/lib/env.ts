import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

const baseSchema = z.object({
  // ── Always required: the app cannot serve a single request without these.
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),

  // ── Auth
  BETTER_AUTH_URL: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // ── Email / cache / queues
  RESEND_API_KEY: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

// Parse and validate environment variables.
// Core vars fail fast in every environment; optional vars
// (Resend, Redis) are checked where needed.
const envSchema = baseSchema.superRefine((val, ctx) => {
  if (isProduction) {
    const requiredInProd = [
      "BETTER_AUTH_URL",
    ] as const;
    for (const key of requiredInProd) {
      if (!val[key]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} is required in production`,
        });
      }
    }
  }

  const pairs = [
    ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
    ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  ] as const;
  for (const [id, secret] of pairs) {
    const hasId = Boolean(val[id]?.trim());
    const hasSecret = Boolean(val[secret]?.trim());
    if (hasId !== hasSecret) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [hasId ? secret : id],
        message: `${id} and ${secret} must both be set or both be absent`,
      });
    }
  }
});

function getEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join("\n");
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

let _env: ReturnType<typeof getEnv> | undefined;

/** Lazy singleton — only validated on first access, not at import time. */
export const env = new Proxy({} as ReturnType<typeof getEnv>, {
  get(_target, prop) {
    if (!_env) _env = getEnv();
    return (_env as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export default env;
