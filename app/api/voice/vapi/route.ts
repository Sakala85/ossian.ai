import { parisParts } from "@/lib/agent/time";
import { db } from "@/lib/server/db";
import { baseUrlFrom, isAuthorizedProvider, resolveDealership } from "@/lib/server/dealerships";
import { notifyTeam } from "@/lib/server/notify";
import { digestSession, endSession, loadSession } from "@/lib/voice/call-session";
import { formatFrench, toE164 } from "@/lib/voice/phone";
import { buildVapiAssistant, type VapiServerMessage } from "@/lib/voice/vapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vapi server webhook (Server URL of every Ossian number).
 * - assistant-request: returns the assistant of the dealership owning the called number
 *   (must answer < 7.5 s) and records the number's first call = forwarding verified
 * - end-of-call-report: stores the call for the dashboard, notifies the team, clears the session
 */
export async function POST(req: Request) {
  if (!isAuthorizedProvider(req)) return new Response("Unauthorized", { status: 401 });
  const body = (await req.json().catch(() => null)) as VapiServerMessage | null;
  const msg = body?.message;
  if (!msg?.type) return new Response("Bad request", { status: 400 });

  const calledNumber = msg.phoneNumber?.number ?? msg.call?.phoneNumber?.number;

  switch (msg.type) {
    case "assistant-request": {
      const dealership = await resolveDealership(calledNumber);
      const e164 = toE164(calledNumber);
      if (dealership.source === "db" && e164) {
        const first = await db.markFirstCall(e164).catch(() => false);
        if (first) {
          await notifyTeam(
            "ligne_active",
            dealership.profile.name,
            "Premier appel reçu : renvoi d'appel opérationnel",
            { Numéro: formatFrench(e164) },
            { email: dealership.contactEmail },
          );
        }
      }
      return Response.json({
        assistant: buildVapiAssistant(dealership.profile, baseUrlFrom(req), { calledNumber, allowTransfers: dealership.source !== "demo" }),
      });
    }

    case "end-of-call-report": {
      const callId = msg.call?.id;
      const [dealership, session] = await Promise.all([resolveDealership(calledNumber), loadSession(callId)]);
      await endSession(callId);
      const caller = toE164(msg.customer?.number ?? msg.call?.customer?.number);
      const seconds = msg.startedAt && msg.endedAt ? Math.round((Date.parse(msg.endedAt) - Date.parse(msg.startedAt)) / 1000) : undefined;
      const digest = digestSession(session);
      const summary = digest.summary || msg.analysis?.summary || undefined;
      const outcome = !session && (seconds ?? 0) < 15 ? "abandonne" : digest.outcome;

      if (dealership.source === "demo") {
        console.info("[vapi] demo call ended", { callId, reason: msg.endedReason, seconds });
        return Response.json({ ok: true });
      }

      if (dealership.source === "db" && dealership.dealershipId) {
        const started = msg.startedAt ? new Date(msg.startedAt) : new Date();
        const p = parisParts(started);
        const transcript = (msg.artifact?.messages ?? [])
          .filter((m) => (m.role === "bot" || m.role === "assistant" || m.role === "user") && m.message?.trim())
          .map((m) => ({ role: m.role === "user" ? "caller" : "agent", text: m.message!.trim(), t: Math.round(m.secondsFromStart ?? 0) }));
        await db
          .logCall(dealership.dealershipId, {
            provider_call_id: callId ?? null,
            direction: "inbound",
            caller_number: caller,
            started_at: started.toISOString(),
            duration_sec: seconds ?? null,
            intent: digest.intent,
            outcome,
            after_hours: p.weekday === 0 || p.hour < 8 || p.hour >= 19,
            summary: summary ?? null,
            extracted: digest.extracted,
            transcript: transcript as never,
            recording_url: msg.artifact?.recordingUrl ?? null,
          })
          .catch((err) => console.error("[vapi] could not store call", err));
      }

      await notifyTeam("fin_appel", dealership.profile.name, "Compte-rendu d'appel", {
        Appelant: caller ? formatFrench(caller) : "masqué",
        Durée: seconds !== undefined ? `${Math.floor(seconds / 60)} min ${seconds % 60} s` : undefined,
        Issue: outcome,
        Résumé: summary,
        ...digest.extracted,
        "Fin d'appel": msg.endedReason,
        Enregistrement: msg.artifact?.recordingUrl,
      }, { email: dealership.contactEmail });
      return Response.json({ ok: true });
    }

    default:
      return Response.json({ ok: true });
  }
}
