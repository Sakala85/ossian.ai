"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { cn, num, pct } from "@/lib/utils";
import { fmtDateShort, fmtDayLong } from "../format";
import { niceTicks, useMeasure } from "../use-measure";

export type DayPoint = { iso: string; handled: number; transferred: number; missed: number };

const H = 260;
const M = { t: 14, r: 10, b: 28, l: 36 };
const GAP = 2;

/** Rect with 4px rounded top corners, square at the baseline. */
function topRounded(x: number, y: number, w: number, h: number, r = 4) {
  if (h <= 0) return "";
  const rr = Math.min(r, w / 2, h);
  return `M${x},${y + h}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${y + h}Z`;
}

const SERIES = [
  { key: "handled", label: "Traités par Léa", color: "var(--chart-1)", kind: "bar" },
  { key: "transferred", label: "Transférés avec contexte", color: "var(--chart-2)", kind: "bar" },
  { key: "missed", label: "Auraient été manqués sans Ossian", color: "var(--chart-5)", kind: "line" },
] as const;

export function CallsChart({ data }: { data: DayPoint[] }) {
  const [view, setView] = useState<"chart" | "table">("chart");
  const [hover, setHover] = useState<number | null>(null);
  const [ref, width] = useMeasure<HTMLDivElement>(760);

  const n = data.length;
  const iw = Math.max(40, width - M.l - M.r);
  const ih = H - M.t - M.b;
  const totals = data.map((d) => d.handled + d.transferred);
  const { max, ticks } = niceTicks(Math.max(1, ...totals, ...data.map((d) => d.missed)), 4);
  const band = iw / n;
  const bw = Math.max(3, Math.min(24, band * 0.62));
  const x = (i: number) => M.l + i * band + band / 2;
  const y = (v: number) => M.t + ih - (v / max) * ih;

  const totalCalls = totals.reduce((a, b) => a + b, 0);
  const totalHandled = data.reduce((a, d) => a + d.handled, 0);
  const totalMissed = data.reduce((a, d) => a + d.missed, 0);

  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.missed).toFixed(1)}`).join("");
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 62))));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.floor(((e.clientX - r.left) / r.width) * n);
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setHover((h) => {
        const cur = h ?? n - 1;
        return Math.max(0, Math.min(n - 1, cur + (e.key === "ArrowRight" ? 1 : -1)));
      });
    }
  };

  const hv = hover !== null ? data[hover] : undefined;
  const tipLeft = hover !== null ? x(hover) : 0;
  const flip = tipLeft > width - 230;
  const tipX = Math.max(0, Math.min(width - 214, flip ? tipLeft - 226 : tipLeft + 14));

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
        <div>
          <h2 className="text-sm font-medium tracking-tight">Volume d&apos;appels</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {num(totalCalls)} appels sur 30 jours · <span className="text-foreground">{pct(totalHandled / totalCalls)}</span> traités
            de bout en bout par Léa
          </p>
        </div>
        <Segmented
          size="sm"
          value={view}
          onChange={setView}
          options={[
            { value: "chart", label: "Graphique" },
            { value: "table", label: "Tableau" },
          ]}
        />
      </div>

      {/* Legend */}
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 px-5 pt-4 text-xs text-muted-foreground">
        {SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-2">
            {s.kind === "bar" ? (
              <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
            ) : (
              <span className="h-0.5 w-3.5 rounded-full" style={{ background: s.color }} />
            )}
            {s.label}
            {s.key === "missed" && <span className="font-medium text-foreground tabular">{num(totalMissed)}</span>}
          </li>
        ))}
      </ul>

      <div className="px-3 pt-2 pb-3 sm:px-4">
        <div ref={ref} className={cn("relative w-full", view !== "chart" && "hidden")} style={{ height: H }}>
            <svg
              width={width}
              height={H}
              className="block overflow-visible outline-none"
              role="group"
              tabIndex={0}
              aria-label="Appels par jour sur 30 jours. Utilisez les flèches gauche et droite pour parcourir les jours."
              onKeyDown={onKey}
              onFocus={() => setHover((h) => h ?? n - 1)}
              onBlur={() => setHover(null)}
            >
              {/* grid */}
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={M.l} x2={M.l + iw} y1={y(t)} y2={y(t)} stroke="var(--border)" strokeWidth={1} shapeRendering="crispEdges" />
                  <text x={M.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular">
                    {num(t)}
                  </text>
                </g>
              ))}

              {/* hover band */}
              {hover !== null && (
                <rect x={M.l + hover * band} y={M.t} width={band} height={ih} rx={4} fill="var(--muted)" opacity={0.9} />
              )}

              {/* stacked bars */}
              {data.map((d, i) => {
                const bx = x(i) - bw / 2;
                const yh = y(d.handled);
                const yt = y(d.handled + d.transferred);
                const dim = hover !== null && hover !== i;
                const topH = yh - GAP - yt;
                return (
                  <g key={d.iso} opacity={dim ? 0.55 : 1} style={{ transition: "opacity 150ms" }}>
                    {d.transferred > 0 && topH > 0 ? (
                      <>
                        <rect x={bx} y={yh} width={bw} height={M.t + ih - yh} fill="var(--chart-1)" />
                        <path d={topRounded(bx, yt, bw, topH)} fill="var(--chart-2)" />
                      </>
                    ) : (
                      <path d={topRounded(bx, yt, bw, M.t + ih - yt)} fill="var(--chart-1)" />
                    )}
                  </g>
                );
              })}

              {/* counterfactual line */}
              <path d={line} fill="none" stroke="var(--chart-5)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {(hover !== null ? [hover] : [n - 1]).map((i) => (
                <circle key={i} cx={x(i)} cy={y(data[i]!.missed)} r={4} fill="var(--chart-5)" stroke="var(--card)" strokeWidth={2} />
              ))}

              {/* baseline */}
              <line x1={M.l} x2={M.l + iw} y1={M.t + ih} y2={M.t + ih} stroke="var(--border-strong)" strokeWidth={1} shapeRendering="crispEdges" />

              {/* x labels */}
              {data.map((d, i) =>
                (n - 1 - i) % labelEvery === 0 ? (
                  <text key={d.iso} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                    {i === n - 1 ? "Auj." : fmtDateShort(d.iso)}
                  </text>
                ) : null,
              )}

              {/* hit area */}
              <rect
                x={M.l}
                y={M.t}
                width={iw}
                height={ih}
                fill="transparent"
                onPointerMove={onMove}
                onPointerLeave={() => setHover(null)}
              />
            </svg>

            {hv && hover !== null && (
              <div
                className="pointer-events-none absolute top-2 z-10 w-[214px] rounded-xl border border-border bg-popover p-3 text-xs shadow-float"
                style={{ left: tipX }}
              >
                <p className="mb-2 font-medium text-foreground">{fmtDayLong(hv.iso)}</p>
                <TipRow color="var(--chart-1)" label="Traités par Léa" value={hv.handled} />
                <TipRow color="var(--chart-2)" label="Transférés" value={hv.transferred} />
                <div className="my-1.5 h-px bg-border" />
                <TipRow label="Total" value={hv.handled + hv.transferred} strong />
                <TipRow color="var(--chart-5)" label="Auraient été manqués" value={hv.missed} />
              </div>
            )}
        </div>
        {view === "table" && (
          <div className="scrollbar-thin max-h-[262px] overflow-auto rounded-lg border border-border">
            <table className="w-full min-w-[480px] text-[13px]">
              <thead className="sticky top-0 bg-subtle text-xs text-muted-foreground">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium">Jour</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                  <th className="px-3 py-2 text-right font-medium">Traités par Léa</th>
                  <th className="px-3 py-2 text-right font-medium">Transférés</th>
                  <th className="px-3 py-2 text-right font-medium">Auraient été manqués</th>
                </tr>
              </thead>
              <tbody className="tabular">
                {[...data].reverse().map((d) => (
                  <tr key={d.iso} className="border-t border-border">
                    <td className="px-3 py-1.5">{fmtDayLong(d.iso)}</td>
                    <td className="px-3 py-1.5 text-right font-medium">{d.handled + d.transferred}</td>
                    <td className="px-3 py-1.5 text-right">{d.handled}</td>
                    <td className="px-3 py-1.5 text-right">{d.transferred}</td>
                    <td className="px-3 py-1.5 text-right text-muted-foreground">{d.missed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function TipRow({ color, label, value, strong }: { color?: string; label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      {color ? <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: color }} /> : <span className="w-3 shrink-0" />}
      <span className={cn("flex-1", strong ? "text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className="font-semibold text-foreground tabular">{num(value)}</span>
    </div>
  );
}
