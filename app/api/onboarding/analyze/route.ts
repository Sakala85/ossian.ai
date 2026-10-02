import { z } from "zod";
import { hasAnthropicKey } from "@/lib/agent/runtime";
import { analyzeWithClaude } from "@/lib/onboarding/analyze";
import { normalizeUrl, simulateProfile } from "@/lib/onboarding/simulate";
import { ANALYZE_STEPS, type AnalyzeEvent } from "@/lib/onboarding/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

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
        if (hasAnthropicKey()) {
          try {
            const profile = await analyzeWithClaude(url, nameHint, emit, req.signal);
            emit({ type: "step", id: "agent", status: "running" });
            await sleep(500);
            emit({ type: "step", id: "agent", status: "done", detail: `Agent « ${profile.agent.name} » prêt` });
            emit({ type: "profile", profile, mode: "ai" });
            return;
          } catch (err) {
            if (req.signal.aborted) return;
            console.error("[onboarding/analyze] falling back to simulated profile", err);
          }
        }
        // Simulated analysis (no API key, or the site could not be read).
        const profile = simulateProfile(url, nameHint);
        const details: Record<string, string> = {
          fetch: `${url.hostname} · pages publiques`,
          identity: `${profile.brands.join(", ")} · ${profile.sites.length} site(s)`,
          hours: `${profile.hours.length} plages horaires`,
          services: `${profile.services.length} prestations`,
          routing: `${profile.departments.length} services joignables`,
          agent: `Agent « ${profile.agent.name} » prêt`,
        };
        for (const s of ANALYZE_STEPS) {
          emit({ type: "step", id: s.id, status: "running" });
          await sleep(550 + Math.random() * 450);
          emit({ type: "step", id: s.id, status: "done", detail: details[s.id] });
        }
        emit({ type: "profile", profile, mode: "simulated" });
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
