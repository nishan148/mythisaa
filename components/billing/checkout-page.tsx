"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { PLAN_ENTITLEMENTS, isPlanId, type PlanId } from "@/lib/mythmind/billing";

export function CheckoutPage() {
  const params = useSearchParams();
  const initial = isPlanId(params.get("plan")) ? params.get("plan") as PlanId : "hustler";
  const [plan, setPlan] = useState<PlanId>(initial);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const context = params.get("context") === "workspace" ? "workspace" : "personal";
  const selected = PLAN_ENTITLEMENTS[plan];
  async function activate() {
    setLoading(true); setStatus("");
    try {
      const response = await fetch("/api/billing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan, context }) });
      const data = await response.json() as { message?: string; error?: string; checkoutUrl?: string | null };
      if (response.ok && "checkoutUrl" in data && typeof data.checkoutUrl === "string") window.location.assign(data.checkoutUrl);
      setStatus(response.ok ? data.message || "Plan activated." : data.error || "Checkout failed.");
    } catch { setStatus("Checkout failed. Please try again."); } finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-[#f7f7f5] px-5 py-10 text-zinc-950 sm:px-8"><div className="mx-auto max-w-5xl"><Link href="/" className="text-sm font-bold">MythMind</Link><div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px]"><section><p className="text-xs font-bold uppercase tracking-[.18em] text-amber-700">Secure checkout</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Choose your workspace plan</h1><p className="mt-3 text-sm text-zinc-500">Payments are securely processed by Dodo Payments. Your plan activates only after a verified payment event.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{(Object.entries(PLAN_ENTITLEMENTS) as [PlanId, typeof selected][]).map(([id, item]) => <button key={id} onClick={() => setPlan(id)} className={`rounded-2xl border p-5 text-left ${plan === id ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200" : "border-zinc-200 bg-white"}`}><div className="flex justify-between"><strong>{item.name}</strong><span className="font-semibold">${item.price}</span></div><p className="mt-2 text-xs text-zinc-500">{item.credits.toLocaleString()} credits / {item.period}</p><p className="mt-3 text-xs leading-5 text-zinc-500">{item.description}</p></button>)}</div></section><aside className="h-fit rounded-3xl bg-zinc-950 p-6 text-white"><CreditCard className="text-amber-300" /><h2 className="mt-5 text-xl font-semibold">{selected.name} plan</h2><div className="mt-3 text-4xl font-semibold">${selected.price}<span className="text-sm text-zinc-400"> / {selected.period === "daily" ? "day" : "month"}</span></div><ul className="mt-6 space-y-3 text-sm text-zinc-300"><li className="flex gap-2"><Check size={16} className="text-amber-300" /> {selected.credits.toLocaleString()} credits</li><li className="flex gap-2"><ShieldCheck size={16} className="text-amber-300" /> Verified Dodo Payments checkout</li></ul><button onClick={() => void activate()} disabled={loading || plan === "free"} className="mt-8 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white font-bold text-zinc-950 disabled:opacity-60">{loading && <Loader2 size={16} className="animate-spin" />}{loading ? "Opening checkout…" : plan === "free" ? "Free plan" : `Continue with ${selected.name}`}</button>{status && <p className="mt-4 rounded-xl bg-white/10 p-3 text-xs leading-5 text-zinc-200">{status}</p>}</aside></div></div></main>;
}