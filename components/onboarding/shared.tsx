"use client";

import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Sparkles, Trash, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { EASE, TOTAL_STEPS, type StepId } from "./lib";

/* ------------------------------------------------------------------ */
/* Step chrome                                                         */
/* ------------------------------------------------------------------ */

export function StepHeader({
  step,
  title,
  description,
  children,
  autoFocus = true,
}: {
  step: StepId;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);
  return (
    <header className="mb-8">
      <p className="mb-3 font-mono text-xs text-muted-foreground tabular">
        {String(step).padStart(2, "0")} <span className="text-border-strong">/</span> {String(TOTAL_STEPS).padStart(2, "0")}
      </p>
      <h1
        ref={ref}
        tabIndex={-1}
        className="font-display text-[32px] font-medium text-balance focus:outline-none sm:text-[40px]"
      >
        {title}
      </h1>
      {description && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-pretty text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}

export function useModKey() {
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setMod("⌘");
  }, []);
  return mod;
}

/** Footer navigation. ⌘/Ctrl + Entrée triggers the primary action. */
export function StepActions({
  onBack,
  backLabel = "Retour",
  onNext,
  nextLabel = "Continuer",
  nextDisabled,
  extra,
  className,
}: {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  extra?: React.ReactNode;
  className?: string;
}) {
  const mod = useModKey();
  const nextRef = useRef(onNext);
  nextRef.current = nextDisabled ? undefined : onNext;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && nextRef.current) {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className={cn("mt-10 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between", className)}>
      {onBack ? (
        <Button variant="ghost" onClick={onBack} className="self-start sm:self-auto">
          <ArrowLeft />
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-3">
        {extra}
        {onNext && (
          <Button onClick={onNext} disabled={nextDisabled} className="w-full sm:w-auto">
            {nextLabel}
            <ArrowRight />
            <Kbd className="ml-1 hidden h-4.5 border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/85 sm:inline-flex">
              {mod} ↵
            </Kbd>
          </Button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Badges, callouts, tiles                                             */
/* ------------------------------------------------------------------ */

export function AiBadge({ className }: { className?: string }) {
  return (
    <span
      title="Pré-rempli par l'IA à partir de votre site — à vérifier"
      className={cn(
        "inline-flex h-4.5 shrink-0 items-center gap-0.5 rounded-full bg-primary-soft px-1.5 text-[10px] font-semibold tracking-wide text-primary [&_svg]:size-2.5",
        className,
      )}
    >
      <Sparkles aria-hidden />
      <span aria-hidden>IA</span>
      <span className="sr-only">Pré-rempli par l&apos;IA, à vérifier</span>
    </span>
  );
}

const calloutTones = {
  neutral: "border-border bg-subtle text-muted-foreground [&>svg]:text-muted-foreground",
  info: "border-[color-mix(in_oklch,var(--info)_22%,transparent)] bg-info-soft text-foreground [&>svg]:text-info",
  primary: "border-[color-mix(in_oklch,var(--primary)_20%,transparent)] bg-primary-soft text-foreground [&>svg]:text-primary",
  warning: "border-[color-mix(in_oklch,var(--warning)_28%,transparent)] bg-warning-soft text-foreground [&>svg]:text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))]",
  success: "border-[color-mix(in_oklch,var(--success)_22%,transparent)] bg-success-soft text-foreground [&>svg]:text-success",
} as const;

export function Callout({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: keyof typeof calloutTones;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-lg border px-3.5 py-3 text-[13px] leading-relaxed [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0", calloutTones[tone], className)}>
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function IconTile({ children, active, className }: { children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border [&_svg]:size-4",
        active ? "border-transparent bg-primary-soft text-primary" : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Brand-neutral monogram used as integration logo placeholder. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted font-mono text-[10.5px] font-semibold tracking-tight text-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-primary bg-primary" : "border-border-strong bg-card",
      )}
    >
      {selected && <span className="size-1.5 rounded-full bg-primary-foreground" />}
    </span>
  );
}

/** Large selectable card (use inside an element with role="radiogroup"). */
export function OptionCard({
  selected,
  onSelect,
  title,
  description,
  icon,
  badge,
  className,
}: {
  selected: boolean;
  onSelect: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-[border-color,box-shadow,background-color] duration-150",
        selected
          ? "border-primary shadow-[0_0_0_3px_var(--primary-soft)]"
          : "border-border hover:border-border-strong hover:bg-subtle",
        className,
      )}
    >
      {icon && <IconTile active={selected}>{icon}</IconTile>}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
          {title}
          {badge}
        </span>
        {description && <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">{description}</span>}
      </span>
      <span className="pt-0.5">
        <RadioDot selected={selected} />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Form bits                                                           */
/* ------------------------------------------------------------------ */

export function FormField({
  id,
  label,
  ai,
  optional,
  hint,
  error,
  className,
  children,
}: {
  id?: string;
  label: string;
  ai?: boolean;
  optional?: boolean;
  hint?: React.ReactNode;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <div className="flex min-h-4.5 items-center gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        {optional && <span className="text-xs text-muted-foreground">facultatif</span>}
        {ai && <AiBadge />}
      </div>
      {children}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** Warning outline for values the analysis could not find. */
export const missingClass = "border-warning/60 bg-warning-soft";

export function RemoveButton({ label, onClick, disabled, className }: { label: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn("text-muted-foreground hover:bg-danger-soft hover:text-danger [&_svg]:size-3.5", className)}
    >
      <Trash />
    </Button>
  );
}

/** Removable chips + free input (Entrée or virgule pour ajouter). */
export function ChipEditor({
  id,
  values,
  onChange,
  placeholder = "Ajouter…",
  label,
}: {
  id?: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  label: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((v, i, a) => a.findIndex((x) => x.toLowerCase() === v.toLowerCase()) === i)
      .filter((v) => !values.some((x) => x.toLowerCase() === v.toLowerCase()));
    if (parts.length) onChange([...values, ...parts]);
    setDraft("");
  };
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[10px] border border-input bg-card p-1.5 shadow-[0_1px_2px_0_oklch(0_0_0/4%)] transition-[border,box-shadow] focus-within:border-primary focus-within:ring-4 focus-within:ring-primary-soft">
      <AnimatePresence initial={false}>
        {values.map((v) => (
          <motion.span
            key={v}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-muted pr-1 pl-2.5 text-[13px] text-foreground"
          >
            {v}
            <button
              type="button"
              aria-label={`Retirer ${v}`}
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="inline-flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              <X className="size-3" />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>
      <input
        id={id}
        value={draft}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if ((e.key === "Enter" && !e.metaKey && !e.ctrlKey) || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        className="h-7 min-w-[9rem] flex-1 bg-transparent px-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus-visible:outline-none"
      />
    </div>
  );
}

/** Input with a trailing unit ("min", "€"). */
export function UnitInput({
  unit,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { unit: string }) {
  return (
    <div className={cn("relative", className)}>
      <input
        {...props}
        className="h-9.5 w-full rounded-[10px] border border-input bg-card pr-10 pl-3 text-sm text-foreground tabular shadow-[0_1px_2px_0_oklch(0_0_0/4%)] transition-[border,box-shadow] outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary-soft [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Collapsible section                                                 */
/* ------------------------------------------------------------------ */

export function Section({
  id,
  icon,
  title,
  summary,
  open,
  onToggle,
  ai,
  badge,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  summary?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  ai?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-soft">
      <h2>
        <button
          type="button"
          id={`${id}-trigger`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-subtle sm:px-5"
        >
          <IconTile active={open}>{icon}</IconTile>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              {title}
              {ai && <AiBadge />}
            </span>
            {summary && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span>}
          </span>
          {badge}
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
        </button>
      </h2>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`${id}-panel`}
            role="region"
            aria-labelledby={`${id}-trigger`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 py-5 sm:px-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Copy                                                                */
/* ------------------------------------------------------------------ */

export function CopyButton({
  value,
  label = "Copier",
  showLabel,
  className,
}: {
  value: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      ta.remove();
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Button
      variant={showLabel ? "outline" : "ghost"}
      size={showLabel ? "sm" : "icon-sm"}
      onClick={copy}
      aria-label={showLabel ? undefined : `${label} ${value}`}
      title={showLabel ? undefined : label}
      className={cn(!showLabel && "text-muted-foreground hover:text-foreground [&_svg]:size-3.5", className)}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {showLabel && (copied ? "Copié" : label)}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copié dans le presse-papiers" : ""}
      </span>
    </Button>
  );
}
