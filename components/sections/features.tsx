import { Bot, BrainCircuit, Braces, FileText, PanelsTopLeft, Globe2, PlugZap, Search, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const features = [
  { icon: Sparkles, title: "AI Workspace", text: "A calm, unified canvas where your conversations, tools, artifacts, and execution stay connected." },
  { icon: Bot, title: "Multi-Agent Collaboration", text: "Build specialized agent teams that divide complex work, share context, and verify one another." },
  { icon: Search, title: "Deep Research", text: "Synthesize reliable answers from the web, your files, and connected knowledge—with citations." },
  { icon: Braces, title: "Code & Ship", text: "Understand repositories, plan changes, write production code, and validate the result end to end." },
  { icon: PanelsTopLeft, title: "Design Studio", text: "Move from product brief to polished flows and interfaces without losing the reasoning behind decisions." },
  { icon: FileText, title: "Living Documents", text: "Create specs, reports, and strategy documents that evolve as your project and knowledge change." },
  { icon: Globe2, title: "Browser Automation", text: "Let agents navigate, collect, and complete structured tasks across the tools you already use." },
  { icon: BrainCircuit, title: "Persistent Memory", text: "MythMind remembers preferences, decisions, and project context—without making you repeat yourself." },
  { icon: PlugZap, title: "Native Integrations", text: "Connect GitHub, Linear, Slack, Notion, Drive, and your internal systems through a secure tool layer." },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <Container>
        <Reveal><SectionHeading eyebrow="One workspace, every capability" title="Intelligence that works across your entire process." description="Replace a fragmented stack of assistants with one context-aware system built to move meaningful work forward." /></Reveal>
        <div className="mt-14 grid overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-200 gap-px sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }, index) => (
            <Reveal key={title} delay={(index % 3) * .06} className="h-full">
              <article className="group h-full min-h-56 bg-white p-7 transition-colors duration-300 hover:bg-amber-50/35 sm:p-8">
                <span className="grid size-10 place-items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 shadow-sm transition group-hover:border-amber-200 group-hover:bg-amber-100 group-hover:text-amber-800"><Icon size={19} strokeWidth={1.8}/></span>
                <h3 className="mt-8 text-base font-semibold tracking-tight text-zinc-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}