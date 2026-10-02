import type Anthropic from "@anthropic-ai/sdk";
import { kv } from "@/lib/server/store";
import type { VapiLlmRequest } from "./vapi";

/**
 * Server-side memory of a phone call.
 *
 * Vapi only sends back the spoken text, so tool calls and their results
 * (slot ids, lead ids…) would be lost between turns. We keep the full Claude
 * history per call id and only take the caller's new utterances from Vapi.
 * The history is append-only, as Claude's thinking blocks require.
 */
export interface CallSession {
  history: Anthropic.Beta.BetaMessageParam[];
  /** Number of caller utterances already consumed from Vapi's message list. */
  userTurns: number;
  /** Set by the agent's end_call tool. */
  outcome?: string;
  summary?: string;
}

const TTL = 60 * 60; // 1 h
const key = (callId: string) => `call:${callId}`;

type VapiMessage = VapiLlmRequest["messages"][number];

const userTexts = (messages: VapiMessage[]) => messages.filter((m) => m.role === "user" && m.content?.trim()).map((m) => m.content!.trim());

/** Text-only reconstruction used when no session exists (first turn or lost state). */
function rebuild(messages: VapiMessage[]): Anthropic.Beta.BetaMessageParam[] {
  const turns = messages.filter((m) => (m.role === "user" || m.role === "assistant") && m.content?.trim());
  const lastUser = turns.map((m) => m.role).lastIndexOf("user");
  const prior = turns.slice(0, lastUser);
  while (prior.length && prior[0]!.role !== "user") prior.shift(); // history must start with the caller
  return prior.map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.trim() }));
}

/** Loads the session and works out what the caller just said. */
export async function prepareTurn(callId: string | undefined, messages: VapiMessage[]) {
  const texts = userTexts(messages);
  const session = callId ? await kv.get<CallSession>(key(callId)).catch(() => null) : null;

  if (session && session.userTurns <= texts.length) {
    const fresh = texts.slice(session.userTurns);
    // No new utterance means Vapi is re-asking (e.g. after an interruption): answer the last one again.
    const userText = fresh.length ? fresh.join(" ") : (texts.at(-1) ?? "");
    return { history: session.history, userText, userTurns: texts.length, outcome: session.outcome, summary: session.summary };
  }
  return { history: rebuild(messages), userText: texts.at(-1) ?? "", userTurns: texts.length } as {
    history: Anthropic.Beta.BetaMessageParam[];
    userText: string;
    userTurns: number;
    outcome?: string;
    summary?: string;
  };
}

export async function loadSession(callId: string | undefined) {
  return callId ? await kv.get<CallSession>(key(callId)).catch(() => null) : null;
}

/* ------------------------------------------------------------------ */
/* What happened during the call, from the agent's own tool calls      */
/* ------------------------------------------------------------------ */

const VALID_OUTCOMES = ["rdv_pris", "lead_cree", "transfere", "info_donnee", "rappel_programme", "abandonne"];

export function digestSession(session: CallSession | null) {
  const uses: { name: string; input: Record<string, unknown> }[] = [];
  for (const m of session?.history ?? []) {
    if (m.role !== "assistant" || typeof m.content === "string") continue;
    for (const b of m.content) if (b.type === "tool_use") uses.push({ name: b.name, input: (b.input ?? {}) as Record<string, unknown> });
  }
  const has = (n: string) => uses.find((u) => u.name === n);
  const book = has("book_appointment");
  const lead = has("create_lead");
  const transfer = has("transfer_call");
  const callback = has("schedule_callback");

  let intent = "autre";
  if (book) intent = /carross|sinistre/i.test(String(book.input.service ?? "")) ? "carrosserie" : "rdv_atelier";
  else if (lead) intent = ({ VO: "achat_vo", Reprise: "reprise", Financement: "financement", LLD: "financement" } as Record<string, string>)[String(lead.input.interest)] ?? "achat_vn";
  else if (has("get_repair_status")) intent = "suivi_reparation";
  else if (transfer?.input.department === "pieces") intent = "pieces";
  else if (transfer?.input.department === "carrosserie") intent = "carrosserie";
  else if (callback?.input.priority === "haute") intent = "reclamation";

  const derived = book ? "rdv_pris" : lead ? "lead_cree" : transfer ? "transfere" : callback ? "rappel_programme" : "info_donnee";
  const outcome = session?.outcome && VALID_OUTCOMES.includes(session.outcome) ? session.outcome : derived;

  const extracted: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== "") extracted[k] = String(v);
  };
  if (book) {
    put("Prestation", book.input.service);
    put("Véhicule", [book.input.vehicle, book.input.plate].filter(Boolean).join(" · "));
    put("Kilométrage", book.input.mileage ? `${book.input.mileage} km` : undefined);
    put("Créneau demandé", String(book.input.slot_id ?? "").replace("T", " "));
    put("Courtoisie", book.input.courtesy_vehicle ? "Oui" : undefined);
  }
  if (lead) {
    put("Projet", `${lead.input.interest} · ${lead.input.vehicle_of_interest}`);
    put("Budget", lead.input.budget ? `${lead.input.budget} €` : undefined);
    put("Reprise", lead.input.trade_in);
  }
  if (transfer) put("Transfert", transfer.input.department);
  if (callback) put("Rappel", `${callback.input.department} · ${callback.input.priority}`);

  return { intent, outcome, summary: session?.summary, extracted, toolNames: uses.map((u) => u.name) };
}

export async function saveTurn(callId: string | undefined, session: CallSession) {
  if (!callId) return;
  await kv.set(key(callId), session, TTL).catch((err) => console.error("[call-session] save failed", err));
}

export async function endSession(callId: string | undefined) {
  if (callId) await kv.del(key(callId)).catch(() => {});
}
