"use client";

import { Pause, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Campaign } from "@/lib/domain/types";
import { num, pct } from "@/lib/utils";
import { fmtDateShort } from "../format";
import { CHANNEL_META, STATUS_META, TYPE_META } from "./meta";

// Ordinal ramp (funnel stage): one hue, stronger as the funnel narrows.
const STEPS = [
  { key: "audience", label: "Audience", color: "color-mix(in oklch, var(--chart-1) 28%, var(--card))" },
  { key: "called", label: "Appelés", color: "color-mix(in oklch, var(--chart-1) 50%, var(--card))" },
  { key: "reached", label: "Joints", color: "color-mix(in oklch, var(--chart-1) 74%, var(--card))" },
  { key: "converted", label: "Convertis", color: "var(--chart-1)" },
] as const;

export function CampaignRow({
  c,
  now,
  paused,
  onToggle,
  onReport,
}: {
  c: Campaign;
  now: string;
  paused?: boolean;
  onToggle: () => void;
  onReport: () => void;
}) {
  const meta = TYPE_META[c.type];
  const status = paused ? { label: "En pause", tone: "warning" as const } : STATUS_META[c.status];
  const Icon = meta.icon;
  const future = new Date(c.startedAt).getTime() > new Date(now).getTime();
  const conv = c.reached ? c.converted / c.reached : 0;

  return (
    <article className="grid gap-5 rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-border-strong md:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_150px] lg:items-center">
      {/* Identity */}
      <div className="flex min-w-0 gap-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-subtle text-foreground [&_svg]:size-4.5">
          <Icon />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-foreground">{c.name}</h3>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={status.tone} dot>
              {status.label}
            </Badge>
            {c.channel.map((ch) => {
              const CI = CHANNEL_META[ch].icon;
              return (
                <span
                  key={ch}
                  className="inline-flex h-5.5 items-center gap-1 rounded-full border border-border px-2 text-[11.5px] text-muted-foreground [&_svg]:size-3"
                >
                  <CI /> {CHANNEL_META[ch].label}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {meta.label} · {future ? "Démarre le" : "Lancée le"} {fmtDateShort(c.startedAt)}
          </p>
        </div>
      </div>

      {/* Funnel */}
      <div className="grid gap-1.5" role="img" aria-label={STEPS.map((s) => `${s.label} ${c[s.key]}`).join(", ")}>
        {STEPS.map((s) => {
          const v = c[s.key];
          const w = c.audience ? (v / c.audience) * 100 : 0;
          return (
            <div key={s.key} className="grid grid-cols-[70px_minmax(0,1fr)_44px] items-center gap-2.5 text-xs">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.max(v > 0 ? 1.5 : 0, w)}%`, background: s.color }}
                />
              </span>
              <span className="text-right font-medium text-foreground tabular">{num(v)}</span>
            </div>
          );
        })}
      </div>

      {/* Result */}
      <div className="flex items-center justify-between gap-3 border-t border-border pt-4 lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
        <div className="lg:text-right">
          <div className="text-[22px] leading-none font-semibold tracking-[-0.03em]">{c.called ? num(c.converted) : "—"}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {meta.result}
            {c.reached > 0 && <span className="text-foreground"> · {pct(conv)}</span>}
          </div>
        </div>
        {c.status === "terminee" ? (
          <Button variant="ghost" size="xs" onClick={onReport}>
            Voir le rapport
          </Button>
        ) : (
          <Button variant="outline" size="xs" onClick={onToggle}>
            {c.status === "active" && !paused ? (
              <>
                <Pause /> Mettre en pause
              </>
            ) : (
              <>
                <Play /> {paused ? "Reprendre" : c.status === "brouillon" ? "Lancer" : "Démarrer"}
              </>
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
