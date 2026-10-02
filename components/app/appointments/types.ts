import type { Appointment, AppointmentStatus } from "@/lib/domain/types";
import type { Tone } from "@/components/ui/badge";

/** Appointment enriched with wall-clock coordinates computed on the server. */
export type CalAppointment = Appointment & { day: number; startMin: number };

export type WeekInfo = {
  days: { label: string; date: number; full: string }[];
  rangeLabel: string;
  today: number | null;
  nowMin: number;
};

export const STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  confirme: { label: "Confirmé", tone: "success" },
  en_attente: { label: "En attente", tone: "warning" },
  honore: { label: "Honoré", tone: "neutral" },
  no_show: { label: "No-show", tone: "danger" },
  annule: { label: "Annulé", tone: "neutral" },
};
