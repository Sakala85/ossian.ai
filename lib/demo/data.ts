import type {
  Appointment,
  CallOutcome,
  CallRecord,
  Campaign,
  DailyStat,
  Integration,
  Intent,
  LanguageCode,
  Lead,
  Sentiment,
} from "@/lib/domain/types";
import { getDemoCalls } from "./calls";
import { addDays, parisParts, parisToUtc, weekdayOf } from "@/lib/agent/time";
import { ADVISORS, DEMO_PROFILE, SALESPEOPLE } from "./profile";

/** Small deterministic PRNG so server and client render identical demo data. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: readonly T[]) => arr[Math.floor(r() * arr.length)]!;

/* ------------------------------------------------------------------ */
/* Daily stats (last 30 days)                                          */
/* ------------------------------------------------------------------ */
export function getDailyStats(now = new Date(), days = 30): DailyStat[] {
  const today = parisParts(now).date;
  const out: DailyStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = addDays(today, -i);
    // Seeded per calendar day so every window (7/30/60/90 j) shows the same numbers for a given day.
    const r = rng([...key].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261));
    const dow = weekdayOf(key);
    const base = dow === 0 ? 9 : dow === 6 ? 28 : dow === 1 ? 64 : 52;
    const ramp = 1 + (90 - Math.min(i, 90)) * 0.003; // adoption grows slowly
    const calls = Math.round(base * ramp * (0.86 + r() * 0.28));
    const transferred = Math.round(calls * (0.16 + r() * 0.06));
    const afterHours = Math.round(calls * (dow === 0 ? 0.9 : dow === 6 ? 0.42 : 0.24 + r() * 0.06));
    out.push({
      date: key,
      calls,
      handledByAi: calls - transferred,
      transferred,
      afterHours,
      appointments: Math.round(calls * (0.27 + r() * 0.06)),
      leads: Math.round(calls * (0.1 + r() * 0.04)),
      missedBefore: Math.round(calls * (0.32 + r() * 0.08)),
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* KPIs                                                                */
/* ------------------------------------------------------------------ */
export const AVG_WORKSHOP_TICKET = 286;
export const LEAD_VALUE = 640; // marge moyenne x taux de conversion

export function getKpis(now = new Date()) {
  const stats = getDailyStats(now, 60);
  const cur = stats.slice(30);
  const prev = stats.slice(0, 30);
  const sum = (a: DailyStat[], k: keyof Omit<DailyStat, "date">) => a.reduce((s, d) => s + d[k], 0);
  const calls = sum(cur, "calls");
  const appointments = sum(cur, "appointments");
  const leads = sum(cur, "leads");
  const afterHours = sum(cur, "afterHours");
  const handled = sum(cur, "handledByAi");
  const revenue = appointments * AVG_WORKSHOP_TICKET + leads * LEAD_VALUE;
  const delta = (a: number, b: number) => (b === 0 ? 0 : (a - b) / b);
  return {
    calls,
    callsDelta: delta(calls, sum(prev, "calls")),
    answerRate: 1,
    answerRateBefore: 1 - sum(cur, "missedBefore") / calls,
    appointments,
    appointmentsDelta: delta(appointments, sum(prev, "appointments")),
    leads,
    leadsDelta: delta(leads, sum(prev, "leads")),
    afterHours,
    automationRate: handled / calls,
    revenue,
    revenueDelta: delta(revenue, sum(prev, "appointments") * AVG_WORKSHOP_TICKET + sum(prev, "leads") * LEAD_VALUE),
    avgPickupSec: 0.8,
    avgDurationSec: 118,
    csat: 4.7,
    hoursSaved: Math.round((calls * 3.4) / 60),
  };
}

/* ------------------------------------------------------------------ */
/* Breakdowns                                                          */
/* ------------------------------------------------------------------ */
export function getIntentBreakdown(): { intent: Intent; share: number }[] {
  return [
    { intent: "rdv_atelier", share: 0.38 },
    { intent: "suivi_reparation", share: 0.17 },
    { intent: "achat_vn", share: 0.09 },
    { intent: "achat_vo", share: 0.08 },
    { intent: "pieces", share: 0.08 },
    { intent: "carrosserie", share: 0.06 },
    { intent: "devis", share: 0.05 },
    { intent: "reprise", share: 0.03 },
    { intent: "reclamation", share: 0.02 },
    { intent: "autre", share: 0.04 },
  ];
}

/** Calls by weekday (Mon..Sun) × hour (0..23). */
export function getHeatmap(): number[][] {
  const r = rng(7);
  return Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 24 }, (_, h) => {
      const weekend = d >= 5;
      const open = weekend ? (d === 5 ? h >= 8 && h < 18 : false) : h >= 8 && h < 19;
      const peak = !weekend && (h === 9 || h === 10 || h === 14 || h === 17) ? 1.5 : 1;
      const evening = h >= 19 && h <= 22 ? 0.45 : 0;
      const night = h < 7 || h > 22 ? 0.04 : 0;
      const base = open ? 1 * peak : evening + night + (h === 7 || h === 18 ? 0.5 : 0);
      const dayFactor = d === 0 ? 1.25 : d === 6 ? 0.35 : 1;
      return Math.round(base * dayFactor * (7 + r() * 5));
    }),
  );
}

