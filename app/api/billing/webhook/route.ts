import { NextResponse } from "next/server";
import type { PlanId } from "@/lib/mythmind/billing";
import type { UnwrapWebhookEvent } from "dodopayments/resources/webhooks/webhooks";
import { PLAN_ENTITLEMENTS, isPlanId } from "@/lib/mythmind/billing";
import { getDodoClient } from "@/lib/dodo";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const key = process.env.DODO_PAYMENTS_WEBHOOK_KEY;
  if (!key) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  let event: UnwrapWebhookEvent;
  try { event = getDodoClient().webhooks.unwrap(body, { headers, key }); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 }); }
  if (!["subscription.active", "subscription.renewed", "subscription.updated"].includes(event.type)) return NextResponse.json({ received: true });
  const data = event.data as { subscription_id: string; customer?: { customer_id?: string }; metadata?: Record<string, string>; status?: string; next_billing_date?: string };
  const metadata = data.metadata || {};
  const plan = isPlanId(metadata.plan) ? metadata.plan as PlanId : null;
  const contextId = typeof metadata.context_id === "string" ? metadata.context_id : null;
  const userId = typeof metadata.user_id === "string" ? metadata.user_id : null;
  if (!plan || plan === "free" || !contextId || !userId) return NextResponse.json({ error: "Webhook metadata is incomplete." }, { status: 400 });
  const entitlement = PLAN_ENTITLEMENTS[plan];
  const admin = createAdminClient();
  const eventId = request.headers.get("webhook-id") || `${event.type}:${data.subscription_id}:${event.timestamp}`;
  const { error: eventError } = await admin.from("mythmind_billing_webhook_events").insert({ event_id: eventId, event_type: event.type });
  if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "Unable to record webhook." }, { status: 500 });
  const { error } = await admin.from("mythmind_billing_accounts").update({ plan, credits_remaining: entitlement.credits, credits_limit: entitlement.credits, credit_period: entitlement.period, period_started_at: new Date().toISOString(), dodo_customer_id: data.customer?.customer_id || null, dodo_subscription_id: data.subscription_id, subscription_status: data.status || "active", current_period_ends_at: data.next_billing_date || null }).eq("context_id", contextId).eq("owner_id", userId);
  if (error) { console.error("Billing webhook update failed", error.message); return NextResponse.json({ error: "Unable to apply entitlement." }, { status: 500 }); }
  return NextResponse.json({ received: true });
}