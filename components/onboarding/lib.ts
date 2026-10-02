import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile, LanguageCode } from "@/lib/domain/types";

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export type StepId = 1 | 2 | 3 | 4 | 5 | 6;

export const STEPS: { id: StepId; label: string; hint: string; eta: string; optional?: boolean }[] = [
  { id: 1, label: "Votre concession", hint: "Adresse du site web", eta: "1 min" },
  { id: 2, label: "Analyse", hint: "Lecture de votre site", eta: "45 s" },
  { id: 3, label: "Vérification", hint: "Sites, horaires, prestations", eta: "1 min 20", optional: true },
  { id: 4, label: "Votre agent", hint: "Voix, ton et accueil", eta: "50 s", optional: true },
  { id: 5, label: "Connexions", hint: "DMS, agenda, alertes", eta: "30 s", optional: true },
  { id: 6, label: "Activation", hint: "Un clic, puis le renvoi d'appel", eta: "10 s" },
];

export const TOTAL_STEPS = STEPS.length;

export function parseStep(v: string | null | undefined): StepId {
  const n = Number(v);
  return (Number.isInteger(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1) as StepId;
}

export const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ */
/* Inputs                                                              */
/* ------------------------------------------------------------------ */

export type ProfileSource = "ai" | "simulated" | "template" | "demo";
export type SitesBucket = "1" | "2-5" | "6-20" | "20+";

export const SITES_BUCKETS: { value: SitesBucket; label: string; min: number }[] = [
  { value: "1", label: "1", min: 1 },
  { value: "2-5", label: "2–5", min: 2 },
  { value: "6-20", label: "6–20", min: 6 },
  { value: "20+", label: "20+", min: 20 },
];

export interface StartInput {
  url: string;
  name: string;
  sites: SitesBucket | null;
}

export type UpdateProfile = (recipe: (draft: DealershipProfile) => void) => void;

/** Accepts "garage-dupont.fr", "www.x.fr/contact", "http://…" and returns a clean https URL, or null. */
export function normalizeUrl(input: string): string | null {
  const s = input.trim();
  if (!s || /\s/.test(s)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname) && !u.hostname.startsWith("xn--")) return null;
    if (u.protocol === "http:") u.protocol = "https:";
    u.hash = "";
    const out = u.toString();
    return u.pathname === "/" && !u.search ? out.replace(/\/$/, "") : out;
  } catch {
    return null;
  }
}

export function hostOf(url?: string | null): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] ?? "";
  }
}

const LOWER_WORDS = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "sur", "d", "l"]);

/** "garage-dupont.fr" → "Garage Dupont". */
export function nameFromUrl(url: string): string {
  const host = hostOf(url);
  const base = host.split(".")[0] ?? "";
  return base
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w, i) => (i > 0 && LOWER_WORDS.has(w) ? w : w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(" ");
}

export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "concession"
  );
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Placeholder values left by the analysis ("À compléter", "Adresse à confirmer") count as missing. */
export function isMissing(v?: string | null) {
  return !v || !v.trim() || /à compléter|à confirmer/i.test(v);
}

export function plural(n: number, word: string, pluralWord = `${word}s`) {
  return `${n} ${n > 1 ? pluralWord : word}`;
}

/* ------------------------------------------------------------------ */
/* Voices & greeting                                                   */
/* ------------------------------------------------------------------ */

export interface VoiceOption {
  id: string;
  name: string;
  trait: string;
  lang: string;
  description: string;
  gender: "f" | "m";
  pitch: number;
  rate: number;
  /** Preferred system voices for the browser preview (speechSynthesis). */
  prefer: RegExp;
}

