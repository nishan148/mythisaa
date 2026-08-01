import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlanId, PLAN_ENTITLEMENTS } from "@/lib/mythmind/billing";
import { ensureBillingContext, resolveContext } from "@/lib/mythmind/context";
import { appUrl, getDodoClient, getDodoProductId } from "@/lib/dodo";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as { plan?: unknown; context?: unknown } | null;
  if (!isPlanId(body?.plan)) return NextResponse.json({ error: "Choose a valid MythMind plan." }, { status: 400 });
  const entitlement = PLAN_ENTITLEMENTS[body.plan];
  const context = await resolveContext(supabase, user, body?.context === "workspace" ? "workspace" : "personal");
  if (!context) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  if (context.ownerId !== user.id) return NextResponse.json({ error: "Only the workspace owner can change this plan." }, { status: 403 });
  await ensureBillingContext(supabase, context);
  if (body.plan !== "free") {
    try {
      const productId = getDodoProductId(body.plan as Exclude<typeof body.plan, "free">);
      const session = await getDodoClient().checkoutSessions.create({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        metadata: { user_id: user.id, context_id: context.contextId, context_type: context.type, plan: body.plan },
        return_url: `${appUrl()}/checkout?context=${context.type}&plan=${body.plan}&status=success`,
      });
      return NextResponse.json({ checkoutUrl: session.checkout_url, sessionId: session.session_id });
    } catch (error) {
      console.error("Dodo checkout creation failed", error instanceof Error ? error.message : "unknown error");
      return NextResponse.json({ error: "Unable to start secure checkout." }, { status: 502 });
    }
  }
  const { data, error } = await supabase.from("mythmind_billing_accounts").update({
    plan: body.plan,
    credits_remaining: entitlement.credits,
    credits_limit: entitlement.credits,
    credit_period: entitlement.period,
    period_started_at: new Date().toISOString(),
  }).eq("context_id", context.contextId).select("*").single();
  if (error) return NextResponse.json({ error: "Test checkout could not update your plan." }, { status: 500 });
  return NextResponse.json({ mode: "test", message: `${entitlement.name} test plan activated. No payment was charged.`, account: data });
}