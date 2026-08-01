import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildBillingContext, ensureBillingContext, normalizeBilling, resolveContext } from "@/lib/mythmind/context";
import type { WorkspaceContextType } from "@/lib/mythmind/billing";

function requestedContext(request: Request): WorkspaceContextType {
  return new URL(request.url).searchParams.get("context") === "workspace" ? "workspace" : "personal";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const context = await resolveContext(supabase, user, requestedContext(request));
  if (!context) return NextResponse.json({ error: "No company workspace is available." }, { status: 404 });
  try {
    let billing = normalizeBilling(await ensureBillingContext(supabase, context));
    const { data: refreshed } = await supabase.from("mythmind_billing_accounts").update(billing).eq("context_id", context.contextId).select("*").single();
    if (refreshed) billing = refreshed;
    const [{ data: profile }, { data: conversations }] = await Promise.all([
      supabase.from("mythmind_accounts").select("workspace_url,avatar_url").eq("user_id", user.id).maybeSingle(),
      supabase.from("mythmind_conversations").select("id,title,messages,updated_at").eq("context_id", context.contextId).order("updated_at", { ascending: false }),
    ]);
    return NextResponse.json({ account: await buildBillingContext(supabase, billing, profile, context.name), conversations: conversations || [], context });
  } catch { return NextResponse.json({ error: "Unable to initialize this workspace." }, { status: 500 }); }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const body = await request.json().catch(() => null) as { context?: WorkspaceContextType; conversations?: Array<{ id: string; title: string; messages: unknown[]; updatedAt: string }> } | null;
  const context = await resolveContext(supabase, user, body?.context === "workspace" ? "workspace" : "personal");
  if (!context) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  await ensureBillingContext(supabase, context);
  const conversations = Array.isArray(body?.conversations) ? body.conversations.slice(0, 100) : [];
  const rows = conversations.map((item) => ({ id: item.id, context_id: context.contextId, owner_id: user.id, title: item.title.slice(0, 120), messages: item.messages, updated_at: item.updatedAt }));
  const { error } = rows.length ? await supabase.from("mythmind_conversations").upsert(rows, { onConflict: "id" }) : { error: null };
  if (error) return NextResponse.json({ error: "Unable to save conversations." }, { status: 500 });
  const keep = rows.map((row) => row.id);
  if (keep.length) await supabase.from("mythmind_conversations").delete().eq("context_id", context.contextId).eq("owner_id", user.id).not("id", "in", `(${keep.join(",")})`);
  return NextResponse.json({ success: true });
}