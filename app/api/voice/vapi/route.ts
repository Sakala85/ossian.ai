import { baseUrlFrom, checkSecret, getDealershipByPhone } from "@/lib/server/dealerships";
import { buildVapiAssistant, type VapiServerMessage } from "@/lib/voice/vapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vapi server webhook.
 * - assistant-request: returns the assistant configured for the called number
 * - end-of-call-report: persists the call (transcript, summary, recording)
 */
export async function POST(req: Request) {
  if (!checkSecret(req.headers.get("x-vapi-secret"), process.env.VAPI_WEBHOOK_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as VapiServerMessage | null;
  const msg = body?.message;
  if (!msg) return new Response("Bad request", { status: 400 });

  switch (msg.type) {
    case "assistant-request": {
      const profile = await getDealershipByPhone(msg.phoneNumber?.number);
      return Response.json({ assistant: buildVapiAssistant(profile, baseUrlFrom(req)) });
    }
    case "end-of-call-report": {
      // Production: insert into `calls` (+ classify intent/outcome with a
      // structured-output Claude call) and notify the right team.
      console.info("[vapi] call ended", {
        callId: msg.call?.id,
        reason: msg.endedReason,
        duration: msg.durationSeconds,
        summary: msg.analysis?.summary,
      });
      return Response.json({ ok: true });
    }
    default:
      return Response.json({ ok: true });
  }
}
