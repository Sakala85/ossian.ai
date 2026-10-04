import Anthropic from "@anthropic-ai/sdk";
import { AGENT_MODEL, hasAnthropicKey } from "@/lib/agent/runtime";
import { ONBOARDING_MODEL } from "@/lib/onboarding/analyze";
import { FAILURE_LABELS, classifyAnalysisError } from "@/lib/onboarding/errors";
import { kv } from "@/lib/server/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnostic: does the Anthropic key work with the onboarding model, using the
 * same request shape as the website analysis? Costs a fraction of a cent.
 * Open https://<site>/api/status/ai in a browser. Never returns the key.
 */
export async function GET(req: Request) {
  const base = { key: hasAnthropicKey(), onboardingModel: ONBOARDING_MODEL, agentModel: AGENT_MODEL };
  if (!base.key) return Response.json({ ...base, ok: false, cause: FAILURE_LABELS.no_key });

  const ip = (req.headers.get("x-forwarded-for") ?? "local").split(",")[0]!.trim();
  const rlKey = `rl:status-ai:${ip}`;
  const count = ((await kv.get<number>(rlKey).catch(() => 0)) ?? 0) + 1;
  await kv.set(rlKey, count, 3600).catch(() => {});
  if (count > 10) return Response.json({ ...base, ok: null, cause: "trop de vérifications, réessayez dans une heure" }, { status: 429 });

  const started = Date.now();
  try {
    const msg = await new Anthropic().beta.messages.create({
      model: ONBOARDING_MODEL,
      max_tokens: 512,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      tools: [
        { type: "web_fetch_20260209", name: "web_fetch", max_uses: 1 },
        { type: "web_search_20260209", name: "web_search", max_uses: 1 },
      ],
      tool_choice: { type: "none" },
      messages: [{ role: "user", content: "Réponds simplement : OK" }],
    });
    return Response.json({ ...base, ok: true, servedBy: msg.model, stopReason: msg.stop_reason, ms: Date.now() - started });
  } catch (err) {
    const c = classifyAnalysisError(err);
    console.error("[status/ai]", c.reason, c.detail);
    return Response.json({ ...base, ok: false, cause: FAILURE_LABELS[c.reason], detail: c.detail, ms: Date.now() - started });
  }
}
