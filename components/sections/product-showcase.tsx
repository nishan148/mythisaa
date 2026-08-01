"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Braces, Check, FileSearch, LayoutPanelTop, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";

const views = [
  { id: "research", label: "Research", icon: FileSearch, title: "From question to grounded insight", text: "MythMind searches, compares, and synthesizes evidence while preserving a clear source trail.", color: "bg-blue-50 text-blue-700", items: ["18 high-quality sources reviewed", "Claims cross-checked across sources", "Executive brief generated with citations"] },
  { id: "build", label: "Build", icon: Braces, title: "From intent to production-ready code", text: "Agents understand your architecture, propose a plan, and implement against your existing conventions.", color: "bg-violet-50 text-violet-700", items: ["Repository context mapped", "Implementation plan approved", "Tests and quality checks passed"] },
  { id: "create", label: "Create", icon: LayoutPanelTop, title: "From brief to a coherent experience", text: "Turn strategy into structured product thinking, polished content, and interfaces ready for review.", color: "bg-amber-50 text-amber-800", items: ["Audience and goals aligned", "Three concepts explored", "Final system packaged for handoff"] },
];

export function ProductShowcase() {
  const [active, setActive] = useState(views[0]);
  const reduceMotion = useReducedMotion();
  return (
    <section id="showcase" className="border-y border-zinc-200 bg-zinc-950 py-24 text-white sm:py-32">
      <Container>
        <SectionHeading eyebrow="Built for real work" title="One environment. Multiple modes of thought." description="Shift from exploration to execution without moving context between tabs, tools, or disconnected assistants." className="[&_h2]:text-white [&_p:last-child]:text-zinc-400" />
        <div className="mt-14 grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-stretch">
          <div className="space-y-2" role="tablist" aria-label="Product capabilities">
            {views.map(view => { const Icon = view.icon; const selected = active.id === view.id; return <button key={view.id} role="tab" aria-selected={selected} onClick={() => setActive(view)} className={`w-full rounded-2xl border p-5 text-left transition-all ${selected ? "border-zinc-700 bg-zinc-900 shadow-xl" : "border-transparent text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300"}`}><div className="flex items-start gap-4"><span className={`grid size-10 shrink-0 place-items-center rounded-xl ${selected ? view.color : "bg-zinc-900 text-zinc-500"}`}><Icon size={18}/></span><div><p className={`text-sm font-semibold ${selected ? "text-white" : ""}`}>{view.label}</p><p className="mt-1 text-sm leading-6">{view.title}</p></div><ArrowUpRight size={16} className="ml-auto mt-1"/></div></button> })}
          </div>
          <div className="min-h-[440px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 p-3 shadow-2xl sm:p-5">
            <AnimatePresence mode="wait">
              <motion.div key={active.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: .25 }} className="flex h-full flex-col rounded-2xl border border-zinc-800 bg-[#111113] p-5 sm:p-7">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-5"><div className="flex items-center gap-2"><Sparkles size={15} className="text-amber-400"/><span className="text-xs font-semibold">MythMind / {active.label}</span></div><span className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] text-zinc-400">Live workspace</span></div>
                <div className="my-auto py-8"><p className="text-xs font-semibold uppercase tracking-[.16em] text-amber-400">{active.label} agent team</p><h3 className="mt-4 max-w-lg text-2xl font-semibold tracking-[-.03em] sm:text-3xl">{active.title}</h3><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">{active.text}</p><div className="mt-8 space-y-3">{active.items.map((item, i) => <motion.div key={item} initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .08 * i }} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-3"><span className="grid size-6 place-items-center rounded-full bg-emerald-500/10 text-emerald-400"><Check size={12}/></span><span className="text-xs text-zinc-300 sm:text-sm">{item}</span><span className="ml-auto text-[10px] text-zinc-600">Complete</span></motion.div>)}</div></div>
                <div className="flex items-center gap-2 border-t border-zinc-800 pt-5"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800"><motion.div key={active.id} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.1 }} className="h-full rounded-full bg-amber-400"/></div><span className="text-[10px] text-zinc-500">100%</span></div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </section>
  );
}