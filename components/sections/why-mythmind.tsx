import { Check, Minus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const rows = [
  ["Plans and executes multi-step work", true, false, false],
  ["Specialist agents collaborate", true, false, false],
  ["Persistent project memory", true, false, true],
  ["Research, code, design, and docs", true, false, false],
  ["Human approval checkpoints", true, false, true],
  ["One connected source of truth", true, false, false],
] as const;

export function WhyMythMind() {
  return (
    <section id="product" className="border-y border-zinc-200 bg-white py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center">
          <Reveal><SectionHeading eyebrow="Why MythMind" title="More than a chat window. Less than another system to manage." description="Traditional assistants wait for the next prompt. MythMind holds the objective, coordinates the work, and gives you leverage without taking away control." /></Reveal>
          <Reveal delay={.1}>
            <div className="overflow-hidden rounded-3xl border border-zinc-200 shadow-[0_12px_45px_rgba(24,24,27,.07)]">
              <div className="grid grid-cols-[1fr_72px_72px_72px] border-b border-zinc-200 bg-zinc-50 px-4 py-4 text-center text-[10px] font-semibold text-zinc-500 sm:grid-cols-[1fr_110px_110px_110px] sm:px-6"><span className="text-left uppercase tracking-wider">Capability</span><span className="text-amber-700">MythMind</span><span>Chatbot</span><span>Copilot</span></div>
              {rows.map(([label, myth, chat, copilot]) => <div key={label} className="grid grid-cols-[1fr_72px_72px_72px] items-center border-b border-zinc-100 px-4 py-4 last:border-0 sm:grid-cols-[1fr_110px_110px_110px] sm:px-6"><span className="pr-2 text-xs font-medium text-zinc-700 sm:text-sm">{label}</span>{[myth, chat, copilot].map((yes, i) => <span key={i} className="mx-auto">{yes ? <span className={`grid size-6 place-items-center rounded-full ${i === 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-500"}`}><Check size={12}/></span> : <Minus size={14} className="text-zinc-300"/>}</span>)}</div>)}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}