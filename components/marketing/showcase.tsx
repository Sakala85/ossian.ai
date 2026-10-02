import { CallShowcase } from "./call-showcase";
import { Accent, Section, SectionHeader } from "./section";

export function Showcase() {
  return (
    <Section id="cas-usage">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 -z-10 h-[520px] w-[min(900px,120vw)] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px]"
      />
      <SectionHeader
        index="04"
        eyebrow="En situation"
        title={
          <>
            Un vrai appel. <Accent>Un vrai résultat.</Accent>
          </>
        }
        description="Chaque conversation se termine par une action concrète dans vos outils et une synthèse claire pour la bonne personne. Choisissez un scénario."
      />
      <CallShowcase />
    </Section>
  );
}
