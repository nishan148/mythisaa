"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";

export function DashboardMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!root.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-dashboard-reveal]", { y: 14, opacity: 0, duration: 0.55, stagger: 0.045, ease: "power3.out" });
    }, root);
    return () => ctx.revert();
  }, []);
  return <div ref={root} className="contents">{children}</div>;
}