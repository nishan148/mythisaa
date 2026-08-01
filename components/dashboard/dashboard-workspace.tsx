"use client";

import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import {
  Activity,
  ArrowRight,
  Bell,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Copy,
  CreditCard,
  Database,
  Gauge,
  Globe2,
  KeyRound,
  LayoutGrid,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareText,
  Mic,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Paperclip,
  PenLine,
  Pencil,
  Plus,
  Search,
  Send,
  Share2,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingUp,
  TriangleAlert,
  UploadCloud,
  UserPlus,
  UserRound,
  UsersRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import {
  agents,
  formatRelativeTime,
  promptSuggestions,
  starterConversations,
  type Agent,
  type Attachment,
  type Conversation,
  type ViewId,
} from "./dashboard-data";
import { DashboardMotion } from "./dashboard-motion";
import { formatCredits, PLAN_ENTITLEMENTS, type BillingContext, type MythMindAccount, type PlanId, type WorkspaceContextType } from "@/lib/mythmind/billing";
import type { WorkspaceAccess, WorkspacePermissions } from "@/lib/mythmind/teams";
import { createClient } from "@/lib/supabase/client";

type DashboardUser = { name: string; email: string; provider: string; avatarUrl?: string };
type Team = { id: string; name: string; purpose: string; members: string[]; runs: number; status: "Ready" | "Running" };
type SpeechRecognitionEventLike = { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> };
type SpeechRecognitionErrorLike = { error: string };
type SpeechRecognitionLike = { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((event: SpeechRecognitionEventLike) => void) | null; onerror: ((event: SpeechRecognitionErrorLike) => void) | null; onend: (() => void) | null };
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type DashboardNotification = { id: string; title: string; body: string; kind: "admin" | "credits" | "upgrade" | "system"; createdAt: string; read: boolean; action?: "upgrade" | "usage" };

const navItems = [
  { id: "chat" as const, label: "Chats", icon: MessageSquareText },
  { id: "agents" as const, label: "Agents", icon: Bot },
  { id: "teams" as const, label: "Teams", icon: UsersRound },
  { id: "usage" as const, label: "Credits & usage", icon: Gauge },
];

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function RichText({ text }: { text: string }) {
  const renderInline = (line: string) => line.split(/(\*\*.*?\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i} className="font-semibold text-zinc-950">{part.slice(2, -2)}</strong> : part,
  );
  return <div className="space-y-3 text-[15px] leading-7 text-zinc-700">{text.split("\n").map((line, i) => {
    if (!line) return <div key={i} className="h-1" />;
    if (/^\d\. /.test(line)) return <p key={i} className="pl-1">{renderInline(line)}</p>;
    if (line.startsWith("> ")) return <p key={i} className="rounded-r-xl border-l-2 border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-950">{renderInline(line.slice(2))}</p>;
    return <p key={i}>{renderInline(line)}</p>;
  })}</div>;
}

function AgentMark({ agent, size = "md" }: { agent: Agent; size?: "sm" | "md" | "lg" }) {
  const Icon = agent.icon;
  const tones: Record<string, string> = { amber: "bg-amber-100 text-amber-800", blue: "bg-blue-100 text-blue-700", violet: "bg-violet-100 text-violet-700", rose: "bg-rose-100 text-rose-700", emerald: "bg-emerald-100 text-emerald-700", slate: "bg-zinc-200 text-zinc-700" };
  return <span className={cn("grid shrink-0 place-items-center rounded-xl", tones[agent.color], size === "sm" ? "size-8" : size === "lg" ? "size-12 rounded-2xl" : "size-10")}><Icon size={size === "lg" ? 21 : size === "sm" ? 15 : 18} /></span>;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} className={cn("relative h-6 w-11 rounded-full transition", checked ? "bg-zinc-950" : "bg-zinc-200")}><span className={cn("absolute top-1 size-4 rounded-full bg-white shadow-sm transition-all", checked ? "left-6" : "left-1")} /></button>;
}

