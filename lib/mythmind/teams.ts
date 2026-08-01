export type WorkspacePermissions = {
  can_chat: boolean;
  can_view_agents: boolean;
  can_view_teams: boolean;
  can_manage_members: boolean;
  can_manage_settings: boolean;
};

export type WorkspaceMember = WorkspacePermissions & {
  user_id: string;
  role: "owner" | "admin" | "member";
  display_name?: string;
  email?: string;
};

export type WorkspaceTeam = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  members: WorkspaceMember[];
};

export type JoinRequest = {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
};

export type WorkspaceAccess = WorkspacePermissions & {
  workspace_id: string;
  workspace_name: string;
  role: "owner" | "admin" | "member";
  is_manager: boolean;
  invite_token: string | null;
  team_limit: number;
  teams: WorkspaceTeam[];
  members: WorkspaceMember[];
  requests: JoinRequest[];
};

export const MEMBER_PERMISSIONS: WorkspacePermissions = {
  can_chat: true,
  can_view_agents: false,
  can_view_teams: true,
  can_manage_members: false,
  can_manage_settings: false,
};