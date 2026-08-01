export const PLAN_ENTITLEMENTS = {
  free: { name: "Free", price: 0, credits: 100, period: "daily", teamLimit: 1, description: "A daily allowance to explore the workspace." },
  hustler: { name: "Hustler", price: 3, credits: 300, period: "daily", teamLimit: 2, description: "More daily room for focused independent work." },
  pro: { name: "Pro", price: 29, credits: 10_000, period: "monthly", teamLimit: 5, description: "10,000 credits every month for ambitious work." },
  team: { name: "Team", price: 99, credits: 40_000, period: "monthly", teamLimit: 12, description: "40,000 shared credits every month for your team." },
  startup: { name: "MythMind Startup", price: 299, credits: 100_000, period: "monthly", teamLimit: 25, description: "100,000 shared credits every month for a growing startup." },
} as const;

export type PlanId = keyof typeof PLAN_ENTITLEMENTS;
export type CreditPeriod = "daily" | "monthly";

export type MythMindAccount = {
  user_id: string;
  plan: PlanId;
  credits_remaining: number;
  credits_limit: number;
  credit_period: CreditPeriod;
  period_started_at: string;
  workspace_name: string;
  workspace_url: string;
  avatar_url: string | null;
};

export type WorkspaceContextType = "personal" | "workspace";

export type UsagePoint = {
  date: string;
  credits: number;
};

export type UsageBreakdown = {
  agent: string;
  credits: number;
};

export type BillingContext = MythMindAccount & {
  context_id: string;
  context_type: WorkspaceContextType;
  workspace_id: string | null;
  owner_id: string;
  usage: UsagePoint[];
  breakdown: UsageBreakdown[];
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLAN_ENTITLEMENTS;
}

export function formatCredits(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}