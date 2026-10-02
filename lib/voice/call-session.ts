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
    return { history: session.history, userText, userTurns: texts.length };
  }
  return { history: rebuild(messages), userText: texts.at(-1) ?? "", userTurns: texts.length };
}

export async function saveTurn(callId: string | undefined, session: CallSession) {
  if (!callId) return;
  await kv.set(key(callId), session, TTL).catch((err) => console.error("[call-session] save failed", err));
}

export async function endSession(callId: string | undefined) {
  if (callId) await kv.del(key(callId)).catch(() => {});
}
