"use client";

import { Moon, PhoneIncoming, PhoneOutgoing, Search, SearchX, X } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { INTENTS, LANGUAGES, OUTCOMES, type CallOutcome, type CallRecord, type Intent, type LanguageCode } from "@/lib/domain/types";
import { cn, duration, num, pct } from "@/lib/utils";
import { IntentBadge, KnownBadge, LangFlag, OutcomeBadge, SentimentDot } from "../badges";
import { EmptyState } from "../empty-state";
import { SITES, dayKey, dayLabel, fmtTime, siteShort } from "../format";
import { Sheet } from "../overlay";
import { CallDetail } from "./call-detail";

type Filters = { q: string; intent: Intent | ""; outcome: CallOutcome | ""; site: string; lang: LanguageCode | ""; afterHours: boolean };
const EMPTY: Filters = { q: "", intent: "", outcome: "", site: "", lang: "", afterHours: false };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "");

const filterCls = "h-8 w-auto rounded-lg py-0 pl-2.5 pr-8 text-[13px] bg-[right_8px_center]";

export function CallsView({ calls, now, initialId }: { calls: CallRecord[]; now: string; initialId?: string }) {
  const [f, setF] = useState<Filters>(EMPTY);
  const [selectedId, setSelectedId] = useState<string | undefined>(initialId);

  useEffect(() => {
    if (initialId) setSelectedId(initialId);
  }, [initialId]);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setF((x) => ({ ...x, [k]: v }));
  const active = JSON.stringify(f) !== JSON.stringify(EMPTY);

  const languages = useMemo(() => [...new Set(calls.map((c) => c.language))], [calls]);
  const sites = useMemo(() => {
    const ids = new Set(calls.map((c) => c.siteId));
    return [...SITES.filter((s) => ids.has(s.id)), ...[...ids].filter((id) => !SITES.some((s) => s.id === id)).map((id) => ({ id, short: siteShort(id) }))];
  }, [calls]);

  const filtered = useMemo(() => {
    const q = norm(f.q);
    return calls.filter(
      (c) =>
        (!q || norm(`${c.caller.name ?? ""} ${c.caller.phone} ${c.summary} ${c.id} ${c.vehicle?.model ?? ""}`).includes(q)) &&
        (!f.intent || c.intent === f.intent) &&
        (!f.outcome || c.outcome === f.outcome) &&
        (!f.site || c.siteId === f.site) &&
        (!f.lang || c.language === f.lang) &&
        (!f.afterHours || c.afterHours),
    );
  }, [calls, f]);

  const stats = useMemo(() => {
    const n = filtered.length || 1;
    return {
      count: filtered.length,
      avg: filtered.reduce((s, c) => s + c.durationSec, 0) / n,
      after: filtered.filter((c) => c.afterHours).length / n,
      booked: filtered.filter((c) => c.outcome === "rdv_pris").length,
      resolved: filtered.filter((c) => c.outcome !== "transfere" && c.outcome !== "abandonne").length / n,
    };
  }, [filtered]);

  // URL sync (?id=) without a server round-trip.
  const select = useCallback((id: string | undefined) => {
    setSelectedId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("id", id);
    else url.searchParams.delete("id");
    window.history.replaceState(null, "", url.toString());
  }, []);

  const list = filtered.some((c) => c.id === selectedId) ? filtered : calls;
  const idx = list.findIndex((c) => c.id === selectedId);
  const selected = idx >= 0 ? list[idx] : undefined;
  const prev = idx > 0 ? list[idx - 1] : undefined;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined;

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      if (e.key === "j" && next) select(next.id);
      if (e.key === "k" && prev) select(prev.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, next, prev, select]);

  let lastDay = "";

  return (
    <>
      {/* Summary strip */}
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-soft md:grid-cols-4">
        <Strip label="Appels" value={num(stats.count)} />
        <Strip label="Résolus sans transfert" value={pct(stats.resolved)} />
        <Strip label="Hors horaires" value={pct(stats.after)} />
        <Strip label="Durée moyenne" value={duration(stats.avg)} />
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={f.q}
            onChange={(e) => set("q", e.target.value)}
            placeholder="Nom, numéro, véhicule…"
            aria-label="Rechercher un appel"
            className="h-8 w-full rounded-lg border border-input bg-card pr-3 pl-8 text-[13px] shadow-[0_1px_2px_0_oklch(0_0_0/4%)] outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary-soft"
          />
        </div>
        <Select aria-label="Motif" value={f.intent} onChange={(e) => set("intent", e.target.value as Intent | "")} className={filterCls}>
          <option value="">Tous les motifs</option>
          {(Object.keys(INTENTS) as Intent[]).map((k) => (
            <option key={k} value={k}>
              {INTENTS[k]}
            </option>
          ))}
        </Select>
        <Select aria-label="Résultat" value={f.outcome} onChange={(e) => set("outcome", e.target.value as CallOutcome | "")} className={filterCls}>
          <option value="">Tous les résultats</option>
          {(Object.keys(OUTCOMES) as CallOutcome[]).map((k) => (
            <option key={k} value={k}>
              {OUTCOMES[k].label}
            </option>
          ))}
        </Select>
        {sites.length > 1 && (
          <Select aria-label="Site" value={f.site} onChange={(e) => set("site", e.target.value)} className={filterCls}>
            <option value="">Tous les sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.short}
              </option>
            ))}
          </Select>
        )}
        {languages.length > 1 && (
          <Select aria-label="Langue" value={f.lang} onChange={(e) => set("lang", e.target.value as LanguageCode | "")} className={filterCls}>
            <option value="">Toutes les langues</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {LANGUAGES[l].flag} {LANGUAGES[l].label}
              </option>
            ))}
          </Select>
        )}
        <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[13px] text-foreground shadow-[0_1px_2px_0_oklch(0_0_0/4%)]">
          <Moon className="size-3.5 text-muted-foreground" />
          Hors horaires
          <Switch checked={f.afterHours} onCheckedChange={(v) => set("afterHours", v)} label="Hors horaires uniquement" className="scale-90" />
        </label>
        {active && (
          <Button variant="ghost" size="xs" onClick={() => setF(EMPTY)}>
            <X /> Réinitialiser
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground tabular">
          {filtered.length} sur {calls.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX />}
            title={calls.length ? "Aucun appel ne correspond" : "Aucun appel pour l'instant"}
            description={
              calls.length
                ? "Essayez d'élargir la recherche ou de retirer un filtre."
                : "Chaque appel décroché apparaîtra ici avec son résumé, les informations notées et la transcription."
            }
            action={
              calls.length ? (
                <Button variant="outline" size="sm" onClick={() => setF(EMPTY)}>
                  Réinitialiser les filtres
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[980px] text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="w-[92px] py-2.5 pr-3 pl-4 font-medium">Heure</th>
                  <th className="px-3 py-2.5 font-medium">Appelant</th>
                  <th className="px-3 py-2.5 font-medium">Motif</th>
                  <th className="px-3 py-2.5 font-medium">Résultat</th>
                  <th className="px-3 py-2.5 text-right font-medium">Durée</th>
                  <th className="px-3 py-2.5 font-medium">Langue</th>
                  <th className="px-3 py-2.5 font-medium">Site</th>
                  <th className="py-2.5 pr-4 pl-3 text-center font-medium">
                    <span className="sr-only">Sentiment</span>
                    <span aria-hidden>Ressenti</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const k = dayKey(c.startedAt);
                  const header = k !== lastDay;
                  lastDay = k;
                  const Dir = c.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
                  const isSel = c.id === selectedId;
                  return (
                    <Fragment key={c.id}>
                      {header && (
                        <tr className="bg-subtle">
                          <td colSpan={8} className="border-b border-border py-1.5 pr-4 pl-4 text-xs font-medium text-muted-foreground">
                            {dayLabel(c.startedAt, now)}
                            <span className="ml-2 font-normal text-muted-foreground/70 tabular">
                              {filtered.filter((x) => dayKey(x.startedAt) === k).length} appels
                            </span>
                          </td>
                        </tr>
                      )}
                      <tr
                        tabIndex={0}
                        onClick={() => select(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            select(c.id);
                          }
                        }}
                        aria-label={`Appel de ${c.caller.name ?? c.caller.phone}, ${INTENTS[c.intent]}`}
                        className={cn(
                          "cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none",
                          isSel && "bg-primary-soft hover:bg-primary-soft",
                        )}
                      >
                        <td className="py-2.5 pr-3 pl-4">
                          <span className="inline-flex items-center gap-2 text-muted-foreground tabular">
                            <Dir className="size-3.5" aria-label={c.direction === "outbound" ? "Sortant" : "Entrant"} />
                            <span className="text-foreground">{fmtTime(c.startedAt)}</span>
                            {c.afterHours && <Moon className="size-3 text-primary" aria-label="Hors horaires" />}
                          </span>
                        </td>
                        <td className="max-w-[280px] px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className={cn("truncate font-medium", !c.caller.name && "font-mono text-[12.5px] font-normal")}>
                              {c.caller.name ?? c.caller.phone}
                            </span>
                            {c.caller.known && <KnownBadge />}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{c.summary}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <IntentBadge intent={c.intent} />
                        </td>
                        <td className="px-3 py-2.5">
                          <OutcomeBadge outcome={c.outcome} />
                        </td>
                        <td className="px-3 py-2.5 text-right text-muted-foreground tabular">{duration(c.durationSec)}</td>
                        <td className="px-3 py-2.5">
                          <LangFlag code={c.language} />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{siteShort(c.siteId)}</td>
                        <td className="py-2.5 pr-4 pl-3 text-center">
                          <SentimentDot sentiment={c.sentiment} />
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Sheet open={!!selected} onClose={() => select(undefined)} label="Détail de l'appel">
        {selected && (
          <CallDetail
            key={selected.id}
            call={selected}
            now={now}
            onClose={() => select(undefined)}
            onPrev={prev ? () => select(prev.id) : undefined}
            onNext={next ? () => select(next.id) : undefined}
          />
        )}
      </Sheet>
    </>
  );
}

function Strip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold tracking-tight">{value}</div>
    </div>
  );
}