export function DashboardWorkspace({ user, initialAccount }: { user: DashboardUser; initialAccount?: MythMindAccount | null }) {
  const [view, setView] = useState<ViewId>("chat");
  const [conversations, setConversations] = useState<Conversation[]>(starterConversations);
  const [activeId, setActiveId] = useState(starterConversations[0].id);
  const [prompt, setPrompt] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("orion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAllChats, setShowAllChats] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [newAgentOpen, setNewAgentOpen] = useState(false);
  const [newTeamOpen, setNewTeamOpen] = useState(false);
  const [customAgents, setCustomAgents] = useState<Agent[]>([]);
  const [toast, setToast] = useState("");
  const [workspaceAccess, setWorkspaceAccess] = useState<WorkspaceAccess | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [browserNotifications, setBrowserNotifications] = useState<NotificationPermission | "unsupported">("default");
  const [account, setAccount] = useState<BillingContext | MythMindAccount | null>(initialAccount ?? null);
  const [contextType, setContextType] = useState<WorkspaceContextType>("personal");
  const [contextsAvailable, setContextsAvailable] = useState(true);
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const [settings, setSettings] = useState({ notifications: true, product: false, memory: true, training: false, dark: false });
  const viewRef = useRef<HTMLDivElement>(null);
  const allAgents = [...agents, ...customAgents];
  const activeConversation = conversations.find((item) => item.id === activeId) || conversations[0];
  const activeAgent = allAgents.find((item) => item.id === selectedAgent) || agents[0];

  const loadContext = async (next: WorkspaceContextType) => {
    const response = await fetch(`/api/workspace?context=${next}`, { cache: "no-store" });
    const data = await response.json() as { account?: BillingContext; conversations?: Array<{ id: string; title: string; messages: Conversation["messages"]; updated_at: string }>; error?: string };
    if (!response.ok) { if (next === "workspace") setContextsAvailable(false); setToast(data.error || "Unable to load workspace."); return; }
    setContextType(next); setContextsAvailable(true);
    if (data.account) setAccount(data.account);
    if (data.conversations?.length) setConversations(data.conversations.map((item) => ({ id: item.id, title: item.title, messages: item.messages, updatedAt: item.updated_at })));
    else setConversations(starterConversations);
  };

  const persistConversations = async (items: Conversation[]) => {
    await fetch("/api/workspace", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ context: contextType, conversations: items }) });
  };

  useEffect(() => { void loadContext("personal"); }, []);

  const loadTeams = async () => {
    const response = await fetch("/api/teams");
    const data = await response.json();
    if (response.ok) { setWorkspaceAccess(data.access); setContextsAvailable(true); }
    else if (response.status === 404) { setWorkspaceAccess(null); setContextsAvailable(false); }
    else setToast(data.error || "Unable to load teams.");
  };

  useEffect(() => { if (view === "teams") void loadTeams(); }, [view]);
  useEffect(() => { void loadTeams(); }, []);
  const canChat = workspaceAccess?.can_chat !== false;
  const canViewAgents = workspaceAccess?.can_view_agents !== false;
  const canViewTeams = workspaceAccess?.can_view_teams !== false;

  const teamAction = async (payload: Record<string, unknown>, success: string) => {
    const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) { setToast(data.error || "Unable to update teams."); return false; }
    setToast(success);
    await loadTeams();
    return true;
  };
  useEffect(() => {
    if (!account) return;
    const id = window.setTimeout(() => void persistConversations(conversations), 350);
    return () => window.clearTimeout(id);
  }, [conversations, contextType, account]);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mythmind-settings");
      if (saved) setSettings((current) => ({ ...current, ...JSON.parse(saved) }));
    } catch { /* local storage can be unavailable */ }
  }, []);
  useEffect(() => { try { localStorage.setItem("mythmind-settings", JSON.stringify(settings)); } catch { /* noop */ } }, [settings]);
  useEffect(() => { document.documentElement.classList.toggle("mythmind-dark", settings.dark); return () => document.documentElement.classList.remove("mythmind-dark"); }, [settings.dark]);
  useEffect(() => {
    setBrowserNotifications("Notification" in window ? Notification.permission : "unsupported");
    const channel = supabase.channel("mythmind-user-notifications", { config: { private: true } })
      .on("broadcast", { event: "notification" }, ({ payload }) => {
        const incoming = payload as Partial<DashboardNotification>;
        const notification: DashboardNotification = { id: incoming.id || crypto.randomUUID(), title: incoming.title || "MythMind update", body: incoming.body || "You have a new workspace update.", kind: incoming.kind || "admin", createdAt: incoming.createdAt || new Date().toISOString(), read: false, action: incoming.action };
        setNotifications((items) => [notification, ...items].slice(0, 30));
        if (document.hidden && Notification.permission === "granted") new Notification(notification.title, { body: notification.body, icon: "/icon.png", tag: notification.id });
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [supabase]);
  useEffect(() => {
    if (!account) return;
    const limit = account.credits_limit || PLAN_ENTITLEMENTS[account.plan].credits;
    const remaining = account.credits_remaining;
    const low = remaining <= Math.max(10, Math.round(limit * .15));
    const generated: DashboardNotification[] = [
      { id: `welcome-${account.plan}`, title: account.plan === "free" ? "Unlock more with Hustler" : `${PLAN_ENTITLEMENTS[account.plan].name} plan active`, body: account.plan === "free" ? "Upgrade for 300 daily credits and expanded workspace features." : `Your ${account.credit_period} credit allowance is active.`, kind: account.plan === "free" ? "upgrade" : "system", createdAt: new Date().toISOString(), read: false, action: account.plan === "free" ? "upgrade" : "usage" },
      ...(low ? [{ id: `credits-${contextType}-${account.credit_period}`, title: "Credits are running low", body: `Only ${formatCredits(remaining)} credits remain. Upgrade now to keep your work moving.`, kind: "credits" as const, createdAt: new Date().toISOString(), read: false, action: "upgrade" as const }] : []),
    ];
    setNotifications((items) => [...generated.filter((item) => !items.some((existing) => existing.id === item.id)), ...items].slice(0, 30));
  }, [account, contextType]);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen((open) => !open); }
      if (event.key === "Escape") { setCommandOpen(false); setSidebarOpen(false); setProfileOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!viewRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tween = gsap.fromTo(viewRef.current, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: .35, ease: "power3.out" });
    return () => { tween.kill(); };
  }, [view, activeId]);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(""), 2600); return () => clearTimeout(id); }, [toast]);
  useEffect(() => {
    const refresh = async () => { const response = await fetch(`/api/workspace?context=${contextType}`, { cache: "no-store" }); if (response.ok) { const data = await response.json() as { account?: BillingContext }; if (data.account) setAccount(data.account); } };
    const id = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(id);
  }, [contextType]);
  useEffect(() => {
    if (!contextMenuOpen || !contextMenuRef.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(contextMenuRef.current, { opacity: 0, y: -8, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .22, ease: "power3.out" });
  }, [contextMenuOpen]);

  const openView = (next: ViewId) => { setView(next); setSidebarOpen(false); setProfileOpen(false); };
  const newChat = () => {
    const id = crypto.randomUUID();
    setConversations((items) => [{ id, title: "Untitled conversation", updatedAt: new Date().toISOString(), messages: [] }, ...items]);
    setActiveId(id); openView("chat"); setPrompt(""); setAttachments([]);
  };
  const selectConversation = (id: string) => { setActiveId(id); openView("chat"); };
  const deleteConversation = (id: string) => {
    const remaining = conversations.filter((item) => item.id !== id);
    if (!remaining.length) { newChat(); return; }
    setConversations(remaining); if (activeId === id) setActiveId(remaining[0].id);
  };
  const startRename = (conversation: Conversation) => { setRenamingId(conversation.id); setRenameValue(conversation.title); };
  const finishRename = () => { const title = renameValue.trim(); if (renamingId && title) setConversations((items) => items.map((item) => item.id === renamingId ? { ...item, title, updatedAt: new Date().toISOString() } : item)); setRenamingId(null); };
  const requestBrowserNotifications = async () => { if (!("Notification" in window)) return setBrowserNotifications("unsupported"); const permission = await Notification.requestPermission(); setBrowserNotifications(permission); if (permission === "granted") new Notification("MythMind notifications enabled", { body: "You’ll receive important workspace and credit alerts." }); };
  const openNotificationAction = (notification: DashboardNotification) => { setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item)); setNotificationsOpen(false); if (notification.action === "upgrade") window.location.href = `/checkout?context=${contextType}&plan=${account?.plan === "free" ? "hustler" : "pro"}`; else if (notification.action === "usage") openView("usage"); };
  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const content = prompt.trim();
    if ((!content && !attachments.length) || isGenerating || !activeConversation) return;
    const now = new Date().toISOString();
    const userMessage = { id: crypto.randomUUID(), role: "user" as const, content: content || "Shared files", createdAt: now, attachments };
    const titleText = content || attachments[0]?.name || "Shared files";
    const title = activeConversation.messages.length ? activeConversation.title : titleText.slice(0, 48) + (titleText.length > 48 ? "…" : "");
    setConversations((items) => items.map((item) => item.id === activeId ? { ...item, title, updatedAt: now, messages: [...item.messages, userMessage] } : item));
    setPrompt(""); setAttachments([]); setIsGenerating(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: content || "Review the attached files.", attachments, agent: activeAgent.name, context: contextType, history: activeConversation.messages.map(({ role, content: messageContent }) => ({ role, content: messageContent })) }) });
      const data = (await response.json()) as { content?: string; error?: string; account?: MythMindAccount };
      if (!response.ok) throw new Error(data.error || "Unable to generate a response");
      if (data.account) setAccount(data.account);
      setConversations((items) => items.map((item) => item.id === activeId ? { ...item, updatedAt: new Date().toISOString(), messages: [...item.messages, { id: crypto.randomUUID(), role: "assistant", content: data.content || "I couldn't generate a response.", createdAt: new Date().toISOString(), agent: activeAgent.name }] } : item));
    } catch (error) { setToast(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setIsGenerating(false); }
  };
  const handleComposerKey = (event: KeyboardEvent<HTMLTextAreaElement>) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } };

  const sidebar = <>
    <div className={cn("flex h-16 items-center justify-between", sidebarCollapsed ? "px-2" : "px-4")}><Link href="/" aria-label="MythMind home" className={cn(sidebarCollapsed && "hidden")}><Logo /></Link><button className="dash-icon-button hidden lg:grid" onClick={() => setSidebarCollapsed((value) => !value)} aria-label={sidebarCollapsed ? "Open sidebar" : "Close sidebar"}>{sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button><button className="dash-icon-button lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={18} /></button></div>
    <div className="px-3"><button onClick={newChat} title="New conversation" className={cn("flex h-11 w-full items-center rounded-xl bg-zinc-950 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800", sidebarCollapsed ? "justify-center px-0" : "justify-between px-3.5")}><span className="flex items-center gap-2.5"><Plus size={17} /><span className={cn(sidebarCollapsed && "hidden")}>New conversation</span></span>{!sidebarCollapsed && <span className="rounded border border-white/15 px-1.5 py-0.5 text-[10px] text-zinc-400">N</span>}</button></div>
    <nav className="mt-5 space-y-1 px-3" aria-label="Workspace navigation">{navItems.map((item) => { const allowed = item.id === "chat" ? canChat : item.id === "agents" ? canViewAgents : item.id === "teams" ? canViewTeams : true; return allowed ? <button key={item.id} title={sidebarCollapsed ? item.label : undefined} onClick={() => openView(item.id)} className={cn("dash-nav-item", sidebarCollapsed && "justify-center px-0", view === item.id && "dash-nav-item-active")}><item.icon size={17} /><span className={cn(sidebarCollapsed && "hidden")}>{item.label}</span></button> : null; })}</nav>
    {!sidebarCollapsed && <button onClick={() => openView("usage")} className="mx-3 mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-sm transition hover:border-amber-300"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Live credits</span><Zap size={14} className="text-amber-500" /></div><div className="mt-1 flex items-end justify-between"><strong className="text-lg tracking-tight">{formatCredits(account?.credits_remaining ?? PLAN_ENTITLEMENTS.free.credits)}</strong><span className="text-[10px] text-zinc-400">{account?.credit_period || "daily"}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${Math.min(100, ((account?.credits_remaining ?? PLAN_ENTITLEMENTS.free.credits) / (account?.credits_limit || PLAN_ENTITLEMENTS.free.credits)) * 100)}%` }} /></div></button>}
    {!sidebarCollapsed && <div className="mt-6 min-h-0 flex-1 overflow-y-auto px-3">
      <div className="mb-2 flex items-center justify-between px-2"><span className="text-[10px] font-bold uppercase tracking-[.16em] text-zinc-400">Recent</span><button onClick={() => setCommandOpen(true)} className="text-zinc-400 transition hover:text-zinc-900" aria-label="Search conversations"><Search size={14} /></button></div>
      <div className="space-y-0.5">{conversations.slice(0, showAllChats ? conversations.length : 7).map((conversation) => <div key={conversation.id} className="group relative">{renamingId === conversation.id ? <input autoFocus value={renameValue} onChange={(event) => setRenameValue(event.target.value)} onBlur={finishRename} onKeyDown={(event) => { if (event.key === "Enter") finishRename(); if (event.key === "Escape") setRenamingId(null); }} className="h-9 w-full rounded-lg border border-amber-400 bg-white px-2 text-[13px] outline-none ring-2 ring-amber-100" /> : <button onDoubleClick={() => startRename(conversation)} onClick={() => selectConversation(conversation.id)} className={cn("w-full truncate rounded-lg px-2.5 py-2 pr-16 text-left text-[13px] transition", activeId === conversation.id && view === "chat" ? "bg-white font-semibold text-zinc-950 shadow-sm ring-1 ring-zinc-200/70" : "text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-950")}>{conversation.title}</button>}<span className="pointer-events-none absolute right-7 top-2.5 text-[10px] text-zinc-400 group-hover:hidden">{formatRelativeTime(conversation.updatedAt)}</span><div className="absolute right-1 top-1 hidden items-center group-hover:flex"><button onClick={() => startRename(conversation)} className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900" aria-label={`Rename ${conversation.title}`}><Pencil size={12} /></button><button onClick={() => deleteConversation(conversation.id)} className="grid size-7 place-items-center rounded-md text-zinc-400 hover:bg-zinc-200 hover:text-red-600" aria-label={`Delete ${conversation.title}`}><Trash2 size={13} /></button></div></div>)}</div>
      {conversations.length > 7 && <button onClick={() => setShowAllChats((value) => !value)} className="mt-2 flex h-9 w-full items-center justify-center gap-1 rounded-lg text-xs font-semibold text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-900">{showAllChats ? "Show fewer" : `View all ${conversations.length} chats`}<ChevronRight size={13} className={cn("transition", showAllChats && "rotate-90")} /></button>}
    </div>}
    <div className="relative border-t border-zinc-200 p-3">
      {profileOpen && <div className="absolute bottom-[4.6rem] left-3 right-3 z-30 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_18px_60px_rgba(24,24,27,.16)]"><button onClick={() => { openView("settings"); setProfileOpen(false); }} className="dash-menu-item"><Settings size={15} /> Settings</button><button onClick={() => { openView("settings"); setProfileOpen(false); }} className="dash-menu-item"><UserRound size={15} /> Profile & account</button><Link href="/auth/update-password" className="dash-menu-item"><LockKeyhole size={15} /> Security</Link><div className="my-1 border-t border-zinc-100" /><form action="/auth/signout" method="post"><button type="submit" className="dash-menu-item w-full text-red-600"><LogOut size={15} /> Sign out</button></form></div>}
      <button onClick={() => setProfileOpen((open) => !open)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-zinc-200/70">{account?.avatar_url ? <img src={account.avatar_url} alt="" className="size-9 rounded-xl object-cover" /> : <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 text-xs font-bold text-white">{initials(user.name)}</span>}<span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-zinc-900">{user.name}</span><span className="block truncate text-[11px] capitalize text-zinc-500">{account?.plan || "free"} workspace</span></span><MoreHorizontal size={16} className="text-zinc-400" /></button>
    </div>
  </>;

  return <DashboardMotion>
    <main className={cn("mythmind-dashboard flex h-dvh overflow-hidden bg-[#f7f7f5] text-zinc-950", settings.dark && "is-dark")}>
      <aside className={cn("hidden shrink-0 flex-col border-r border-zinc-200 bg-[#f1f1ef] transition-[width] duration-300 lg:flex", sidebarCollapsed ? "w-[68px]" : "w-[248px]")}>{sidebar}</aside>
      {sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-zinc-950/35 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} /><aside className="relative flex h-full w-[285px] flex-col bg-[#f1f1ef] shadow-2xl">{sidebar}</aside></div>}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="relative z-[60] flex h-16 shrink-0 items-center justify-between overflow-visible border-b border-zinc-200/80 bg-white/95 px-4 backdrop-blur-xl sm:px-6">
          <div className="relative flex min-w-0 items-center gap-3"><button className="dash-icon-button lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu size={19} /></button><button onClick={() => setContextMenuOpen((open) => !open)} className="group flex min-w-0 items-center gap-2 rounded-xl px-1.5 py-1 text-left transition hover:bg-zinc-100" aria-expanded={contextMenuOpen} aria-haspopup="menu"><span className={cn("grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold", contextType === "workspace" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-800")}><LayoutGrid size={15} /></span><span className="min-w-0"><span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950"><span className="truncate">{contextType === "workspace" ? "Company workspace" : "Personal workspace"}</span><ChevronDown size={14} className={cn("text-zinc-400 transition-transform", contextMenuOpen && "rotate-180")} /></span><span className="hidden text-[10px] text-zinc-400 sm:block">{account?.plan || "free"} plan · mythmind.co</span></span></button>{contextMenuOpen && <><button aria-label="Close workspace menu" className="fixed inset-0 z-[69] cursor-default" onClick={() => setContextMenuOpen(false)} /><div ref={contextMenuRef} role="menu" className="absolute left-0 top-12 z-[70] w-72 origin-top-left rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_18px_55px_rgba(24,24,27,.16)]"><p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[.15em] text-zinc-400">Switch workspace</p><button role="menuitem" onClick={() => { void loadContext("personal"); setContextMenuOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition", contextType === "personal" ? "bg-amber-50" : "hover:bg-zinc-50")}><span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-800"><UserRound size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-900">Personal</span><span className="mt-0.5 block text-[11px] text-zinc-500">Your private conversations and ideas</span></span>{contextType === "personal" && <Check size={16} className="text-amber-600" />}</button><button role="menuitem" disabled={!contextsAvailable} onClick={() => { void loadContext("workspace"); setContextMenuOpen(false); }} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40", contextType === "workspace" ? "bg-violet-50" : "hover:bg-zinc-50")}><span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-700"><UsersRound size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-zinc-900">Company workspace</span><span className="mt-0.5 block text-[11px] text-zinc-500">Shared teams, agents, and permissions</span></span>{contextType === "workspace" && <Check size={16} className="text-violet-600" />}</button>{!contextsAvailable && <p className="px-3 pb-2 pt-1 text-[10px] text-zinc-400">Join or create a company workspace to enable this option.</p>}</div></>}<div className="min-w-0"><p className="hidden truncate text-sm font-semibold text-zinc-950 lg:block">{view === "chat" ? activeConversation?.title : navItems.find((item) => item.id === view)?.label || "Settings"}</p></div></div>
          <div className="relative flex items-center gap-2"><button onClick={() => setCommandOpen(true)} className="hidden h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-500 shadow-sm transition hover:border-zinc-300 sm:flex"><Search size={14} /> Search <span className="ml-3 rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold">⌘ K</span></button><button onClick={() => { setNotificationsOpen((open) => !open); setContextMenuOpen(false); }} className="dash-icon-button relative" aria-label="Notifications" aria-expanded={notificationsOpen}><Bell size={17} />{notifications.some((item) => !item.read) && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-white" />}</button><button onClick={() => setHelpOpen(true)} className="dash-icon-button hidden sm:grid" aria-label="Help"><CircleHelp size={17} /></button>{notificationsOpen && <NotificationCenter notifications={notifications} permission={browserNotifications} onClose={() => setNotificationsOpen(false)} onEnable={() => void requestBrowserNotifications()} onReadAll={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} onOpen={openNotificationAction} />}</div>
        </header>
        <div ref={viewRef} className="min-h-0 flex-1 overflow-hidden">
          {view === "chat" && (canChat ? <ChatView conversation={activeConversation} prompt={prompt} setPrompt={setPrompt} attachments={attachments} setAttachments={setAttachments} plan={account?.plan || "free"} onNotice={setToast} activeAgent={activeAgent} setSelectedAgent={setSelectedAgent} isGenerating={isGenerating} onSend={sendMessage} onKeyDown={handleComposerKey} onSuggestion={(value) => setPrompt(value)} allAgents={allAgents} /> : <AccessDenied title="Chat access is disabled" />)}
          {view === "agents" && (canViewAgents ? <AgentsView agentList={allAgents} onCreate={() => setNewAgentOpen(true)} onChat={(id) => { setSelectedAgent(id); newChat(); }} /> : <AccessDenied title="Agents are not enabled for your membership" />)}
          {view === "teams" && (canViewTeams ? <TeamsView access={workspaceAccess} onCreate={() => setNewTeamOpen(true)} onRun={(team) => setToast(`${team.name} is now running`)} onAction={teamAction} onWorkspaceCreated={async () => { await loadTeams(); await loadContext("workspace"); }} /> : <AccessDenied title="Teams are not enabled for your membership" />)}
          {view === "usage" && <UsageView account={account} />}
          {view === "settings" && <SettingsView user={user} account={account} setAccount={setAccount} settings={settings} setSettings={setSettings} onSaved={(message) => setToast(message)}/>} 
        </div>
      </section>
      {commandOpen && <CommandPalette conversations={conversations} onClose={() => setCommandOpen(false)} onNavigate={(next) => { openView(next); setCommandOpen(false); }} onConversation={(id) => { selectConversation(id); setCommandOpen(false); }} onNew={() => { newChat(); setCommandOpen(false); }} />}
      {newAgentOpen && <CreateAgentModal onClose={() => setNewAgentOpen(false)} onCreate={(name, role) => { setCustomAgents((items) => [...items, { ...agents[0], id: crypto.randomUUID(), name, role, description: "A custom specialist configured for your workspace.", tasks: 0, success: 100 }]); setNewAgentOpen(false); setToast(`${name} joined your workspace`); }} />}
      {newTeamOpen && <CreateTeamModal onClose={() => setNewTeamOpen(false)} onCreate={async (name, purpose) => { const created = await teamAction({ action: "create_team", name, description: purpose }, `${name} created`); if (created) setNewTeamOpen(false); }} />}
      {helpOpen && <HelpCenter onClose={() => setHelpOpen(false)} onNavigate={(next) => { setHelpOpen(false); openView(next); }} />}
      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl"><Check size={14} className="text-amber-300" />{toast}</div>}
    </main>
  </DashboardMotion>;
}

function ChatView({ conversation, prompt, setPrompt, attachments, setAttachments, plan, onNotice, activeAgent, setSelectedAgent, isGenerating, onSend, onKeyDown, onSuggestion, allAgents }: { conversation: Conversation; prompt: string; setPrompt: (value: string) => void; attachments: Attachment[]; setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>; plan: PlanId; onNotice: (message: string) => void; activeAgent: Agent; setSelectedAgent: (id: string) => void; isGenerating: boolean; onSend: (event?: FormEvent) => Promise<void>; onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void; onSuggestion: (value: string) => void; allAgents: Agent[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const copyMessage = async (content: string) => { await navigator.clipboard.writeText(content); onNotice("Message copied"); };
  const shareMessage = async (content: string) => {
    if (navigator.share) { try { await navigator.share({ title: "MythMind response", text: content }); return; } catch { return; } }
    await navigator.clipboard.writeText(content); onNotice("Sharing is unavailable here, so the message was copied");
  };
  const reportMessage = (messageId: string) => { localStorage.setItem(`mythmind-report-${messageId}`, new Date().toISOString()); onNotice("Response reported. Thank you for the feedback."); };
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [conversation?.messages.length, isGenerating]);
  useEffect(() => () => recognitionRef.current?.stop(), []);
  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files);
    if (selected.some((file) => file.size > 10 * 1024 * 1024)) return onNotice("Each attachment must be 10 MB or smaller");
    if (plan === "free" && attachments.length + selected.length > 2) return onNotice("Free includes up to 2 files per message. Paid plans include unlimited files.");
    const readable = /^(text\/|application\/(json|xml|javascript))|\.(txt|md|csv|json|xml|js|ts|tsx|jsx|css|html)$/i;
    const next = await Promise.all(selected.map(async (file): Promise<Attachment> => ({ name: file.name, type: file.type || "application/octet-stream", size: file.size, text: readable.test(file.type) || readable.test(file.name) ? (await file.text()).slice(0, 12000) : undefined })));
    setAttachments((items) => [...items, ...next]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const toggleVoice = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return onNotice("Voice input is not supported in this browser. Try Chrome or Edge.");
    const recognition = new Recognition(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = navigator.language || "en-US";
    const startingPrompt = prompt; let finalTranscript = "";
    recognition.onresult = (event) => { let interim = ""; for (let i = 0; i < event.results.length; i += 1) { const result = event.results[i]; if (result.isFinal) finalTranscript += `${result[0].transcript} `; else interim += result[0].transcript; } setPrompt([startingPrompt, finalTranscript + interim].filter(Boolean).join(startingPrompt ? " " : "").trimStart()); };
    recognition.onerror = (event) => { if (event.error !== "aborted") onNotice(event.error === "not-allowed" ? "Microphone permission was denied" : "Voice input could not start"); setListening(false); };
    recognition.onend = () => setListening(false); recognitionRef.current = recognition; recognition.start(); setListening(true);
  };
  const empty = !conversation?.messages.length;
  return <div className="flex h-full flex-col bg-white">
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
      {empty ? <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center px-5 py-12 sm:px-8">
        <div data-dashboard-reveal className="mb-8"><span className="mb-6 grid size-12 place-items-center rounded-2xl bg-zinc-950 text-amber-300 shadow-lg shadow-zinc-950/10"><Sparkles size={22} /></span><h1 className="max-w-2xl text-3xl font-semibold tracking-[-.055em] text-zinc-950 sm:text-5xl">What will we build today?</h1><p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500 sm:text-base">Think with a coordinated team of specialists. Start with an outcome, question, or rough idea.</p></div>
        <div data-dashboard-reveal className="grid gap-2 sm:grid-cols-2">{promptSuggestions.map((suggestion) => <button key={suggestion.title} onClick={() => onSuggestion(suggestion.prompt)} className="group flex items-center gap-3 rounded-2xl border border-zinc-200 bg-[#fafaf9] p-4 text-left transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-lg hover:shadow-zinc-950/5"><span className="grid size-9 place-items-center rounded-xl bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200 group-hover:text-amber-700"><suggestion.icon size={16} /></span><span><span className="block text-sm font-semibold text-zinc-900">{suggestion.title}</span><span className="mt-0.5 block text-xs text-zinc-500">Use a proven starting point</span></span><ArrowRight size={14} className="ml-auto text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-600" /></button>)}</div>
      </div> : <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">{conversation.messages.map((message) => message.role === "user" ? <div key={message.id} className="mb-8 flex justify-end"><div className="max-w-[88%] sm:max-w-[78%]"><div className="rounded-[22px] rounded-br-md bg-zinc-950 px-4 py-3 text-[14px] leading-6 text-white"><p>{message.content}</p></div>{message.attachments?.length ? <div className="mt-2 grid justify-items-end gap-2">{message.attachments.map((file, index) => <div key={`${file.name}-${index}`} className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left shadow-sm"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><Paperclip size={17} /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-900">{file.name}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wide text-zinc-400">{formatFileSize(file.size)} · {file.type || "file"}</span></span><Check size={14} className="shrink-0 text-emerald-600" /></div>)}</div> : null}</div></div> : <div key={message.id} className="mb-10 flex gap-3.5"><AgentMark agent={allAgents.find((agent) => agent.name === message.agent) || activeAgent} /><div className="min-w-0 flex-1"><div className="mb-2 flex items-center gap-2"><span className="text-sm font-semibold">{message.agent || activeAgent.name}</span><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">AI agent</span></div><RichText text={message.content} /><div className="mt-3 flex flex-wrap items-center gap-1"><button className="dash-mini-button" title="Copy" aria-label="Copy response" onClick={() => void copyMessage(message.content)}><Copy size={13} /></button><button className="dash-mini-button" title="Share" aria-label="Share response" onClick={() => void shareMessage(message.content)}><Share2 size={13} /></button><button className="dash-mini-button hover:text-red-600" title="Report" aria-label="Report response" onClick={() => reportMessage(message.id)}><TriangleAlert size={13} /></button></div></div></div>)}{isGenerating && <div className="flex gap-3.5"><AgentMark agent={activeAgent} /><div><p className="mb-2 text-sm font-semibold">{activeAgent.name}</p><div className="flex h-9 items-center gap-1 rounded-xl bg-zinc-100 px-3"><i className="dash-thinking-dot" /><i className="dash-thinking-dot [animation-delay:120ms]" /><i className="dash-thinking-dot [animation-delay:240ms]" /></div></div></div>}</div>}
    </div>
    <div className="shrink-0 border-t border-zinc-100 bg-white px-4 pb-4 pt-3 sm:px-6 sm:pb-6"><form onSubmit={onSend} className="mx-auto max-w-3xl rounded-[22px] border border-zinc-200 bg-white p-2 shadow-[0_12px_44px_rgba(24,24,27,.08)]">{attachments.length ? <div className="flex flex-wrap gap-1.5 px-2 pt-1">{attachments.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex max-w-52 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-600"><Paperclip size={11} /><span className="truncate">{file.name}</span><button type="button" onClick={() => setAttachments((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}><X size={11} /></button></span>)}</div> : null}<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={onKeyDown} rows={1} placeholder={`Ask ${activeAgent.name} anything…`} className="max-h-36 min-h-12 w-full resize-none bg-transparent px-3 py-3 text-[14px] leading-6 text-zinc-950 outline-none placeholder:text-zinc-400" /><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-1"><input ref={fileRef} type="file" multiple className="hidden" onChange={(event) => void addFiles(event.target.files)} /><button type="button" onClick={() => fileRef.current?.click()} className="dash-composer-button" aria-label="Attach files" title={plan === "free" ? "Up to 2 files on Free" : "Unlimited file attachments"}><Paperclip size={16} /></button><button type="button" onClick={toggleVoice} className={cn("dash-composer-button", listening && "bg-red-50 text-red-600")} aria-label={listening ? "Stop voice input" : "Start voice input"}><Mic size={16} /></button><label className="ml-1 flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100"><AgentMark agent={activeAgent} size="sm" /><select value={activeAgent.id} onChange={(event) => setSelectedAgent(event.target.value)} className="max-w-24 appearance-none bg-transparent outline-none sm:max-w-none">{allAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><ChevronDown size={12} /></label></div><div className="flex items-center gap-2"><span className="hidden text-[10px] text-zinc-400 sm:block">{listening ? "Listening..." : plan === "free" ? "2 file limit" : "Unlimited files"}</span><button type="submit" disabled={(!prompt.trim() && !attachments.length) || isGenerating} className="grid size-9 place-items-center rounded-xl bg-zinc-950 text-white transition hover:scale-105 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400" aria-label="Send message"><Send size={15} /></button></div></div></form><p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-zinc-400">MythMind can make mistakes. Review important decisions and outputs.</p></div>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div data-dashboard-reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[.18em] text-amber-700">{eyebrow}</p><h1 className="text-3xl font-semibold tracking-[-.05em] sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">{description}</p></div>{action}</div>;
}

function AccessDenied({ title }: { title: string }) {
  return <div className="grid h-full place-items-center p-6"><div className="max-w-md rounded-[24px] border border-zinc-200 bg-white p-8 text-center shadow-sm"><LockKeyhole className="mx-auto text-amber-600" size={24} /><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">Ask a workspace owner or admin to update your access permissions.</p></div></div>;
}

function AgentsView({ agentList, onCreate, onChat }: { agentList: Agent[]; onCreate: () => void; onChat: (id: string) => void }) {
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"><PageHeader eyebrow="Agent network" title="Your AI specialists" description="Deploy focused agents with distinct skills, context, and operating boundaries. Combine them into teams for complex work." action={<button onClick={onCreate} className="dash-primary-button"><Plus size={16} /> Create agent</button>} />
    <div data-dashboard-reveal className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"><Stat label="Active agents" value={`${agentList.filter((a) => a.status === "Active").length}`} icon={Activity} /><Stat label="Tasks completed" value="457" icon={Check} /><Stat label="Success rate" value="96.4%" icon={TrendingUp} /><Stat label="Time recovered" value="38h" icon={Clock3} /></div>
    <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{agentList.map((agent) => <article data-dashboard-reveal key={agent.id} className="group rounded-[22px] border border-zinc-200 bg-white p-5 transition hover:-translate-y-1 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-950/[.06]"><div className="flex items-start justify-between"><AgentMark agent={agent} size="lg" /><div className="flex items-center gap-2"><span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold", agent.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-500")}><i className={cn("size-1.5 rounded-full", agent.status === "Active" ? "bg-emerald-500" : "bg-zinc-400")} />{agent.status}</span><button className="dash-mini-button"><MoreHorizontal size={15} /></button></div></div><h2 className="mt-5 text-lg font-semibold tracking-tight">{agent.name}</h2><p className="mt-0.5 text-xs font-semibold text-zinc-400">{agent.role}</p><p className="mt-3 min-h-12 text-sm leading-6 text-zinc-600">{agent.description}</p><div className="mt-4 flex flex-wrap gap-1.5">{agent.capabilities.map((item) => <span key={item} className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600">{item}</span>)}</div><div className="mt-5 grid grid-cols-2 border-y border-zinc-100 py-3 text-xs"><div><span className="text-zinc-400">Tasks</span><strong className="ml-2 text-zinc-900">{agent.tasks}</strong></div><div><span className="text-zinc-400">Quality</span><strong className="ml-2 text-zinc-900">{agent.success}%</strong></div></div><button onClick={() => onChat(agent.id)} className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-xs font-semibold text-white transition hover:bg-zinc-800">Open workspace <ArrowRight size={13} /></button></article>)}</div>
  </div></div>;
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Activity }) { return <div className="rounded-2xl border border-zinc-200 bg-white p-4"><Icon size={16} className="text-zinc-400" /><strong className="mt-4 block text-xl tracking-tight sm:text-2xl">{value}</strong><span className="mt-1 block text-[11px] text-zinc-500">{label}</span></div>; }

function TeamsView({ access, onCreate, onRun, onAction, onWorkspaceCreated }: { access: WorkspaceAccess | null; onCreate: () => void; onRun: (team: Team) => void; onAction: (payload: Record<string, unknown>, success: string) => Promise<boolean>; onWorkspaceCreated: () => Promise<void> }) {
  const [invite, setInvite] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [copied, setCopied] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<Record<string, Partial<WorkspacePermissions>>>({});
  const copyInvite = async () => { let token = access?.invite_token; if (!token) { const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_invite" }) }); const data = await response.json(); if (!response.ok) return; token = data.token; } const link = `${window.location.origin}/invite/${token}`; setInvite(link); await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  if (!access) return <div className="h-full overflow-y-auto"><div className="mx-auto grid min-h-full max-w-5xl place-items-center px-5 py-10"><section data-dashboard-reveal className="relative w-full max-w-2xl overflow-hidden rounded-[30px] border border-zinc-200 bg-white p-7 shadow-[0_24px_80px_rgba(24,24,27,.09)] sm:p-10"><div className="absolute -right-16 -top-20 size-56 rounded-full bg-violet-200/40 blur-3xl" /><div className="relative"><span className="grid size-12 place-items-center rounded-2xl bg-zinc-950 text-amber-300 shadow-lg"><UsersRound size={21} /></span><p className="mt-7 text-[11px] font-bold uppercase tracking-[.18em] text-violet-700">Company setup</p><h1 className="mt-2 text-3xl font-semibold tracking-[-.05em] sm:text-4xl">Create your workspace</h1><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">Your company workspace is the secure home for teams, shared agents, members, permissions, conversations, and company billing. You can choose any organization name.</p><form onSubmit={async (event) => { event.preventDefault(); if (workspaceName.trim().length < 2 || creatingWorkspace) return; setCreatingWorkspace(true); const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_workspace", name: workspaceName }) }); if (!response.ok) { setCreatingWorkspace(false); return; } await onWorkspaceCreated(); setCreatingWorkspace(false); }} className="mt-7"><label className="block"><span className="mb-2 block text-xs font-semibold text-zinc-700">Workspace name</span><input autoFocus value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} maxLength={60} placeholder="e.g. Acme Labs" className="dash-input h-12" /></label><p className="mt-2 text-[10px] text-zinc-400">You can update this later in workspace settings.</p><button disabled={workspaceName.trim().length < 2 || creatingWorkspace} className="dash-primary-button mt-5 h-11 w-full disabled:cursor-not-allowed disabled:opacity-40">{creatingWorkspace ? "Creating workspace…" : "Create company workspace"}<ArrowRight size={15} /></button></form></div></section></div></div>;
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"><PageHeader eyebrow={access.workspace_name} title="Teams & access" description="Create company teams, share a controlled invite link, approve join requests, and decide exactly what each member can do." action={<button onClick={onCreate} disabled={!access.is_manager} className="dash-primary-button disabled:cursor-not-allowed disabled:opacity-40"><UserPlus size={16} /> New team</button>} />
    <section data-dashboard-reveal className="relative mt-8 overflow-hidden rounded-[26px] bg-zinc-950 p-6 text-white sm:p-8"><div className="absolute -right-20 -top-24 size-64 rounded-full bg-amber-400/20 blur-3xl" /><div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-center"><div><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200"><WandSparkles size={13} /> Multi-agent orchestration</span><h2 className="mt-4 max-w-xl text-2xl font-semibold tracking-[-.04em] sm:text-3xl">Complex goals, coordinated automatically.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">Orion plans the work, routes tasks to specialists, verifies the output, and keeps you in control at every gate.</p></div><div className="flex shrink-0 -space-x-2">{agents.slice(0, 5).map((agent) => <span key={agent.id} className="rounded-2xl ring-4 ring-zinc-950"><AgentMark agent={agent} size="lg" /></span>)}</div></div></section>
    <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_.85fr]"><section className="space-y-3">{(access?.teams || []).map((team) => <article data-dashboard-reveal key={team.id} className="rounded-[22px] border border-zinc-200 bg-white p-5 sm:p-6"><div className="flex items-start gap-4"><div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700"><UsersRound size={21} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{team.name}</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">Company team</span></div><p className="mt-1 text-sm text-zinc-500">{team.description || "A focused team inside this workspace."}</p><p className="mt-3 text-xs font-semibold text-zinc-400">{team.members.length} assigned member{team.members.length === 1 ? "" : "s"}</p></div><button onClick={() => onRun({ id: team.id, name: team.name, purpose: team.description, members: [], runs: 0, status: "Ready" })} className="dash-secondary-button"><Zap size={14} /> Run</button></div></article>)}{!access?.teams.length && <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">No company teams yet. Create the first one to organize work.</div>}</section><aside className="space-y-4"><section className="rounded-[22px] border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Invite to workspace</h2><p className="mt-1 text-xs leading-5 text-zinc-500">Members request access before an owner or admin assigns permissions.</p></div><Copy size={17} className="text-zinc-400" /></div><button onClick={() => void copyInvite()} disabled={!access?.is_manager} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-xs font-bold text-white disabled:opacity-40">{copied ? "Copied invite link" : "Copy invite link"}</button>{invite && <p className="mt-2 break-all text-[10px] text-zinc-400">{invite}</p>}<p className="mt-3 text-[10px] text-zinc-400">Plan limit: {access?.team_limit ?? 1} team{access?.team_limit === 1 ? "" : "s"}.</p></section><section className="rounded-[22px] border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Join requests</h2><span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">{access?.requests.length || 0} pending</span></div>{access?.requests.length ? <div className="mt-4 space-y-3">{access.requests.map((request) => <div key={request.id} className="rounded-xl border border-zinc-100 p-3"><p className="text-sm font-semibold">{request.display_name}</p><p className="text-xs text-zinc-500">{request.email}</p>{reviewing === request.id ? <div className="mt-3 space-y-2"><p className="text-[11px] text-zinc-500">Approve as a member with these workspace permissions:</p>{(["can_chat", "can_view_agents", "can_view_teams"] as const).map((key) => <label key={key} className="flex items-center justify-between text-xs"><span>{key.replace("can_", "").replaceAll("_", " ")}</span><Toggle checked={memberPermissions[request.id]?.[key] ?? key !== "can_view_agents"} onChange={() => setMemberPermissions((items) => ({ ...items, [request.id]: { ...items[request.id], [key]: !(items[request.id]?.[key] ?? key !== "can_view_agents") } }))} label={key} /></label>)}<button onClick={async () => { const permissions = memberPermissions[request.id] || {}; if (await onAction({ action: "review_request", request_id: request.id, decision: "approved", ...permissions }, "Member approved")) setReviewing(null); }} className="dash-primary-button mt-2 w-full justify-center">Approve member</button></div> : <div className="mt-3 flex gap-2"><button onClick={() => setReviewing(request.id)} className="dash-primary-button flex-1 justify-center">Review</button><button onClick={() => void onAction({ action: "review_request", request_id: request.id, decision: "rejected" }, "Request rejected")} className="dash-secondary-button">Reject</button></div>}</div>)}</div> : <p className="mt-4 text-xs text-zinc-500">No pending requests.</p>}</section><section className="rounded-[22px] border border-zinc-200 bg-white p-5"><h2 className="font-semibold">Workspace members</h2><div className="mt-4 space-y-2">{(access?.members || []).map((member) => <div key={member.user_id} className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2"><span className="font-mono text-[10px] text-zinc-500">{member.user_id.slice(0, 8)}…</span><span className="text-[10px] font-bold capitalize text-zinc-600">{member.role}</span></div>)}</div></section></aside></div>
  </div></div>;
}

function UsageView({ account }: { account: BillingContext | MythMindAccount | null }) {
  const usage = account && "usage" in account ? account.usage : [];
  const maxUsage = Math.max(1, ...usage.map((point) => point.credits));
  const bars = usage.map((point) => ({ ...point, height: Math.max(3, Math.round((point.credits / maxUsage) * 100)) }));
  const breakdown = account && "breakdown" in account ? account.breakdown : [];
  const context = account && "context_type" in account ? account.context_type : "personal";
  const plan = account?.plan || "free"; const entitlement = PLAN_ENTITLEMENTS[plan]; const remaining = account?.credits_remaining ?? entitlement.credits; const used = Math.max(0, entitlement.credits - remaining); const percent = Math.min(100, Math.round((used / entitlement.credits) * 100));
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"><PageHeader eyebrow={`${context} plan & billing`} title="Credits and usage" description="Live credit activity for this context only. Personal and company allowances never mix." action={<Link href={`/checkout?context=${context}&plan=${plan === "free" ? "hustler" : "pro"}`} className="dash-primary-button"><Zap size={16} /> Change plan</Link>} />
    <div className="mt-8 grid gap-4 lg:grid-cols-[1.4fr_.6fr]"><section data-dashboard-reveal className="rounded-[24px] border border-zinc-200 bg-white p-6 sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-zinc-500">{entitlement.period === "daily" ? "Daily" : "Monthly"} credits</p><p className="mt-2 text-3xl font-semibold tracking-[-.04em]">{formatCredits(remaining)} <span className="text-base font-medium text-zinc-400">/ {formatCredits(entitlement.credits)}</span></p></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-[10px] font-bold capitalize text-amber-800">{entitlement.period} reset</span></div><div className="mt-7 h-3 overflow-hidden rounded-full bg-zinc-100"><div style={{ width: `${percent}%` }} className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500" /></div><div className="mt-3 flex justify-between text-[11px] text-zinc-400"><span>{formatCredits(remaining)} credits remaining</span><span>{percent}% used</span></div></section><section data-dashboard-reveal className="rounded-[24px] bg-zinc-950 p-6 text-white sm:p-7"><CreditCard size={19} className="text-amber-300" /><p className="mt-5 text-xs text-zinc-400">Current plan</p><div className="mt-1 flex items-end justify-between"><strong className="text-2xl capitalize">{entitlement.name}</strong><span className="text-sm text-zinc-300">${entitlement.price} / {entitlement.period === "daily" ? "day" : "month"}</span></div><Link href="/checkout" className="mt-6 flex h-10 w-full items-center justify-center rounded-xl bg-white text-xs font-bold text-zinc-950 transition hover:bg-amber-100">Manage subscription</Link></section></div>
    <section data-dashboard-reveal className="mt-4 rounded-[24px] border border-zinc-200 bg-white p-6 sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Usage trend</h2><p className="mt-1 text-xs text-zinc-400">Actual credits consumed over the last 30 days</p></div><span className="text-xs font-semibold text-zinc-400">Live data</span></div><div className="mt-8 flex h-44 items-end gap-1 sm:gap-2">{bars.map((bar) => <div key={bar.date} className="group flex h-full flex-1 items-end"><div style={{ height: `${bar.height}%` }} className="relative w-full rounded-t-md bg-zinc-200 transition group-hover:bg-amber-400"><span className="absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded bg-zinc-950 px-2 py-1 text-[9px] text-white group-hover:block">{bar.credits}</span></div></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-zinc-400"><span>{bars[0]?.date || "No usage"}</span><span>{bars.at(-1)?.date || "Today"}</span></div></section>
    <div className="mt-4 grid gap-4 md:grid-cols-3">{breakdown.slice(0, 3).map((item) => <UsageCard key={item.agent} icon={BrainCircuit} title={`${item.agent} usage`} amount={formatCredits(item.credits)} percent={`${used ? Math.round(item.credits / used * 100) : 0}%`} />)}{!breakdown.length && <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500 md:col-span-3">No credits have been used in this context yet.</div>}</div>
  </div></div>;
}

function UsageCard({ icon: Icon, title, amount, percent }: { icon: typeof BrainCircuit; title: string; amount: string; percent: string }) { return <div data-dashboard-reveal className="rounded-2xl border border-zinc-200 bg-white p-5"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-xl bg-zinc-100"><Icon size={16} /></span><span className="text-xs font-semibold text-zinc-400">{percent}</span></div><p className="mt-4 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-zinc-400">{amount} credits</p></div>; }

function SettingsView({ user, account, setAccount, settings, setSettings, onSaved }: { user: DashboardUser; account: BillingContext | MythMindAccount | null; setAccount: React.Dispatch<React.SetStateAction<BillingContext | MythMindAccount | null>>; settings: Record<string, boolean>; setSettings: React.Dispatch<React.SetStateAction<{ notifications: boolean; product: boolean; memory: boolean; training: boolean; dark: boolean }>>; onSaved: (message: string) => void }) {
  const [tab, setTab] = useState("Profile");
  const [avatarUrl, setAvatarUrl] = useState(account?.avatar_url || "");
  const [workspaceName, setWorkspaceName] = useState(account?.workspace_name || "Personal workspace");
  const [workspaceUrl, setWorkspaceUrl] = useState(account?.workspace_url || "mythmind.co/w/personal");
  const saveAccount = async (updates: { avatar_url?: string | null; workspace_name?: string; workspace_url?: string }) => {
    const response = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updates) });
    const data = (await response.json()) as { account?: MythMindAccount; error?: string };
    if (!response.ok) return onSaved(data.error || "Unable to save settings");
    if (data.account) setAccount(data.account); onSaved("Settings saved");
  };
  const tabs = [{ name: "Profile", icon: UserRound }, { name: "Workspace", icon: LayoutGrid }, { name: "AI & memory", icon: BrainCircuit }, { name: "Notifications", icon: Bell }, { name: "Security", icon: ShieldCheck }, { name: "Billing", icon: CreditCard }];
  return <div className="h-full overflow-y-auto"><div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"><PageHeader eyebrow="Preferences" title="Settings" description="Manage your identity, workspace behavior, data controls, and account security." />
    <div className="mt-8 grid gap-6 lg:grid-cols-[210px_1fr]"><nav data-dashboard-reveal className="space-y-1">{tabs.map((item) => <button key={item.name} onClick={() => setTab(item.name)} className={cn("dash-nav-item", tab === item.name && "dash-nav-item-active bg-white shadow-sm ring-1 ring-zinc-200")}><item.icon size={16} />{item.name}</button>)}</nav><section data-dashboard-reveal className="rounded-[24px] border border-zinc-200 bg-white p-5 sm:p-8">
      {tab === "Profile" && <><SettingsTitle title="Profile details" description="Control how you appear across your workspace." /><div className="mt-7 flex items-center gap-4">{avatarUrl ? <img src={avatarUrl} alt="Profile preview" className="size-16 rounded-2xl object-cover" /> : <span className="grid size-16 place-items-center rounded-2xl bg-zinc-950 text-lg font-bold text-white">{initials(user.name)}</span>}<div className="min-w-0 flex-1"><label className="block text-xs font-semibold text-zinc-700">Photo URL</label><div className="mt-2 flex gap-2"><input value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://example.com/photo.jpg" className="dash-input" /><button onClick={() => void saveAccount({ avatar_url: avatarUrl.trim() || null })} className="dash-secondary-button shrink-0"><UploadCloud size={14} /> Apply</button></div><p className="mt-2 text-[10px] text-zinc-400">Use a public HTTPS image URL.</p></div></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><Field label="Full name" defaultValue={user.name} /><Field label="Email address" defaultValue={user.email} type="email" /><Field label="Role" defaultValue="Workspace owner" /><Field label="Time zone" defaultValue="Asia/Kathmandu (GMT+5:45)" /></div><div className="mt-7 flex justify-end"><button onClick={() => void saveAccount({ avatar_url: avatarUrl.trim() || null })} className="dash-primary-button">Save changes</button></div></>}
      {tab === "Workspace" && <><SettingsTitle title="Workspace preferences" description="Configure the defaults shared by this workspace." /><div className="mt-7 space-y-5"><ControlledField label="Workspace name" value={workspaceName} onChange={setWorkspaceName} /><ControlledField label="Workspace URL" value={workspaceUrl} onChange={setWorkspaceUrl} /><p className="-mt-3 text-[10px] text-zinc-400">Workspace URLs must use mythmind.co.</p><SettingRow title="Dark workspace" description="Use a darker interface for focused work."><Toggle checked={settings.dark} onChange={() => setSettings((s) => ({ ...s, dark: !s.dark }))} label="Dark workspace" /></SettingRow></div><div className="mt-7 flex justify-end"><button onClick={() => void saveAccount({ workspace_name: workspaceName, workspace_url: workspaceUrl })} className="dash-primary-button">Save workspace</button></div></>}
      {tab === "AI & memory" && <><SettingsTitle title="AI and memory" description="Control model behavior and what MythMind can remember." /><div className="mt-7 space-y-2"><SettingRow icon={BrainCircuit} title="Workspace memory" description="Let agents remember decisions and preferences across conversations."><Toggle checked={settings.memory} onChange={() => setSettings((s) => ({ ...s, memory: !s.memory }))} label="Workspace memory" /></SettingRow><SettingRow icon={Database} title="Improve models" description="Allow anonymized interactions to improve MythMind. Off by default."><Toggle checked={settings.training} onChange={() => setSettings((s) => ({ ...s, training: !s.training }))} label="Improve models" /></SettingRow><SettingRow icon={SlidersHorizontal} title="Default reasoning" description="Balanced—strong results with predictable credit usage."><button className="dash-secondary-button">Configure <ChevronRight size={13} /></button></SettingRow></div></>}
      {tab === "Notifications" && <><SettingsTitle title="Notification controls" description="Choose which activity reaches you outside MythMind." /><div className="mt-7 space-y-2"><SettingRow icon={Bell} title="Agent completion alerts" description="Email me when long-running agent work finishes."><Toggle checked={settings.notifications} onChange={() => setSettings((s) => ({ ...s, notifications: !s.notifications }))} label="Completion alerts" /></SettingRow><SettingRow icon={Sparkles} title="Product updates" description="Occasional releases, guides, and workflow ideas."><Toggle checked={settings.product} onChange={() => setSettings((s) => ({ ...s, product: !s.product }))} label="Product updates" /></SettingRow></div></>}
      {tab === "Security" && <><SettingsTitle title="Security and access" description="Protect your account and review active access." /><div className="mt-7 space-y-3"><SettingRow icon={KeyRound} title="Password" description={`Authentication provider: ${user.provider}.`}><Link href="/auth/update-password" className="dash-secondary-button">Update</Link></SettingRow><SettingRow icon={ShieldCheck} title="Two-factor authentication" description="Add another layer of protection to your account."><button onClick={() => onSaved("Two-factor setup will be available soon") } className="dash-secondary-button">Enable</button></SettingRow><SettingRow icon={Globe2} title="Active sessions" description="Windows · Kathmandu, Nepal · This session"><span className="text-xs font-semibold text-emerald-600">Current</span></SettingRow></div></>}
      {tab === "Billing" && <><SettingsTitle title="Plan and billing" description="Choose the allowance for the active context. Personal and company plans are billed separately." /><div className="mt-7 grid gap-3 sm:grid-cols-2">{(Object.entries(PLAN_ENTITLEMENTS) as [PlanId, typeof PLAN_ENTITLEMENTS[PlanId]][]).map(([id, plan]) => <article key={id} className={cn("rounded-2xl border p-4", account?.plan === id ? "border-amber-400 bg-amber-50" : "border-zinc-200")}><div className="flex items-start justify-between"><div><p className="font-semibold">{plan.name}</p><p className="mt-1 text-2xl font-semibold">${plan.price}<span className="text-xs font-normal text-zinc-400"> / {plan.period === "daily" ? "day" : "month"}</span></p></div>{account?.plan === id && <span className="rounded-full bg-zinc-950 px-2 py-1 text-[9px] font-bold text-white">CURRENT</span>}</div><p className="mt-3 text-xs leading-5 text-zinc-500">{formatCredits(plan.credits)} credits / {plan.period}</p><Link href={`/checkout?context=${account && "context_type" in account ? account.context_type : "personal"}&plan=${id}`} className="mt-4 flex h-9 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold text-white">{account?.plan === id ? "Manage" : `Choose ${plan.name}`}</Link></article>)}</div></>}
    </section></div>
  </div></div>;
}

function SettingsTitle({ title, description }: { title: string; description: string }) { return <div className="border-b border-zinc-100 pb-5"><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1.5 text-sm text-zinc-500">{description}</p></div>; }
function Field({ label, defaultValue, type = "text" }: { label: string; defaultValue: string; type?: string }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-zinc-700">{label}</span><input type={type} defaultValue={defaultValue} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-100" /></label>; }
function ControlledField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-2 block text-xs font-semibold text-zinc-700">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 text-sm outline-none transition focus:border-amber-400 focus:ring-3 focus:ring-amber-100" /></label>; }
function SettingRow({ icon: Icon, title, description, children }: { icon?: typeof BrainCircuit; title: string; description: string; children: React.ReactNode }) { return <div className="flex items-center gap-3 rounded-2xl border border-zinc-100 p-4"><span className="hidden size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600 sm:grid">{Icon ? <Icon size={16} /> : <Settings size={16} />}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-zinc-500">{description}</p></div>{children}</div>; }

function CommandPalette({ conversations, onClose, onNavigate, onConversation, onNew }: { conversations: Conversation[]; onClose: () => void; onNavigate: (view: ViewId) => void; onConversation: (id: string) => void; onNew: () => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => conversations.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [conversations, query]);
  return <div className="fixed inset-0 z-[70] flex items-start justify-center bg-zinc-950/30 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={onClose}><div className="w-full max-w-xl overflow-hidden rounded-[22px] border border-white/30 bg-white shadow-[0_30px_100px_rgba(24,24,27,.25)]" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center gap-3 border-b border-zinc-100 px-4"><Search size={18} className="text-zinc-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations, agents, or actions…" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none" /><button onClick={onClose} className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500">ESC</button></div><div className="max-h-[55vh] overflow-y-auto p-2"><p className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Quick actions</p><button onClick={onNew} className="dash-command-item"><PenLine size={16} /> New conversation <span>⌘ N</span></button>{navItems.slice(1).map((item) => <button key={item.id} onClick={() => onNavigate(item.id)} className="dash-command-item"><item.icon size={16} /> Open {item.label}<span>Go</span></button>)}<p className="mt-2 border-t border-zinc-100 px-2 pb-2 pt-4 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Conversations</p>{filtered.map((item) => <button key={item.id} onClick={() => onConversation(item.id)} className="dash-command-item"><MessageSquareText size={16} /> <span className="flex-1 truncate text-left text-zinc-800">{item.title}</span><small>{formatRelativeTime(item.updatedAt)}</small></button>)}</div></div></div>;
}

function NotificationCenter({ notifications, permission, onClose, onEnable, onReadAll, onOpen }: { notifications: DashboardNotification[]; permission: NotificationPermission | "unsupported"; onClose: () => void; onEnable: () => void; onReadAll: () => void; onOpen: (notification: DashboardNotification) => void }) {
  const tones: Record<DashboardNotification["kind"], string> = { admin: "bg-violet-100 text-violet-700", credits: "bg-red-100 text-red-700", upgrade: "bg-amber-100 text-amber-800", system: "bg-emerald-100 text-emerald-700" };
  return <><button aria-label="Close notifications" className="fixed inset-0 z-[69] cursor-default" onClick={onClose} /><section className="absolute right-0 top-12 z-[70] w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_22px_70px_rgba(24,24,27,.2)]"><div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3"><div><h2 className="text-sm font-semibold">Notifications</h2><p className="mt-0.5 text-[10px] text-zinc-400">Realtime workspace and account updates</p></div><button onClick={onReadAll} className="text-[10px] font-bold text-amber-700 hover:text-amber-900">Mark all read</button></div>{permission !== "granted" && <div className="m-3 flex items-center gap-3 rounded-xl bg-zinc-950 p-3 text-white"><Bell size={16} className="shrink-0 text-amber-300" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Browser alerts are {permission === "denied" ? "blocked" : permission === "unsupported" ? "unavailable" : "off"}</p><p className="mt-0.5 text-[10px] leading-4 text-zinc-400">Get low-credit and admin alerts while MythMind is in the background.</p></div>{permission === "default" && <button onClick={onEnable} className="rounded-lg bg-white px-2.5 py-1.5 text-[10px] font-bold text-zinc-950">Enable</button>}</div>}<div className="max-h-[25rem] overflow-y-auto p-2">{notifications.map((notification) => <button key={notification.id} onClick={() => onOpen(notification)} className={cn("flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-zinc-50", !notification.read && "bg-amber-50/60")}><span className={cn("mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg", tones[notification.kind])}>{notification.kind === "credits" ? <Zap size={14} /> : notification.kind === "upgrade" ? <Sparkles size={14} /> : notification.kind === "admin" ? <ShieldCheck size={14} /> : <Bell size={14} />}</span><span className="min-w-0 flex-1"><span className="flex items-start gap-2"><strong className="flex-1 text-xs font-semibold text-zinc-900">{notification.title}</strong>{!notification.read && <i className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-500" />}</span><span className="mt-1 block text-[11px] leading-5 text-zinc-500">{notification.body}</span><span className="mt-1.5 block text-[9px] font-semibold uppercase tracking-wide text-zinc-400">{formatRelativeTime(notification.createdAt)}</span></span></button>)}{!notifications.length && <div className="grid place-items-center px-6 py-12 text-center"><Bell size={20} className="text-zinc-300" /><p className="mt-3 text-xs font-semibold text-zinc-600">You are all caught up</p></div>}</div></section></>;
}

function HelpCenter({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: ViewId) => void }) {
  const [query, setQuery] = useState("");
  const articles = [
    { title: "Start a conversation", body: "Choose an agent, describe the outcome you need, and press Enter.", view: "chat" as const },
    { title: "Create an AI specialist", body: "Open Agents to add a custom specialist with a focused operating role.", view: "agents" as const },
    { title: "Run an agent team", body: "Open Teams to coordinate several specialists around one outcome.", view: "teams" as const },
    { title: "Understand credits", body: "Every generated answer consumes one credit. Allowances reset daily or monthly by plan.", view: "usage" as const },
    { title: "Change account settings", body: "Update your photo, workspace URL, theme, security, and billing preferences.", view: "settings" as const },
  ];
  const filtered = articles.filter((article) => `${article.title} ${article.body}`.toLowerCase().includes(query.toLowerCase()));
  return <Modal title="MythMind help center" description="Search quick answers or jump directly to a workspace area." onClose={onClose}><div className="space-y-4"><label className="flex h-11 items-center gap-2 rounded-xl border border-zinc-200 px-3"><Search size={15} className="text-zinc-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search help…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label><div className="max-h-80 space-y-2 overflow-y-auto">{filtered.map((article) => <button key={article.title} onClick={() => onNavigate(article.view)} className="w-full rounded-xl border border-zinc-100 p-3 text-left transition hover:border-amber-300 hover:bg-amber-50"><span className="block text-sm font-semibold">{article.title}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{article.body}</span></button>)}{!filtered.length && <p className="py-8 text-center text-sm text-zinc-400">No help articles matched that search.</p>}</div><a href="mailto:support@mythmind.co" className="flex h-10 items-center justify-center rounded-xl bg-zinc-950 text-xs font-bold text-white">Contact support</a></div></Modal>;
}

function CreateAgentModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, role: string) => void }) {
  const [name, setName] = useState(""); const [role, setRole] = useState("");
  return <Modal title="Create a specialist" description="Give your agent a clear identity and operating role." onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); if (name.trim() && role.trim()) onCreate(name.trim(), role.trim()); }} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-semibold">Name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nova" className="dash-input" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Specialist role</span><input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Customer intelligence" className="dash-input" /></label><div className="flex justify-end gap-2 pt-3"><button type="button" onClick={onClose} className="dash-secondary-button">Cancel</button><button disabled={!name.trim() || !role.trim()} className="dash-primary-button disabled:opacity-40"><Sparkles size={15} /> Create agent</button></div></form></Modal>;
}

function CreateTeamModal({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string, purpose: string) => void }) {
  const [name, setName] = useState(""); const [purpose, setPurpose] = useState("");
  return <Modal title="Create an agent team" description="Combine specialists around a repeatable outcome." onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); if (name && purpose) onCreate(name, purpose); }} className="space-y-4"><label className="block"><span className="mb-2 block text-xs font-semibold">Team name</span><input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Customer insight pod" className="dash-input" /></label><label className="block"><span className="mb-2 block text-xs font-semibold">Primary outcome</span><textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="What should this team accomplish?" className="dash-input min-h-24 py-3" /></label><div className="rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">Orion, Atlas, and Forge will be added as a balanced starting team. You can customize roles after creation.</div><div className="flex justify-end gap-2 pt-3"><button type="button" onClick={onClose} className="dash-secondary-button">Cancel</button><button disabled={!name || !purpose} className="dash-primary-button disabled:opacity-40"><UsersRound size={15} /> Create team</button></div></form></Modal>;
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[75] grid place-items-center bg-zinc-950/35 p-4 backdrop-blur-sm" onMouseDown={onClose}><div onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-[0_30px_100px_rgba(24,24,27,.28)]"><div className="mb-6 flex items-start justify-between"><div><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-zinc-500">{description}</p></div><button onClick={onClose} className="dash-icon-button"><X size={17} /></button></div>{children}</div></div>; }