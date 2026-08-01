import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import type { MythMindAccount } from "@/lib/mythmind/billing";

export const metadata: Metadata = {
  title: "Your workspace",
  description: "Manage your MythMind account and workspace.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const fullName = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0] || "Builder";
  const provider = user.app_metadata.provider === "google" ? "Google" : "Email";
  const { data: account } = await supabase.from("mythmind_accounts").select("*").eq("user_id", user.id).maybeSingle();

  return <DashboardWorkspace user={{ name: fullName, email: user.email || "", provider }} initialAccount={account as MythMindAccount | null} />;
}