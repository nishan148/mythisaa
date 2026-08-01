import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinWorkspace } from "@/components/dashboard/join-workspace";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  return <JoinWorkspace token={token} />;
}