"use client";

import { KeyRound } from "lucide-react";
import { Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { cn, euro } from "@/lib/utils";
import { hm, siteShort } from "../format";
import { MiniOrb } from "../mini-orb";
import { STATUS, type CalAppointment, type WeekInfo } from "./types";

export function AppointmentList({
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
  const sorted = [...items].sort((a, b) => a.day - b.day || a.startMin - b.startMin);
  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full min-w-[900px] text-[13px]">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2.5 pr-3 pl-4 font-medium">Heure</th>
            <th className="px-3 py-2.5 font-medium">Client</th>
            <th className="px-3 py-2.5 font-medium">Véhicule</th>
            <th className="px-3 py-2.5 font-medium">Prestation</th>
            <th className="px-3 py-2.5 font-medium">Conseiller</th>
            <th className="px-3 py-2.5 font-medium">Source</th>
            <th className="px-3 py-2.5 font-medium">Statut</th>
            <th className="py-2.5 pr-4 pl-3 text-right font-medium">Valeur</th>
          </tr>
        </thead>
        <tbody>
          {week.days.map((d, di) => {
            const rows = sorted.filter((a) => a.day === di);
            if (!rows.length) return null;
            return (
              <Fragment key={d.full}>
                <tr className="bg-subtle">
                  <td colSpan={8} className="border-b border-border px-4 py-1.5 text-xs font-medium text-muted-foreground">
                    {d.full}
                    {week.today === di && <span className="ml-2 text-primary">Aujourd&apos;hui</span>}
                    <span className="ml-2 font-normal text-muted-foreground/70 tabular">{rows.length} RDV</span>
                  </td>
                </tr>
                {rows.map((a) => {
                  const st = STATUS[a.status];
                  return (
                    <tr
                      key={a.id}
                      tabIndex={0}
                      onClick={() => onSelect(a.id)}
                      onKeyDown={(e) => e.key === "Enter" && onSelect(a.id)}
                      className={cn(
                        "cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none",
                        selectedId === a.id && "bg-primary-soft hover:bg-primary-soft",
                      )}
                    >
                      <td className="py-2.5 pr-3 pl-4 tabular">
                        {hm(a.startMin)}
                        <span className="text-muted-foreground"> · {a.durationMin} min</span>
                      </td>
                      <td className="px-3 py-2.5 font-medium">{a.customer}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-foreground">
                          {a.vehicle.make} {a.vehicle.model}
                        </span>
                        {a.vehicle.plate && <span className="ml-2 font-mono text-xs text-muted-foreground">{a.vehicle.plate}</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          {a.service}
                          {a.courtesyVehicle && <KeyRound className="size-3 text-muted-foreground" aria-label="Véhicule de courtoisie" />}
                        </span>
                        <span className="block text-xs text-muted-foreground">{siteShort(a.siteId)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-2">
                          <Avatar name={a.advisor} size={20} />
                          {a.advisor}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {a.source === "ossian" ? (
                          <span className="inline-flex items-center gap-1.5 text-foreground">
                            <MiniOrb size={14} /> Ossian
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Manuel</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={st.tone} dot>
                          {st.label}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 pl-3 text-right tabular">{a.estimatedValue ? euro(a.estimatedValue) : "Offert"}</td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
