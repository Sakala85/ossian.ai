"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

/** Settings panel: title + description header, body, optional footer note. */
export function Panel({
  title,
  description,
  action,
  footer,
  children,
  className,
  bodyClassName,
  id,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 overflow-hidden rounded-xl border border-border bg-card shadow-soft", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          {description && <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-border bg-subtle px-5 py-3 text-xs text-muted-foreground">{footer}</footer>}
    </section>
  );
}

export function ToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
  children,
  badge,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  children?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3.5">
        {icon && (
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-subtle text-muted-foreground [&_svg]:size-4">
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-medium text-foreground">{title}</p>
            {badge}
          </div>
          {description && <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>}
        </div>
        <Switch checked={checked} onCheckedChange={onChange} label={title} className="mt-0.5" />
      </div>
      {children && checked && <div className={cn("mt-3", icon && "pl-11.5")}>{children}</div>}
    </div>
  );
}

export function RadioCards<T extends string>({
  value,
  onChange,
  options,
  name,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; title: string; description?: React.ReactNode; icon?: React.ReactNode; badge?: string }[];
  name: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={name} className={cn("grid gap-2.5 md:grid-cols-3", className)}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex flex-col rounded-xl border p-4 text-left transition-[border-color,box-shadow,background]",
              on
                ? "border-primary/60 bg-primary-soft shadow-[0_0_0_3px_var(--primary-soft)]"
                : "border-border bg-card hover:border-border-strong hover:bg-subtle",
            )}
          >
            <span className="flex items-center gap-2.5">
              {o.icon && <span className={cn("[&_svg]:size-4", on ? "text-primary" : "text-muted-foreground")}>{o.icon}</span>}
              <span className="flex-1 text-[13.5px] font-medium">{o.title}</span>
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border",
                  on ? "border-primary bg-primary" : "border-border-strong bg-card",
                )}
              >
                {on && <span className="size-1.5 rounded-full bg-primary-foreground" />}
              </span>
            </span>
            {o.description && <span className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{o.description}</span>}
            {o.badge && (
              <span className="mt-3 inline-flex w-fit rounded-full border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground">
                {o.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function CopyField({ value, className, label }: { value: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={cn(
        "flex h-9.5 min-w-0 items-center gap-2 rounded-[10px] border border-input bg-subtle pr-1 pl-3 font-mono text-[13px] text-foreground",
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate" aria-label={label}>
        {value}
      </span>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        aria-label="Copier"
        className="inline-flex h-7 items-center gap-1 rounded-md px-2 font-sans text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
      >
        {copied ? <Check className="text-success" /> : <Copy />}
        {copied ? "Copié" : "Copier"}
      </button>
    </div>
  );
}

export function CodeBlock({ code, title, className }: { code: React.ReactNode; title?: string; className?: string; raw?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl border border-border bg-subtle", className)}>
      {title && (
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2 text-xs text-muted-foreground">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
          </span>
          <span className="font-mono">{title}</span>
        </div>
      )}
      <pre className="scrollbar-thin overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/** Small icon button used in editable lists. */
export function IconAction({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </button>
  );
}
