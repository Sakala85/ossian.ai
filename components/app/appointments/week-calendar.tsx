"use client";

import { Check, KeyRound, UserX } from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { hm } from "../format";
import type { CalAppointment, WeekInfo } from "./types";

const START = 7 * 60;
const END = 19 * 60;
const HOUR_H = 56;
const HOURS = Array.from({ length: (END - START) / 60 + 1 }, (_, i) => 7 + i);

type Placed = CalAppointment & { lane: number; lanes: number };

/** Greedy lane layout for overlapping appointments within one day. */
function layout(items: CalAppointment[]): Placed[] {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || b.durationMin - a.durationMin);
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  let laneEnds: number[] = [];
  const flush = () => {
    const lanes = Math.max(1, laneEnds.length);
    cluster.forEach((p) => (p.lanes = lanes));
    out.push(...cluster);
    cluster = [];
    laneEnds = [];
  };
  for (const a of sorted) {
    if (a.startMin >= clusterEnd && cluster.length) flush();
    let lane = laneEnds.findIndex((e) => e <= a.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = a.startMin + a.durationMin;
    clusterEnd = Math.max(clusterEnd, a.startMin + a.durationMin);
    cluster.push({ ...a, lane, lanes: 1 });
  }
  flush();
  return out;
}

export function WeekCalendar({
  items,
  week,
  onSelect,
  selectedId,
}: {
  items: CalAppointment[];
  week: WeekInfo;
  onSelect: (id: string) => void;
  selectedId?: string;
}) {
  const byDay = useMemo(() => week.days.map((_, d) => layout(items.filter((a) => a.day === d))), [items, week.days]);
  const showNow = week.today !== null && week.nowMin >= START && week.nowMin <= END;

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <div className="min-w-[820px]">
        {/* Day headers */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: `52px repeat(${week.days.length}, minmax(0, 1fr))` }}>
          <div />
          {week.days.map((d, i) => {
            const isToday = week.today === i;
            const count = items.filter((a) => a.day === i).length;
            return (
              <div key={d.full} className={cn("border-l border-border px-3 py-2.5", isToday && "bg-primary-soft/40")}>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs", isToday ? "text-primary" : "text-muted-foreground")}>{d.label}</span>
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-[13px] font-semibold tabular",
                      isToday ? "bg-primary text-primary-foreground" : "text-foreground",
                    )}
                  >
                    {d.date}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground tabular">{count} RDV</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="relative grid" style={{ gridTemplateColumns: `52px repeat(${week.days.length}, minmax(0, 1fr))` }}>
          {/* Time gutter */}
          <div className="relative" style={{ height: (END - START) / 60 * HOUR_H }}>
            {HOURS.map((h) => (
              <span
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] text-muted-foreground tabular"
                style={{ top: (h * 60 - START) / 60 * HOUR_H }}
              >
                {h === 7 ? "" : `${h}h`}
              </span>
            ))}
          </div>

          {byDay.map((placed, d) => (
            <div
              key={d}
              className={cn("relative border-l border-border", week.today === d && "bg-primary-soft/25")}
              style={{ height: (END - START) / 60 * HOUR_H }}
            >
              {/* hour lines */}
              {HOURS.slice(1, -1).map((h) => (
                <div key={h} className="absolute inset-x-0 border-t border-border" style={{ top: (h * 60 - START) / 60 * HOUR_H }} />
              ))}
              {/* lunch break */}
              {d < 5 && (
                <div
                  className="absolute inset-x-0 bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--muted)_6px_7px)] opacity-70"
                  style={{ top: (12 * 60 - START) / 60 * HOUR_H, height: 1.5 * HOUR_H }}
                  aria-hidden
                />
              )}

              {placed.map((a) => {
                const top = ((a.startMin - START) / 60) * HOUR_H;
                const height = Math.max(24, (a.durationMin / 60) * HOUR_H - 3);
                const ossian = a.source === "ossian";
                const compact = height < 44;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onSelect(a.id)}
                    title={`${hm(a.startMin)} · ${a.customer} · ${a.service}`}
                    className={cn(
                      "absolute overflow-hidden rounded-md border-l-[3px] px-1.5 py-1 text-left text-[11px] leading-tight transition-[box-shadow,transform] hover:z-10 hover:shadow-float focus-visible:z-10",
                      ossian
                        ? "border-l-primary bg-[color-mix(in_oklch,var(--primary)_12%,var(--card))] text-foreground"
                        : "border-l-border-strong bg-muted text-foreground",
                      a.status === "en_attente" && "outline outline-1 -outline-offset-1 outline-dashed outline-[color-mix(in_oklch,var(--warning)_70%,transparent)]",
                      a.status === "no_show" && "border-l-danger bg-danger-soft",
                      a.status === "honore" && "opacity-65",
                      a.status === "annule" && "line-through opacity-50",
                      selectedId === a.id && "z-10 ring-2 ring-primary",
                    )}
                    style={{
                      top: top + 1,
                      height,
                      left: `calc(${(a.lane / a.lanes) * 100}% + 3px)`,
                      width: `calc(${100 / a.lanes}% - 5px)`,
                    }}
                  >
                    <span className="flex items-center gap-1 font-medium">
                      <span className="tabular">{hm(a.startMin)}</span>
                      {a.status === "honore" && <Check className="size-3 shrink-0 text-success" aria-label="Honoré" />}
                      {a.status === "no_show" && <UserX className="size-3 shrink-0 text-danger" aria-label="No-show" />}
                      {a.courtesyVehicle && <KeyRound className="size-3 shrink-0 text-muted-foreground" aria-label="Véhicule de courtoisie" />}
                      {compact && <span className="truncate font-normal text-muted-foreground">{a.customer}</span>}
                    </span>
                    {!compact && (
                      <>
                        <span className="block truncate">{a.customer}</span>
                        <span className="block truncate text-muted-foreground">{a.service}</span>
                      </>
                    )}
                  </button>
                );
              })}

              {showNow && week.today === d && (
                <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: ((week.nowMin - START) / 60) * HOUR_H }}>
                  <div className="relative h-px bg-danger">
                    <span className="absolute -top-[4px] -left-[5px] size-[9px] rounded-full bg-danger ring-2 ring-card" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
