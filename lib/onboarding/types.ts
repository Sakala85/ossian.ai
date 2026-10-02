import type { DealershipProfile } from "@/lib/domain/types";

/**
 * POST /api/onboarding/analyze  { url: string }
 * Response: NDJSON stream (one JSON object per line) of AnalyzeEvent.
 */
export type AnalyzeEvent =
  | { type: "step"; id: AnalyzeStepId; status: "running" | "done"; detail?: string }
  | { type: "profile"; profile: DealershipProfile; mode: "ai" | "simulated" }
  | { type: "error"; message: string };

export type AnalyzeStepId = "fetch" | "identity" | "hours" | "services" | "routing" | "agent";

export const ANALYZE_STEPS: { id: AnalyzeStepId; label: string }[] = [
  { id: "fetch", label: "Lecture du site web et des pages publiques" },
  { id: "identity", label: "Identité, marques et sites" },
  { id: "hours", label: "Horaires par service" },
  { id: "services", label: "Prestations atelier et tarifs indicatifs" },
  { id: "routing", label: "Services, numéros et règles de transfert" },
  { id: "agent", label: "Génération de l'agent et du message d'accueil" },
];
