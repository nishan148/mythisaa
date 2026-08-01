"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, LoaderCircle, UsersRound } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export function JoinWorkspace({ token }: { token: string }) {
  const [name, setName] = useState("Workspace");
  const [state, setState] = useState<"loading" | "ready" | "member" | "sent" | "error">("loading");
  const [error, setError] = useState("");
  useEffect(() => { void fetch(`/api/teams?invite=${encodeURIComponent(token)}`).then(async (response) => { const data = await response.json(); if (!response.ok) { setError(data.error); setState("error"); return; } const workspace = Array.isArray(data.invite.mythmind_workspaces) ? data.invite.mythmind_workspaces[0] : data.invite.mythmind_workspaces; setName(workspace?.name || "Workspace"); setState(data.alreadyMember ? "member" : "ready"); }); }, [token]);
  const requestJoin = async () => { setState("loading"); const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request_join", token }) }); const data = await response.json(); if (!response.ok) { setError(data.error); setState("error"); } else setState("sent"); };
  return <main className="grid min-h-screen place-items-center bg-[#f7f7f5] p-5"><section className="w-full max-w-md rounded-[28px] border border-zinc-200 bg-white p-8 text-center shadow-xl shadow-zinc-950/5"><div className="flex justify-center"><Logo /></div><span className="mx-auto mt-8 grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-800"><UsersRound size={28} /></span><h1 className="mt-6 text-2xl font-semibold tracking-tight">Join {name}</h1><p className="mt-2 text-sm leading-6 text-zinc-500">Request access to this MythMind workspace. An owner or admin will review your request and assign your teams and permissions.</p>{state === "loading" && <LoaderCircle className="mx-auto mt-7 animate-spin text-amber-600" />}{state === "ready" && <button onClick={requestJoin} className="mt-7 h-11 w-full rounded-xl bg-zinc-950 text-sm font-bold text-white">Request to join</button>}{(state === "sent" || state === "member") && <div className="mt-7 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><Check className="mx-auto mb-2" size={18} />{state === "member" ? "You already belong to this workspace." : "Request sent. You can enter after an admin approves it."}</div>}{state === "error" && <p className="mt-7 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}<Link href="/account" className="mt-5 inline-block text-xs font-semibold text-zinc-500">Back to your workspace</Link></section></main>;
}