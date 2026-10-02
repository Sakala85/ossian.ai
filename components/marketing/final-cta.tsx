import { ArrowRight, AudioLines, PhoneIncoming } from "lucide-react";
import { LinkButton } from "@/components/ui/button";
import { LiveOrb } from "./live-orb";
import { Reveal } from "./reveal";
import { Accent } from "./section";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden border-t border-border py-28 md:py-40">
      {/* Orb glow backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_75%)]" />
        <div className="absolute top-1/2 left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.4] opacity-55 blur-[22px] md:scale-[1.9]">
          <LiveOrb state="speaking" size={320} />
        </div>
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <Reveal className="relative mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[12.5px] text-muted-foreground backdrop-blur">
          <span className="relative flex size-4 items-center justify-center text-success">
            <span className="absolute inset-0 animate-ping rounded-full bg-success/30" />
            <PhoneIncoming className="relative size-3" />
          </span>
          Appel entrant…
        </span>
        <h2 className="mt-7 font-display text-[44px] font-medium text-balance sm:text-6xl md:text-[80px]">
          Votre prochain client appelle <Accent>maintenant.</Accent>
        </h2>
        <p className="mt-6 max-w-xl text-[15.5px] leading-relaxed text-pretty text-muted-foreground sm:text-lg">
          Laissez Léa décrocher. Testez l&apos;agent de démonstration en 30 secondes, ou créez le vôtre en 15 minutes à
          partir de votre site.
        </p>
        <div className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <LinkButton href="/demo" size="lg" className="shadow-[0_10px_40px_-8px_color-mix(in_oklch,var(--primary)_70%,transparent)]">
            <AudioLines />
            Parler à Léa
          </LinkButton>
          <LinkButton href="/onboarding" size="lg" variant="inverted" className="group">
            Créer mon agent
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </LinkButton>
        </div>
        <p className="mt-5 text-xs text-muted-foreground">Sans engagement · 14 jours d&apos;essai · Mise en service offerte</p>
      </Reveal>
    </section>
  );
}
