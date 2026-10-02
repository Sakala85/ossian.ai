import { ArrowUpRight, Ban, Bot, FileCheck, Lock, MicOff, Server, type LucideIcon } from "lucide-react";
import { Stagger, StaggerItem } from "./reveal";
import { Accent, Section, SectionHeader } from "./section";

const ITEMS: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Server,
    title: "Hébergement dans l'UE",
    body: "Données, transcriptions et enregistrements hébergés dans l'Union européenne.",
  },
  {
    icon: Lock,
    title: "Chiffrement",
    body: "Chiffrement en transit (TLS) et au repos, accès restreints et journalisés.",
  },
  {
    icon: FileCheck,
    title: "RGPD, by design",
    body: "DPA signé, durée de conservation configurable, droits d'accès et de suppression traités en quelques clics.",
  },
  {
    icon: Bot,
    title: "Transparence IA",
    body: "L'agent se présente comme l'assistante virtuelle de la concession, conformément à l'AI Act. Un humain reste joignable.",
  },
  {
    icon: MicOff,
    title: "Enregistrement désactivable",
    body: "Activez ou non l'enregistrement audio, site par site, avec message d'information automatique.",
  },
  {
    icon: Ban,
    title: "Zéro entraînement sur vos données",
    body: "Vos conversations et données clients ne servent jamais à entraîner des modèles d'IA.",
  },
];

export function Security() {
  return (
    <Section id="securite">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader
            align="left"
            index="08"
            eyebrow="Sécurité & conformité"
            title={
              <>
                Vos données restent <Accent>les vôtres.</Accent>
              </>
            }
            description="Ossian traite des données clients sensibles : coordonnées, véhicules, factures. Il est conçu dès le départ pour répondre aux exigences de votre DPO."
          >
            <div className="flex flex-wrap gap-2 pt-1">
              {["RGPD", "AI Act", "Hébergement UE"].map((b) => (
                <span
                  key={b}
                  className="inline-flex h-7 items-center rounded-full border border-border-strong bg-card/50 px-3 font-mono text-[11.5px] text-foreground"
                >
                  {b}
                </span>
              ))}
            </div>
            <a
              href="mailto:contact@ossian.ai?subject=Demande%20de%20DPA"
              className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-primary"
            >
              Demander notre DPA
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </SectionHeader>
        </div>

        <Stagger className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
          {ITEMS.map((it) => (
            <StaggerItem key={it.title} className="group bg-background p-6 transition-colors hover:bg-subtle sm:p-7">
              <span className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-primary transition-colors group-hover:border-primary/40">
                <it.icon className="size-[18px]" aria-hidden />
              </span>
              <h3 className="mt-5 text-[16px] font-medium tracking-tight">{it.title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{it.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </Section>
  );
}
