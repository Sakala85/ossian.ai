import { cn } from "@/lib/utils";

/**
 * Stat-tile sparkline. Context in the de-emphasis ink, the most recent
 * `highlight` points in the accent, with a ringed end-dot.
 * Uses a stretched viewBox + non-scaling strokes; the end-dot is HTML so it
 * stays perfectly round at any width.
 */
export function Sparkline({
  values,
  highlight = 7,
  className,
  label,
}: {
  values: number[];
  highlight?: number;
  className?: string;
  label?: string;
}) {
  const W = 100;
  const H = 32;
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * W, pad + (1 - (v - min) / span) * (H - pad * 2)] as const);
  const path = (p: readonly (readonly [number, number])[]) => p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join("");
  const cut = Math.max(0, pts.length - highlight);
  const recent = pts.slice(cut);
  const last = pts[pts.length - 1] ?? [W, H / 2];
  const area = `${path(recent)}L${W},${H}L${recent[0]?.[0] ?? 0},${H}Z`;

  return (
    <div className={cn("relative h-8 w-full", className)} role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible" aria-hidden>
        <path d={area} fill="var(--chart-1)" opacity={0.1} />
        <path
          d={path(pts.slice(0, cut + 1))}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeOpacity={0.45}
          strokeWidth={1.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path(recent)}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-chart-1 ring-2 ring-card"
        style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%` }}
        aria-hidden
      />
    </div>
  );
}
