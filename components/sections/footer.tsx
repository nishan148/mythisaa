import Link from "next/link";
import { BriefcaseBusiness, Code2, MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const groups = [
  { title: "Product", links: ["Workspace", "Studio", "Agents", "Integrations", "Pricing"] },
  { title: "Resources", links: ["Documentation", "Guides", "Changelog", "Blog", "Community"] },
  { title: "Company", links: ["About", "Careers", "Security", "Contact", "Partners"] },
  { title: "Legal", links: ["Privacy", "Terms", "Data policy", "Acceptable use"] },
];

export function Footer() {
  return (
    <footer id="footer" className="border-t border-zinc-200 bg-white py-12 sm:py-16">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_2fr]">
          <div><Link href="#" aria-label="MythMind home"><Logo /></Link><p className="mt-5 max-w-xs text-sm leading-6 text-zinc-500">The intelligent workspace for people building what comes next.</p><div className="mt-6 flex gap-2">{[MessageCircle, Code2, BriefcaseBusiness].map((Icon, i) => <Link href="#" key={i} aria-label={["Community", "GitHub", "LinkedIn"][i]} className="grid size-9 place-items-center rounded-full border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-900"><Icon size={15}/></Link>)}</div></div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">{groups.map(group => <div key={group.title}><h3 className="text-xs font-semibold text-zinc-900">{group.title}</h3><ul className="mt-4 space-y-3">{group.links.map(link => <li key={link}><Link href="#" className="text-xs text-zinc-500 transition hover:text-zinc-900">{link}</Link></li>)}</ul></div>)}</div>
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-zinc-200 pt-6 text-[11px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} MythMind, Inc. All rights reserved.</p><p className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-emerald-500"/> All systems operational</p></div>
      </Container>
    </footer>
  );
}