import type { SupabaseClient, User } from "@supabase/supabase-js";
import { PLAN_ENTITLEMENTS, type BillingContext, type PlanId, isPlanId, type WorkspaceContextType } from "./billing";

export async function resolveContext(supabase: SupabaseClient, user: User, requested: WorkspaceContextType) {
  if (requested === "personal") return { contextId: user.id, type: "personal" as const, workspaceId: null, ownerId: user.id, name: "Personal workspace" };

  const { data: memberships } = await supabase
    .from("mythmind_workspace_members")
    .select("workspace_id,role,mythmind_workspaces!inner(id,name,owner_id)")
    .eq("user_id", user.id);
  const membership = memberships?.find((item) => item.role !== "owner") || memberships?.[0];
  const workspace = membership?.mythmind_workspaces as unknown as { id: string; name: string; owner_id: string } | undefined;
  if (!workspace) return null;
  return { contextId: workspace.id, type: "workspace" as const, workspaceId: workspace.id, ownerId: workspace.owner_id, name: workspace.name };
}

export async function ensureBillingContext(supabase: SupabaseClient, context: NonNullable<Awaited<ReturnType<typeof resolveContext>>>) {
  const { data: existing } = await supabase.from("mythmind_billing_accounts").select("*").eq("context_id", context.contextId).maybeSingle();
  if (existing) return existing;
  const starter = { context_id: context.contextId, context_type: context.type, owner_id: context.ownerId, workspace_id: context.workspaceId, plan: "free", credits_remaining: 100, credits_limit: 100, credit_period: "daily", period_started_at: new Date().toISOString() };
  const { data, error } = await supabase.from("mythmind_billing_accounts").insert(starter).select("*").single();
  if (error) throw error;
  return data;
}

export function normalizeBilling(account: Record<string, unknown>) {
  const plan: PlanId = isPlanId(account.plan) ? account.plan : "free";
  const entitlement = PLAN_ENTITLEMENTS[plan];
  const started = new Date(String(account.period_started_at));
  const periodMs = entitlement.period === "daily" ? 86_400_000 : 30 * 86_400_000;
  return Date.now() - started.getTime() >= periodMs
    ? { ...account, credits_remaining: entitlement.credits, credits_limit: entitlement.credits, credit_period: entitlement.period, period_started_at: new Date().toISOString() }
    : account;
}

export async function buildBillingContext(supabase: SupabaseClient, billing: Record<string, unknown>, profile: Record<string, unknown> | null, contextName: string): Promise<BillingContext> {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  const { data: events } = await supabase.from("mythmind_usage_events").select("agent,credits,created_at").eq("context_id", billing.context_id).gte("created_at", since.toISOString()).order("created_at");
  const dayMap = new Map<string, number>();
  const agentMap = new Map<string, number>();
  for (let index = 29; index >= 0; index--) { const day = new Date(); day.setDate(day.getDate() - index); dayMap.set(day.toISOString().slice(0, 10), 0); }
  for (const event of events || []) {
    const credits = Number(event.credits) || 0;
    const day = String(event.created_at).slice(0, 10);
    dayMap.set(day, (dayMap.get(day) || 0) + credits);
    agentMap.set(event.agent, (agentMap.get(event.agent) || 0) + credits);
  }
  return {
    ...(billing as unknown as BillingContext),
    user_id: String(billing.owner_id),
    workspace_name: contextName,
    workspace_url: String(profile?.workspace_url || `mythmind.co/w/${String(billing.context_id).slice(0, 8)}`),
    avatar_url: typeof profile?.avatar_url === "string" ? profile.avatar_url : null,
    usage: [...dayMap].map(([date, credits]) => ({ date, credits })),
    breakdown: [...agentMap].map(([agent, credits]) => ({ agent, credits })).sort((a, b) => b.credits - a.credits),
  };
}