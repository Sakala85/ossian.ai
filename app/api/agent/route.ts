import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { AgentEvent } from "@/lib/agent/events";
import { hasAnthropicKey, runClaudeTurn } from "@/lib/agent/runtime";
import { runSimulatedTurn } from "@/lib/agent/simulated";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile } from "@/lib/domain/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Body = z.object({
  profile: z.record(z.string(), z.unknown()).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.unknown() })).max(80),
  userText: z.string().min(1).max(1500),
  callerNumber: z.string().max(32).optional(),
  forceSimulated: z.boolean().optional(),
});

export async function GET() {
  return Response.json({ mode: hasAnthropicKey() ? "ai" : "simulated" });
}

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return Response.json({ error: "Requête invalide" }, { status: 400 });
  }

  const profile = (body.profile as unknown as DealershipProfile | undefined)?.agent ? (body.profile as unknown as DealershipProfile) : DEMO_PROFILE;
  const history = body.history as Anthropic.Beta.BetaMessageParam[];
  const simulated = body.forceSimulated || !hasAnthropicKey();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: AgentEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        if (simulated) {
          await runSimulatedTurn({ profile, history, userText: body.userText, emit });
        } else {
          await runClaudeTurn({ profile, history, userText: body.userText, callerNumber: body.callerNumber, emit, signal: req.signal });
        }
        emit({ type: "done", mode: simulated ? "simulated" : "ai" });
      } catch (err) {
        let message = "Erreur inattendue";
        if (err instanceof Anthropic.AuthenticationError) message = "Clé API Anthropic invalide";
        else if (err instanceof Anthropic.RateLimitError) message = "Trop de requêtes, réessayez dans un instant";
        else if (err instanceof Anthropic.APIError) message = `Erreur API (${err.status ?? "réseau"})`;
        else if (err instanceof Error) message = err.message;
        console.error("[api/agent]", err);
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
