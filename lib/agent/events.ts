import type Anthropic from "@anthropic-ai/sdk";

/**
 * Wire protocol of POST /api/agent (NDJSON, one event per line).
 *
 * Request body: { profile: DealershipProfile, history: BetaMessageParam[], userText: string, callerNumber?: string }
 * The client keeps `history` and appends the `messages` event at the end of each turn
 * (append-only: assistant turns are sent back exactly as received).
 */
export type AgentEvent =
  | { type: "text"; delta: string }
  | { type: "tool_call"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; id: string; name: string; ok: boolean; result: unknown }
  | { type: "end_call"; outcome: string; summary: string }
  | { type: "messages"; messages: Anthropic.Beta.BetaMessageParam[] }
  | { type: "done"; mode: "ai" | "simulated" }
  | { type: "error"; message: string };

export type Emit = (e: AgentEvent) => void;
