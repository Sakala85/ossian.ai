"use client";

import { CalendarClock, Car, KeyRound, MapPin, MessageSquare, Phone, UserRound, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { euro } from "@/lib/utils";
import { hm, siteShort } from "../format";
import { MiniOrb } from "../mini-orb";
import { OverlayHeader } from "../overlay";
import { useShell } from "../shell-context";
import { STATUS, type CalAppointment, type WeekInfo } from "./types";

export function AppointmentDetail({ a, week, onClose }: { a: CalAppointment; week: WeekInfo; onClose: () => void }) {
  const { toast } = useShell();
  const st = STATUS[a.status];
  const day = week.days[a.day];
  const rows: { icon: React.ReactNode; label: string; value: React.ReactNode }[] = [
    {
      icon: <CalendarClock />,
      label: "Créneau",
      value: (
        <>
          {day?.full} · {hm(a.startMin)}–{hm(a.startMin + a.durationMin)}
          <span className="text-muted-foreground"> ({a.durationMin} min)</span>
        </>
      ),
    },
    { icon: <Wrench />, label: "Prestation", value: a.service },
    {
      icon: <Car />,
      label: "Véhicule",
      value: (
        <>
          {a.vehicle.make} {a.vehicle.model}
          {a.vehicle.plate && <span className="ml-2 rounded border border-border bg-muted px-1.5 py-px font-mono text-xs">{a.vehicle.plate}</span>}
        </>
      ),
    },
    { icon: <MapPin />, label: "Site", value: siteShort(a.siteId) },
    {
      icon: <UserRound />,
      label: "Conseiller",
      value: (
        <span className="inline-flex items-center gap-2">
          <Avatar name={a.advisor} size={20} /> {a.advisor}
        </span>
      ),
    },
    { icon: <KeyRound />, label: "Courtoisie", value: a.courtesyVehicle ? "Véhicule de courtoisie réservé" : "Non" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <OverlayHeader title={a.customer} description={<span className="font-mono">{a.phone}</span>} onClose={onClose} />
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={st.tone} dot>
            {st.label}
          </Badge>
          {a.source === "ossian" ? (
            <Badge tone="primary">
              <MiniOrb size={12} /> Pris par Ossian
            </Badge>
          ) : (
            <Badge>Saisi manuellement</Badge>
          )}
          <span className="ml-auto text-sm font-semibold tabular">{euro(a.estimatedValue)}</span>
        </div>

        <dl className="mt-5 grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 bg-card px-4 py-3">
              <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{r.icon}</span>
              <dt className="w-24 shrink-0 text-[13px] text-muted-foreground">{r.label}</dt>
              <dd className="min-w-0 flex-1 text-[13px] text-foreground">{r.value}</dd>
            </div>
          ))}
        </dl>

        {a.source === "ossian" && (
          <div className="mt-5 rounded-xl border border-border bg-subtle p-4 text-[13px] text-muted-foreground">
            <p className="font-medium text-foreground">Créé par Léa au téléphone</p>
            <p className="mt-1">
              Créneau proposé selon la charge atelier, confirmation SMS envoyée et rappel automatique programmé la veille à 18h.
            </p>
          </div>
        )}

        {a.status === "no_show" && (
          <div className="mt-5 rounded-xl border border-[color-mix(in_oklch,var(--danger)_25%,var(--border))] bg-danger-soft p-4 text-[13px]">
            <p className="font-medium text-foreground">Le client ne s&apos;est pas présenté</p>
            <p className="mt-1 text-muted-foreground">Léa peut le rappeler pour proposer un nouveau créneau dès aujourd&apos;hui.</p>
            <Button size="sm" className="mt-3" onClick={() => toast(`Léa va rappeler ${a.customer} pour reprogrammer`)}>
              Laisser Léa reprogrammer
            </Button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 border-t border-border px-5 py-3">
        <Button variant="outline" size="sm" onClick={() => toast(`Appel vers ${a.phone}…`, "info")}>
          <Phone /> Appeler
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast("SMS de rappel envoyé")}>
          <MessageSquare /> Envoyer un SMS
        </Button>
        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => toast("Reprogrammation ouverte dans le DMS", "info")}>
          Reprogrammer
        </Button>
      </div>
    </div>
  );
}
