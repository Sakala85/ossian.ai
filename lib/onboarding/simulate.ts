import type { DealershipProfile } from "@/lib/domain/types";

const BRANDS = ["Peugeot", "Citroën", "Renault", "Dacia", "Toyota", "Volkswagen", "Audi", "BMW", "Mercedes", "Ford", "Opel", "Fiat", "Kia", "Hyundai", "Nissan", "Skoda", "Seat", "Cupra", "Tesla", "Volvo", "Mazda", "Suzuki", "Jeep", "DS", "Mini", "Lexus", "MG", "BYD"];

export function normalizeUrl(input: string) {
  const s = input.trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

const PARTICLES = new Set(["de", "du", "des", "la", "le", "les", "et", "d", "l", "en", "sur"]);

function titleCase(s: string) {
  return s
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((w, i) =>
      i > 0 && PARTICLES.has(w.toLowerCase()) ? w.toLowerCase() : w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/**
 * Fallback when the site could not be analysed (no API key, site unreachable):
 * only what we know for sure — the name and the website. Hours, phones,
 * services and FAQ stay empty for the dealership to fill in: nothing is
 * invented for a real account.
 */
export function starterProfile(url: URL, nameHint?: string): DealershipProfile {
  const host = url.hostname.replace(/^www\./, "");
  const base = host.split(".")[0] ?? host;
  const name = nameHint?.trim() || titleCase(base);
  const brands = BRANDS.filter((b) => base.toLowerCase().includes(b.toLowerCase().replace("ë", "e")));
  return {
    id: `p_${base}`,
    name,
    website: url.origin,
    description: "",
    brands,
    sites: [{ id: "site-1", name, address: "", city: "", phone: "", brands }],
    hours: [],
    services: [],
    departments: STARTER_DEPARTMENTS.map((d) => ({ ...d })),
    policies: [STARTER_POLICY],
    faq: [],
    agent: {
      name: "Léa",
      voiceId: "lea-fr",
      languages: ["fr", "en", "es", "it", "de", "pt", "ar"],
      tone: "chaleureux",
      greeting: `${name} bonjour, je suis Léa, l'assistante de la concession. Comment puis-je vous aider ?`,
      transferPolicy: "business_hours",
      smsConfirmation: false,
      recordCalls: true,
    },
  };
}

/** Service skeleton to fill in (labels only, no invented numbers). */
export const STARTER_DEPARTMENTS: DealershipProfile["departments"] = [
  { key: "apres_vente", label: "Atelier / après-vente", phone: "", hours: "" },
  { key: "vn", label: "Ventes", phone: "", hours: "" },
  { key: "accueil", label: "Accueil", phone: "", hours: "" },
];

/** Safe default rule, true for every dealership. */
export const STARTER_POLICY = "Les prix annoncés au téléphone sont indicatifs ; le devis définitif est établi par un conseiller.";
