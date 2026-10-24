import "server-only";

const PRO_PLAN = {
  id: "pro",
  planType: "pro",
  name: "Pro",
  maxLinks: 99999999,
  maxClicks: 99999999,
  maxCustomDomains: 99999999,
  maxTags: 99999999,
  maxUtmTemplates: 99999999,
  maxWorkspaces: 99999999,
  maxUsers: 99999999,
};

export async function getActiveSubscription(userId: string) {
  return {
    msg: "Success",
    status: true,
    subscription: {
      id: "sub_pro",
      referenceId: userId,
      status: "active",
      planId: "pro",
      periodStart: new Date("2020-01-01"),
      periodEnd: new Date("2099-01-01"),
      plan: PRO_PLAN,
    },
  };
}

export async function getSubscriptionWithPlan(userId: string) {
  return {
    msg: "Success",
    status: true,
    subscription: {
      id: "sub_pro",
      referenceId: userId,
      status: "active",
      planId: "pro",
      periodStart: new Date("2020-01-01"),
      periodEnd: new Date("2099-01-01"),
      plan: PRO_PLAN,
    },
  };
}
