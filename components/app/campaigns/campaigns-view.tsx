"use client";

import { Megaphone, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import type { Campaign } from "@/lib/domain/types";
import { num, pct } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import { Page } from "../page-header";
import { useShell } from "../shell-context";
import { StatTile } from "../stat-tile";
import { CampaignRow } from "./campaign-row";
import { NewCampaignModal } from "./new-campaign-modal";

type Filter = "all" | "active" | "planifiee" | "terminee";

export function CampaignsView({ campaigns: initial, now, openNew }: { campaigns: Campaign[]; now: string; openNew?: boolean }) {
  const { toast } = useShell();
  const [campaigns, setCampaigns] = useState(initial);
  const [paused, setPaused] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  const [modal, setModal] = useState(!!openNew);

  useEffect(() => {
    if (openNew) setModal(true);
  }, [openNew]);

  const stats = useMemo(() => {
    const called = campaigns.reduce((s, c) => s + c.called, 0);
    const reached = campaigns.reduce((s, c) => s + c.reached, 0);
    return {
      active: campaigns.filter((c) => c.status === "active" && !paused.has(c.id)).length,
      called,
      reach: called ? reached / called : 0,
      converted: campaigns.reduce((s, c) => s + c.converted, 0),
    };
  }, [campaigns, paused]);

  const visible = campaigns.filter((c) => filter === "all" || c.status === filter);

  const toggle = (c: Campaign) => {
    if (c.status === "active") {
      setPaused((p) => {
        const x = new Set(p);
        if (x.has(c.id)) {
          x.delete(c.id);
          toast(`« ${c.name} » a repris`);
        } else {
          x.add(c.id);
          toast(`« ${c.name} » est en pause`, "info");
        }
        return x;
      });
    } else {
      setCampaigns((cs) => cs.map((x) => (x.id === c.id ? { ...x, status: "active", startedAt: now } : x)));
      toast(`« ${c.name} » est lancée : Léa commence les appels`);
    }
  };

  const closeModal = () => {
    setModal(false);
    const url = new URL(window.location.href);
    if (url.searchParams.has("new")) {
      url.searchParams.delete("new");
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <Page
      title="Campagnes"
      subtitle="Appels sortants automatisés : Léa rappelle vos clients au bon moment et remplit le planning atelier."
      range
      actions={
        <Button size="sm" onClick={() => setModal(true)}>
          <Plus /> Nouvelle campagne
        </Button>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Campagnes actives" value={stats.active} hint={`${campaigns.length} campagnes au total`} />
        <StatTile label="Appels sortants" value={num(stats.called)} hint="Passés par Léa ce mois-ci" />
        <StatTile label="Taux de joignabilité" value={pct(stats.reach)} hint="Clients joints sur appels passés" />
        <StatTile label="Conversions" value={num(stats.converted)} hint="RDV, devis acceptés, avis, reprogrammations" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Toutes" },
            { value: "active", label: "En cours" },
            { value: "planifiee", label: "Planifiées" },
            { value: "terminee", label: "Terminées" },
          ]}
        />
        <ul className="ml-auto hidden items-center gap-3 text-[11px] text-muted-foreground sm:flex">
          {["Audience", "Appelés", "Joints", "Convertis"].map((l, i) => (
            <li key={l} className="inline-flex items-center gap-1.5">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ background: i === 3 ? "var(--chart-1)" : `color-mix(in oklch, var(--chart-1) ${[28, 50, 74][i]}%, var(--card))` }}
              />
              {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3">
        {visible.map((c) => (
          <CampaignRow
            key={c.id}
            c={c}
            now={now}
            paused={paused.has(c.id)}
            onToggle={() => toggle(c)}
            onReport={() => toast("Rapport de campagne exporté (PDF)")}
          />
        ))}
        {visible.length === 0 && (
          <div className="rounded-xl border border-dashed border-border-strong">
            <EmptyState
              icon={<Megaphone />}
              title="Aucune campagne dans cette vue"
              description="Créez une campagne à partir d'un modèle : Léa s'occupe des appels."
              action={
                <Button size="sm" onClick={() => setModal(true)}>
                  <Plus /> Nouvelle campagne
                </Button>
              }
            />
          </div>
        )}
      </div>

      <NewCampaignModal
        open={modal}
        onClose={closeModal}
        onCreate={({ startsIn, ...c }) => {
          const startedAt = new Date(new Date(now).getTime() + startsIn * 86_400_000).toISOString();
          setCampaigns((cs) => [{ ...c, id: `cmp_${Date.now()}`, startedAt }, ...cs]);
          setFilter("all");
          closeModal();
          toast(c.status === "active" ? `« ${c.name} » est lancée` : `« ${c.name} » est programmée`);
        }}
      />
    </Page>
  );
}
