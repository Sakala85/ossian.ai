import { RoiCalculator } from "./roi-calculator";
import { Accent, Section, SectionHeader } from "./section";

export function Roi() {
  return (
    <Section id="roi">
      <SectionHeader
        index="06"
        eyebrow="Calculateur de ROI"
        title={
          <>
            Combien vous coûtent <Accent>vos appels manqués ?</Accent>
          </>
        }
        description="Ajustez les curseurs avec vos propres chiffres. Le calcul reste volontairement prudent : seuls les RDV atelier sont comptés, pas les ventes VN/VO."
      />
      <RoiCalculator />
    </Section>
  );
}
