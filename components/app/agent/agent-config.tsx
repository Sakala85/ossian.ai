"use client";

import { BookOpen, Fingerprint, Play, Route, ShieldCheck, Waypoints } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { Button, LinkButton } from "@/components/ui/button";
import { LiveDot } from "@/components/ui/misc";
import type { DealershipProfile } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { Page } from "../page-header";
import { useShell } from "../shell-context";
import { Tabs } from "../tabs";
import { ChannelsTab } from "./channels-tab";
import { IdentityTab } from "./identity-tab";
import { KnowledgeTab } from "./knowledge-tab";
import { RoutingTab } from "./routing-tab";
import { RulesTab } from "./rules-tab";
import { initialState, type AgentState, type SetAgent } from "./state";

type Tab = "identity" | "knowledge" | "routing" | "rules" | "channels";

export function AgentConfig({ profile }: { profile: DealershipProfile }) {
  const { toast } = useShell();
  const initial = useMemo(() => initialState(profile), [profile]);
  const [saved, setSaved] = useState<AgentState>(initial);
  const [s, setS] = useState<AgentState>(initial);
  const [tab, setTab] = useState<Tab>("identity");
  const [saving, setSaving] = useState(false);

  const set: SetAgent = useCallback((k, v) => setS((x) => ({ ...x, [k]: v })), []);
  const dirty = useMemo(() => JSON.stringify(s) !== JSON.stringify(saved), [s, saved]);

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      setSaved(s);
      setSaving(false);
      toast(`Configuration de ${s.name} publiée · active sur les 3 sites`);
    }, 700);
  };

  return (
    <Page
      title="Agent"
      subtitle={`Configurez ${s.name || "l'agent"} : sa voix, ce qu'elle sait, à qui elle transfère et les règles qu'elle respecte.`}
      actions={
        <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-border bg-card px-3 text-[13px] shadow-soft">
          <LiveDot /> {s.name || "Agent"} · En ligne
          <span className="text-muted-foreground">· v12</span>
        </span>
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        className="mb-6"
        items={[
          { value: "identity", label: "Identité & voix", icon: <Fingerprint /> },
          { value: "knowledge", label: "Connaissances", icon: <BookOpen /> },
          { value: "routing", label: "Routage & transferts", icon: <Route /> },
          { value: "rules", label: "Règles", icon: <ShieldCheck /> },
          { value: "channels", label: "Canaux", icon: <Waypoints /> },
        ]}
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === "identity" && <IdentityTab s={s} set={set} />}
          {tab === "knowledge" && <KnowledgeTab s={s} set={set} />}
          {tab === "routing" && <RoutingTab s={s} set={set} />}
          {tab === "rules" && <RulesTab s={s} set={set} />}
          {tab === "channels" && <ChannelsTab s={s} set={set} />}
        </motion.div>
      </AnimatePresence>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 z-20 mt-8">
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-xl border bg-popover/90 px-4 py-3 shadow-float backdrop-blur-xl transition-colors",
            dirty ? "border-[color-mix(in_oklch,var(--primary)_35%,var(--border))]" : "border-border",
          )}
        >
          <span className="flex items-center gap-2 text-[13px]">
            <span className={cn("size-2 rounded-full", dirty ? "bg-warning" : "bg-success")} />
            {dirty ? "Modifications non enregistrées" : "Toutes les modifications sont publiées"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            {dirty && (
              <Button variant="ghost" size="sm" onClick={() => setS(saved)}>
                Annuler
              </Button>
            )}
            <LinkButton href="/demo" variant="outline" size="sm">
              <Play /> Tester l&apos;agent
            </LinkButton>
            <Button size="sm" onClick={save} disabled={!dirty || saving}>
              {saving ? "Publication…" : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
