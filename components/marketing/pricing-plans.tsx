"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE } from "./reveal";

type Billing = "monthly" | "annual";

type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: number | null;
  minutes?: string;
  intro?: string;
  features: string[];
  cta: { label: string; href: string };
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "essentiel",
    name: "Essentiel",
    tagline: "Pour décrocher 100 % des appels d'un site.",
    price: 290,
    minutes: "500 min incluses / mois",
    features: [
      "Réponse 24h/24, 7j/7",
      "Prise de rendez-vous (agenda Google ou Outlook)",
      "Transfert intelligent avec fiche contexte",
      "Rappels programmés et messages",
      "Tableau de bord & transcriptions",
    ],
    cta: { label: "Démarrer l'essai", href: "/onboarding?plan=essentiel" },
  },
  {
    id: "performance",
    name: "Performance",
    tagline: "Pour faire de chaque appel du chiffre d'affaires.",
    price: 490,
    minutes: "1 200 min incluses / mois",
    intro: "Tout Essentiel, plus :",
    features: [
      "Intégration DMS & CRM",
      "Qualification des leads VN/VO et essais",
      "Campagnes d'appels sortants",
      "Multilingue : 30 langues",
      "Confirmations SMS & WhatsApp",
    ],
    cta: { label: "Démarrer l'essai", href: "/onboarding?plan=performance" },
    featured: true,
  },
  {
    id: "groupe",
    name: "Groupe",
    tagline: "Pour les groupes multi-sites et multimarques.",
    price: null,
    minutes: "Volume de minutes négocié",
    intro: "Tout Performance, plus :",
    features: [
      "Multi-sites & vue consolidée groupe",
      "SSO & gestion fine des rôles",
      "SLA contractuel",
      "API & webhooks",
      "Accompagnement dédié",
    ],
    cta: { label: "Parler à un expert", href: "mailto:contact@ossian.ai?subject=Ossian%20%E2%80%94%20Offre%20Groupe" },
  },
];

const ANNUAL_DISCOUNT = 0.15;

export function PricingPlans() {
  const [billing, setBilling] = useState<Billing>("monthly");

  return (
    <div className="mt-12">
      <div className="flex justify-center">
        <div role="group" aria-label="Période de facturation" className="inline-flex items-center gap-0.5 rounded-full border border-border bg-card/50 p-1">
          {(
            [
              ["monthly", "Mensuel"],
              ["annual", "Annuel"],
            ] as const
          ).map(([value, label]) => {
            const selected = billing === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => setBilling(value)}
                className={cn(
                  "relative inline-flex h-8.5 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition-colors",
                  selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {selected && (
                  <motion.span
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-full bg-muted shadow-[inset_0_0_0_1px_var(--border-strong)]"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative">{label}</span>
                {value === "annual" && (
                  <span className="relative rounded-full bg-primary-soft px-1.5 py-px text-[11px] font-semibold text-primary">
                    −15 %
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 grid items-stretch gap-4 lg:grid-cols-3">
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} billing={billing} />
        ))}
      </div>
    </div>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const price = plan.price === null ? null : billing === "annual" ? Math.round(plan.price * (1 - ANNUAL_DISCOUNT)) : plan.price;

  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium tracking-tight">{plan.name}</h3>
        {plan.featured && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11.5px] font-semibold text-primary-foreground">
            <Sparkles className="size-3" />
            Le plus choisi
          </span>
        )}
      </div>
      <p className="mt-2 text-[14px] text-muted-foreground">{plan.tagline}</p>

      <div className="mt-7 flex h-[68px] items-end gap-2">
        {price === null ? (
          <p className="font-display text-5xl font-medium">
            <span className="font-serif-accent text-[1.08em]">Sur mesure</span>
          </p>
        ) : (
          <>
            <div className="relative h-[56px] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.p
                  key={price}
                  initial={{ y: 28, opacity: 0, filter: "blur(4px)" }}
                  animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: -28, opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="font-display text-[56px] font-medium tabular"
                >
                  {price}&nbsp;€
                </motion.p>
              </AnimatePresence>
            </div>
            <p className="pb-1.5 text-[13px] leading-tight text-muted-foreground">
              / mois / site
              <br />
              HT
            </p>
          </>
        )}
      </div>
      <p className="mt-2 h-5 text-[12.5px] text-muted-foreground">
        {price === null
          ? "Tarif dégressif selon le nombre de sites"
          : billing === "annual"
            ? `Facturé annuellement, soit ${new Intl.NumberFormat("fr-FR").format(price * 12)} € / an / site`
            : "Sans engagement, résiliable à tout moment"}
      </p>

      <LinkButton
        href={plan.cta.href}
        variant={plan.featured ? "primary" : "outline"}
        size="lg"
        className={cn("group mt-7 w-full", !plan.featured && "bg-transparent")}
      >
        {plan.cta.label}
        <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
      </LinkButton>

      <div className="mt-7 border-t border-border pt-6">
        {plan.minutes && (
          <p className="mb-4 inline-flex rounded-md border border-border bg-muted px-2 py-1 font-mono text-[12px] text-foreground">
            {plan.minutes}
          </p>
        )}
        {plan.intro && <p className="mb-3 text-[13px] font-medium text-foreground">{plan.intro}</p>}
        <ul className="grid gap-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2.5 text-[14px] text-muted-foreground">
              <Check className={cn("mt-0.5 size-4 shrink-0", plan.featured ? "text-primary" : "text-foreground/70")} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (plan.featured) {
    return (
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[22px] bg-primary/20 blur-2xl"
        />
        <div className="ring-gradient flex h-full flex-col rounded-[20px] bg-card p-7 shadow-float">{body}</div>
      </div>
    );
  }
  return <div className="flex h-full flex-col rounded-[20px] border border-border bg-card/40 p-7">{body}</div>;
}
