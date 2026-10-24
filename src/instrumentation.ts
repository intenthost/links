export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Fail fast on missing/invalid env (DATABASE_URL, BETTER_AUTH_SECRET,
    // production provider keys) instead of crashing at first request.
    await import("@/lib/env");
  }
}

export const onRequestError = (err: unknown) => {
  console.error("[Request Error]", err);
};
