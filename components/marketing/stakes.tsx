import { Phone, PhoneMissed } from "lucide-react";
import { AnimatedNumber } from "./animated-number";
import { GrowBar } from "./stakes-visuals";
import { Stagger, StaggerItem } from "./reveal";
import { Accent, Section, SectionHeader } from "./section";

const MISSED = new Set([2, 5, 7, 9]);
const MONTHS = [62, 70, 58, 74, 80, 66, 48, 40, 72, 78, 69, 76];

export function Stakes() {
  return (
    <Section id="enjeu">
      <SectionHeader
        index="01"
        eyebrow="L'enjeu"
        title={
          <>
            Le téléphone sonne. <Accent>Personne ne décroche.</Accent>
          </>
        }
        description="Réception atelier saturée à 8h, commerciaux en rendez-vous, pause déjeuner, soirs et week-ends : chaque appel sans réponse est un client qui rappelle… la concession d'en face."
      />

      <Stagger className="mt-16 grid overflow-hidden rounded-2xl border border-border bg-card/40 md:grid-cols-3">
        <StaggerItem className="flex flex-col gap-6 p-7 sm:p-9">
          <p className="font-display text-6xl font-medium sm:text-7xl">
            <AnimatedNumber value={30} />
            <span className="text-muted-foreground">–</span>
            <AnimatedNumber value={40} />
            <span className="ml-1 text-[0.55em] text-muted-foreground">%</span>
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            <span className="text-foreground">des appels entrants en concession</span> restent sans réponse.
          </p>
          <div className="mt-auto grid grid-cols-10 gap-1.5" aria-hidden>
            {Array.from({ length: 10 }, (_, i) =>
              MISSED.has(i) ? (
                <span
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-md border border-dashed border-danger/50 text-danger [&_svg]:size-3"
                >
                  <PhoneMissed />
                </span>
              ) : (
                <span
                  key={i}
                  className="flex aspect-square items-center justify-center rounded-md bg-muted text-muted-foreground [&_svg]:size-3"
                >
                  <Phone />
                </span>
              ),
            )}
          </div>
        </StaggerItem>

        <StaggerItem className="flex flex-col gap-6 border-t border-border p-7 sm:p-9 md:border-t-0 md:border-l">
          <p className="font-display text-6xl font-medium sm:text-7xl">
            <AnimatedNumber value={80} />
            <span className="ml-1 text-[0.55em] text-muted-foreground">%</span>
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            <span className="text-foreground">des rendez-vous atelier</span> sont encore pris par téléphone.
          </p>
          <div className="mt-auto" aria-hidden>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <GrowBar percent={80} />
            </div>
            <div className="mt-2.5 flex justify-between font-mono text-[11px] text-muted-foreground">
              <span>Téléphone</span>
              <span>Web, e-mail, comptoir</span>
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className="flex flex-col gap-6 border-t border-border p-7 sm:p-9 md:border-t-0 md:border-l">
          <p className="font-display text-6xl font-medium sm:text-7xl">
            <span className="mr-2 align-middle font-sans text-base font-normal tracking-normal text-muted-foreground">
              jusqu&apos;à
            </span>
            <AnimatedNumber value={10} />
            <span className="ml-1 text-[0.55em] text-muted-foreground">%</span>
          </p>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            <span className="text-foreground">du chiffre d&apos;affaires atelier</span> perdu à cause des appels manqués.
          </p>
          <div className="mt-auto flex h-[52px] items-end gap-1.5" aria-hidden>
            {MONTHS.map((h, i) => (
              <span key={i} className="flex flex-1 flex-col justify-end" style={{ height: `${h}%` }}>
                <span className="h-[18%] rounded-t-[3px] border border-b-0 border-dashed border-danger/50" />
                <span className="flex-1 rounded-b-[3px] bg-muted-foreground/35" />
              </span>
            ))}
          </div>
        </StaggerItem>
      </Stagger>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Selon les études du secteur. Ordres de grandeur observés en concession ; vos chiffres réels apparaissent dans
        votre tableau de bord dès la première semaine.
      </p>
    </Section>
  );
}
