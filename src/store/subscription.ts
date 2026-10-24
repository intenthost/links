import { create } from "zustand";

type PlanType = "basic" | "pro" | string;

interface SubscriptionPlan {
  id?: string;
  name?: string | null;
  planType?: PlanType | null;
}

interface ActiveSubscription {
  id?: string;
  priceId?: string | null;
  customerId?: string | null;
  provider?: string | null;
  status?: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
  plan?: SubscriptionPlan | null;
}

interface SubscriptionStoreState {
  subscription: ActiveSubscription | null;
  planType: PlanType | null;
  isPro: boolean;
  isGrowth: boolean;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchSubscription: () => Promise<void>;
  resetSubscription: () => void;
}

function applySubscription(
  set: (partial: Partial<SubscriptionStoreState>) => void,
  subscription: ActiveSubscription | null,
) {
  const planType =
    (subscription?.plan?.planType as PlanType | undefined) ?? null;
  // These flags represent feature access: Premium includes Growth and Pro.
  const normalized = planType?.toString().toLowerCase();
  const isPro =
    normalized === "pro" || normalized === "growth" || normalized === "premium";
  const isGrowth = normalized === "growth" || normalized === "premium";

  set({
    subscription,
    planType,
    isPro,
    isGrowth,
    hasFetched: true,
    isLoading: false,
    error: null,
  });
}

export const useSubscriptionStore = create<SubscriptionStoreState>(
  (set) => ({
    subscription: {
      status: "active",
      plan: {
        id: "premium-plan",
        name: "Premium",
        planType: "premium",
      },
    },
    planType: "premium",
    isPro: true,
    isGrowth: true,
    isLoading: false,
    error: null,
    hasFetched: true,
    fetchSubscription: async () => {},
    resetSubscription: () => {},
  }),
);
