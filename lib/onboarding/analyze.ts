import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { DEMO_PROFILE } from "@/lib/demo/profile";
import type { DealershipProfile, DepartmentKey } from "@/lib/domain/types";
import { cleanModel } from "@/lib/agent/runtime";
import { STARTER_DEPARTMENTS, STARTER_POLICY } from "./simulate";
import type { AnalyzeEvent, AnalyzeStepId } from "./types";

export const ONBOARDING_MODEL = cleanModel(process.env.OSSIAN_ONBOARDING_MODEL);
const MODEL = ONBOARDING_MODEL;
const DEPARTMENT_KEYS = ["apres_vente", "vn", "vo", "pieces", "carrosserie", "accueil", "comptabilite"] as const;

const ProfileInput = z.object({
  name: z.string().min(1),
  group: z.string().optional(),
  description: z.string().optional(),
  brands: z.array(z.string()).default([]),
  sites: z
    .array(z.object({ name: z.string(), address: z.string().default(""), city: z.string().default(""), phone: z.string().default(""), brands: z.array(z.string()).default([]) }))
    .default([]),
  hours: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  services: z
    .array(z.object({ name: z.string(), durationMin: z.number().default(60), priceFrom: z.number().optional(), description: z.string().optional() }))
    .default([]),
  departments: z
    .array(z.object({ key: z.enum(DEPARTMENT_KEYS), label: z.string(), phone: z.string().default(""), email: z.string().optional(), hours: z.string().default("") }))
    .default([]),
  policies: z.array(z.string()).default([]),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
});

const SUBMIT_TOOL: Anthropic.Beta.BetaTool = {
  name: "submit_profile",
  description: "Enregistre la fiche de la concession extraite du site. À appeler une seule fois, à la fin de l'analyse.",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nom commercial de la concession." },
      group: { type: "string", description: "Groupe de distribution, si mentionné." },
      description: { type: "string", description: "Présentation en 1 à 2 phrases." },
      brands: { type: "array", items: { type: "string" } },
      sites: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, address: { type: "string" }, city: { type: "string", description: "Code postal + ville" }, phone: { type: "string" }, brands: { type: "array", items: { type: "string" } } },
          required: ["name", "address", "city", "phone", "brands"],
        },
      },
      hours: {
        type: "array",
        description: "Horaires par service (Showroom, Atelier, Pièces, Carrosserie…), format lisible à l'oral.",
        items: { type: "object", properties: { label: { type: "string" }, value: { type: "string" } }, required: ["label", "value"] },
      },
      services: {
        type: "array",
        description: "Prestations atelier proposées avec durée estimée et prix d'appel si affiché.",
        items: {
          type: "object",
          properties: { name: { type: "string" }, durationMin: { type: "number" }, priceFrom: { type: "number" }, description: { type: "string" } },
          required: ["name", "durationMin"],
        },
      },
      departments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            key: { type: "string", enum: [...DEPARTMENT_KEYS] },
            label: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            hours: { type: "string" },
          },
          required: ["key", "label", "phone", "hours"],
        },
      },
      policies: { type: "array", items: { type: "string" }, description: "Engagements et conditions utiles au téléphone (courtoisie, paiement, garanties…)." },
      faq: { type: "array", items: { type: "object", properties: { q: { type: "string" }, a: { type: "string" } }, required: ["q", "a"] } },
    },
    required: ["name", "brands", "sites", "hours", "services", "departments", "policies", "faq"],
  },
};

const SYSTEM = `Tu configures l'agent vocal d'une concession ou d'un garage automobile français à partir de son site web.
Méthode :
1. Lis la page fournie avec web_fetch, puis 2 à 5 pages internes utiles (contact, horaires, atelier/entretien, occasions, sites/concessions, mentions légales). Utilise web_search seulement si une information clé manque (adresse, horaires).
2. Extrais : nom commercial, groupe, marques distribuées, sites (adresse, ville, téléphone), horaires par service, prestations atelier (avec prix « à partir de » s'ils sont affichés), services joignables (atelier, VN, VO, pièces, carrosserie, comptabilité) avec téléphones/e-mails, politiques utiles (véhicule de courtoisie, moyens de paiement, garanties), et 3 à 6 questions fréquentes.
3. N'invente rien : laisse une chaîne vide si un téléphone, une adresse ou un horaire est introuvable, et ne liste que les prestations mentionnées sur le site. Seule la durée d'une prestation peut être estimée quand elle n'est pas affichée (révision 120 min, vidange 60 min, diagnostic 45 min, freinage 90 min, pneumatiques 45 min, climatisation 60 min). N'indique un prix que s'il est affiché.
4. Termine en appelant submit_profile une seule fois. Rédige en français.`;

