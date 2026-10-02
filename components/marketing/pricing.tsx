import { PricingPlans } from "./pricing-plans";
import { Accent, Section, SectionHeader } from "./section";

const PERKS = ["Minute supplémentaire 0,25 € HT", "Sans engagement", "14 jours d'essai", "Mise en service offerte"];

export function Pricing() {
  return (
    <Section id="tarifs">
      <SectionHeader
        index="07"
        eyebrow="Tarifs"
        title={
          <>
            Un prix simple, <Accent>par site.</Accent>
          </>
        }
        description="Pas de frais d'installation, pas de matériel, pas de surprise. Vous payez par site, les minutes au-delà du forfait sont facturées à l'usage."
      />
      <PricingPlans />
      <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-muted-foreground">
        {PERKS.map((p) => (
          <li key={p} className="inline-flex items-center gap-2">
            <span aria-hidden className="size-1 rounded-full bg-primary" />
            {p}
          </li>
        ))}
      </ul>
    </Section>
  );
}
