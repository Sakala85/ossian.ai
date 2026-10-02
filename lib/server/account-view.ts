import { INTENTS, LANGUAGES, OUTCOMES, type CallOutcome, type CallRecord, type Intent, type LanguageCode } from "@/lib/domain/types";
import { formatFrench } from "@/lib/voice/phone";
import type { Dashboard, DbCall } from "./db";
import { relTime } from "@/components/app/format";
import type { NotificationItem, Workspace } from "@/components/app/shell-context";

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
    recordingUrl: c.recording_url ?? undefined,
  }));
}

/** Latest things that need the team's attention, newest first. */
export function notificationsFor(account: Dashboard, now = new Date()): NotificationItem[] {
  const fmt = (p: string) => (p.startsWith("+") ? formatFrench(p) : p);
  const items: (Omit<NotificationItem, "time"> & { at: string })[] = [
    ...account.callbacks
      .filter((c) => !c.done_at)
      .map((c) => ({
        id: `cb:${c.id}`,
        kind: c.priority === "haute" ? ("urgent" as const) : ("callback" as const),
        title: `Rappel à faire · ${c.name ?? fmt(c.phone)}`,
        body: c.reason,
        at: c.created_at,
        href: "/app",
      })),
    ...account.appointments
      .filter((a) => a.status === "en_attente")
      .map((a) => ({
        id: `rdv:${a.id}`,
        kind: "appointment" as const,
        title: `Demande de RDV · ${a.customer_name}`,
        body: [a.service, a.vehicle.label].filter(Boolean).join(" · "),
        at: a.created_at,
        href: "/app/appointments",
      })),
    ...account.leads
      .filter((l) => l.stage === "nouveau")
      .map((l) => ({
        id: `lead:${l.id}`,
        kind: "lead" as const,
        title: `Nouveau lead · ${l.name}`,
        body: [l.interest, l.vehicle].filter(Boolean).join(" · "),
        at: l.created_at,
        href: "/app/leads",
      })),
    ...(account.phone?.first_call_at
      ? [{ id: "line", kind: "line" as const, title: "Ligne active", body: "Premier appel reçu : le renvoi fonctionne.", at: account.phone.first_call_at, href: "/app/calls" }]
      : []),
  ];
  return items
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 8)
    .map(({ at, ...n }) => ({ ...n, time: relTime(at, now) }));
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
    notifications: notificationsFor(account),
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
