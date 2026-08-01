"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Bot, Check, ChevronDown, CircleUserRound, Code2, FileText, Globe2, MoreHorizontal, Paperclip, Play, Search, Sparkles, Terminal, WandSparkles } from "lucide-react";

const agents = [
  { icon: Search, name: "Researcher", status: "Sources mapped", color: "bg-blue-50 text-blue-600" },
  { icon: Code2, name: "Engineer", status: "Building", color: "bg-violet-50 text-violet-600" },
  { icon: FileText, name: "Writer", status: "Ready", color: "bg-emerald-50 text-emerald-600" },
];

export function DashboardPreview() {
  const reduceMotion = useReducedMotion();
  const floating = reduceMotion ? {} : { y: [0, -5, 0] };
  return (
    <div className="relative mx-auto max-w-[1080px] px-2 sm:px-7 lg:px-0" aria-label="MythMind application interface preview">
      <motion.div animate={floating} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-3 top-24 z-20 hidden w-52 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_18px_55px_rgba(24,24,27,.13)] lg:block">
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-700"><WandSparkles size={15} /></span><div><p className="text-xs font-semibold text-zinc-900">Task orchestrated</p><p className="text-[10px] text-zinc-500">3 agents in sync</p></div></div>
      </motion.div>
      <motion.div animate={floating} transition={{ duration: 5.5, delay: .8, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-4 bottom-24 z-20 hidden w-48 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_18px_55px_rgba(24,24,27,.13)] lg:block">
        <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check size={15} /></span><div><p className="text-xs font-semibold text-zinc-900">Build complete</p><p className="text-[10px] text-zinc-500">12 checks passed</p></div></div>
      </motion.div>

      <div className="overflow-hidden rounded-[20px] border border-zinc-300/80 bg-white shadow-[0_35px_90px_rgba(24,24,27,.14),0_2px_8px_rgba(24,24,27,.06)] sm:rounded-[26px]">
        <div className="flex h-12 items-center border-b border-zinc-200 bg-zinc-50/80 px-4 sm:h-14">
          <div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-zinc-300"/><span className="size-2.5 rounded-full bg-zinc-300"/><span className="size-2.5 rounded-full bg-zinc-300"/></div>
          <div className="mx-auto flex items-center gap-2 text-[11px] font-medium text-zinc-500"><Sparkles size={12} className="text-amber-500" /> MythMind Studio <ChevronDown size={11}/></div>
          <MoreHorizontal size={16} className="text-zinc-400" />
        </div>
        <div className="grid min-h-[430px] grid-cols-[58px_1fr] sm:grid-cols-[190px_1fr] lg:grid-cols-[210px_1fr_250px]">
          <aside className="border-r border-zinc-200 bg-zinc-50/60 p-2 sm:p-3">
            <div className="mb-5 flex items-center gap-2 rounded-lg px-2 py-2"><span className="grid size-7 shrink-0 place-items-center rounded-lg bg-zinc-950 text-white"><Sparkles size={13}/></span><span className="hidden text-xs font-semibold text-zinc-900 sm:block">Acme launch</span></div>
            <div className="space-y-1">
              {[{ icon: CircleUserRound, text: "Overview" }, { icon: Bot, text: "Agent team" }, { icon: FileText, text: "Documents" }, { icon: Globe2, text: "Sources" }, { icon: Terminal, text: "Codebase" }].map(({icon: Icon, text}, i) => <div key={text} className={`flex items-center gap-2.5 rounded-lg px-2 py-2 text-[11px] ${i === 1 ? "bg-white font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200" : "text-zinc-500"}`}><Icon size={14}/><span className="hidden sm:block">{text}</span></div>)}
            </div>
            <div className="mt-20 hidden border-t border-zinc-200 pt-3 sm:block"><p className="px-2 text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Recent</p><p className="mt-2 truncate px-2 text-[10px] text-zinc-500">Product research</p><p className="mt-2 truncate px-2 text-[10px] text-zinc-500">Launch strategy</p></div>
          </aside>
          <main className="flex min-w-0 flex-col bg-white">
            <div className="border-b border-zinc-100 px-4 py-4 sm:px-7 sm:py-5"><div className="flex items-center justify-between"><div><p className="text-[10px] font-medium text-zinc-400">WORKSPACE / LAUNCH</p><h3 className="mt-1 text-sm font-semibold text-zinc-900 sm:text-base">Ship the developer platform</h3></div><button className="hidden h-8 items-center gap-1.5 rounded-lg bg-zinc-950 px-3 text-[10px] font-semibold text-white sm:flex"><Play size={11} fill="currentColor"/> Run</button></div></div>
            <div className="flex-1 space-y-4 p-4 sm:p-7">
              <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-zinc-100"><CircleUserRound size={13}/></span><div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3 text-[11px] leading-5 text-zinc-700 sm:text-xs">Research the market, define our positioning, and build the launch experience.</div></div>
              <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-amber-400 text-zinc-950"><Sparkles size={13}/></span><div className="min-w-0 flex-1"><p className="mb-2 text-[11px] font-semibold text-zinc-900">MythMind</p><p className="text-[11px] leading-5 text-zinc-600 sm:text-xs">I’ve assembled a focused agent team. They’ll work in parallel while keeping decisions and context aligned.</p><div className="mt-4 grid gap-2 sm:grid-cols-3">{agents.map(({icon: Icon, name, status, color}) => <div key={name} className="rounded-xl border border-zinc-200 p-2.5"><span className={`mb-2 grid size-7 place-items-center rounded-lg ${color}`}><Icon size={13}/></span><p className="text-[10px] font-semibold text-zinc-800">{name}</p><p className="mt-0.5 text-[9px] text-zinc-400">{status}</p></div>)}</div></div></div>
              <div className="ml-10 hidden rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:block"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-500"/><p className="text-[10px] font-medium text-zinc-700">Agents are collaborating</p></div><span className="text-[9px] text-zinc-400">2m 14s</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-200"><div className="h-full w-2/3 rounded-full bg-amber-400"/></div></div>
            </div>
            <div className="m-3 flex h-11 items-center rounded-xl border border-zinc-200 bg-white px-3 shadow-sm sm:m-5"><Paperclip size={14} className="text-zinc-400"/><span className="ml-2 text-[10px] text-zinc-400">Ask your workspace anything…</span><span className="ml-auto grid size-7 place-items-center rounded-lg bg-zinc-950 text-white"><Sparkles size={12}/></span></div>
          </main>
          <aside className="hidden border-l border-zinc-200 bg-zinc-50/40 p-4 lg:block"><div className="flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Activity</p><MoreHorizontal size={14} className="text-zinc-400"/></div><div className="mt-5 space-y-5">{agents.map(({icon: Icon, name}, i) => <div className="flex gap-2.5" key={name}><span className="grid size-7 shrink-0 place-items-center rounded-full border border-zinc-200 bg-white"><Icon size={12}/></span><div><p className="text-[10px] font-medium text-zinc-700">{name} {i === 1 ? "created a branch" : i === 0 ? "added 8 sources" : "drafted positioning"}</p><p className="mt-1 text-[9px] text-zinc-400">{i + 1} min ago</p></div></div>)}</div><div className="mt-8 rounded-xl border border-zinc-200 bg-white p-3"><p className="text-[10px] font-semibold text-zinc-800">Shared memory</p><p className="mt-2 text-[9px] leading-4 text-zinc-500">24 decisions and 16 insights available to every agent.</p><div className="mt-3 flex -space-x-1.5">{["R","E","W"].map(v => <span key={v} className="grid size-6 place-items-center rounded-full border-2 border-white bg-zinc-100 text-[8px] font-semibold text-zinc-600">{v}</span>)}</div></div></aside>
        </div>
      </div>
    </div>
  );
}