export const VOICES: VoiceOption[] = [
  {
    id: "lea-fr",
    name: "Léa",
    trait: "Chaleureuse",
    lang: "Français",
    description: "Douce et souriante, idéale pour l'accueil.",
    gender: "f",
    pitch: 1.1,
    rate: 1,
    prefer: /(amélie|amelie|audrey|aurélie|aurelie|marie|julie|denise|google français)/i,
  },
  {
    id: "hugo-fr",
    name: "Hugo",
    trait: "Posé",
    lang: "Français",
    description: "Grave et rassurant, parfait pour l'après-vente.",
    gender: "m",
    pitch: 0.78,
    rate: 0.92,
    prefer: /(thomas|henri|paul|nicolas|daniel|claude|mathieu|male)/i,
  },
  {
    id: "camille-fr",
    name: "Camille",
    trait: "Dynamique",
    lang: "Français",
    description: "Énergique, taillée pour les ventes VN / VO.",
    gender: "f",
    pitch: 1.28,
    rate: 1.12,
    prefer: /(audrey|amélie|amelie|marie|virginie|google français)/i,
  },
  {
    id: "sofia-multi",
    name: "Sofia",
    trait: "Multilingue",
    lang: "30 langues",
    description: "Native dans 30 langues, change avec l'appelant.",
    gender: "f",
    pitch: 1,
    rate: 1.02,
    prefer: /(google français|amélie|amelie|marie)/i,
  },
];

export function voiceOf(id?: string): VoiceOption {
  return VOICES.find((v) => v.id === id) ?? VOICES[0]!;
}

export function buildGreeting(name: string, agentName: string, voiceId?: string) {
  const who = name.trim();
  const role = voiceOf(voiceId).gender === "m" ? "l'assistant" : "l'assistante";
  return `${who ? `${who} bonjour` : "Bonjour"}, je suis ${agentName.trim() || "votre assistante"}, ${role} de la concession. Comment puis-je vous aider ?`;
}

function isAutoGreeting(p: DealershipProfile) {
  const g = p.agent.greeting.trim();
  return (
    g === buildGreeting(p.name, p.agent.name, p.agent.voiceId) ||
    g === buildGreeting(p.name, p.agent.name, "lea-fr") ||
    g === buildGreeting(p.name, p.agent.name, "hugo-fr")
  );
}

/**
 * Keeps the greeting in sync when the dealership name, agent name or voice
 * changes — rebuilt when it is still the default template, patched in place
 * otherwise. Never touches a greeting the user is editing in the same update.
 */
