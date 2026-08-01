import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const plans = [
  { name: "Free", price: "$0", description: "Explore MythMind with everything you need to start.", features: ["1 active workspace", "Core agent capabilities", "Limited monthly runs"], cta: "Start for free", featured: false },
  { name: "Pro", price: "$29", description: "For professionals building ambitious work every day.", features: ["Unlimited workspaces", "Advanced agent teams", "Expanded context & memory", "Priority integrations"], cta: "Start Pro", featured: true },
  { name: "Team", price: "$79", description: "Shared intelligence and governance for growing teams.", features: ["Everything in Pro", "Up to 5 members", "Shared team knowledge", "Admin controls & support"], cta: "Start with Team", featured: false },
  { name: "MythMind Startup", price: "$299", description: "For startups that need serious room to build.", features: ["100,000 monthly credits", "Up to 25 members", "Advanced agent teams", "Priority support"], cta: "Start Startup", featured: false },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-y border-zinc-200 bg-white py-24 sm:py-32">
      <Container>
        <Reveal><SectionHeading align="center" eyebrow="Simple pricing" title="Start small. Scale your intelligence." description="Transparent plans designed around how much you build—not how many features we can put behind a paywall." /></Reveal>
        <div className="mt-14 grid items-stretch gap-4 lg:grid-cols-4">
          {plans.map((plan, i) => <Reveal key={plan.name} delay={i * .07}><article className={cn("relative flex h-full flex-col rounded-3xl border p-7 sm:p-8", plan.featured ? "border-zinc-950 bg-zinc-950 text-white shadow-2xl" : "border-zinc-200 bg-stone-50")}>
            {plan.featured && <span className="absolute right-6 top-6 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-950">Most popular</span>}
            <p className={cn("text-sm font-semibold", plan.featured ? "text-white" : "text-zinc-900")}>{plan.name}</p><div className="mt-7 flex items-end gap-1"><span className="text-4xl font-semibold tracking-[-.05em]">{plan.price}</span><span className={cn("mb-1 text-xs", plan.featured ? "text-zinc-500" : "text-zinc-400")}>/ month</span></div><p className={cn("mt-4 min-h-12 text-sm leading-6", plan.featured ? "text-zinc-400" : "text-zinc-600")}>{plan.description}</p>
            <ul className={cn("my-8 space-y-3 border-t pt-7", plan.featured ? "border-zinc-800" : "border-zinc-200")}>{plan.features.map(feature => <li key={feature} className={cn("flex items-center gap-2.5 text-sm", plan.featured ? "text-zinc-300" : "text-zinc-600")}><span className={cn("grid size-5 place-items-center rounded-full", plan.featured ? "bg-amber-400 text-zinc-950" : "bg-amber-100 text-amber-800")}><Check size={11}/></span>{feature}</li>)}</ul>
            <Link href="/login?mode=signup" className={cn(buttonVariants({ variant: plan.featured ? "accent" : "outline" }), "mt-auto w-full")}>{plan.cta}<ArrowRight size={14}/></Link>
          </article></Reveal>)}
        </div>
      </Container>
    </section>
  );
}