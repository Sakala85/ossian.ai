import { notifyTeam } from "@/lib/server/notify";
import { baseUrlFrom, getDealershipByPhone, isAuthorizedProvider, isDemoDealership } from "@/lib/server/dealerships";
import { endSession } from "@/lib/voice/call-session";
import { formatFrench, toE164 } from "@/lib/voice/phone";
import { buildVapiAssistant, type VapiServerMessage } from "@/lib/voice/vapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vapi server webhook (set as the phone number's Server URL).
 * - assistant-request: returns the assistant for the called number (must answer < 7.5 s)
 * - end-of-call-report: sends the call summary to the team, clears the call session
 */
export async function POST(req: Request) {
  if (!isAuthorizedProvider(req)) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as VapiServerMessage | null;
  const msg = body?.message;
  if (!msg?.type) return new Response("Bad request", { status: 400 });

  const calledNumber = msg.phoneNumber?.number ?? msg.call?.phoneNumber?.number;

  switch (msg.type) {
    case "assistant-request": {
      const profile = await getDealershipByPhone(calledNumber);
      return Response.json({
        assistant: buildVapiAssistant(profile, baseUrlFrom(req), { calledNumber, allowTransfers: !isDemoDealership(profile) }),
      });
    }

    case "end-of-call-report": {
      await endSession(msg.call?.id);
      const profile = await getDealershipByPhone(calledNumber);
      const caller = toE164(msg.customer?.number ?? msg.call?.customer?.number);
      const seconds = msg.startedAt && msg.endedAt ? Math.round((Date.parse(msg.endedAt) - Date.parse(msg.startedAt)) / 1000) : undefined;
      // Production: insert into `calls` (supabase/migrations) and classify intent/outcome.
      if (!isDemoDealership(profile)) {
        await notifyTeam("fin_appel", profile.name, "Compte-rendu d'appel", {
          Appelant: caller ? formatFrench(caller) : "masqué",
          Durée: seconds !== undefined ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : undefined,
          Résumé: msg.analysis?.summary,
          "Fin d'appel": msg.endedReason,
          Enregistrement: msg.artifact?.recordingUrl,
          Transcription: msg.artifact?.transcript?.slice(0, 2500),
        });
      } else {
        console.info("[vapi] demo call ended", { callId: msg.call?.id, reason: msg.endedReason, seconds });
      }
      return Response.json({ ok: true });
    }

    default:
      return Response.json({ ok: true });
  }
}
