import { DEMO_PROFILE } from "@/lib/demo/profile";
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

function titleCase(s: string) {
  return s
    .split(/[-_.\s]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Offline fallback when no API key is configured (or the site can't be read):
 * builds a plausible starter profile from the domain name so the rest of the
 * onboarding (and the demo) still works end-to-end.
 */
export function simulateProfile(url: URL, nameHint?: string): DealershipProfile {
  const host = url.hostname.replace(/^www\./, "");
  const base = host.split(".")[0] ?? host;
  const name = nameHint?.trim() || titleCase(base);
  const found = BRANDS.filter((b) => base.toLowerCase().includes(b.toLowerCase().replace("ë", "e")));
  const brands = found.length ? found : ["Toutes marques"];
  const p = structuredClone(DEMO_PROFILE);
  return {
    ...p,
    id: `p_${base}`,
    name,
    group: undefined,
    website: url.origin,
    description: `${name} — concession et atelier automobile${found.length ? ` ${found.join(", ")}` : " toutes marques"} : ventes de véhicules neufs et d'occasion, entretien, réparation et carrosserie.`,
    brands,
    sites: [
      { id: "site-1", name, address: "Adresse à confirmer", city: "", phone: "À compléter", brands },
    ],
    departments: p.departments.map((d) => ({ ...d, phone: "À compléter", email: `${d.key.replace("_", "-")}@${host}` })),
    faq: p.faq.slice(0, 3),
    agent: {
      ...p.agent,
      greeting: `${name} bonjour, je suis ${p.agent.name}, l'assistante de la concession. Comment puis-je vous aider ?`,
    },
  };
}
