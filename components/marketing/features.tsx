import {
  Building,
  CalendarCheck,
  Languages,
  LayoutDashboard,
  PhoneForwarded,
  PhoneOutgoing,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CalendarMock,
  DashboardMock,
  LanguagesMock,
  LeadMock,
  MultiSiteMock,
  OutboundMock,
  TransferMock,
} from "./feature-mocks";
import { Stagger, StaggerItem } from "./reveal";
import { Accent, Section, SectionHeader } from "./section";
import { SpotlightCard } from "./spotlight-card";

type Feature = {
  icon: LucideIcon;
  title: string;
  body: string;
  className: string;
  mock: React.ReactNode;
};

const FEATURES: Feature[] = [
  {
    icon: CalendarCheck,
    title: "Prise de RDV atelier, directement dans votre DMS",
    body: "Ossian lit les vraies disponibilités de l'atelier, propose des créneaux, réserve le véhicule de courtoisie et confirme par SMS. Zéro double saisie.",
    className: "md:col-span-2 lg:col-span-4",
    mock: <CalendarMock />,
  },
  {
    icon: Target,
    title: "Qualification des leads VN/VO & essais",
    body: "Modèle, budget, reprise, financement, délai : chaque prospect est qualifié, scoré et assigné au bon commercial, essai déjà planifié.",
    className: "lg:col-span-2",
    mock: <LeadMock />,
  },
  {
    icon: PhoneForwarded,
    title: "Transfert intelligent, avec le contexte",
    body: "Quand un humain est nécessaire, l'appel part vers la bonne personne avec une fiche résumé. Plus jamais « c'est à quel sujet ? ».",
    className: "lg:col-span-2",
    mock: <TransferMock />,
  },
  {
    icon: Languages,
    title: "30 langues, détectées automatiquement",
    body: "Clients étrangers, touristes, frontaliers : Ossian répond dans la langue de l'appelant et vous transmet la synthèse en français.",
    className: "lg:col-span-2",
    mock: <LanguagesMock />,
  },
  {
    icon: Building,
    title: "Multi-sites & groupes",
    body: "Un agent par site ou un standard central qui oriente vers la bonne concession. Horaires, marques et règles propres à chaque site.",
    className: "lg:col-span-2",
    mock: <MultiSiteMock />,
  },
  {
    icon: PhoneOutgoing,
    title: "Appels sortants qui remplissent l'atelier",
    body: "Rappels d'entretien, relances de devis, enquêtes de satisfaction, no-show : Ossian rappelle vos clients au bon moment, à grande échelle.",
    className: "lg:col-span-3",
    mock: <OutboundMock />,
  },
  {
    icon: LayoutDashboard,
    title: "Tableau de bord & transcriptions",
    body: "Chaque appel est transcrit, résumé et classé. Suivez volumes, motifs, taux de décroché et RDV générés, site par site.",
    className: "lg:col-span-3",
    mock: <DashboardMock />,
  },
];

export function Features() {
  return (
    <Section id="fonctionnalites">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-40 -z-10 h-[600px] bg-dots opacity-40 mask-radial" />
      <SectionHeader
        index="03"
        eyebrow="Fonctionnalités"
        title={
          <>
            Pas un répondeur. <Accent>Un collaborateur.</Accent>
          </>
        }
        description="Ossian ne se contente pas de prendre des messages : il agit dans vos outils, comme un membre de l'équipe formé à votre concession, à vos marques et à vos process."
      />

      <Stagger className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-6" stagger={0.07}>
        {FEATURES.map((f) => (
          <StaggerItem key={f.title} className={cn("min-w-0", f.className)}>
            <SpotlightCard className="flex h-full flex-col">
              <div className="relative h-[262px] p-4 sm:p-5">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-dots opacity-60 [mask-image:radial-gradient(ellipse_at_center,#000_20%,transparent_75%)]"
                />
                <div className="relative h-full">{f.mock}</div>
              </div>
              <div className="flex flex-1 flex-col px-6 pt-2 pb-6">
                <span className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted/60 text-primary">
                  <f.icon className="size-4" aria-hidden />
                </span>
                <h3 className="mt-4 text-[17px] font-medium tracking-tight text-balance">{f.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            </SpotlightCard>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
