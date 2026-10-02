import { CalendarCheck, Euro, Hourglass, PhoneIncoming, PhoneCall, Target } from "lucide-react";
import { num, pct } from "@/lib/utils";
import { euroCompact, signedPct } from "../format";
import { Sparkline } from "../sparkline";
import { Delta, StatTile } from "../stat-tile";

export type KpiData = {
  calls: number;
  callsDelta: number;
  answerRateBefore: number;
  appointments: number;
  appointmentsDelta: number;
  leads: number;
  leadsDelta: number;
  revenue: number;
  revenueDelta: number;
  hoursSaved: number;
  series: { calls: number[]; appointments: number[]; leads: number[]; revenue: number[]; hours: number[] };
};

export function KpiRow({ k }: { k: KpiData }) {
  const vs = "vs 30 j précédents";
  const gain = Math.round((1 - k.answerRateBefore) * 100);
  return (
    <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <StatTile
        label="Appels traités"
        icon={<PhoneIncoming />}
        value={num(k.calls)}
        delta={<Delta value={k.callsDelta} label={signedPct(k.callsDelta)} />}
        hint={vs}
      >
        <Sparkline values={k.series.calls} label="Appels par jour, 30 derniers jours" />
      </StatTile>

      <StatTile
        label="Taux de décroché"
        icon={<PhoneCall />}
        value="100 %"
        delta={<Delta value={gain} label={`+${gain} pts`} />}
        hint="Décroché en 0,8 s en moyenne"
      >
        <div className="grid gap-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0">Ossian</span>
            <span className="h-1.5 flex-1 rounded-full bg-chart-1" />
            <span className="w-8 text-right text-foreground tabular">100 %</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-10 shrink-0">Avant</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-muted-foreground/45" style={{ width: `${k.answerRateBefore * 100}%` }} />
            </span>
            <span className="w-8 text-right tabular">{pct(k.answerRateBefore)}</span>
          </div>
        </div>
      </StatTile>

      <StatTile
        label="RDV pris"
        icon={<CalendarCheck />}
        value={num(k.appointments)}
        delta={<Delta value={k.appointmentsDelta} label={signedPct(k.appointmentsDelta)} />}
        hint={vs}
      >
        <Sparkline values={k.series.appointments} label="Rendez-vous par jour" />
      </StatTile>

      <StatTile
        label="Leads qualifiés"
        icon={<Target />}
        value={num(k.leads)}
        delta={<Delta value={k.leadsDelta} label={signedPct(k.leadsDelta)} />}
        hint={vs}
      >
        <Sparkline values={k.series.leads} label="Leads par jour" />
      </StatTile>

      <StatTile
        label="CA généré estimé"
        icon={<Euro />}
        value={euroCompact(k.revenue)}
        delta={<Delta value={k.revenueDelta} label={signedPct(k.revenueDelta)} />}
        hint="RDV atelier + leads qualifiés"
      >
        <Sparkline values={k.series.revenue} label="CA estimé par jour" />
      </StatTile>

      <StatTile
        label="Heures libérées"
        icon={<Hourglass />}
        value={num(k.hoursSaved)}
        unit="h"
        delta={<Delta value={k.callsDelta} label={signedPct(k.callsDelta)} />}
        hint="≈ 3,4 min de standard par appel"
      >
        <Sparkline values={k.series.hours} label="Heures libérées par jour" />
      </StatTile>
    </div>
  );
}
