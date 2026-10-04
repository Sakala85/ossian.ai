import Anthropic from "@anthropic-ai/sdk";

/** Why the automatic analysis could not run (shown to the user, detailed in the logs). */
export type AnalysisFailure = "no_key" | "auth" | "credit" | "model" | "busy" | "timeout" | "request" | "site";

export const FAILURE_LABELS: Record<AnalysisFailure, string> = {
  no_key: "clé API Anthropic absente sur le serveur",
  auth: "clé API Anthropic refusée (invalide ou révoquée)",
  credit: "crédit Anthropic insuffisant",
  model: "modèle d'analyse introuvable (variable OSSIAN_ONBOARDING_MODEL)",
  busy: "service d'analyse momentanément saturé, réessayez dans une minute",
  timeout: "analyse trop longue, réessayez",
  request: "requête refusée par l'API Anthropic",
  site: "site inaccessible ou protégé contre la lecture automatique",
};

export function classifyAnalysisError(err: unknown): { reason: AnalysisFailure; detail?: string } {
  const detail = err instanceof Error ? err.message.slice(0, 240) : undefined;
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return { reason: "auth", detail };
  if (err instanceof Anthropic.NotFoundError) return { reason: "model", detail };
  if (err instanceof Anthropic.RateLimitError) return { reason: "busy", detail };
  if (err instanceof Anthropic.APIConnectionTimeoutError) return { reason: "timeout", detail };
  if (err instanceof Anthropic.APIUserAbortError || (err instanceof Error && err.name === "TimeoutError")) return { reason: "timeout", detail };
  if (err instanceof Anthropic.BadRequestError) {
    if (/credit balance|billing|purchase credits/i.test(err.message)) return { reason: "credit", detail };
    if (/model/i.test(err.message) && /not.*(found|exist|available)|invalid/i.test(err.message)) return { reason: "model", detail };
    return { reason: "request", detail };
  }
  if (err instanceof Anthropic.APIError && (err.status === 529 || (err.status ?? 0) >= 500)) return { reason: "busy", detail };
  return { reason: "site", detail };
}
