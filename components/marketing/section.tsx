import { cn } from "@/lib/utils";
import { Reveal } from "./reveal";

/** Marketing section shell: vertical rhythm + centered 6xl container + anchor offset for the fixed nav. */
export function Section({
  id,
  className,
  containerClassName,
  children,
  ...rest
}: React.HTMLAttributes<HTMLElement> & { containerClassName?: string }) {
  return (
    <section id={id} className={cn("relative scroll-mt-16 py-24 md:py-32", className)} {...rest}>
      <div className={cn("relative mx-auto max-w-6xl px-6", containerClassName)}>{children}</div>
    </section>
  );
}

/** Mono, uppercase section kicker with an optional index ("02 — Produit"). */
export function Eyebrow({ index, children, className }: { index?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase", className)}>
      {index ? <span className="text-primary">{index}</span> : <span className="size-1.5 rounded-full bg-primary" aria-hidden />}
      <span aria-hidden className="h-px w-5 bg-border-strong" />
      {children}
    </p>
  );
}

/** Instrument Serif italic highlight for 1–3 words of a display heading. */
export function Accent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "font-serif-accent pr-[0.04em] text-[1.06em] text-[color-mix(in_oklch,var(--primary)_58%,var(--foreground))]",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  index,
  title,
  description,
  align = "center",
  className,
  children,
}: {
  eyebrow?: string;
  index?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "center" | "left";
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "mx-auto max-w-3xl items-center text-center" : "max-w-2xl items-start",
        className,
      )}
    >
      {eyebrow && <Eyebrow index={index}>{eyebrow}</Eyebrow>}
      <h2 className="font-display text-[40px] font-medium text-balance sm:text-5xl md:text-[58px]">{title}</h2>
      {description && (
        <p className="max-w-2xl text-[15px] leading-relaxed text-pretty text-muted-foreground sm:text-base md:text-[17px]">
          {description}
        </p>
      )}
      {children}
    </Reveal>
  );
}

/** Glass surface with the gradient hairline. Do not put positioning classes on it (ring-gradient sets `relative`). */
export function Glass({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("ring-gradient rounded-2xl bg-card/70 shadow-float backdrop-blur-xl", className)}>{children}</div>
  );
}

/** Brand-neutral monogram tile used in place of third-party logos. */
export function Monogram({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-border-strong bg-[linear-gradient(180deg,var(--muted),var(--card))] font-mono text-[10.5px] font-semibold tracking-tight text-foreground shadow-[inset_0_1px_0_0_oklch(1_0_0/6%)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
