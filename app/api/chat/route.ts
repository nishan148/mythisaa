import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_ENTITLEMENTS, isPlanId, type PlanId } from "@/lib/mythmind/billing";
import { ensureBillingContext, normalizeBilling, resolveContext } from "@/lib/mythmind/context";

type ChatRequest = {
  prompt?: string;
  agent?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  context?: "personal" | "workspace";
  attachments?: Array<{ name?: string; type?: string; size?: number; text?: string }>;
};

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 8_000;
const DEFAULT_AI_BASE_URL = "https://api.freemodel.dev/v1";
const DEFAULT_AI_MODEL = "gpt-5.6-sol";

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
  error?: { message?: string };
};

function isChatRequest(value: unknown): value is ChatRequest {
  return typeof value === "object" && value !== null;
}

function safeHistory(history: ChatRequest["history"]) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((message): message is { role: "user" | "assistant"; content: string } =>
      typeof message === "object" && message !== null &&
      (message.role === "user" || message.role === "assistant") &&
      typeof message.content === "string" && message.content.trim().length > 0,
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map(({ role, content }) => ({ role, content: content.slice(0, MAX_MESSAGE_LENGTH) }));
}

const fallback = (prompt: string, agent: string) => {
  const topic = prompt.trim().replace(/[?.!]$/, "");
  return `I’ve mapped **${topic}** into an execution-ready path. Here’s the strongest approach:\n\n1. **Define the outcome** — choose one measurable result and the constraints that matter.\n2. **Build the evidence layer** — gather customer, market, and product signals before committing resources.\n3. **Run a focused sprint** — assign an owner, a seven-day milestone, and a clear review gate.\n\n**My recommendation**\nStart with the smallest reversible decision, instrument it, and let the result determine the next investment. ${agent} can coordinate the specialist handoffs and turn this into a detailed brief.\n\n> Demo intelligence is active. Add an AI provider key to enable live generation.`;
};

function completionUrl(baseUrl: string) {
  return `${baseUrl.replace(/\/+$/, "")}/chat/completions`;
}

function providerErrorMessage(status: number) {
  if (status === 401 || status === 403) return "The AI provider rejected its credentials. Check the server API key.";
  if (status === 429) return "The AI provider is rate limited or out of credits. Please try again shortly.";
  return "The AI provider could not complete this request. Please try again.";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to use MythMind." }, { status: 401 });
  const { data: membership } = await supabase.from("mythmind_workspace_members").select("can_chat").eq("user_id", user.id).limit(1).maybeSingle();
  if (membership && membership.can_chat === false) return NextResponse.json({ error: "Chat access is disabled for your workspace membership." }, { status: 403 });

  let body: ChatRequest;
  try {
    const parsed: unknown = await request.json();
    if (!isChatRequest(parsed)) throw new Error("Invalid request body");
    body = parsed;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt || prompt.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: `Please provide a prompt under ${MAX_MESSAGE_LENGTH.toLocaleString()} characters.` }, { status: 400 });
  }

  const agent = typeof body.agent === "string" && body.agent.trim().length > 0
    ? body.agent.trim().slice(0, 80)
    : "Orion";

  const context = await resolveContext(supabase, user, body.context === "workspace" ? "workspace" : "personal");
  if (!context) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  let account = normalizeBilling(await ensureBillingContext(supabase, context));
  const plan: PlanId = isPlanId(account.plan) ? account.plan : "free";
  const entitlement = PLAN_ENTITLEMENTS[plan];
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  if (plan === "free" && attachments.length > 2) return NextResponse.json({ error: "Free accounts can attach up to 2 files per message. Upgrade for unlimited attachments." }, { status: 403 });
  const remaining = Number(account.credits_remaining ?? entitlement.credits);
  if (remaining < 1) return NextResponse.json({ error: "You’ve used all credits for this period. Change your plan or wait for the next reset." }, { status: 402 });
  const result = await supabase.from("mythmind_billing_accounts").update({ ...account, credits_remaining: remaining - 1 }).eq("context_id", context.contextId).select("*").single();
  if (result.error || !result.data) return NextResponse.json({ error: "Unable to verify your credits. Please refresh and try again." }, { status: 500 });
  account = result.data;
  await supabase.from("mythmind_usage_events").insert({ context_id: context.contextId, owner_id: user.id, agent, credits: 1 });

  const apiKey = process.env.AGENTROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ content: fallback(prompt, agent), demo: true, account });
  }

  const baseUrl = process.env.AGENTROUTER_BASE_URL || process.env.OPENAI_BASE_URL || DEFAULT_AI_BASE_URL;
  const model = process.env.AGENTROUTER_MODEL || process.env.OPENAI_MODEL || DEFAULT_AI_MODEL;

  const attachmentContext = attachments.length ? `\n\nAttached files:\n${attachments.map((file) => `- ${String(file.name || "file").slice(0, 120)} (${String(file.type || "unknown")}, ${Number(file.size || 0)} bytes)${file.text ? `\n${String(file.text).slice(0, 12000)}` : ""}`).join("\n")}` : "";
  const messages = [
    {
      role: "system",
      content: `You are ${agent}, a thoughtful specialist inside MythMind, an enterprise AI workspace. Be concise but useful. Structure complex answers with headings, numbered steps, and explicit recommendations. Never claim to have taken an action you did not take.`,
    },
    ...safeHistory(body.history),
    { role: "user" as const, content: prompt + attachmentContext },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const response = await fetch(completionUrl(baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.55, max_tokens: 2_000 }),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => ({}))) as ChatCompletionResponse;
    if (!response.ok) {
      console.error("AI provider request failed", { status: response.status, message: data.error?.message });
      return NextResponse.json({ error: providerErrorMessage(response.status) }, { status: 502 });
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      console.error("AI provider returned an empty completion", { model });
      return NextResponse.json({ error: "The AI provider returned an empty response. Please try again." }, { status: 502 });
    }

    return NextResponse.json({ content, account });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("AI provider request failed", { timedOut, message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json(
      { error: timedOut ? "The AI provider took too long to respond. Please try again." : "Unable to reach the AI provider. Please try again." },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}