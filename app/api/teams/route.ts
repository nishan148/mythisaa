import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPlanId, PLAN_ENTITLEMENTS, type PlanId } from "@/lib/mythmind/billing";
import { MEMBER_PERMISSIONS, type WorkspacePermissions } from "@/lib/mythmind/teams";

const permissionKeys: (keyof WorkspacePermissions)[] = ["can_chat", "can_view_agents", "can_view_teams", "can_manage_members", "can_manage_settings"];

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, membership: null, account: null };
  const { data: account } = await supabase.from("mythmind_accounts").select("*").eq("user_id", user.id).maybeSingle();
  const { data: memberships } = await supabase.from("mythmind_workspace_members").select("*, mymind_workspaces:mythmind_workspaces!inner(id,name,owner_id)").eq("user_id", user.id);
  const membership = memberships?.find((item) => item.role !== "owner") || memberships?.[0] || null;
  const workspace = membership?.mymind_workspaces as unknown as { owner_id?: string } | undefined;
  const workspaceAccount = workspace?.owner_id && workspace.owner_id !== user.id
    ? (await supabase.from("mythmind_accounts").select("*").eq("user_id", workspace.owner_id).maybeSingle()).data
    : account;
  return { supabase, user, membership, account: workspaceAccount };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("invite");
  const { supabase, user, membership, account } = await context();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (token) {
    const { data: invite } = await supabase.from("mythmind_workspace_invites").select("id,workspace_id,mythmind_workspaces(name)").eq("token", token).is("revoked_at", null).maybeSingle();
    if (!invite) return NextResponse.json({ error: "This invite link is invalid or expired." }, { status: 404 });
    const alreadyMember = await supabase.from("mythmind_workspace_members").select("user_id").eq("workspace_id", invite.workspace_id).eq("user_id", user.id).maybeSingle();
    return NextResponse.json({ invite, alreadyMember: Boolean(alreadyMember.data) });
  }
  if (!membership) return NextResponse.json({ error: "No workspace is available." }, { status: 404 });
  const workspace = membership.mymind_workspaces as unknown as { id: string; name: string; owner_id: string };
  const isManager = membership.role === "owner" || membership.role === "admin";
  const [{ data: teams }, { data: teamMembers }, { data: members }, { data: requests }, { data: invites }] = await Promise.all([
    supabase.from("mythmind_teams").select("*").eq("workspace_id", workspace.id).order("created_at"),
    supabase.from("mythmind_team_members").select("*").in("team_id", (await supabase.from("mythmind_teams").select("id").eq("workspace_id", workspace.id)).data?.map((t) => t.id) || []),
    supabase.from("mythmind_workspace_members").select("*").eq("workspace_id", workspace.id).order("joined_at"),
    isManager ? supabase.from("mythmind_join_requests").select("*").eq("workspace_id", workspace.id).eq("status", "pending").order("requested_at") : Promise.resolve({ data: [] }),
    isManager ? supabase.from("mythmind_workspace_invites").select("token").eq("workspace_id", workspace.id).is("revoked_at", null).order("created_at", { ascending: false }).limit(1) : Promise.resolve({ data: [] }),
  ]);
  const rawPlan: unknown = account?.plan;
  const plan: PlanId = isPlanId(rawPlan) ? rawPlan : "free";
  return NextResponse.json({ access: { ...membership, workspace_id: workspace.id, workspace_name: workspace.name, is_manager: isManager, invite_token: invites?.[0]?.token || null, team_limit: PLAN_ENTITLEMENTS[plan].teamLimit, teams: (teams || []).map((team) => ({ ...team, members: (teamMembers || []).filter((member) => member.team_id === team.id) })), members: members || [], requests: requests || [] } });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const { supabase, user, membership, account } = await context();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const action = body.action;
  if (action === "create_workspace") {
    if (membership) return NextResponse.json({ error: "You already belong to a company workspace." }, { status: 409 });
    const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ").slice(0, 60) : "";
    if (name.length < 2) return NextResponse.json({ error: "Workspace name must be at least 2 characters." }, { status: 400 });
    const slugBase = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) || "workspace";
    const { error } = await supabase.rpc("mythmind_bootstrap_workspace", { workspace_name: name, workspace_slug: `${slugBase}-${user.id.slice(0, 6)}` });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
  if (action === "request_join") {
    const token = typeof body.token === "string" ? body.token : "";
    const { data: invite } = await supabase.from("mythmind_workspace_invites").select("id,workspace_id").eq("token", token).is("revoked_at", null).maybeSingle();
    if (!invite) return NextResponse.json({ error: "This invite link is invalid or expired." }, { status: 404 });
    const displayName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] || "Workspace member";
    const result = await supabase.from("mythmind_join_requests").upsert({ workspace_id: invite.workspace_id, user_id: user.id, invite_id: invite.id, status: "pending", display_name: displayName, email: user.email || "" }, { onConflict: "workspace_id,user_id,status" });
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ success: true });
  }
  if (!membership) return NextResponse.json({ error: "No workspace is available." }, { status: 404 });
  const workspaceId = membership.workspace_id as string;
  const manager = membership.role === "owner" || membership.role === "admin";
  if (!manager) return NextResponse.json({ error: "Owner or admin access is required." }, { status: 403 });

  if (action === "create_team") {
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
    const description = typeof body.description === "string" ? body.description.trim().slice(0, 240) : "";
    if (!name) return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    const { count } = await supabase.from("mythmind_teams").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId);
    const rawPlan: unknown = account?.plan;
    const plan: PlanId = isPlanId(rawPlan) ? rawPlan : "free";
    if ((count || 0) >= PLAN_ENTITLEMENTS[plan].teamLimit) return NextResponse.json({ error: `${PLAN_ENTITLEMENTS[plan].name} supports ${PLAN_ENTITLEMENTS[plan].teamLimit} teams. Upgrade to create more.` }, { status: 402 });
    const result = await supabase.from("mythmind_teams").insert({ workspace_id: workspaceId, name, description, created_by: user.id }).select("*").single();
    if (result.data) await supabase.from("mythmind_team_members").insert({ team_id: result.data.id, user_id: user.id, role: "lead", can_chat: true, can_view_agents: true, can_view_teams: true, can_manage_members: true, can_manage_settings: true });
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ team: result.data });
  }
  if (action === "create_invite") {
    const result = await supabase.from("mythmind_workspace_invites").insert({ workspace_id: workspaceId, created_by: user.id }).select("token").single();
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ token: result.data.token });
  }
  if (action === "review_request") {
    const requestId = typeof body.request_id === "string" ? body.request_id : "";
    const decision = body.decision === "approved" ? "approved" : "rejected";
    const { data: joinRequest } = await supabase.from("mythmind_join_requests").select("*").eq("id", requestId).eq("workspace_id", workspaceId).eq("status", "pending").single();
    if (!joinRequest) return NextResponse.json({ error: "Join request not found." }, { status: 404 });
    if (decision === "approved") {
      const permissions = permissionKeys.reduce((values, key) => ({ ...values, [key]: typeof body[key] === "boolean" ? body[key] : MEMBER_PERMISSIONS[key] }), {} as WorkspacePermissions);
      await supabase.from("mythmind_workspace_members").upsert({ workspace_id: workspaceId, user_id: joinRequest.user_id, role: body.role === "admin" ? "admin" : "member", ...permissions });
      const teamIds = Array.isArray(body.team_ids) ? body.team_ids.filter((id): id is string => typeof id === "string") : [];
      if (teamIds.length) await supabase.from("mythmind_team_members").upsert(teamIds.map((teamId) => ({ team_id: teamId, user_id: joinRequest.user_id, ...permissions })), { onConflict: "team_id,user_id" });
    }
    await supabase.from("mythmind_join_requests").update({ status: decision, reviewed_by: user.id, reviewed_at: new Date().toISOString() }).eq("id", requestId);
    return NextResponse.json({ success: true });
  }
  if (action === "update_member") {
    const memberId = typeof body.user_id === "string" ? body.user_id : "";
    const updates = permissionKeys.reduce((values, key) => typeof body[key] === "boolean" ? { ...values, [key]: body[key] } : values, {} as Partial<WorkspacePermissions>);
    if (body.role === "admin" || body.role === "member") Object.assign(updates, { role: body.role });
    const result = await supabase.from("mythmind_workspace_members").update(updates).eq("workspace_id", workspaceId).eq("user_id", memberId).neq("role", "owner");
    return result.error ? NextResponse.json({ error: result.error.message }, { status: 400 }) : NextResponse.json({ success: true });
  }
  return NextResponse.json({ error: "Unknown team action." }, { status: 400 });
}