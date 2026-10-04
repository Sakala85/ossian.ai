import Anthropic from "@anthropic-ai/sdk";
import type { DealershipProfile } from "@/lib/domain/types";
import { DemoBackend, type AgentBackend } from "./backend";
import type { Emit } from "./events";
import { buildCallContext, buildSystemPrompt } from "./prompt";
import { AGENT_TOOLS, executeTool } from "./tools";

/**
 * Model used for live conversations. Defaults to Claude Opus 5.5 at low effort
 * (fast, short spoken turns). Override with OSSIAN_AGENT_MODEL to benchmark
 * latency/cost alternatives for production voice traffic.
 */
export const AGENT_MODEL = cleanModel(process.env.OSSIAN_AGENT_MODEL);

/** Model id from an environment variable, tolerant of stray spaces or quotes; Claude Opus 5.5 by default. */
export function cleanModel(value: string | undefined) {
  return value?.trim().replace(/^["']+|["']+$/g, "").trim() || "claude-opus-5-5";
}

const MAX_STEPS = 8;

const TOOLS: Anthropic.Beta.BetaTool[] = AGENT_TOOLS.map((t) => ({ ...t, eager_input_streaming: true }));

export function hasAnthropicKey() {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

/**
 * Runs one caller turn: streams Claude's answer, executes tool calls against
 * the dealership backend, loops until Claude yields the floor back to the caller.
 */
export async function runClaudeTurn(opts: {
  profile: DealershipProfile;
  history: Anthropic.Beta.BetaMessageParam[];
  userText: string;
  callerNumber?: string;
  emit: Emit;
  signal?: AbortSignal;
  backend?: AgentBackend;
}) {
  const client = new Anthropic();
  const backend = opts.backend ?? new DemoBackend(opts.profile);

  const system: Anthropic.Beta.BetaTextBlockParam[] = [
    // Stable per dealership → cached prefix.
    { type: "text", text: buildSystemPrompt(opts.profile, "voice"), cache_control: { type: "ephemeral" } },
    // Volatile → after the breakpoint.
    { type: "text", text: buildCallContext({ callerNumber: opts.callerNumber }) },
  ];

  const convo: Anthropic.Beta.BetaMessageParam[] = [...opts.history, { role: "user", content: opts.userText }];
  const appended: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: opts.userText }];
  let jsonRetries = 0;

  for (let step = 0; step < MAX_STEPS; step++) {
    const stream = client.beta.messages.stream(
      {
        model: AGENT_MODEL,
        max_tokens: 8000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system,
        tools: TOOLS,
        messages: convo,
      },
      { signal: opts.signal },
    );
    stream.on("text", (delta) => opts.emit({ type: "text", delta }));

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
      jsonRetries = 0;
    } catch (err) {
      // Only an unparseable streamed tool input is retried; API errors bubble up.
      if (err instanceof Anthropic.APIError || opts.signal?.aborted || jsonRetries++ >= 2) throw err;
      continue;
    }

    if (message.stop_reason === "refusal") {
      opts.emit({ type: "text", delta: " Je vais plutôt vous faire rappeler par un conseiller." });
      break;
    }

    const assistantTurn: Anthropic.Beta.BetaMessageParam = { role: "assistant", content: message.content };
    convo.push(assistantTurn);
    appended.push(assistantTurn);

    if (message.stop_reason === "pause_turn") continue;

    const toolUses = message.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
    if (toolUses.length === 0) break;
    if (message.stop_reason === "max_tokens") throw new Error("Réponse tronquée (max_tokens).");

    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    let ended = false;
    for (const tu of toolUses) {
      const input = (tu.input ?? {}) as Record<string, unknown>;
      opts.emit({ type: "tool_call", id: tu.id, name: tu.name, input });
      const r = await executeTool(backend, tu.name, input);
      opts.emit({ type: "tool_result", id: tu.id, name: tu.name, ok: r.ok, result: r.ok ? r.result : { error: r.error } });
      results.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(r.ok ? r.result : { error: r.error }),
        ...(r.ok ? {} : { is_error: true }),
      });
      if (tu.name === "end_call" && r.ok) {
        ended = true;
        opts.emit({ type: "end_call", outcome: String(input.outcome ?? ""), summary: String(input.summary ?? "") });
      }
    }
    const toolTurn: Anthropic.Beta.BetaMessageParam = { role: "user", content: results };
    convo.push(toolTurn);
    appended.push(toolTurn);
    if (ended) break;
  }

  opts.emit({ type: "messages", messages: appended });
}
