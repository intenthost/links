import "server-only";
import { revalidateTag } from "next/cache";

export async function syncUserLimits(_userId: string, _planType?: string) {
  return { success: true };
}

export async function revalidateSubscriptionCache(_userId: string) {
  // no-op for internal tool
}