export function getLanguageBreakdown(): { code: LanguageCode; share: number }[] {
  return [
    { code: "fr", share: 0.86 },
    { code: "en", share: 0.05 },
    { code: "ar", share: 0.03 },
    { code: "es", share: 0.02 },
    { code: "pt", share: 0.02 },
    { code: "it", share: 0.01 },
    { code: "tr", share: 0.01 },
  ];
}

/* ------------------------------------------------------------------ */
/* Calls (hand-written + generated)                                    */
/* ------------------------------------------------------------------ */
const FIRST = ["Julie", "Nicolas", "Céline", "Romain", "Léa", "Mehdi", "Claire", "Hugo", "Sonia", "Bruno", "Inès", "Paul", "Yasmine", "Olivier", "Chloé", "Damien", "Fatou", "Antoine", "Elodie", "Rachid"];
const LAST = ["Bernard", "Moreau", "Laurent", "Simon", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Morel", "Girard", "André", "Mercier", "Blanc", "Guerin", "Boyer", "Chevalier", "Faure"];
const CARS = [
  ["Peugeot", "208"], ["Peugeot", "2008"], ["Peugeot", "308 SW"], ["Peugeot", "3008"], ["Peugeot", "5008"],
  ["Citroën", "C3"], ["Citroën", "C3 Aircross"], ["Citroën", "C4"], ["Citroën", "Berlingo"],
  ["Toyota", "Yaris"], ["Toyota", "Yaris Cross"], ["Toyota", "C-HR"], ["Toyota", "RAV4"], ["Toyota", "Corolla"],
  ["Renault", "Clio"], ["Volkswagen", "Golf"], ["Dacia", "Sandero"],
] as const;

const TEMPLATES: { intent: Intent; outcome: CallOutcome; sentiment: Sentiment; summary: (car: string) => string; weight: number }[] = [
  { intent: "rdv_atelier", outcome: "rdv_pris", sentiment: "positif", weight: 30, summary: (c) => `Révision sur ${c}. RDV pris et confirmé par SMS.` },
  { intent: "rdv_atelier", outcome: "rdv_pris", sentiment: "positif", weight: 10, summary: (c) => `Vidange + filtres sur ${c}. Créneau du matin choisi, attente sur place.` },
  { intent: "suivi_reparation", outcome: "info_donnee", sentiment: "positif", weight: 16, summary: (c) => `Suivi d'intervention ${c} : véhicule prêt, horaires de restitution communiqués.` },
  { intent: "achat_vn", outcome: "lead_cree", sentiment: "positif", weight: 8, summary: (c) => `Projet d'achat ${c} neuf. Besoin qualifié, rappel vendeur sous 2 h.` },
  { intent: "achat_vo", outcome: "lead_cree", sentiment: "positif", weight: 7, summary: (c) => `Intérêt pour un ${c} d'occasion en stock. Visite programmée.` },
  { intent: "pieces", outcome: "transfere", sentiment: "neutre", weight: 8, summary: (c) => `Demande de pièce pour ${c}. Transfert au magasin avec la référence pré-qualifiée.` },
  { intent: "carrosserie", outcome: "rdv_pris", sentiment: "neutre", weight: 5, summary: (c) => `Sinistre carrosserie sur ${c}. Expertise gratuite réservée.` },
  { intent: "devis", outcome: "rappel_programme", sentiment: "neutre", weight: 5, summary: (c) => `Demande de devis freinage ${c}. Rappel conseiller service programmé.` },
  { intent: "reprise", outcome: "lead_cree", sentiment: "positif", weight: 3, summary: (c) => `Estimation de reprise ${c}. RDV d'expertise reprise fixé.` },
  { intent: "financement", outcome: "transfere", sentiment: "neutre", weight: 2, summary: (c) => `Question LOA sur ${c}. Transfert au service financement.` },
  { intent: "autre", outcome: "info_donnee", sentiment: "neutre", weight: 4, summary: () => `Demande d'horaires et d'adresse. Informations données et envoyées par SMS.` },
  { intent: "rdv_atelier", outcome: "abandonne", sentiment: "neutre", weight: 2, summary: () => `L'appelant a raccroché avant la fin de la qualification. Rappel automatique envoyé par SMS.` },
];

function weighted<T extends { weight: number }>(r: () => number, items: T[]) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let x = r() * total;
  for (const i of items) {
    x -= i.weight;
    if (x <= 0) return i;
  }
  return items[items.length - 1]!;
}

