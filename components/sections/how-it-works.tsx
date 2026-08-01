import { ArrowRight, CheckCircle2, Network, Send, SlidersHorizontal } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  { icon: Send, number: "01", title: "Describe the outcome", text: "Start with a goal, not a perfectly engineered prompt. Add files, links, or repository context when useful." },
  { icon: Network, number: "02", title: "MythMind assembles the team", text: "The workspace plans the work and assigns the right specialist agents, tools, and shared context." },
  { icon: SlidersHorizontal, number: "03", title: "Guide the important decisions", text: "Review plans, set constraints, and collaborate at meaningful checkpoints while agents handle the busywork." },
  { icon: CheckCircle2, number: "04", title: "Receive finished, verifiable work", text: "Get usable artifacts with sources, decision history, quality checks, and a clear path to the next iteration." },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <Container>
        <Reveal><SectionHeading align="center" eyebrow="How MythMind works" title="You set the direction. MythMind moves the work." description="Stay in control without staying in the weeds. Every action remains visible, steerable, and grounded in your intent." /></Reveal>
        <div className="relative mt-16 grid gap-4 lg:grid-cols-4">
          {steps.map(({ icon: Icon, number, title, text }, index) => <Reveal key={number} delay={index * .07}><article className="relative h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,.03)]"><div className="flex items-center justify-between"><span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-800"><Icon size={18}/></span><span className="font-mono text-xs text-zinc-400">{number}</span></div><h3 className="mt-8 text-base font-semibold text-zinc-950">{title}</h3><p className="mt-3 text-sm leading-6 text-zinc-600">{text}</p>{index < steps.length - 1 && <span className="absolute -right-3 top-10 z-10 hidden size-6 place-items-center rounded-full border border-zinc-200 bg-stone-50 text-zinc-400 lg:grid"><ArrowRight size={12}/></span>}</article></Reveal>)}
        </div>
      </Container>
    </section>
  );
}