export async function analyzeWithClaude(url: URL, nameHint: string | undefined, emit: (e: AnalyzeEvent) => void, signal?: AbortSignal): Promise<DealershipProfile> {
  const client = new Anthropic();
  const stepOrder: AnalyzeStepId[] = ["fetch", "identity", "hours", "services", "routing"];
  let stepIdx = 0;
  const advance = (detail?: string) => {
    if (stepIdx < stepOrder.length) emit({ type: "step", id: stepOrder[stepIdx]!, status: "done", detail });
    stepIdx++;
    if (stepIdx < stepOrder.length) emit({ type: "step", id: stepOrder[stepIdx]!, status: "running" });
  };
  emit({ type: "step", id: "fetch", status: "running" });

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `Site de la concession : ${url.href}${nameHint ? `\nNom indiqué par le client : ${nameHint}` : ""}` },
  ];
  let fetched = 0;

  for (let turn = 0; turn < 6; turn++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 32000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "medium" },
        system: SYSTEM,
        tools: [
          { type: "web_fetch_20260209", name: "web_fetch", max_uses: 6 },
          { type: "web_search_20260209", name: "web_search", max_uses: 2, user_location: { type: "approximate", country: "FR" } },
          SUBMIT_TOOL,
        ],
        messages,
      },
      { signal },
    );
    stream.on("streamEvent", (ev) => {
      if (ev.type === "content_block_start" && ev.content_block.type === "server_tool_use") {
        fetched++;
        if (fetched === 2 && stepIdx === 0) advance(`${url.hostname} lu`);
      }
    });
    const msg = await stream.finalMessage();
    if (msg.stop_reason === "refusal") throw new Error("Analyse refusée par le modèle");
    messages.push({ role: "assistant", content: msg.content });
    if (msg.stop_reason === "pause_turn") continue;

    const submit = msg.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "submit_profile");
    if (!submit) {
      messages.push({ role: "user", content: "Appelle maintenant submit_profile avec ce que tu as trouvé." });
      continue;
    }
    if (msg.stop_reason === "max_tokens") throw new Error("Analyse tronquée");
    const parsed = ProfileInput.safeParse(submit.input);
    if (!parsed.success) {
      messages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: submit.id, is_error: true, content: `Paramètres invalides : ${parsed.error.issues.map((i) => i.path.join(".")).join(", ")}. Corrige et rappelle submit_profile.` }],
      });
      continue;
    }
    while (stepIdx < stepOrder.length) advance();
    return toProfile(parsed.data, url, nameHint, emit);
  }
  throw new Error("L'analyse n'a pas abouti");
}

function toProfile(d: z.infer<typeof ProfileInput>, url: URL, nameHint: string | undefined, emit: (e: AnalyzeEvent) => void): DealershipProfile {
  const name = nameHint?.trim() || d.name;
  emit({ type: "step", id: "identity", status: "done", detail: `${d.brands.length} marque(s) · ${d.sites.length} site(s)` });
  // Only what was found on the site: missing hours, services or services' numbers stay empty to fill in.
  const departments = d.departments.length ? d.departments : STARTER_DEPARTMENTS.map((x) => ({ ...x, phone: d.sites[0]?.phone ?? "" }));
  return {
    id: `p_${url.hostname.replace(/^www\./, "").split(".")[0]}`,
    name,
    group: d.group,
    website: url.origin,
    description: d.description,
    brands: d.brands,
    sites: (d.sites.length ? d.sites : [{ name, address: "", city: "", phone: "", brands: d.brands }]).map((s, i) => ({ id: `site-${i + 1}`, ...s })),
    hours: d.hours,
    services: d.services,
    departments: departments.map((x) => ({ ...x, key: x.key as DepartmentKey })),
    policies: d.policies.length ? d.policies : [STARTER_POLICY],
    faq: d.faq,
    agent: {
      ...DEMO_PROFILE.agent,
      smsConfirmation: false,
      greeting: `${name} bonjour, je suis ${DEMO_PROFILE.agent.name}, l'assistante de la concession. Comment puis-je vous aider ?`,
    },
  };
}
