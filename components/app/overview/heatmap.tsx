"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { cn, num, pct } from "@/lib/utils";

const DAYS = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."];
const DAYS_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/** Opening hours used to split "in hours" vs "after hours" (showroom + atelier). */
export function isOpen(day: number, hour: number) {
  if (day <= 4) return hour >= 8 && hour < 19;
  if (day === 5) return hour >= 8 && hour < 18;
  return false;
}

// Sequential ramp: one hue, more is darker (mixed into the muted track).
const ACCENT_STEPS = [0, 16, 32, 50, 72, 100];
const GRAY_STEPS = [0, 10, 18, 27, 37, 48];
const LEGEND_LEVELS = [1, 2, 3, 4, 5];

const LABEL_W = 34;
const CELL_H = 18;
const GAP = 2;

export function Heatmap({ grid }: { grid: number[][] }) {
  const [mode, setMode] = useState<"after" | "all">("after");
  const [active, setActive] = useState<{ d: number; h: number } | null>(null);

  const stats = useMemo(() => {
    let total = 0;
    let after = 0;
    let max = 0;
    grid.forEach((row, d) =>
      row.forEach((v, h) => {
        total += v;
        if (!isOpen(d, h)) after += v;
        max = Math.max(max, v);
      }),
    );
    return { total, after, max, share: total ? after / total : 0 };
  }, [grid]);

  const level = (v: number) => (v <= 0 ? 0 : Math.max(1, Math.ceil((v / stats.max) * 5)));
  const color = (d: number, h: number) => {
    const l = level(grid[d]![h]!);
    if (l === 0) return "var(--muted)";
    const emphasize = mode === "all" || !isOpen(d, h);
    return emphasize
      ? `color-mix(in oklch, var(--chart-1) ${ACCENT_STEPS[l]}%, var(--muted))`
      : `color-mix(in oklch, var(--muted-foreground) ${GRAY_STEPS[l]}%, var(--muted))`;
  };

  const onKey = (e: React.KeyboardEvent) => {
    const moves: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setActive((a) => {
      const cur = a ?? { d: 0, h: 9 };
      return { d: Math.max(0, Math.min(6, cur.d + m[0])), h: Math.max(0, Math.min(23, cur.h + m[1])) };
    });
  };

  const av = active ? grid[active.d]![active.h]! : 0;
  const openStart = 8 / 24;
  const openEnd = 19 / 24;

  return (
    <Card className="flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5">
        <div className="min-w-0">
          <h2 className="text-sm font-medium tracking-tight">Quand vos clients appellent</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Semaine type · appels par créneau horaire</p>
        </div>
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: "after", label: "Hors horaires" },
            { value: "all", label: "Tout" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-end gap-x-8 gap-y-2 px-5 pt-4">
        <div>
          <div className="text-[28px] leading-none font-semibold tracking-[-0.03em]">{pct(stats.share)}</div>
          <p className="mt-1.5 text-xs text-muted-foreground">des appels arrivent en dehors des horaires d&apos;ouverture</p>
        </div>
        <div className="max-w-xs text-xs text-muted-foreground">
          Soit <span className="font-medium text-foreground tabular">{num(Math.round(stats.after / 7))}</span> appels par jour
          qui tombaient sur répondeur. Léa les traite tous, y compris le dimanche.
        </div>
      </div>

      <div className="px-5 pt-5 pb-5">
        <div
          className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          tabIndex={0}
          role="group"
          aria-label={`Carte de chaleur des appels. ${pct(stats.share)} hors horaires. Utilisez les flèches pour parcourir les créneaux.`}
          onKeyDown={onKey}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          <div className="grid" style={{ gridTemplateColumns: `${LABEL_W}px repeat(24, minmax(0, 1fr))`, gap: GAP }}>
            {grid.map((row, d) => (
              <div key={d} className="contents">
                <div className="flex items-center text-[11px] text-muted-foreground" style={{ height: CELL_H }}>
                  {DAYS[d]}
                </div>
                {row.map((v, h) => (
                  <div
                    key={h}
                    onPointerEnter={() => setActive({ d, h })}
                    className={cn(
                      "rounded-[3px] transition-[outline-color] duration-100",
                      active?.d === d && active.h === h ? "outline-2 outline-offset-1 outline-foreground" : "outline-transparent",
                    )}
                    style={{ height: CELL_H, background: color(d, h) }}
                    aria-hidden
                    title={`${DAYS_LONG[d]} ${h}h–${h + 1}h : ${v} appels`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Hour axis + opening hours bracket */}
          <div className="relative mt-2 h-9" style={{ marginLeft: LABEL_W + GAP }}>
            <div
              className="absolute top-0 h-1.5 rounded-b-[3px] border-x border-b border-border-strong"
              style={{ left: `${openStart * 100}%`, width: `${(openEnd - openStart) * 100}%` }}
            />
            <span
              className="absolute top-2.5 -translate-x-1/2 text-[11px] whitespace-nowrap text-muted-foreground"
              style={{ left: `${((openStart + openEnd) / 2) * 100}%` }}
            >
              Ouvert · 8h–19h
            </span>
            {[0, 6, 12, 18].map((h) => (
              <span key={h} className="absolute top-5 text-[11px] text-muted-foreground tabular" style={{ left: `${(h / 24) * 100}%` }}>
                {h}h
              </span>
            ))}
          </div>

          {active && (
            <div
              className="pointer-events-none absolute z-10 w-max -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-2.5 py-2 text-xs shadow-float"
              style={{
                left: `calc(${LABEL_W + GAP}px + (100% - ${LABEL_W + GAP}px) * ${(active.h + 0.5) / 24})`,
                top: active.d * (CELL_H + GAP) - 6,
              }}
            >
              <span className="font-semibold text-foreground tabular">{av} appels</span>
              <span className="text-muted-foreground">
                {" "}
                · {DAYS_LONG[active.d]} {active.h}h–{active.h + 1}h
              </span>
              <span className={cn("mt-0.5 block", isOpen(active.d, active.h) ? "text-muted-foreground" : "text-primary")}>
                {isOpen(active.d, active.h) ? "Pendant les horaires d'ouverture" : "Hors horaires · traité par Léa"}
              </span>
            </div>
          )}
        </div>

        {/* Scale legend */}
        <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            Moins
            {LEGEND_LEVELS.map((l) => (
              <span
                key={l}
                className="size-2.5 rounded-[2px]"
                style={{ background: `color-mix(in oklch, var(--chart-1) ${ACCENT_STEPS[l]}%, var(--muted))` }}
              />
            ))}
            Plus
          </span>
          {mode === "after" && (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[2px]"
                style={{ background: `color-mix(in oklch, var(--muted-foreground) ${GRAY_STEPS[3]}%, var(--muted))` }}
              />
              Pendant les horaires (atténué)
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
