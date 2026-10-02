"use client";

import { CalendarCheck, CalendarClock, CalendarX, Check, KeyRound, Phone, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DbAppointment } from "@/lib/server/db";
import { formatFrench } from "@/lib/voice/phone";
import { STATUS } from "../appointments/types";
import { EmptyState } from "../empty-state";
import { fmtDayShort, fmtTime, relTime } from "../format";
import { StatTile } from "../stat-tile";
import { useShell } from "../shell-context";
import { useAccountAction } from "./use-account-action";

const phone = (p: string) => (p.startsWith("+") ? formatFrench(p) : p);

function Row({ a, now }: { a: DbAppointment; now: number }) {
  const { update, pending } = useAccountAction();
  const busy = pending === a.id;
  const start = new Date(a.starts_at).getTime();
  const past = start < now - 2 * 3600_000;
  const st = STATUS[a.status as keyof typeof STATUS] ?? STATUS.en_attente;
  const vehicle = [a.vehicle.label, a.vehicle.plate, a.vehicle.mileage && `${a.vehicle.mileage} km`].filter(Boolean).join(" · ");

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5">
      <div className="w-[72px] shrink-0 text-center">
        <p className="text-xs text-muted-foreground">{fmtDayShort(a.starts_at)}</p>
        <p className="font-mono text-sm font-medium text-foreground tabular">{fmtTime(a.starts_at)}</p>
      </div>
      <div className="min-w-0 flex-1 basis-56">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{a.customer_name}</span>
          <span className="text-muted-foreground">·</span>
          <span className="truncate font-normal">{a.service}</span>
          {a.courtesy_vehicle && (
            <Badge tone="info">
              <KeyRound /> Courtoisie
            </Badge>
          )}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {vehicle || "Véhicule non précisé"} · demandé {relTime(a.created_at, now)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {a.phone && (
          <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-xs text-primary tabular hover:bg-primary-soft">
            <Phone className="size-3.5" /> {phone(a.phone)}
          </a>
        )}
        {a.status === "en_attente" ? (
          <>
            <Button size="xs" disabled={busy} onClick={() => update(a.id, { kind: "appointment", value: "confirme" }, `RDV de ${a.customer_name} confirmé`)}>
              <Check /> Confirmer
            </Button>
            <Button
              size="xs"
              variant="ghost"
              disabled={busy}
              onClick={() => update(a.id, { kind: "appointment", value: "annule" }, `Demande de ${a.customer_name} annulée`)}
            >
              <X /> Annuler
            </Button>
          </>
        ) : a.status === "confirme" && past ? (
          <>
            <Button size="xs" variant="outline" disabled={busy} onClick={() => update(a.id, { kind: "appointment", value: "honore" }, "Marqué comme venu")}>
              Venu
            </Button>
            <Button size="xs" variant="ghost" disabled={busy} onClick={() => update(a.id, { kind: "appointment", value: "no_show" }, "Marqué comme absent")}>
              Absent
            </Button>
          </>
        ) : (
          <Badge tone={st.tone} dot>
            {st.label}
          </Badge>
        )}
      </div>
    </li>
  );
}

function Section({ title, hint, items, now }: { title: string; hint: string; items: DbAppointment[]; now: number }) {
  if (!items.length) return null;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-medium">
          {title} <span className="ml-1 font-mono text-xs text-muted-foreground tabular">{items.length}</span>
        </h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ul className="divide-y divide-border">
        {items.map((a) => (
          <Row key={a.id} a={a} now={now} />
        ))}
      </ul>
    </Card>
  );
}

/** Appointment requests taken by the agent, to confirm in the dealership's own planning. */
export function LiveAppointments({ appointments, now: nowIso }: { appointments: DbAppointment[]; now: string }) {
  const { workspace } = useShell();
  const now = new Date(nowIso).getTime();
  const byStart = [...appointments].sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const pendingItems = byStart.filter((a) => a.status === "en_attente");
  const upcoming = byStart.filter((a) => a.status === "confirme" && new Date(a.starts_at).getTime() >= now - 2 * 3600_000);
  const confirmedPast = byStart.filter((a) => a.status === "confirme" && new Date(a.starts_at).getTime() < now - 2 * 3600_000);
  const history = byStart.filter((a) => a.status !== "en_attente" && a.status !== "confirme").reverse();

  return (
    <div className="grid gap-4 md:gap-5">
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
        <StatTile label="À confirmer" icon={<CalendarClock />} value={pendingItems.length} hint="Demandes prises au téléphone" />
        <StatTile label="À venir" icon={<CalendarCheck />} value={upcoming.length} hint="Confirmés par votre équipe" />
        <StatTile label="Total des demandes" icon={<CalendarX />} value={appointments.length} hint={`Depuis l'activation de ${workspace.agent.name}`} />
      </div>

      {appointments.length === 0 ? (
        <Card>
          <EmptyState
            icon={<CalendarClock />}
            title="Aucune demande de rendez-vous pour l'instant"
            description={`Quand un client demande un créneau, ${workspace.agent.name} note le besoin, le véhicule et le créneau souhaité. La demande arrive ici et par e-mail, à confirmer dans votre planning.`}
          />
        </Card>
      ) : (
        <>
          <Section title="À confirmer" hint="Appelez ou confirmez dans votre planning, puis cochez ici" items={pendingItems} now={now} />
          <Section title="Passés, à pointer" hint="Le client est-il venu ?" items={confirmedPast} now={now} />
          <Section title="À venir" hint="Rendez-vous confirmés" items={upcoming} now={now} />
          <Section title="Historique" hint="Honorés, absents, annulés" items={history} now={now} />
        </>
      )}
    </div>
  );
}
