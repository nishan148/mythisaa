"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { DashboardPreview } from "@/components/product/dashboard-preview";
import { cn } from "@/lib/utils";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
  return (
    <section className="relative overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28 lg:pt-44">
      <div className="hero-grid absolute inset-x-0 top-0 -z-10 h-[750px]" />
      <div className="absolute left-1/2 top-0 -z-20 h-[650px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(234,179,8,.11),transparent_66%)]" />
      <Container>
        <motion.div initial={reduceMotion ? false : "hidden"} animate="show" variants={{ show: { transition: { staggerChildren: .09 } } }} className="mx-auto max-w-4xl text-center">
          <motion.div variants={item} transition={{ duration: .55 }} className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-800 shadow-sm"><Sparkles size={13}/> Meet your intelligent build team <ArrowRight size={13}/></motion.div>
          <motion.h1 variants={item} transition={{ duration: .6 }} className="text-balance text-[46px] font-semibold leading-[.98] tracking-[-0.06em] text-zinc-950 sm:text-6xl lg:text-[78px]">The AI workspace that <span className="relative whitespace-nowrap">builds with you<span className="absolute -bottom-1 left-1 right-1 -z-10 h-3 rounded-full bg-amber-300/70 sm:h-4"/></span>.</motion.h1>
          <motion.p variants={item} transition={{ duration: .6 }} className="mx-auto mt-7 max-w-2xl text-pretty text-base leading-7 text-zinc-600 sm:text-xl sm:leading-8">Turn ambitious ideas into finished work with a coordinated team of AI agents that research, reason, create, and ship alongside you.</motion.p>
          <motion.div variants={item} transition={{ duration: .6 }} className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link href="/login?mode=signup" className={cn(buttonVariants({ size: "lg" }), "group w-full sm:w-auto")}>Start building for free <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5"/></Link><Link href="#showcase" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}><PlayCircle size={17}/> See how it works</Link></motion.div>
          <motion.p variants={item} className="mt-4 text-xs text-zinc-400">No credit card required · Set up in under a minute</motion.p>
        </motion.div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 35, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: .5, duration: .8, ease: [0.22, 1, 0.36, 1] }} className="mt-16 sm:mt-20"><DashboardPreview /></motion.div>
      </Container>
    </section>
  );
}