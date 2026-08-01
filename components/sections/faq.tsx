"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const faqs = [
  ["What is an agentic workspace?", "An agentic workspace goes beyond answering isolated prompts. It can plan multi-step work, choose tools, coordinate specialist agents, preserve project context, and produce finished artifacts—with you in control of important decisions."],
  ["Can MythMind work with my existing tools?", "Yes. MythMind is designed to connect with tools such as GitHub, Linear, Slack, Notion, Google Drive, and internal APIs. Integrations share only the access and context you explicitly authorize."],
  ["How does MythMind keep agent work reliable?", "MythMind combines transparent plans, source citations, approval checkpoints, agent cross-review, and task-specific quality checks. You can inspect what happened, why, and which sources or tools were used."],
  ["Is my workspace data used to train public models?", "No. Your private workspace data is not used to train public models. Data is encrypted in transit and at rest, with workspace-level controls for retention, integrations, and team access."],
  ["Do I need technical experience to use MythMind?", "No. MythMind starts from outcomes in natural language. Technical users can add deeper constraints, repositories, tools, or custom workflows, but none of that is required to get meaningful work done."],
  ["Can I use my preferred AI models?", "Pro and Team plans support model routing so you can use the right model for each task. Enterprise deployments can also support approved model providers and custom security requirements."],
] as const;

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[.7fr_1.3fr]">
          <SectionHeading eyebrow="Frequently asked questions" title="Good questions deserve clear answers." description="Everything you need to know before bringing MythMind into your workflow." />
          <div className="border-t border-zinc-200">
            {faqs.map(([question, answer], index) => { const expanded = open === index; return <div key={question} className="border-b border-zinc-200"><button onClick={() => setOpen(expanded ? null : index)} className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-semibold text-zinc-900 sm:py-6 sm:text-base" aria-expanded={expanded}><span>{question}</span><ChevronDown size={18} className={cn("shrink-0 text-zinc-400 transition-transform", expanded && "rotate-180")}/></button><AnimatePresence initial={false}>{expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25 }} className="overflow-hidden"><p className="max-w-2xl pb-6 pr-8 text-sm leading-6 text-zinc-600">{answer}</p></motion.div>}</AnimatePresence></div> })}
          </div>
        </div>
      </Container>
    </section>
  );
}