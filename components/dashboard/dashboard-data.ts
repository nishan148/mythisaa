import type { LucideIcon } from "lucide-react";
import {
  Bot,
  BrainCircuit,
  Code2,
  FileSearch,
  LineChart,
  Palette,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

export type ViewId = "chat" | "agents" | "teams" | "usage" | "settings";
export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  agent?: string;
  attachments?: Attachment[];
};
export type Attachment = { name: string; type: string; size: number; text?: string };
export type Conversation = {
  id: string;
  title: string;
  updatedAt: string;
  messages: Message[];
};
export type Agent = {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: LucideIcon;
  color: string;
  status: "Active" | "Paused";
  tasks: number;
  success: number;
  capabilities: string[];
};

const now = new Date().toISOString();

export const starterConversations: Conversation[] = [
  {
    id: "launch-plan",
    title: "Q4 product launch plan",
    updatedAt: now,
    messages: [
      {
        id: "welcome-1",
        role: "assistant",
        agent: "Orion",
        createdAt: now,
        content:
          "I’ve assembled a focused launch plan across product, growth, and customer success. The critical path is a two-week beta, proof-point capture, and a coordinated launch narrative.\n\n**Recommended next move**\nAlign the team on one measurable promise before producing campaign assets. I can turn that promise into a complete execution brief when you’re ready.",
      },
    ],
  },
  {
    id: "competitor-research",
    title: "Competitor research synthesis",
    updatedAt: new Date(Date.now() - 86_400_000).toISOString(),
    messages: [
      {
        id: "research-1",
        role: "assistant",
        agent: "Atlas",
        createdAt: now,
        content:
          "The market is converging on generic copilots. MythMind’s defensible position is coordinated specialist agents with transparent handoffs, shared memory, and measurable outcomes.",
      },
    ],
  },
  {
    id: "onboarding-flow",
    title: "Improve onboarding activation",
    updatedAt: new Date(Date.now() - 172_800_000).toISOString(),
    messages: [],
  },
];

export const agents: Agent[] = [
  {
    id: "orion",
    name: "Orion",
    role: "Chief of Staff",
    description: "Plans complex work, delegates to specialists, and keeps execution aligned.",
    icon: BrainCircuit,
    color: "amber",
    status: "Active",
    tasks: 142,
    success: 98,
    capabilities: ["Planning", "Delegation", "Synthesis"],
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "Research Analyst",
    description: "Finds reliable signals, compares sources, and produces decision-ready research.",
    icon: FileSearch,
    color: "blue",
    status: "Active",
    tasks: 89,
    success: 96,
    capabilities: ["Web research", "Analysis", "Citations"],
  },
  {
    id: "forge",
    name: "Forge",
    role: "Product Engineer",
    description: "Turns product intent into robust technical plans and production-grade code.",
    icon: Code2,
    color: "violet",
    status: "Active",
    tasks: 71,
    success: 94,
    capabilities: ["Architecture", "Code", "QA"],
  },
  {
    id: "muse",
    name: "Muse",
    role: "Creative Director",
    description: "Shapes clear narratives, visual directions, and differentiated brand systems.",
    icon: Palette,
    color: "rose",
    status: "Active",
    tasks: 58,
    success: 97,
    capabilities: ["Strategy", "Writing", "Creative"],
  },
  {
    id: "pulse",
    name: "Pulse",
    role: "Growth Strategist",
    description: "Designs experiments and finds the shortest path to sustainable growth.",
    icon: LineChart,
    color: "emerald",
    status: "Active",
    tasks: 64,
    success: 92,
    capabilities: ["Growth", "Experiments", "Metrics"],
  },
  {
    id: "aegis",
    name: "Aegis",
    role: "Risk & Security",
    description: "Reviews plans, systems, and outputs for operational and security risks.",
    icon: ShieldCheck,
    color: "slate",
    status: "Paused",
    tasks: 33,
    success: 99,
    capabilities: ["Security", "Compliance", "Review"],
  },
];

export const promptSuggestions = [
  { icon: Search, title: "Research a market", prompt: "Research the agentic AI workspace market and surface three underserved opportunities." },
  { icon: Sparkles, title: "Create a strategy", prompt: "Create a concise go-to-market strategy for a new collaborative AI product." },
  { icon: Bot, title: "Build an agent", prompt: "Design a specialist agent for customer research, including its instructions and workflow." },
  { icon: UsersRound, title: "Coordinate a team", prompt: "Create a three-agent team to plan, write, and review a product launch campaign." },
];

export function createDemoResponse(prompt: string, agentName: string) {
  const topic = prompt.trim().replace(/[?.!]$/, "");
  return `I’ve mapped **${topic}** into an execution-ready path. Here’s the strongest approach:\n\n1. **Define the outcome** — choose one measurable result and the constraints that matter.\n2. **Build the evidence layer** — gather customer, market, and product signals before committing resources.\n3. **Run a focused sprint** — assign an owner, a seven-day milestone, and a clear review gate.\n\n**My recommendation**\nStart with the smallest reversible decision, instrument it, and let the result determine the next investment. ${agentName} can coordinate the specialist handoffs and turn this into a detailed brief.\n\n> Demo intelligence is active. Connect your preferred model provider later for live generation.`;
}

export function formatRelativeTime(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60_000) return "Now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}