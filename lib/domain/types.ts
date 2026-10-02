/**
 * Ossian domain model.
 * The same shapes are used by the demo data, the agent runtime and the
 * Postgres schema (supabase/migrations) so the demo maps 1:1 to production.
 */

export type LanguageCode = "fr" | "en" | "es" | "it" | "de" | "pt" | "nl" | "ar" | "tr" | "pl" | "ro" | "zh";

export const LANGUAGES: Record<LanguageCode, { label: string; flag: string }> = {
  fr: { label: "Français", flag: "🇫🇷" },
  en: { label: "English", flag: "🇬🇧" },
  es: { label: "Español", flag: "🇪🇸" },
  it: { label: "Italiano", flag: "🇮🇹" },
  de: { label: "Deutsch", flag: "🇩🇪" },
  pt: { label: "Português", flag: "🇵🇹" },
  nl: { label: "Nederlands", flag: "🇳🇱" },
  ar: { label: "العربية", flag: "🇲🇦" },
  tr: { label: "Türkçe", flag: "🇹🇷" },
  pl: { label: "Polski", flag: "🇵🇱" },
  ro: { label: "Română", flag: "🇷🇴" },
  zh: { label: "中文", flag: "🇨🇳" },
};

export type DepartmentKey = "apres_vente" | "vn" | "vo" | "pieces" | "carrosserie" | "accueil" | "comptabilite";

export const DEPARTMENTS: Record<DepartmentKey, string> = {
  apres_vente: "Atelier / Après-vente",
  vn: "Ventes véhicules neufs",
  vo: "Ventes véhicules d'occasion",
  pieces: "Magasin pièces",
  carrosserie: "Carrosserie",
  accueil: "Accueil",
  comptabilite: "Comptabilité",
};

export type Intent =
  | "rdv_atelier"
  | "suivi_reparation"
  | "devis"
  | "achat_vn"
  | "achat_vo"
  | "essai"
  | "reprise"
  | "pieces"
  | "carrosserie"
  | "financement"
  | "reclamation"
  | "autre";

export const INTENTS: Record<Intent, string> = {
  rdv_atelier: "RDV atelier",
  suivi_reparation: "Suivi réparation",
  devis: "Devis",
  achat_vn: "Achat VN",
  achat_vo: "Achat VO",
  essai: "Essai",
  reprise: "Reprise",
  pieces: "Pièces",
  carrosserie: "Carrosserie",
  financement: "Financement",
  reclamation: "Réclamation",
  autre: "Autre",
};

export type CallOutcome = "rdv_pris" | "lead_cree" | "transfere" | "info_donnee" | "rappel_programme" | "abandonne";

export const OUTCOMES: Record<CallOutcome, { label: string; tone: "success" | "primary" | "info" | "neutral" | "warning" | "danger" }> = {
  rdv_pris: { label: "RDV pris", tone: "success" },
  lead_cree: { label: "Lead créé", tone: "primary" },
  transfere: { label: "Transféré", tone: "info" },
  info_donnee: { label: "Renseigné", tone: "neutral" },
  rappel_programme: { label: "Rappel programmé", tone: "warning" },
  abandonne: { label: "Raccroché", tone: "danger" },
};

export type Sentiment = "positif" | "neutre" | "negatif";

export interface ServiceItem {
  name: string;
  durationMin: number;
  priceFrom?: number;
  description?: string;
}

export interface DepartmentContact {
  key: DepartmentKey;
  label: string;
  phone: string;
  email?: string;
  hours: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  brands: string[];
}

export interface AgentConfig {
  name: string;
  voiceId: string;
  languages: LanguageCode[];
  tone: "chaleureux" | "professionnel" | "dynamique";
  greeting: string;
  /** When to hand over to a human. */
  transferPolicy: "business_hours" | "always_offer" | "never";
  smsConfirmation: boolean;
  recordCalls: boolean;
  customInstructions?: string;
}

export interface DealershipProfile {
  id: string;
  name: string;
  group?: string;
  website?: string;
  description?: string;
  brands: string[];
  sites: Site[];
  hours: { label: string; value: string }[];
  services: ServiceItem[];
  departments: DepartmentContact[];
  policies: string[];
  faq: { q: string; a: string }[];
  agent: AgentConfig;
}

export interface TranscriptLine {
  role: "agent" | "caller" | "tool";
  text: string;
  /** seconds from call start */
  t: number;
  tool?: { name: string; input: Record<string, unknown>; result?: Record<string, unknown> };
}

export interface Vehicle {
  make: string;
  model: string;
  plate?: string;
  year?: number;
  mileage?: number;
}

export interface CallRecord {
  id: string;
  startedAt: string;
  durationSec: number;
  direction: "inbound" | "outbound";
  caller: { name?: string; phone: string; known: boolean };
  siteId: string;
  language: LanguageCode;
  intent: Intent;
  outcome: CallOutcome;
  sentiment: Sentiment;
  afterHours: boolean;
  summary: string;
  vehicle?: Vehicle;
  transferredTo?: DepartmentKey;
  appointmentId?: string;
  leadId?: string;
  csat?: number;
  transcript: TranscriptLine[];
  extracted?: Record<string, string>;
  /** Real recording (live accounts); the demo simulates playback. */
  recordingUrl?: string;
}

export type AppointmentStatus = "confirme" | "en_attente" | "honore" | "no_show" | "annule";

export interface Appointment {
  id: string;
  customer: string;
  phone: string;
  vehicle: Vehicle;
  service: string;
  start: string;
  durationMin: number;
  siteId: string;
  advisor: string;
  status: AppointmentStatus;
  source: "ossian" | "manuel";
  courtesyVehicle?: boolean;
  estimatedValue: number;
}

export type LeadStage = "nouveau" | "contacte" | "essai" | "offre" | "gagne" | "perdu";

export const LEAD_STAGES: Record<LeadStage, string> = {
  nouveau: "Nouveau",
  contacte: "Contacté",
  essai: "Essai planifié",
  offre: "Offre envoyée",
  gagne: "Gagné",
  perdu: "Perdu",
};

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  interest: "VN" | "VO" | "Reprise" | "Financement" | "LLD";
  vehicle: string;
  budget?: number;
  stage: LeadStage;
  score: number;
  createdAt: string;
  siteId: string;
  assignee: string;
  note: string;
  source: "appel entrant" | "campagne" | "site web" | "SMS";
}

export interface Campaign {
  id: string;
  name: string;
  type: "rappel_entretien" | "relance_devis" | "satisfaction" | "no_show" | "relance_lead" | "rappel_ct";
  status: "active" | "planifiee" | "terminee" | "brouillon";
  audience: number;
  called: number;
  reached: number;
  converted: number;
  startedAt: string;
  channel: ("voix" | "sms" | "whatsapp" | "email")[];
}

export interface Integration {
  id: string;
  name: string;
  category: "DMS" | "CRM" | "Agenda" | "Téléphonie" | "Messagerie" | "Automatisation" | "Avis clients";
  status: "connecte" | "disponible" | "bientot";
  description: string;
  /** Short brand-neutral monogram used as logo placeholder. */
  mono: string;
  hue: number;
}

export interface DailyStat {
  date: string;
  calls: number;
  handledByAi: number;
  transferred: number;
  afterHours: number;
  appointments: number;
  leads: number;
  missedBefore: number;
}
