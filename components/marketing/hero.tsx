import Link from "next/link";
import { ArrowRight, AudioLines, Clock, Database, Languages, Zap } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { HeroCallStage } from "./hero-call-stage";
import { Accent } from "./section";

const TRUST = [
  { icon: Clock, strong: "24h/24", rest: "7j/7" },
  { icon: Languages, strong: "30 langues", rest: "détectées seules" },
  { icon: Zap, strong: "Décroche en < 1 s", rest: "" },
  { icon: Database, strong: "Connecté", rest: "à votre DMS" },
];

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-32 md:pt-40 md:pb-28">
      {/* Backdrop: grid fading out from the top + violet glow behind the orb */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,#000_25%,transparent_75%)]" />
        <div className="absolute top-[-12%] left-1/2 h-[420px] w-[min(980px,140vw)] -translate-x-1/2 rounded-[100%] bg-primary/12 blur-[110px]" />
        <div className="absolute top-[52%] left-1/2 h-[520px] w-[min(760px,120vw)] -translate-x-1/2 rounded-full bg-primary/14 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Link
            href="/onboarding"
            className="group inline-flex animate-fade-up items-center gap-2 rounded-full border border-border bg-card/60 py-1 pr-3 pl-1 text-[12.5px] text-muted-foreground backdrop-blur transition-colors hover:border-border-strong hover:text-foreground"
          >
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11.5px] font-medium text-primary">Nouveau</span>
            <span>
              Onboarding automatique en <span className="text-foreground">15 min</span>
            </span>
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-7 animate-fade-up font-display text-[44px] font-medium text-balance [animation-delay:80ms] sm:text-6xl md:text-7xl lg:text-[84px]">
            <span className="text-gradient">Plus aucun appel manqué dans vos</span> <Accent>concessions.</Accent>
          </h1>

          <p className="mt-6 max-w-2xl animate-fade-up text-[15.5px] leading-relaxed text-pretty text-muted-foreground [animation-delay:160ms] sm:text-lg">
            Ossian est l&apos;agent vocal IA qui décroche 100&nbsp;% des appels de vos concessions et ateliers, 24h/24 et en
            30&nbsp;langues. Il prend les rendez-vous dans votre DMS, qualifie vos leads et transfère au bon service,
            avec le contexte.
          </p>

          <div className="mt-9 flex w-full animate-fade-up flex-col items-stretch justify-center gap-3 [animation-delay:240ms] sm:w-auto sm:flex-row sm:items-center">
            <LinkButton
              href="/demo"
              size="lg"
              className="group shadow-[inset_0_1px_0_0_oklch(1_0_0/25%),0_0_0_1px_color-mix(in_oklch,var(--primary)_60%,transparent),0_10px_40px_-8px_color-mix(in_oklch,var(--primary)_70%,transparent)]"
            >
              <AudioLines />
              Parler à Léa, l&apos;agent démo
            </LinkButton>
            <LinkButton href="/onboarding" size="lg" variant="outline" className="group bg-card/60 backdrop-blur">
              Créer mon agent
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-0.5" />
            </LinkButton>
          </div>
          <p className="mt-4 animate-fade-up text-xs text-muted-foreground [animation-delay:300ms]">
            Sans engagement · 14 jours d&apos;essai · Mise en service offerte
          </p>
        </div>

        <div className="animate-fade-in [animation-delay:350ms]">
          <HeroCallStage />
        </div>

        <ul className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-y-5 md:mt-14 md:grid-cols-4">
          {TRUST.map(({ icon: Icon, strong, rest }, i) => (
            <li
              key={strong}
              className={
                "flex items-center justify-center gap-2.5 px-3 text-[13.5px] text-muted-foreground md:border-l md:border-border md:first:border-l-0 " +
                (i % 2 === 1 ? "border-l border-border" : "")
              }
            >
              <Icon className="size-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="font-medium text-foreground">{strong}</span>
                {rest && <span className="hidden sm:inline"> {rest}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
