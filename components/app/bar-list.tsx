import { cn } from "@/lib/utils";

export type BarItem = {
  key: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  value: number;
  /** Formatted primary value (right column). */
  display: string;
  /** Secondary value shown before the primary one. */
  sub?: string;
};

/**
 * Ranked horizontal bars rendered as soft fills behind each row.
 * One series → one hue (chart-1); every value is direct-labelled.
 */
export function BarList({ items, className, max }: { items: BarItem[]; className?: string; max?: number }) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className={cn("grid gap-1", className)}>
      {items.map((it) => (
        <li key={it.key} className="group relative flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px]">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-md bg-[color-mix(in_oklch,var(--chart-1)_13%,transparent)] transition-colors group-hover:bg-[color-mix(in_oklch,var(--chart-1)_22%,transparent)]"
            style={{ width: `${Math.max(2, (it.value / top) * 100)}%` }}
          />
          {it.icon && <span className="relative shrink-0 text-muted-foreground [&_svg]:size-3.5">{it.icon}</span>}
          <span className="relative flex-1 truncate text-foreground">{it.label}</span>
          {it.sub && <span className="relative hidden text-xs text-muted-foreground tabular sm:inline">{it.sub}</span>}
          <span className="relative w-11 text-right font-medium tabular">{it.display}</span>
        </li>
      ))}
    </ul>
  );
}
