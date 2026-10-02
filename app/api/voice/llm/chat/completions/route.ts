import type Anthropic from "@anthropic-ai/sdk";
import type { AgentEvent } from "@/lib/agent/events";
import { runClaudeTurn } from "@/lib/agent/runtime";
import { checkSecret, getDealershipByPhone } from "@/lib/server/dealerships";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface OpenAIStyleBody {
  messages: { role: "system" | "user" | "assistant" | "tool"; content: string | null }[];
  call?: { id?: string; customer?: { number?: string }; phoneNumber?: { number?: string } };
}

/**
 * OpenAI-compatible streaming endpoint consumed by Vapi's "custom-llm" provider.
 * Vapi owns the audio and sends the text transcript; we run Ossian's Claude
 * runtime (tools executed server-side) and stream the spoken answer back.
 */
export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!checkSecret(token, process.env.OSSIAN_LLM_SECRET)) return new Response("Unauthorized", { status: 401 });

  const body = (await req.json()) as OpenAIStyleBody;
  const profile = await getDealershipByPhone(body.call?.phoneNumber?.number);

  // Rebuild the conversation from the spoken transcript (text only).
  const turns = body.messages.filter((m) => (m.role === "user" || m.role === "assistant") && m.content);
  const lastUser = [...turns].reverse().find((m) => m.role === "user");
  const prior = turns.slice(0, turns.lastIndexOf(lastUser!));
  while (prior.length && prior[0]!.role !== "user") prior.shift(); // history must start with a user turn
  const history: Anthropic.Beta.BetaMessageParam[] = prior.map((m) => ({ role: m.role as "user" | "assistant", content: m.content! }));

  const encoder = new TextEncoder();
  const id = `chatcmpl-${Date.now().toString(36)}`;
  const chunk = (delta: Record<string, unknown>, finish: string | null = null) =>
    encoder.encode(`data: ${JSON.stringify({ id, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: "ossian-agent", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(chunk({ role: "assistant" }));
      const emit = (e: AgentEvent) => {
        if (e.type === "text") controller.enqueue(chunk({ content: e.delta }));
      };
      try {
        if (lastUser) await runClaudeTurn({ profile, history, userText: lastUser.content!, callerNumber: body.call?.customer?.number, emit, signal: req.signal });
      } catch (err) {
        console.error("[voice/llm]", err);
        controller.enqueue(chunk({ content: "Je vais vous faire rappeler par un conseiller très rapidement." }));
      }
      controller.enqueue(chunk({}, "stop"));
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-store" } });
}
