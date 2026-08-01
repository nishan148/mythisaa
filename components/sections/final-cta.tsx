import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FinalCTA() {
  return (
    <section id="final-cta" className="pb-24 sm:pb-32">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-zinc-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20">
          <div className="absolute left-1/2 top-0 h-64 w-[700px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(234,179,8,.18),transparent_70%)]" />
          <div className="relative mx-auto max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.18em] text-amber-400">Your next project starts here</p><h2 className="mt-5 text-balance text-3xl font-semibold tracking-[-.05em] sm:text-5xl">Build what matters—with intelligence that stays with you.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-zinc-400">Bring your ideas, context, and ambition. MythMind brings the team, tools, and momentum to turn them into reality.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/login?mode=signup" className={cn(buttonVariants({ variant: "accent", size: "lg" }), "group")}>Start building for free <ArrowRight size={16} className="transition group-hover:translate-x-0.5"/></Link><Link href="#footer" className={cn(buttonVariants({ size: "lg" }), "border border-zinc-700 bg-zinc-900 hover:bg-zinc-800")}>Talk to our team</Link></div><div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-zinc-500">{["Free to start", "No credit card", "Cancel anytime"].map(item => <span key={item} className="flex items-center gap-1.5"><Check size={12} className="text-amber-400"/>{item}</span>)}</div></div>
        </div>
      </Container>
    </section>
  );
}