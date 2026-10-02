"use client";

import { CalendarDays, ChevronLeft, ChevronRight, List } from "lucide-react";
import { useMemo, useState } from "react";
import { Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { euro, pct } from "@/lib/utils";
import { SITES } from "../format";
import { Sheet } from "../overlay";
import { Delta, StatTile } from "../stat-tile";
import { AppointmentDetail } from "./appointment-detail";
import { AppointmentList } from "./appointment-list";
import type { CalAppointment, WeekInfo } from "./types";
import { WeekCalendar } from "./week-calendar";

export function AppointmentsView({ items, week }: { items: CalAppointment[]; week: WeekInfo }) {
  const [view, setView] = useState<"week" | "list">("week");
  const [site, setSite] = useState("");
  const [selectedId, setSelectedId] = useState<string>();

  const visible = useMemo(() => items.filter((a) => !site || a.siteId === site), [items, site]);
  const stats = useMemo(() => {
    const active = visible.filter((a) => a.status !== "annule");
    const past = visible.filter((a) => a.status === "honore" || a.status === "no_show");
    const noShows = past.filter((a) => a.status === "no_show").length;
    return {
      count: active.length,
      ossian: active.length ? active.filter((a) => a.source === "ossian").length / active.length : 0,
      noShow: past.length ? noShows / past.length : null,
      noShows,
      revenue: active.reduce((s, a) => s + a.estimatedValue, 0),
    };
  }, [visible]);

  const selected = items.find((a) => a.id === selectedId);

  return (
    <>
      <div className="mb-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatTile label="RDV cette semaine" value={stats.count} delta={<Delta value={0.14} label="+14 %" />} hint="vs semaine précédente" />
        <StatTile label="Pris par Ossian" value={pct(stats.ossian)} hint="Au téléphone, 24h/24, sans ressaisie">
          <div className="flex h-1.5 w-full gap-0.5">
            <span className="rounded-l-full bg-chart-1" style={{ width: `${stats.ossian * 100}%` }} />
            <span className="flex-1 rounded-r-full bg-muted" />
          </div>
        </StatTile>
        <StatTile
          label="Taux de no-show"
          value={stats.noShow === null ? "—" : pct(stats.noShow, 1)}
          delta={stats.noShow === null ? undefined : <Delta value={-0.6} goodWhenUp={false} label="−6 pts" />}
          hint={stats.noShow === null ? "Aucun RDV passé cette semaine" : `${stats.noShows} absence(s) · rappel SMS J−1 actif`}
        />
        <StatTile label="CA atelier estimé" value={euro(stats.revenue)} hint="Valeur estimée des RDV de la semaine" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled
              aria-label="Semaine précédente"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground disabled:opacity-40 [&_svg]:size-4"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              disabled
              aria-label="Semaine suivante"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground disabled:opacity-40 [&_svg]:size-4"
            >
              <ChevronRight />
            </button>
          </div>
          <p className="text-sm font-medium">{week.rangeLabel}</p>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ul className="mr-2 hidden items-center gap-4 text-xs text-muted-foreground xl:flex">
              <li className="inline-flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-full bg-primary" /> Pris par Ossian
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-full bg-border-strong" /> Saisi manuellement
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-3 w-1 rounded-full bg-danger" /> No-show
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-[3px] outline outline-1 -outline-offset-1 outline-dashed outline-warning" /> En attente
              </li>
            </ul>
            <Select
              aria-label="Site"
              value={site}
              onChange={(e) => setSite(e.target.value)}
              className="h-8 w-auto rounded-lg py-0 pr-8 pl-2.5 text-[13px] bg-[right_8px_center]"
            >
              <option value="">Tous les sites</option>
              {SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.short}
                </option>
              ))}
            </Select>
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              options={[
                { value: "week", label: <><CalendarDays /> Semaine</> },
                { value: "list", label: <><List /> Liste</> },
              ]}
            />
          </div>
        </div>

        {view === "week" ? (
          <WeekCalendar items={visible} week={week} onSelect={setSelectedId} selectedId={selectedId} />
        ) : (
          <AppointmentList items={visible} week={week} onSelect={setSelectedId} selectedId={selectedId} />
        )}
      </div>

      <Sheet open={!!selected} onClose={() => setSelectedId(undefined)} label="Détail du rendez-vous" className="max-w-[460px]">
        {selected && <AppointmentDetail a={selected} week={week} onClose={() => setSelectedId(undefined)} />}
      </Sheet>
    </>
  );
}
