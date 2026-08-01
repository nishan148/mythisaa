import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Update password",
  description: "Choose a new password for your MythMind account.",
};

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=confirmation");

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5ef] px-5 py-5 text-zinc-950 sm:px-8">
      <div className="auth-orb auth-orb-one" />
      <Link href="/" className="relative inline-flex items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950"><ArrowLeft size={16} /> Back to MythMind</Link>
      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl items-center justify-center py-12">
        <div className="w-full rounded-[32px] border border-white/80 bg-white/80 p-7 shadow-[0_24px_100px_rgba(39,39,42,.13)] backdrop-blur-xl sm:p-12"><UpdatePasswordForm /></div>
      </div>
    </main>
  );
}