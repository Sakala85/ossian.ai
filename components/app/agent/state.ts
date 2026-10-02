import type { DealershipProfile, DepartmentContact, LanguageCode, ServiceItem } from "@/lib/domain/types";

export type RuleKey = "noFirmPrice" | "alwaysCallback" | "complaintAlert" | "recordCalls" | "aiDisclosure" | "smsConfirmation" | "noRemoteDiagnosis";

export type AgentState = {
  name: string;
  voiceId: string;
  tone: DealershipProfile["agent"]["tone"];
  greeting: string;
  languages: LanguageCode[];
  website: string;
  hours: { label: string; value: string }[];
  services: ServiceItem[];
  policies: string[];
  faq: { q: string; a: string }[];
  departments: (DepartmentContact & { enabled: boolean })[];
  transferPolicy: DealershipProfile["agent"]["transferPolicy"];
  warmTransfer: boolean;
  noAnswer: "callback" | "message" | "voicemail";
  ringTimeout: string;
  rules: Record<RuleKey, boolean>;
  complaintEmail: string;
  customInstructions: string;
  forwarding: "all" | "overflow" | "after_hours";
  rings: string;
  sms: boolean;
  smsSender: string;
  smsReminder: boolean;
  whatsapp: boolean;
  webchat: boolean;
};

export type SetAgent = <K extends keyof AgentState>(k: K, v: AgentState[K]) => void;

export function initialState(p: DealershipProfile): AgentState {
  return {
    name: p.agent.name,
    voiceId: p.agent.voiceId,
    tone: p.agent.tone,
    greeting: p.agent.greeting,
    languages: p.agent.languages,
    website: p.website ?? "",
    hours: p.hours,
    services: p.services,
    policies: p.policies,
    faq: p.faq,
    departments: p.departments.map((d) => ({ ...d, enabled: true })),
    transferPolicy: p.agent.transferPolicy,
    warmTransfer: true,
    noAnswer: "callback",
    ringTimeout: "20",
    rules: {
      noFirmPrice: true,
      alwaysCallback: true,
      complaintAlert: true,
      recordCalls: p.agent.recordCalls,
      aiDisclosure: true,
      smsConfirmation: p.agent.smsConfirmation,
      noRemoteDiagnosis: true,
    },
    complaintEmail: "claire.fontaine@mistral-automobiles.fr",
    customInstructions: p.agent.customInstructions ?? "",
    forwarding: "overflow",
    rings: "3",
    sms: true,
    smsSender: "MISTRALAUTO",
    smsReminder: true,
    whatsapp: false,
    webchat: true,
  };
}

export const VOICES = [
  { id: "lea-fr", name: "Léa", traits: "Chaleureuse · naturelle", accent: "Français", hue: 285, pitch: 1.12, rate: 1.0 },
  { id: "hugo-fr", name: "Hugo", traits: "Posé · rassurant", accent: "Français", hue: 220, pitch: 0.78, rate: 0.94 },
  { id: "camille-fr", name: "Camille", traits: "Dynamique · souriante", accent: "Français", hue: 330, pitch: 1.25, rate: 1.1 },
  { id: "sofia-multi", name: "Sofia", traits: "Multilingue · 30 langues", accent: "Accent neutre", hue: 175, pitch: 1.05, rate: 1.0 },
] as const;
