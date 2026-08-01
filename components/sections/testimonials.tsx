import { Quote } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { SectionHeading } from "@/components/ui/section-heading";

const testimonials = [
  { quote: "MythMind feels less like prompting a tool and more like working with a deeply prepared product team. The quality of the handoff is exceptional.", name: "Maya Chen", role: "Co-founder, Northstar", initials: "MC" },
  { quote: "We went from a scattered research process to a repeatable system. Every conclusion is sourced, and the entire team can build on the same context.", name: "Jon Bell", role: "Research Lead, Aperture", initials: "JB" },
  { quote: "The difference is continuity. MythMind understands the repository, the product decisions, and why we made them—not just the latest request.", name: "Elena Rossi", role: "VP Engineering, Vertex", initials: "ER" },
];

export function Testimonials() {
  return (
    <section className="py-24 sm:py-32">
      <Container>
        <Reveal><SectionHeading align="center" eyebrow="Built for high-agency teams" title="Work that compounds, not context that disappears." description="Early teams use MythMind to turn their best thinking into durable systems and consistently better outcomes." /></Reveal>
        <div className="mt-14 grid gap-4 lg:grid-cols-3">
          {testimonials.map((item, i) => <Reveal key={item.name} delay={i * .07}><figure className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-7"><Quote size={22} className="text-amber-500" fill="currentColor"/><blockquote className="mt-6 flex-1 text-base leading-7 text-zinc-700">“{item.quote}”</blockquote><figcaption className="mt-8 flex items-center gap-3 border-t border-zinc-100 pt-5"><span className="grid size-9 place-items-center rounded-full bg-zinc-950 text-[10px] font-semibold text-white">{item.initials}</span><span><span className="block text-xs font-semibold text-zinc-900">{item.name}</span><span className="mt-1 block text-[11px] text-zinc-500">{item.role}</span></span></figcaption></figure></Reveal>)}
        </div>
      </Container>
    </section>
  );
}