export function getAllCalls(now = new Date()): CallRecord[] {
  const seeded = getDemoCalls(now);
  const r = rng(1337);
  const generated: CallRecord[] = [];
  let minutesAgo = 95;
  for (let i = 0; i < 64; i++) {
    minutesAgo += Math.round(25 + r() * 160);
    const startedAt = new Date(now.getTime() - minutesAgo * 60_000);
    const h = startedAt.getHours();
    const afterHours = h < 8 || h >= 19 || startedAt.getDay() === 0;
    const tpl = weighted(r, TEMPLATES);
    const [make, model] = pick(r, CARS);
    const name = `${pick(r, FIRST)} ${pick(r, LAST)}`;
    const lang: LanguageCode = r() < 0.9 ? "fr" : pick(r, ["en", "ar", "es", "pt"] as const);
    const site = pick(r, DEMO_PROFILE.sites);
    generated.push({
      id: `call_${(100000 + i * 7919).toString(36).toUpperCase()}`,
      startedAt: startedAt.toISOString(),
      durationSec: Math.round(45 + r() * 210),
      direction: r() < 0.88 ? "inbound" : "outbound",
      caller: { name: r() < 0.85 ? name : undefined, phone: `0${6 + Math.floor(r() * 2)} ${String(Math.floor(r() * 90 + 10))} ${String(Math.floor(r() * 90 + 10))} ${String(Math.floor(r() * 90 + 10))} ${String(Math.floor(r() * 90 + 10))}`, known: r() < 0.45 },
      siteId: site.id,
      language: lang,
      intent: tpl.intent,
      outcome: tpl.outcome,
      sentiment: tpl.sentiment,
      afterHours,
      csat: tpl.outcome === "abandonne" ? undefined : r() < 0.6 ? (r() < 0.75 ? 5 : 4) : undefined,
      vehicle: { make, model },
      transferredTo: tpl.outcome === "transfere" ? (tpl.intent === "pieces" ? "pieces" : "vn") : undefined,
      summary: tpl.summary(`${make} ${model}`),
      transcript: [
        { role: "agent", t: 0, text: `${site.name.replace(" Lyon Est", "")} bonjour, je suis Léa. Comment puis-je vous aider ?` },
        { role: "caller", t: 4, text: "Bonjour, …" },
      ],
    });
  }
  return [...seeded, ...generated].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

/* ------------------------------------------------------------------ */
/* Appointments (current week)                                         */
/* ------------------------------------------------------------------ */
const SERVICES = [
  ["Révision constructeur", 120, 289],
  ["Vidange + filtres", 60, 129],
  ["Diagnostic électronique", 45, 89],
  ["Freinage", 90, 310],
  ["Pneumatiques ×4", 60, 520],
  ["Climatisation", 60, 99],
  ["Expertise carrosserie", 30, 1200],
  ["Pré-contrôle technique", 30, 0],
] as const;

export function getAppointments(now = new Date()): Appointment[] {
  const r = rng(2024);
  // Week grid in Paris time, whatever the server time zone.
  const today = parisParts(now);
  const monday = addDays(today.date, -((today.weekday + 6) % 7));
  const out: Appointment[] = [];
  let id = 1000;
  for (let day = 0; day < 6; day++) {
    const count = day === 5 ? 4 : 7 + Math.floor(r() * 3);
    const slots = new Set<number>();
    while (slots.size < count) {
      const m = day === 5 ? 8 * 60 + Math.floor(r() * 7) * 30 : [7.75, 8, 8.5, 9, 9.25, 10, 10.5, 11, 13.5, 14, 14.5, 15, 16, 16.5, 17][Math.floor(r() * 15)]! * 60;
      slots.add(m);
    }
    for (const m of [...slots].sort((a, b) => a - b)) {
      const start = parisToUtc(addDays(monday, day), m);
      const [service, durationMin, value] = pick(r, SERVICES);
      const [make, model] = pick(r, CARS);
      const past = start.getTime() < now.getTime();
      const roll = r();
      out.push({
        id: `apt_${++id}`,
        customer: `${pick(r, FIRST)} ${pick(r, LAST)}`,
        phone: `06 ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)}`,
        vehicle: { make, model, plate: `${String.fromCharCode(65 + Math.floor(r() * 26))}${String.fromCharCode(65 + Math.floor(r() * 26))}-${Math.floor(r() * 900 + 100)}-${String.fromCharCode(65 + Math.floor(r() * 26))}${String.fromCharCode(65 + Math.floor(r() * 26))}` },
        service,
        start: start.toISOString(),
        durationMin,
        siteId: r() < 0.6 ? "lyon-est" : r() < 0.7 ? "villeurbanne" : "bron",
        advisor: pick(r, ADVISORS),
        status: past ? (roll < 0.9 ? "honore" : "no_show") : roll < 0.85 ? "confirme" : "en_attente",
        source: r() < 0.72 ? "ossian" : "manuel",
        courtesyVehicle: durationMin >= 120 && r() < 0.6,
        estimatedValue: value,
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Leads                                                               */
/* ------------------------------------------------------------------ */
export function getLeads(now = new Date()): Lead[] {
  const r = rng(99);
  const vehicles = ["Peugeot E-3008 GT", "Toyota RAV4 Hybride", "Citroën ë-C3", "Peugeot 2008 Allure", "Toyota Yaris Cross", "Peugeot 308 SW Hybrid", "Citroën C5 Aircross", "Toyota C-HR", "Occasion · Clio V 2022", "Occasion · Tiguan 2020", "Occasion · Yaris 2021", "Peugeot E-208"];
  const stages = ["nouveau", "nouveau", "nouveau", "contacte", "contacte", "contacte", "essai", "essai", "offre", "offre", "gagne", "perdu"] as const;
  const leads: Lead[] = [
    {
      id: "lead_2001",
      name: "Thomas Lefèvre",
      phone: "07 81 22 09 64",
      email: "thomas.lefevre@gmail.com",
      interest: "VN",
      vehicle: "Peugeot E-3008 GT",
      budget: 45000,
      stage: "essai",
      score: 86,
      createdAt: new Date(now.getTime() - 38 * 60_000).toISOString(),
      siteId: "lyon-est",
      assignee: "Inès Fontaine",
      note: "Reprise Golf 7 2018 (98 000 km). Lyon–Grenoble 2×/sem. LOA à étudier. Essai samedi 10h.",
      source: "appel entrant",
    },
    {
      id: "lead_2002",
      name: "Kevin Marchand",
      phone: "07 66 20 13 98",
      interest: "VO",
      vehicle: "Occasion · Toyota Yaris Hybride 2021",
      budget: 18000,
      stage: "contacte",
      score: 74,
      createdAt: new Date(now.getTime() - (50 * 60 + 21) * 60_000).toISOString(),
      siteId: "bron",
      assignee: "Marc Dubois",
      note: "Vu sur Leboncoin à 21h. Visite demain 18h. Simulation financement 48 mois demandée.",
      source: "appel entrant",
    },
  ];
  for (let i = 0; i < 22; i++) {
    const stage = pick(r, stages);
    const vehicle = pick(r, vehicles);
    const vo = vehicle.startsWith("Occasion");
    leads.push({
      id: `lead_${2003 + i}`,
      name: `${pick(r, FIRST)} ${pick(r, LAST)}`,
      phone: `06 ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)} ${Math.floor(r() * 90 + 10)}`,
      interest: vo ? "VO" : r() < 0.15 ? "LLD" : r() < 0.1 ? "Reprise" : "VN",
      vehicle,
      budget: Math.round((vo ? 12000 + r() * 14000 : 22000 + r() * 30000) / 500) * 500,
      stage,
      score: Math.round(stage === "gagne" ? 95 : stage === "perdu" ? 20 + r() * 20 : 45 + r() * 45),
      createdAt: new Date(now.getTime() - Math.round(r() * 14 * 24 * 60) * 60_000).toISOString(),
      siteId: vo ? "bron" : pick(r, ["lyon-est", "villeurbanne"] as const),
      assignee: pick(r, SALESPEOPLE),
      note: pick(r, [
        "Souhaite un essai le week-end.",
        "Compare avec un concurrent, sensible au prix.",
        "Famille, besoin de 7 places.",
        "Rouleur urbain, intéressé par l'électrique.",
        "Reprise à estimer, véhicule actuel de 2017.",
        "Professionnel, demande une offre LLD 36 mois.",
      ]),
      source: pick(r, ["appel entrant", "appel entrant", "campagne", "site web", "SMS"] as const),
    });
  }
  return leads;
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */
export function getCampaigns(now = new Date()): Campaign[] {
  const d = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();
  return [
    { id: "cmp_1", name: "Rappel entretien — échéances d'octobre", type: "rappel_entretien", status: "active", audience: 842, called: 516, reached: 371, converted: 148, startedAt: d(6), channel: ["voix", "sms"] },
    { id: "cmp_2", name: "Relance devis atelier non signés", type: "relance_devis", status: "active", audience: 126, called: 126, reached: 94, converted: 41, startedAt: d(3), channel: ["voix"] },
    { id: "cmp_3", name: "Satisfaction J+2 après intervention", type: "satisfaction", status: "active", audience: 388, called: 360, reached: 287, converted: 251, startedAt: d(21), channel: ["voix", "sms"] },
    { id: "cmp_4", name: "No-show : reprogrammation automatique", type: "no_show", status: "active", audience: 37, called: 37, reached: 29, converted: 22, startedAt: d(30), channel: ["voix", "sms"] },
    { id: "cmp_5", name: "Contrôle technique à échéance (−30 j)", type: "rappel_ct", status: "planifiee", audience: 214, called: 0, reached: 0, converted: 0, startedAt: d(-2), channel: ["sms", "voix"] },
    { id: "cmp_6", name: "Relance leads VN sans suite > 7 jours", type: "relance_lead", status: "terminee", audience: 96, called: 96, reached: 71, converted: 19, startedAt: d(45), channel: ["voix", "email"] },
  ];
}

/* ------------------------------------------------------------------ */
/* Integrations catalogue                                              */
/* ------------------------------------------------------------------ */
export const INTEGRATIONS: Integration[] = [
  { id: "nextlane", name: "Nextlane", category: "DMS", status: "connecte", description: "Planning atelier, ordres de réparation, fiches clients et véhicules.", mono: "NX", hue: 250 },
  { id: "keyloop", name: "Keyloop (Autoline)", category: "DMS", status: "disponible", description: "Synchronisation des RDV atelier et de l'historique d'entretien.", mono: "KL", hue: 200 },
  { id: "kerridge", name: "Kerridge", category: "DMS", status: "disponible", description: "Lecture du planning, création d'OR et statut des interventions.", mono: "KD", hue: 20 },
  { id: "cdk", name: "CDK Global", category: "DMS", status: "disponible", description: "Service scheduling et données clients via API partenaires.", mono: "CDK", hue: 140 },
  { id: "incadea", name: "incadea", category: "DMS", status: "bientot", description: "Connecteur en cours de certification.", mono: "IN", hue: 300 },
  { id: "salesforce", name: "Salesforce Automotive Cloud", category: "CRM", status: "disponible", description: "Création de leads, opportunités et tâches commerciales.", mono: "SF", hue: 210 },
  { id: "hubspot", name: "HubSpot", category: "CRM", status: "disponible", description: "Contacts, deals et séquences de relance.", mono: "HS", hue: 25 },
  { id: "gcal", name: "Google Agenda", category: "Agenda", status: "disponible", description: "Pour les ateliers sans DMS : agenda partagé par conseiller.", mono: "GC", hue: 220 },
  { id: "outlook", name: "Microsoft 365 / Outlook", category: "Agenda", status: "connecte", description: "Agenda des vendeurs pour planifier les essais.", mono: "MS", hue: 205 },
  { id: "twilio", name: "Twilio", category: "Téléphonie", status: "connecte", description: "Numéros, SIP trunk et SMS. Renvoi d'appel depuis votre standard.", mono: "TW", hue: 0 },
  { id: "sip", name: "SIP / Standard IPBX", category: "Téléphonie", status: "disponible", description: "3CX, Ringover, Aircall, Orange Business, Alcatel… via SIP.", mono: "SIP", hue: 160 },
  { id: "whatsapp", name: "WhatsApp Business", category: "Messagerie", status: "disponible", description: "Confirmations, rappels et conversation asynchrone.", mono: "WA", hue: 145 },
  { id: "email", name: "E-mail (SMTP / Resend)", category: "Messagerie", status: "connecte", description: "Récapitulatifs d'appels et alertes envoyés aux équipes.", mono: "@", hue: 270 },
  { id: "slack", name: "Slack / Teams", category: "Messagerie", status: "disponible", description: "Alertes temps réel : réclamations, leads chauds, rappels.", mono: "SL", hue: 320 },
  { id: "zapier", name: "Webhooks & Zapier", category: "Automatisation", status: "disponible", description: "Envoyez chaque appel structuré vers n'importe quel outil.", mono: "ZP", hue: 30 },
  { id: "google-reviews", name: "Avis Google", category: "Avis clients", status: "bientot", description: "Sollicitation d'avis après un appel satisfaisant.", mono: "G★", hue: 50 },
];
