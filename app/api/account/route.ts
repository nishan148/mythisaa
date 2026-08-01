import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_ENTITLEMENTS } from "@/lib/mythmind/billing";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const { data, error } = await supabase.from("mythmind_accounts").select("*").eq("user_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load workspace account." }, { status: 500 });
  if (!data) {
    const starter = { user_id: user.id, plan: "free", credits_remaining: PLAN_ENTITLEMENTS.free.credits, credits_limit: PLAN_ENTITLEMENTS.free.credits, credit_period: "daily", period_started_at: new Date().toISOString(), workspace_name: "Personal workspace", workspace_url: "mythmind.co/w/personal", avatar_url: null };
    const created = await supabase.from("mythmind_accounts").insert(starter).select("*").single();
    if (created.error) return NextResponse.json({ error: "Unable to initialize workspace credits." }, { status: 500 });
    return NextResponse.json({ account: created.data });
  }
  return NextResponse.json({ account: data });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const updates: Record<string, string> = {};
  const avatar = typeof body?.avatar_url === "string" ? body.avatar_url : body?.avatarUrl;
  const name = typeof body?.workspace_name === "string" ? body.workspace_name : body?.workspaceName;
  const url = typeof body?.workspace_url === "string" ? body.workspace_url : body?.workspaceUrl;
  if (typeof avatar === "string" && avatar.length <= 2_000) updates.avatar_url = avatar.trim();
  if (typeof name === "string" && name.trim().length <= 80) updates.workspace_name = name.trim();
  if (typeof url === "string" && url.trim().length <= 120) {
    const workspaceUrl = url.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!workspaceUrl.startsWith("mythmind.co/")) return NextResponse.json({ error: "Workspace URLs must use mythmind.co." }, { status: 400 });
    updates.workspace_url = workspaceUrl;
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No valid account changes supplied." }, { status: 400 });

  const { data, error } = await supabase.from("mythmind_accounts").update(updates).eq("user_id", user.id).select("*").single();
  if (error) return NextResponse.json({ error: "Unable to save workspace settings." }, { status: 500 });
  return NextResponse.json({ account: data });
}