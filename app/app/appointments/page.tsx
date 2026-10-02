import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { AppointmentsView } from "@/components/app/appointments/appointments-view";
import type { CalAppointment, WeekInfo } from "@/components/app/appointments/types";
import { Page } from "@/components/app/page-header";
import { ToastButton } from "@/components/app/toast-button";
import { LiveAppointments } from "@/components/app/live/live-appointments";
import { getAppointments } from "@/lib/demo/data";
import { getAccount } from "@/lib/server/account";
import { addDays, parisParts } from "@/lib/agent/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rendez-vous" };

const DAY_SHORT = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const DAY_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/* Appointments are real instants; the grid is laid out in Paris time whatever the server TZ. */
export default async function AppointmentsPage() {
  const now = new Date();
  const account = await getAccount();
  if (account) {
    const agent = account.dealership.agent_name ?? "Léa";
    return (
      <Page
        title="Rendez-vous"
        subtitle={`Les demandes de rendez-vous notées par ${agent} au téléphone. Confirmez-les dans votre planning, puis pointez-les ici.`}
      >
        <LiveAppointments appointments={account.appointments} now={now.toISOString()} />
      </Page>
    );
  }
  const appts = getAppointments(now);

  // Everything in Paris time so the grid matches the times shown elsewhere.
  const today = parisParts(now);
  const monday = addDays(today.date, -((today.weekday + 6) % 7));

  const days = DAY_SHORT.map((label, i) => {
    const iso = addDays(monday, i);
    const date = Number(iso.slice(8, 10));
    const month = Number(iso.slice(5, 7)) - 1;
    return { label, date, full: `${DAY_LONG[i]} ${date} ${MONTHS_LONG[month]}`, month };
  });
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const todayIdx = (today.weekday + 6) % 7;

  const week: WeekInfo = {
    days: days.map(({ label, date, full }) => ({ label, date, full })),
    rangeLabel: `Semaine du ${first.date}${first.month !== last.month ? ` ${MONTHS[first.month]}` : ""} au ${last.date} ${MONTHS[last.month]}`,
    today: todayIdx < 6 ? todayIdx : null,
    nowMin: today.hour * 60 + today.minute,
  };

  const items: CalAppointment[] = appts.map((a) => {
    const p = parisParts(new Date(a.start));
    return { ...a, day: (p.weekday + 6) % 7, startMin: p.hour * 60 + p.minute };
  });

  return (
    <Page
      title="Rendez-vous"
      subtitle="Planning atelier synchronisé avec votre DMS. Les créneaux pris par Léa apparaissent en violet."
      actions={
        <ToastButton size="sm" message="Nouveau rendez-vous : formulaire ouvert dans le DMS" tone="info">
          <Plus /> Nouveau RDV
        </ToastButton>
      }
    >
      <AppointmentsView items={items} week={week} />
    </Page>
  );
}
