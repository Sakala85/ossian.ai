"use client";

import { ArrowRight, Info } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { LinkButton } from "@/components/ui/button";
import { cn, euro, num } from "@/lib/utils";
import { AnimatedNumber } from "./animated-number";

/** Assumptions (kept deliberately conservative and shown to the visitor). */
const CONVERSION = 0.35; // recovered call → workshop appointment
const AVG_MINUTES = 2.5; // average handled call length
const PLAN_PRICE = 490; // Performance, €/month/site
const PLAN_MINUTES = 1200; // included minutes / site / month
const EXTRA_MINUTE = 0.25; // € per extra minute

type Inputs = { calls: number; missed: number; basket: number; sites: number };

function compute({ calls, missed, basket, sites }: Inputs) {
  const recovered = Math.round(calls * sites * (missed / 100));
  const appointments = Math.round(recovered * CONVERSION);
  const revenueYear = appointments * basket * 12;
  const minutes = recovered * AVG_MINUTES;
  const included = PLAN_MINUTES * sites;
  const costMonth = PLAN_PRICE * sites + Math.max(0, minutes - included) * EXTRA_MINUTE;
  const costYear = costMonth * 12;
  const roi = costYear > 0 ? revenueYear / costYear : 0;
  const paybackDays = revenueYear > 0 ? Math.max(1, Math.ceil(costYear / (revenueYear / 365))) : 0;
  return { recovered, appointments, revenueYear, costMonth, roi, paybackDays };
}

export function RoiCalculator() {
  const [inputs, setInputs] = useState<Inputs>({ calls: 900, missed: 30, basket: 240, sites: 1 });
  const r = useMemo(() => compute(inputs), [inputs]);
  const set = (k: keyof Inputs) => (v: number) => setInputs((s) => ({ ...s, [k]: v }));

  return (
    <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_1.05fr]">
      {/* Inputs */}
      <div className="rounded-2xl border border-border bg-card/50 p-6 sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">Vos chiffres</p>
        <div className="mt-6 grid gap-8">
          <Slider
            label="Appels entrants par mois et par site"
            value={inputs.calls}
            min={200}
            max={5000}
            step={50}
            onChange={set("calls")}
            display={num(inputs.calls)}
          />
          <Slider
            label="Part d'appels manqués aujourd'hui"
            value={inputs.missed}
            min={10}
            max={50}
            step={1}
            onChange={set("missed")}
            display={`${inputs.missed} %`}
          />
          <Slider
            label="Panier moyen atelier"
            value={inputs.basket}
            min={100}
            max={600}
            step={10}
            onChange={set("basket")}
            display={euro(inputs.basket)}
          />
          <Slider
            label="Nombre de sites"
            value={inputs.sites}
            min={1}
            max={30}
            step={1}
            onChange={set("sites")}
            display={inputs.sites === 1 ? "1 site" : `${inputs.sites} sites`}
          />
        </div>
      </div>

      {/* Results */}
      <div className="ring-gradient relative flex flex-col overflow-hidden rounded-2xl bg-card/70 p-6 shadow-float sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-[90px]"
        />
        <p className="relative font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Chiffre d&apos;affaires atelier récupéré
        </p>
        <p className="relative mt-3 font-display text-[34px] font-medium [overflow-wrap:anywhere] sm:text-6xl">
          <AnimatedNumber value={r.revenueYear} duration={0.7} format={(n) => euro(Math.round(n))} />
          <span className="ml-2 align-middle font-sans text-base font-normal tracking-normal text-muted-foreground">/ an</span>
        </p>

        <dl className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border">
          <Stat label="Appels récupérés / mois">
            <AnimatedNumber value={r.recovered} duration={0.6} format={(n) => num(Math.round(n))} />
          </Stat>
          <Stat label="RDV atelier en plus / mois">
            <AnimatedNumber value={r.appointments} duration={0.6} format={(n) => `+${num(Math.round(n))}`} />
          </Stat>
          <Stat label="Coût Ossian estimé / mois">
            <AnimatedNumber value={r.costMonth} duration={0.6} format={(n) => euro(Math.round(n))} />
          </Stat>
          <Stat label="Retour sur investissement" highlight>
            <AnimatedNumber value={r.roi} duration={0.6} format={(n) => `× ${num(n, n < 10 ? 1 : 0)}`} />
          </Stat>
        </dl>

        <div className="relative mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-muted-foreground">
            Rentabilisé en{" "}
            <span className="font-medium text-foreground tabular">
              {r.paybackDays} jour{r.paybackDays > 1 ? "s" : ""}
            </span>
            .
          </p>
          <LinkButton href="/onboarding" className="group">
            Démarrer l&apos;essai gratuit
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </LinkButton>
        </div>

        <p className="relative mt-auto flex gap-2 pt-6 text-[11.5px] leading-relaxed text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Estimation indicative : {Math.round(CONVERSION * 100)} % des appels récupérés convertis en RDV atelier, durée
          moyenne de {num(AVG_MINUTES, 1)} min, formule Performance ({PLAN_PRICE} €/mois/site, {num(PLAN_MINUTES)} min incluses,
          puis {num(EXTRA_MINUTE, 2)} €/min).
        </p>
      </div>
    </div>
  );
}

function Stat({ label, highlight, children }: { label: string; highlight?: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-card px-4 py-4 sm:px-5">
      <dt className="text-[12px] text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 font-display text-2xl font-medium sm:text-[28px]", highlight && "text-primary")}>{children}</dd>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[14px] text-foreground">
          {label}
        </label>
        <span className="shrink-0 rounded-md border border-border bg-muted px-2 py-0.5 font-mono text-[13px] font-medium tabular">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${fill}%` } as React.CSSProperties}
        className={cn(
          "mt-4 h-5 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-none",
          // track
          "[&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full",
          "[&::-webkit-slider-runnable-track]:bg-[linear-gradient(to_right,var(--primary)_0%,var(--primary)_var(--fill),var(--muted)_var(--fill),var(--muted)_100%)]",
          "[&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-muted",
          "[&::-moz-range-progress]:h-1.5 [&::-moz-range-progress]:rounded-full [&::-moz-range-progress]:bg-primary",
          // thumb
          "[&::-webkit-slider-thumb]:-mt-[7px] [&::-webkit-slider-thumb]:box-border [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full",
          "[&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-foreground",
          "[&::-webkit-slider-thumb]:shadow-[0_0_0_4px_color-mix(in_oklch,var(--primary)_18%,transparent),0_2px_6px_0_oklch(0_0_0/40%)]",
          "[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 active:[&::-webkit-slider-thumb]:scale-110",
          "focus-visible:[&::-webkit-slider-thumb]:shadow-[0_0_0_6px_var(--ring)]",
          "[&::-moz-range-thumb]:size-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-foreground",
          "focus-visible:[&::-moz-range-thumb]:shadow-[0_0_0_6px_var(--ring)]",
        )}
      />
      <div className="mt-1 flex justify-between font-mono text-[10.5px] text-muted-foreground" aria-hidden>
        <span>{num(min)}</span>
        <span>{num(max)}</span>
      </div>
    </div>
  );
}
