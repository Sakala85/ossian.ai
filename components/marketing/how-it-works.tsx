import { Clock } from "lucide-react";
import { AgentConfigMock, ForwardingMock, StepsBeam, UrlScanMock } from "./how-it-works-mocks";
import { Stagger, StaggerItem } from "./reveal";
import { Accent, Section, SectionHeader } from "./section";

const STEPS = [
  {
    n: "01",
    time: "≈ 2 min",
    title: "Collez l'adresse de votre site",
    body: "Ossian lit vos horaires, vos marques, vos prestations et vos services, puis rédige la configuration complète de votre agent.",
    mock: <UrlScanMock />,
  },
  {
    n: "02",
    time: "≈ 10 min",
    title: "Validez votre agent",
    body: "Choisissez la voix et les langues, ajustez les règles de transfert, connectez votre DMS et votre agenda atelier.",
    mock: <AgentConfigMock />,
  },
  {
    n: "03",
    time: "≈ 3 min",
    title: "Renvoyez vos appels",
    body: "Renvoi sur non-réponse, en débordement ou 24h/24, ou numéro dédié. Vous gardez votre opérateur et vos numéros.",
    mock: <ForwardingMock />,
  },
];

export function HowItWorks() {
  return (
    <Section id="produit">
      <SectionHeader
        index="02"
        eyebrow="Mise en service"
        title={
          <>
            En ligne en <Accent>15 minutes.</Accent> Sans projet IT.
          </>
        }
        description="Pas d'intégrateur, pas de cahier des charges, pas de nouveau standard. Ossian apprend votre concession à partir de votre site, vous validez, vous renvoyez vos appels."
      />

      <div className="relative mt-16 md:mt-20">
        <StepsBeam />
        <div aria-hidden className="absolute top-0 bottom-0 left-5 w-px bg-gradient-to-b from-border-strong via-border-strong to-transparent md:hidden" />

        <Stagger className="grid gap-12 md:grid-cols-3 md:gap-6 lg:gap-8" stagger={0.14}>
          {STEPS.map((s) => (
            <StaggerItem key={s.n} className="relative pl-14 md:pl-0">
              <div className="absolute top-0 left-0 flex items-center gap-3 md:static">
                <span className="relative z-10 flex size-10 items-center justify-center rounded-full border border-border-strong bg-background font-mono text-xs text-foreground shadow-[0_0_0_6px_var(--background)]">
                  {s.n}
                </span>
                <span className="hidden items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground md:inline-flex">
                  <Clock className="size-3" />
                  {s.time}
                </span>
              </div>

              <div className="md:mt-7">
                <h3 className="flex items-center gap-2 text-lg font-medium tracking-tight">
                  {s.title}
                  <span className="font-mono text-[11px] font-normal text-muted-foreground md:hidden">{s.time}</span>
                </h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>

              <div className="ring-gradient mt-6 h-[240px] rounded-xl bg-card/60 p-3.5 shadow-float">{s.mock}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
