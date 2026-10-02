import { CalendarDays, Database, Info, MessageSquare, PhoneCall, Users, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./reveal";
import { Accent, Monogram, Section, SectionHeader } from "./section";

type Category = { name: string; icon: LucideIcon; blurb: string; items: { name: string; mono: string }[] };

const CATEGORIES: Category[] = [
  {
    name: "DMS",
    icon: Database,
    blurb: "Disponibilités atelier, RDV, ordres de réparation",
    items: [
      { name: "Nextlane", mono: "NX" },
      { name: "Keyloop", mono: "KL" },
      { name: "Kerridge", mono: "KR" },
      { name: "CDK Global", mono: "CDK" },
      { name: "incadea", mono: "IN" },
    ],
  },
  {
    name: "CRM",
    icon: Users,
    blurb: "Leads VN/VO, historique client",
    items: [
      { name: "Salesforce", mono: "SF" },
      { name: "HubSpot", mono: "HS" },
    ],
  },
  {
    name: "Agenda",
    icon: CalendarDays,
    blurb: "Essais, expertises, rappels",
    items: [
      { name: "Google Agenda", mono: "GA" },
      { name: "Outlook", mono: "OL" },
    ],
  },
  {
    name: "Téléphonie",
    icon: PhoneCall,
    blurb: "Renvoi, transfert, numéros dédiés",
    items: [
      { name: "Twilio", mono: "TW" },
      { name: "SIP / IPBX", mono: "SIP" },
      { name: "3CX", mono: "3CX" },
      { name: "Ringover", mono: "RO" },
      { name: "Aircall", mono: "AC" },
    ],
  },
  {
    name: "Messagerie",
    icon: MessageSquare,
    blurb: "Confirmations et alertes équipe",
    items: [
      { name: "WhatsApp", mono: "WA" },
      { name: "SMS", mono: "SMS" },
      { name: "E-mail", mono: "@" },
      { name: "Slack / Teams", mono: "ST" },
    ],
  },
];

const ALL = CATEGORIES.flatMap((c) => c.items.map((i) => ({ ...i, category: c.name })));

export function Integrations() {
  return (
    <Section id="integrations">
      <SectionHeader
        index="05"
        eyebrow="Intégrations"
        title={
          <>
            S&apos;intègre à <Accent>vos outils.</Accent>
          </>
        }
        description="Ossian lit et écrit directement dans votre DMS, votre CRM et vos agendas. Vos équipes retrouvent chaque RDV et chaque lead là où elles travaillent déjà."
      />

      {/* Marquee band */}
      <div className="relative mt-14 overflow-hidden mask-fade-x" aria-hidden>
        <div className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
          {[...ALL, ...ALL].map((it, i) => (
            <div
              key={`${it.name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card/50 py-2.5 pr-5 pl-2.5"
            >
              <Monogram>{it.mono}</Monogram>
              <div className="leading-tight">
                <p className="text-[13.5px] font-medium whitespace-nowrap">{it.name}</p>
                <p className="text-[11px] text-muted-foreground">{it.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category grid */}
      <Stagger className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
        {CATEGORIES.map((c) => (
          <StaggerItem key={c.name} className="flex flex-col bg-background p-5 transition-colors hover:bg-subtle sm:last:col-span-2 lg:last:col-span-1">
            <div className="flex items-center gap-2">
              <c.icon className="size-4 text-primary" aria-hidden />
              <h3 className="text-[15px] font-medium">{c.name}</h3>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">{c.items.length}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-snug text-muted-foreground">{c.blurb}</p>
            <ul className="mt-4 grid gap-2">
              {c.items.map((it) => (
                <li key={it.name} className="flex items-center gap-2.5 text-[13.5px]">
                  <Monogram className="size-7 rounded-lg text-[9.5px]">{it.mono}</Monogram>
                  {it.name}
                </li>
              ))}
            </ul>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="mt-6 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-center text-[13px] text-muted-foreground sm:flex-row">
        <p className="inline-flex items-center gap-2">
          <Info className="size-3.5 shrink-0" aria-hidden />
          Connecteurs DMS déployés selon votre éditeur — liste à jour sur demande.
        </p>
        <p>API REST et webhooks disponibles avec la formule Groupe.</p>
      </div>
    </Section>
  );
}
