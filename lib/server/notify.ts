/**
 * Team notifications for real calls (pilot phase, before DMS/CRM connectors).
 * - Email to the dealership (its onboarding email) via Resend, when RESEND_API_KEY
 *   and OSSIAN_EMAIL_FROM are set and a recipient is known.
 * - Webhook to OSSIAN_NOTIFY_WEBHOOK_URL (Ossian's ops channel: Slack, Teams,
 *   Make, Zapier…). The payload carries a readable `text` plus structured fields.
 */

export type NotifyEvent = "rdv_demande" | "lead" | "rappel" | "transfert" | "fin_appel" | "activation" | "ligne_active";

const EMOJI: Record<NotifyEvent, string> = {
  rdv_demande: "📅",
  lead: "✨",
  rappel: "📞",
  transfert: "↪️",
  fin_appel: "📝",
  activation: "🚀",
  ligne_active: "✅",
};

export async function notifyTeam(
  event: NotifyEvent,
  dealership: string,
  title: string,
  fields: Record<string, unknown>,
  opts: { email?: string | null } = {},
) {
  const lines = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `• *${k}* : ${typeof v === "string" ? v : JSON.stringify(v)}`);
  const text = `${EMOJI[event]} *${title}* — ${dealership}\n${lines.join("\n")}`;
  console.info(`[notify:${event}]`, dealership, title, fields);

  if (opts.email) await sendEmail(opts.email, `${EMOJI[event]} ${title} — ${dealership}`, lines.map((l) => l.replace(/\*/g, "")).join("\n"));

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

/** Sends a plain-text email through Resend. Returns false when email is not configured or fails. */
export async function sendEmail(to: string, subject: string, body: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.OSSIAN_EMAIL_FROM;
  if (!key || !from) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text: `${body}\n\n— Ossian, votre assistante téléphonique`,
        ...(process.env.OSSIAN_EMAIL_REPLY_TO ? { reply_to: process.env.OSSIAN_EMAIL_REPLY_TO } : {}),
      }),
    });
    if (!res.ok) console.error(`[notify] email HTTP ${res.status}`);
    return res.ok;
  } catch (err) {
    console.error("[notify] email failed", err);
    return false;
  }
}
