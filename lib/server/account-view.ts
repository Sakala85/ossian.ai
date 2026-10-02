import { INTENTS, LANGUAGES, OUTCOMES, type CallOutcome, type CallRecord, type Intent, type LanguageCode } from "@/lib/domain/types";
import { formatFrench } from "@/lib/voice/phone";
import type { Dashboard, DbCall } from "./db";
import type { Workspace } from "@/components/app/shell-context";

/** Maps stored calls to the dashboard's CallRecord shape. */
export function toCallRecords(calls: DbCall[], siteLabel = "Concession"): CallRecord[] {
  return calls.map((c) => ({
    id: c.provider_call_id ?? c.id,
    startedAt: c.started_at,
    durationSec: c.duration_sec ?? 0,
    direction: c.direction,
    caller: { phone: c.caller_number ? formatFrench(c.caller_number) : "Numéro masqué", name: c.caller_name ?? undefined, known: false },
    siteId: siteLabel,
    language: (c.language && c.language in LANGUAGES ? c.language : "fr") as LanguageCode,
    intent: (c.intent && c.intent in INTENTS ? c.intent : "autre") as Intent,
    outcome: (c.outcome && c.outcome in OUTCOMES ? c.outcome : "info_donnee") as CallOutcome,
    sentiment: (c.sentiment === "positif" || c.sentiment === "negatif" ? c.sentiment : "neutre") as CallRecord["sentiment"],
    afterHours: c.after_hours,
    summary: c.summary ?? "Appel traité par l'agent.",
    extracted: c.extracted ?? {},
    transcript: (c.transcript ?? []).map((l) => ({ role: l.role, text: l.text, t: l.t ?? 0 })),
  }));
}

export function workspaceFor(account: Dashboard): Workspace {
  const { name, profile } = account.dealership;
  const initials = name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\d]/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const email = account.dealership.contact_email ?? "";
  const sites = profile.sites?.length ?? 1;
  const langs = profile.agent?.languages?.length ?? 1;
  const online = Boolean(account.phone?.first_call_at);
  return {
    name,
    initials: initials || "OS",
    user: email.split("@")[0] || "Mon compte",
    role: email || "Compte concession",
    live: true,
    subtitle: account.phone ? `Ligne ${formatFrench(account.phone.e164)}` : "Numéro en cours d'attribution",
    agent: {
      name: account.dealership.agent_name ?? profile.agent?.name ?? "Léa",
      online,
      summary: online ? `24h/24 · ${langs} langue${langs > 1 ? "s" : ""} · ${sites} site${sites > 1 ? "s" : ""}` : "Prête : il reste le renvoi d'appel",
    },
  };
}

export interface GoLiveState {
  agentName: string;
  createdAt: string;
  phone: { e164: string; display: string } | null;
  forwardingVerifiedAt: string | null;
  firstCallAt: string | null;
  calls: number;
}

export function goLiveState(account: Dashboard): GoLiveState {
  return {
    agentName: account.dealership.agent_name ?? "Léa",
    createdAt: account.dealership.created_at,
    phone: account.phone ? { e164: account.phone.e164, display: formatFrench(account.phone.e164) } : null,
    forwardingVerifiedAt: account.phone?.first_call_at ?? null,
    firstCallAt: account.calls.at(-1)?.started_at ?? null,
    calls: account.calls.length,
  };
}
