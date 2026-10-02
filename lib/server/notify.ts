/**
 * Team notifications for real calls (pilot phase, before DMS/CRM connectors).
 * Posts to OSSIAN_NOTIFY_WEBHOOK_URL — a Slack incoming webhook, Microsoft
 * Teams workflow, Make/Zapier/n8n scenario… The payload carries a human
 * readable `text` (what Slack displays) plus structured fields for automations.
 */

export type NotifyEvent = "rdv_demande" | "lead" | "rappel" | "transfert" | "fin_appel";

const EMOJI: Record<NotifyEvent, string> = {
  rdv_demande: "📅",
  lead: "✨",
  rappel: "📞",
  transfert: "↪️",
  fin_appel: "📝",
};

export async function notifyTeam(event: NotifyEvent, dealership: string, title: string, fields: Record<string, unknown>) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `• *${k}* : ${typeof v === "string" ? v : JSON.stringify(v)}`);
  const text = `${EMOJI[event]} *${title}* — ${dealership}\n${lines.join("\n")}`;
  console.info(`[notify:${event}]`, dealership, title, fields);

  const hook = process.env.OSSIAN_NOTIFY_WEBHOOK_URL;
  if (!hook) return;
  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, event, dealership, title, fields, sentAt: new Date().toISOString() }),
    });
    if (!res.ok) console.error(`[notify] webhook HTTP ${res.status}`);
  } catch (err) {
    console.error("[notify] webhook failed", err);
  }
}
