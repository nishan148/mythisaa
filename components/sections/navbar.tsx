"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  ["Product", "#product"], ["Studio", "#showcase"], ["Agents", "#features"],
  ["Pricing", "#pricing"], ["Blog", "#footer"], ["Docs", "#how-it-works"],
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 border-b border-transparent transition-all duration-300", scrolled && "border-zinc-200/80 bg-stone-50/85 shadow-[0_1px_0_rgba(0,0,0,.02)] backdrop-blur-xl")}>
      <Container className="flex h-16 items-center justify-between lg:h-[72px]">
        <Link href="/" aria-label="MythMind home"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {links.map(([label, href]) => <Link key={label} href={href} className="rounded-full px-3.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950">{label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Log in</Link>
          <Link href="/login?mode=signup" className={buttonVariants({ variant: "primary", size: "sm" })}>Get started</Link>
        </div>
        <button className="grid size-10 place-items-center rounded-full text-zinc-700 hover:bg-zinc-100 lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </Container>
      {open && (
        <div className="border-t border-zinc-200 bg-stone-50 px-5 pb-5 lg:hidden">
          <nav className="mx-auto flex max-w-[1200px] flex-col py-3" aria-label="Mobile navigation">
            {links.map(([label, href]) => <Link key={label} href={href} onClick={() => setOpen(false)} className="border-b border-zinc-200/70 py-3 text-sm font-medium text-zinc-700">{label}</Link>)}
          </nav>
          <div className="mx-auto flex max-w-[1200px] gap-2 pt-2"><Link href="/login" onClick={() => setOpen(false)} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Log in</Link><Link href="/login?mode=signup" onClick={() => setOpen(false)} className={cn(buttonVariants(), "flex-1")}>Get started</Link></div>
        </div>
      )}
    </header>
  );
}