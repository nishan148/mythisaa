import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in or create your MythMind workspace.",
};

type LoginPageProps = {
  searchParams: Promise<{ mode?: string; error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f5ef] text-zinc-950">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="auth-back inline-flex w-fit items-center gap-2 text-sm font-semibold text-zinc-600 transition hover:text-zinc-950">
          <ArrowLeft size={16} /> Back to MythMind
        </Link>
        <div className="flex flex-1 items-center justify-center py-12 lg:py-16">
          <div className="auth-shell grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/80 bg-white/70 shadow-[0_24px_100px_rgba(39,39,42,.13)] backdrop-blur-xl lg:grid-cols-[.88fr_1.12fr]">
            <div className="auth-story relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:38px_38px]" />
              <div className="auth-story-glow absolute -right-32 -top-32 size-96 rounded-full bg-amber-400/20 blur-3xl" />
              <div className="relative">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-300 text-lg font-black text-zinc-950">M</div>
                <p className="mt-10 max-w-sm text-4xl font-semibold leading-[1.02] tracking-[-.06em]">Your clearest ideas deserve a team that keeps up.</p>
                <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">Bring the context. Your MythMind workspace brings the research, reasoning, and momentum.</p>
              </div>
              <div className="relative flex items-center gap-3 text-xs font-semibold text-zinc-400"><span className="size-2 rounded-full bg-amber-300" /> Trusted by curious builders everywhere</div>
            </div>
            <div className="auth-form-panel p-6 sm:p-10 lg:p-14"><AuthForm initialMode={params.mode === "signup" ? "signup" : "login"} initialError={params.error} next={params.next} /></div>
          </div>
        </div>
      </div>
    </main>
  );
}