export function syncGreeting(prev: DealershipProfile, next: DealershipProfile) {
  if (next.agent.greeting !== prev.agent.greeting) return;
  const nameChanged = prev.name !== next.name;
  const agentChanged = prev.agent.name !== next.agent.name;
  const voiceChanged = prev.agent.voiceId !== next.agent.voiceId;
  if (!nameChanged && !agentChanged && !voiceChanged) return;

  if (isAutoGreeting(prev)) {
    next.agent.greeting = buildGreeting(next.name, next.agent.name, next.agent.voiceId);
    return;
  }
  let g = next.agent.greeting;
  if (nameChanged && prev.name.trim().length >= 3 && next.name.trim() && g.includes(prev.name)) {
    g = g.split(prev.name).join(next.name.trim());
  }
  if (agentChanged && prev.agent.name.trim().length >= 2 && next.agent.name.trim()) {
    g = g.replace(`je suis ${prev.agent.name}`, `je suis ${next.agent.name.trim()}`);
  }
  if (voiceChanged) {
    const m = voiceOf(next.agent.voiceId).gender === "m";
    g = m ? g.replace(/l(['’])assistante\b/, "l$1assistant") : g.replace(/l(['’])assistant\b(?!e)/, "l$1assistante");
  }
  next.agent.greeting = g;
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_LANGUAGES: LanguageCode[] = ["fr", "en", "es", "it", "de", "pt", "ar"];

export function emptyProfile(name = "", website?: string): DealershipProfile {
  return {
    id: uid("onb"),
    name,
    website,
    brands: [],
    sites: [],
    hours: [],
    services: [],
    departments: [],
    policies: [],
    faq: [],
    agent: {
      name: "Léa",
      voiceId: "lea-fr",
      languages: DEFAULT_LANGUAGES,
      tone: "chaleureux",
      greeting: buildGreeting(name, "Léa", "lea-fr"),
      transferPolicy: "business_hours",
      smsConfirmation: true,
      recordCalls: true,
    },
  };
}

/** "Je n'ai pas de site web": typical dealership values, blank identity. */
export function templateProfile(name = ""): DealershipProfile {
  const p = structuredClone(DEMO_PROFILE);
  return {
    id: uid("onb"),
    name,
    group: undefined,
    website: undefined,
    description: "",
    brands: [],
    sites: [{ id: uid("site"), name, address: "", city: "", phone: "", brands: [] }],
    hours: p.hours,
    services: p.services,
    departments: p.departments.map((d) => ({ ...d, phone: "", email: undefined })),
    policies: p.policies,
    faq: p.faq,
    agent: { ...p.agent, greeting: buildGreeting(name, p.agent.name, p.agent.voiceId) },
  };
}

/** Fallback when the analysis fails: the demo dealership, renamed after the URL. */
export function demoProfileFor(url: string, typedName?: string): DealershipProfile {
  const host = hostOf(url);
  const name = typedName?.trim() || nameFromUrl(url) || "Votre concession";
  const p = structuredClone(DEMO_PROFILE);
  const rename = (s: string) => s.replace(/Mistral Occasions/g, `${name} Occasions`).replace(/Mistral Automobiles/g, name);
  return {
    ...p,
    id: uid("demo"),
    name,
    group: undefined,
    website: url || undefined,
    description: `${name} : ventes de véhicules neufs et d'occasion, atelier toutes marques, carrosserie et magasin de pièces.`,
    sites: p.sites.map((s) => ({ ...s, name: rename(s.name) })),
    departments: p.departments.map((d) => ({
      ...d,
      email: d.email && host ? d.email.replace("mistral-automobiles.fr", host) : d.email,
    })),
    agent: { ...p.agent, greeting: buildGreeting(name, p.agent.name, p.agent.voiceId) },
  };
}

const arr = <T,>(v: T[] | undefined | null): T[] => (Array.isArray(v) ? v : []);

/** Placeholder strings become empty fields (highlighted "à compléter" in the review step). */
const clean = (v?: string | null) => (v && !/^\s*(adresse\s+)?à (compléter|confirmer)\s*$/i.test(v) ? v : "");

/** Defensive merge of whatever the API returned with sane defaults. */
export function normalizeProfile(raw: Partial<DealershipProfile> | undefined, fallbackUrl?: string): DealershipProfile {
  const base = emptyProfile();
  const p = raw ?? {};
  const agent = { ...base.agent, ...(p.agent ?? {}) };
  if (!Array.isArray(agent.languages) || agent.languages.length === 0) agent.languages = base.agent.languages;
  if (!agent.greeting) agent.greeting = buildGreeting(p.name ?? "", agent.name, agent.voiceId);
  return {
    id: p.id || base.id,
    name: p.name ?? "",
    group: p.group || undefined,
    website: p.website || fallbackUrl,
    description: p.description ?? "",
    brands: arr(p.brands),
    sites: arr(p.sites).map((s, i) => ({
      id: s.id || `site-${i + 1}`,
      name: s.name ?? "",
      address: clean(s.address),
      city: clean(s.city),
      phone: clean(s.phone),
      brands: arr(s.brands),
    })),
    hours: arr(p.hours),
    services: arr(p.services).map((s) => ({ ...s, durationMin: Number(s.durationMin) || 30 })),
    departments: arr(p.departments).map((d) => ({ ...d, label: d.label ?? "", phone: clean(d.phone), hours: d.hours ?? "" })),
    policies: arr(p.policies),
    faq: arr(p.faq),
    agent,
  };
}

export function summaryParts(p: DealershipProfile) {
  return [
    plural(p.sites.length, "site"),
    plural(p.brands.length, "marque"),
    plural(p.services.length, "prestation"),
    plural(p.departments.length, "service"),
  ];
}

/* ------------------------------------------------------------------ */
/* Connections (step 5)                                                */
/* ------------------------------------------------------------------ */

export type BookingProviderId = "ossian" | "nextlane" | "keyloop" | "kerridge" | "cdk" | "incadea" | "google" | "outlook";
export type CrmId = "none" | "salesforce" | "hubspot";
export type LinkStatus = "connected" | "pending";

export interface Provider<T extends string> {
  id: T;
  name: string;
  mono: string;
  kind: "builtin" | "dms" | "calendar" | "crm";
}

export const DMS_PROVIDERS: Provider<BookingProviderId>[] = [
  { id: "nextlane", name: "Nextlane", mono: "NX", kind: "dms" },
  { id: "keyloop", name: "Keyloop / Autoline", mono: "KL", kind: "dms" },
  { id: "kerridge", name: "Kerridge", mono: "KD", kind: "dms" },
  { id: "cdk", name: "CDK Global", mono: "CDK", kind: "dms" },
  { id: "incadea", name: "incadea", mono: "IN", kind: "dms" },
];

export const CALENDAR_PROVIDERS: Provider<BookingProviderId>[] = [
  { id: "google", name: "Google Agenda", mono: "G", kind: "calendar" },
  { id: "outlook", name: "Microsoft Outlook", mono: "O", kind: "calendar" },
];

export const CRM_PROVIDERS: Provider<CrmId>[] = [
  { id: "none", name: "Aucun", mono: "—", kind: "crm" },
  { id: "salesforce", name: "Salesforce", mono: "SF", kind: "crm" },
  { id: "hubspot", name: "HubSpot", mono: "HS", kind: "crm" },
];

export interface Connections {
  booking: BookingProviderId;
  status: Partial<Record<BookingProviderId | CrmId, LinkStatus>>;
  crm: CrmId;
  slack: boolean;
  teams: boolean;
}

export const initialConnections: Connections = { booking: "ossian", status: {}, crm: "none", slack: false, teams: false };

export function providerName(id: BookingProviderId) {
  if (id === "ossian") return "Agenda Ossian";
  return [...DMS_PROVIDERS, ...CALENDAR_PROVIDERS].find((p) => p.id === id)?.name ?? id;
}

/* ------------------------------------------------------------------ */
/* Go live (step 6)                                                    */
/* ------------------------------------------------------------------ */

/** Result of POST /api/onboarding/activate (or a local demo activation when no database is configured). */
export interface Activation {
  email: string;
  phone: { e164: string; display: string } | null;
  fallback: string | null;
  accessUrl: string | null;
  emailSent: boolean;
  /** No database on this deployment: the activation stayed local (demo). */
  demo: boolean;
}

export interface GoLive {
  live: boolean;
  email: string;
  fallback: string;
  activation: Activation | null;
}

export const initialGoLive: GoLive = { live: false, email: "", fallback: "", activation: null };

/* ------------------------------------------------------------------ */
/* Draft persistence (resume after "Enregistrer et quitter" / demo)   */
/* ------------------------------------------------------------------ */

const DRAFT_KEY = "ossian.onboarding.draft";

export interface Draft {
  v: 1;
  step: StepId;
  maxStep: StepId;
  profile: DealershipProfile;
  ready: boolean;
  source: ProfileSource | null;
  edited: string[];
  input: StartInput;
  connections: Connections;
  golive: GoLive;
  visited?: StepId[];
  savedAt: number;
}

export function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as Draft;
    if (d?.v !== 1 || !d.profile) return null;
    return {
      ...d,
      profile: normalizeProfile(d.profile),
      connections: { ...initialConnections, ...d.connections },
      golive: { ...initialGoLive, ...d.golive },
    };
  } catch {
    return null;
  }
}

export function saveDraft(d: Draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {}
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function timeAgo(ts: number) {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "à l'instant";
  const m = Math.round(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
}
