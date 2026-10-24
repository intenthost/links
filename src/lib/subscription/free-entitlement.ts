export async function ensureFreePlanRow(): Promise<string | null> {
  return "unlocked";
}

export async function ensureFreeSubscription(_userId: string) {
  return { success: true as const, created: false };
}
