import { DemoBackend } from "@/lib/agent/backend";
import type { AgentEvent } from "@/lib/agent/events";
import { PilotBackend } from "@/lib/agent/pilot-backend";
import { hasAnthropicKey, runClaudeTurn } from "@/lib/agent/runtime";
import { runSimulatedTurn } from "@/lib/agent/simulated";
import { isAuthorizedProvider, resolveDealership } from "@/lib/server/dealerships";
import { prepareTurn, saveTurn } from "@/lib/voice/call-session";
import { toE164 } from "@/lib/voice/phone";
import { sseChunker, type VapiLlmRequest } from "@/lib/voice/vapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * OpenAI-compatible streaming endpoint used by Vapi's "custom-llm" provider
 * (Vapi calls `${model.url}/chat/completions` on every caller turn).
 *
 * Vapi owns the audio; we run Ossian's agent (Claude + business tools executed
 * here), stream the words to speak, and finish with a Vapi tool call when the
 * call must be transferred (transferCall) or hung up (endCall).
 */
export async function POST(req: Request) {
  if (!isAuthorizedProvider(req)) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as VapiLlmRequest | null;
  if (!body?.messages) return new Response("Bad request", { status: 400 });

  const callId = body.call?.id;
  const calledNumber = body.phoneNumber?.number ?? body.call?.phoneNumber?.number ?? body.metadata?.calledNumber;
  const callerNumber = body.customer?.number ?? body.call?.customer?.number;
  const dealership = await resolveDealership(calledNumber);
  const { profile } = dealership;
  const isDemo = dealership.source === "demo";
  const backend = isDemo ? new DemoBackend(profile) : new PilotBackend(profile, { callId, callerNumber, dealershipId: dealership.dealershipId, contactEmail: dealership.contactEmail });
  const { history, userText, userTurns, outcome, summary } = await prepareTurn(callId, body.messages);
  const sse = sseChunker(body.model);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(sse.role());
      let transferTo: string | null = null;
      let hangUp = false;
      let endOutcome = outcome;
      let endSummary = summary;
      let appended: NonNullable<Extract<AgentEvent, { type: "messages" }>["messages"]> = [];

      const emit = (e: AgentEvent) => {
        switch (e.type) {
          case "text":
            controller.enqueue(sse.text(e.delta));
            break;
          case "tool_result":
            // Demo dealership numbers are fictional: the transfer stays verbal only.
            if (e.name === "transfer_call" && e.ok && !isDemo) {
              const r = e.result as { status?: string; number?: string };
              if (r.status === "transfert_en_cours") transferTo = toE164(r.number);
            }
            break;
          case "end_call":
            hangUp = true;
            endOutcome = e.outcome;
            endSummary = e.summary;
            break;
          case "messages":
            appended = e.messages;
            break;
        }
      };

      try {
        if (!userText) {
          controller.enqueue(sse.text("Je vous écoute."));
        } else if (hasAnthropicKey()) {
          await runClaudeTurn({ profile, history, userText, callerNumber, emit, signal: req.signal, backend });
        } else {
          await runSimulatedTurn({ profile, history, userText, emit, backend });
        }
      } catch (err) {
        if (!req.signal.aborted) {
          console.error("[voice/llm]", err);
          controller.enqueue(sse.text(" Excusez-moi, je vais vous faire rappeler très rapidement par un conseiller."));
        }
      }

      await saveTurn(callId, { history: [...history, ...appended], userTurns, outcome: endOutcome, summary: endSummary });

      if (transferTo) {
        controller.enqueue(sse.toolCall("transferCall", { destination: transferTo }));
        controller.enqueue(sse.finish("tool_calls"));
      } else if (hangUp) {
        controller.enqueue(sse.toolCall("endCall", {}));
        controller.enqueue(sse.finish("tool_calls"));
      } else {
        controller.enqueue(sse.finish("stop"));
      }
      controller.enqueue(sse.done());
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" } });
}
