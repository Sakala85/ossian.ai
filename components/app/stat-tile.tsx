import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Signed delta pill. Color = direction × whether "up" is good. */
export function Delta({
  value,
  label,
  goodWhenUp = true,
  className,
}: {
  value: number;
  /** Pre-formatted text (e.g. "+12 %", "+35 pts"). */
  label: string;
  goodWhenUp?: boolean;
  className?: string;
}) {
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-0.5 rounded-md px-1.5 text-[11.5px] font-medium tabular [&_svg]:size-3",
        value === 0 ? "bg-muted text-muted-foreground" : good ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        className,
      )}
    >
      {value !== 0 && <Icon aria-hidden />}
      {label}
    </span>
  );
}

/**
 * Stat tile: label · value · optional delta · optional hint / trend.
 * Values use proportional figures (no `tabular`) per the figure contract.
 */
export function StatTile({
  label,
  value,
  unit,
  delta,
  hint,
  icon,
  children,
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  delta?: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 shadow-soft", className)}>
      <div className="flex items-center gap-2 text-[13px] text-muted-foreground [&_svg]:size-3.5">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-[26px] leading-none font-semibold tracking-[-0.03em] text-foreground">
          {value}
          {unit && <span className="ml-0.5 text-base font-medium text-muted-foreground">{unit}</span>}
        </span>
        {delta}
      </div>
      {hint && <div className="mt-1.5 text-xs text-muted-foreground">{hint}</div>}
      {children && <div className="mt-auto pt-3">{children}</div>}
    </div>
  );
}
