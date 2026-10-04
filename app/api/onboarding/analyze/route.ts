import { z } from "zod";
import { hasAnthropicKey } from "@/lib/agent/runtime";
import { analyzeWithClaude } from "@/lib/onboarding/analyze";
import { FAILURE_LABELS, classifyAnalysisError, type AnalysisFailure } from "@/lib/onboarding/errors";
import { normalizeUrl, starterProfile } from "@/lib/onboarding/simulate";
import { ANALYZE_STEPS, type AnalyzeEvent } from "@/lib/onboarding/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
/** Stop the analysis before the function limit so the user still gets the form. */
const ANALYSIS_BUDGET_MS = 105_000;

const Body = z.object({ url: z.string().min(3).max(300), name: z.string().max(120).optional() });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const url = parsed.success ? normalizeUrl(parsed.data.url) : null;
  if (!parsed.success || !url) return Response.json({ error: "URL invalide" }, { status: 400 });
  const nameHint = parsed.data.name;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: AnalyzeEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        let failure: AnalysisFailure = "no_key";
        if (hasAnthropicKey()) {
          try {
            const signal = AbortSignal.any([req.signal, AbortSignal.timeout(ANALYSIS_BUDGET_MS)]);
            const profile = await analyzeWithClaude(url, nameHint, emit, signal);
            emit({ type: "step", id: "agent", status: "running" });
            await sleep(500);
            emit({ type: "step", id: "agent", status: "done", detail: `Agent « ${profile.agent.name} » prêt` });
            emit({ type: "profile", profile, mode: "ai" });
            return;
          } catch (err) {
            if (req.signal.aborted) return;
            const c = classifyAnalysisError(err);
            failure = c.reason;
            console.error(`[onboarding/analyze] ${c.reason}: falling back to the starter profile`, c.detail ?? err);
          }
        } else {
          console.error("[onboarding/analyze] no_key: ANTHROPIC_API_KEY is not set");
        }
        // No analysis possible (no API key, or the site could not be read): a starter
        // profile with only the name and website, to complete by hand. Nothing invented.
        const profile = starterProfile(url, nameHint);
        for (const s of ANALYZE_STEPS) {
          emit({ type: "step", id: s.id, status: "running" });
          await sleep(250);
          emit({ type: "step", id: s.id, status: "done", detail: s.id === "fetch" ? url.hostname : undefined });
        }
        emit({ type: "profile", profile, mode: "simulated", reason: FAILURE_LABELS[failure] });
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "Analyse impossible" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
