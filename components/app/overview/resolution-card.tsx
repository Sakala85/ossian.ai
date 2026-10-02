import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OUTCOMES, type CallOutcome } from "@/lib/domain/types";
import { pct } from "@/lib/utils";

const GROUPS = [
  { key: "ai", label: "Résolus par Léa", color: "var(--chart-1)", outcomes: ["rdv_pris", "lead_cree", "info_donnee"] },
  { key: "transfer", label: "Transférés", color: "var(--chart-2)", outcomes: ["transfere"] },
  { key: "other", label: "Rappels & raccrochés", color: "var(--chart-6)", outcomes: ["rappel_programme", "abandonne"] },
] as const satisfies readonly { key: string; label: string; color: string; outcomes: readonly CallOutcome[] }[];

/** Part-to-whole of call outcomes: one stacked bar (3 groups) + the detail list. */
export function ResolutionCard({ counts }: { counts: Record<CallOutcome, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  const groups = GROUPS.map((g) => ({ ...g, value: g.outcomes.reduce((s, o) => s + counts[o], 0) }));
  const ai = groups[0]!.value / total;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Issue des appels</CardTitle>
          <CardDescription>Sur les 7 derniers jours</CardDescription>
        </div>
      </CardHeader>
      <div className="px-5 pt-4 pb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-[28px] leading-none font-semibold tracking-[-0.03em]">{pct(ai)}</span>
          <span className="text-xs text-muted-foreground">résolus sans intervention humaine</span>
        </div>

        <div className="mt-4 flex h-2.5 w-full gap-0.5" role="img" aria-label={groups.map((g) => `${g.label} ${pct(g.value / total)}`).join(", ")}>
          {groups.map((g, i) => (
            <span
              key={g.key}
              className={i === 0 ? "rounded-l-[4px]" : i === groups.length - 1 ? "rounded-r-[4px]" : ""}
              style={{ width: `${(g.value / total) * 100}%`, background: g.color }}
              title={`${g.label} · ${pct(g.value / total)}`}
            />
          ))}
        </div>

        <ul className="mt-4 grid gap-0.5 text-[13px]">
          {groups.flatMap((g) =>
            g.outcomes.map((o) => (
              <li key={o} className="flex h-7 items-center gap-2.5 rounded-md px-1 transition-colors hover:bg-subtle">
                <span className="size-2 rounded-[2px]" style={{ background: g.color }} aria-hidden />
                <span className="flex-1 text-foreground">{OUTCOMES[o].label}</span>
                <span className="text-xs text-muted-foreground tabular">{counts[o]}</span>
                <span className="w-10 text-right font-medium tabular">{pct(counts[o] / total)}</span>
              </li>
            )),
          )}
        </ul>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
          {groups.map((g) => (
            <span key={g.key} className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-[2px]" style={{ background: g.color }} /> {g.label}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
