import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { AppointmentsView } from "@/components/app/appointments/appointments-view";
import type { CalAppointment, WeekInfo } from "@/components/app/appointments/types";
import { Page } from "@/components/app/page-header";
import { ToastButton } from "@/components/app/toast-button";
import { getAppointments } from "@/lib/demo/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rendez-vous" };

const DAY_SHORT = ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const DAY_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const MONTHS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const MONTHS_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/*
 * The demo generator lays the week out in the server's local wall-clock
 * (setHours). We therefore derive calendar coordinates with the same local
 * getters, so slots render at their intended times whatever the server TZ.
 */
export default function AppointmentsPage() {
  const now = new Date();
  const appts = getAppointments(now);

  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));

  const days = DAY_SHORT.map((label, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return { label, date: d.getDate(), full: `${DAY_LONG[i]} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`, month: d.getMonth() };
  });
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const todayIdx = (now.getDay() + 6) % 7;

  const week: WeekInfo = {
    days: days.map(({ label, date, full }) => ({ label, date, full })),
    rangeLabel: `Semaine du ${first.date}${first.month !== last.month ? ` ${MONTHS[first.month]}` : ""} au ${last.date} ${MONTHS[last.month]}`,
    today: todayIdx < 6 ? todayIdx : null,
    nowMin: now.getHours() * 60 + now.getMinutes(),
  };

  const items: CalAppointment[] = appts.map((a) => {
    const d = new Date(a.start);
    return { ...a, day: (d.getDay() + 6) % 7, startMin: d.getHours() * 60 + d.getMinutes() };
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
