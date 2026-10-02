"use client";

import { Inbox, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { LEAD_STAGES, type Lead, type LeadStage } from "@/lib/domain/types";
import { cn, euro } from "@/lib/utils";
import { Sheet } from "../overlay";
import { useShell } from "../shell-context";
import { LeadCard } from "./lead-card";
import { LeadDetail } from "./lead-detail";

const STAGES = Object.keys(LEAD_STAGES) as LeadStage[];
// Ordinal ramp: pipeline position reads as one hue getting stronger.
const STAGE_DOT: Record<LeadStage, string> = {
  nouveau: "color-mix(in oklch, var(--chart-1) 35%, var(--muted))",
  contacte: "color-mix(in oklch, var(--chart-1) 55%, var(--muted))",
  essai: "color-mix(in oklch, var(--chart-1) 75%, var(--muted))",
  offre: "var(--chart-1)",
  gagne: "var(--success)",
  perdu: "var(--muted-foreground)",
};

type InterestFilter = "all" | "VN" | "VO" | "other";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function LeadsBoard({ leads: initial, now, callByLead }: { leads: Lead[]; now: string; callByLead: Record<string, string> }) {
  const { toast } = useShell();
  const [leads, setLeads] = useState(initial);
  const [q, setQ] = useState("");
  const [interest, setInterest] = useState<InterestFilter>("all");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStage | null>(null);
  const [openId, setOpenId] = useState<string>();

  const visible = useMemo(() => {
    const n = norm(q.trim());
    return leads
      .filter((l) => !n || norm(`${l.name} ${l.vehicle} ${l.assignee} ${l.note}`).includes(n))
      .filter((l) => interest === "all" || (interest === "other" ? l.interest !== "VN" && l.interest !== "VO" : l.interest === interest))
      .sort((a, b) => b.score - a.score);
  }, [leads, q, interest]);

  const move = (id: string, stage: LeadStage) => {
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.stage === stage) return;
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));
    toast(`${lead.name} → ${LEAD_STAGES[stage]}`);
  };

  const opened = leads.find((l) => l.id === openId);

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nom, véhicule, vendeur…"
            aria-label="Rechercher un lead"
            className="h-8 w-full rounded-lg border border-input bg-card pr-3 pl-8 text-[13px] shadow-[0_1px_2px_0_oklch(0_0_0/4%)] outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary-soft"
          />
        </div>
        <Segmented
          size="sm"
          value={interest}
          onChange={setInterest}
          options={[
            { value: "all", label: "Tous" },
            { value: "VN", label: "Neuf" },
            { value: "VO", label: "Occasion" },
            { value: "other", label: "LLD · Reprise" },
          ]}
        />
        <span className="ml-auto hidden text-xs text-muted-foreground md:inline">Glissez une carte pour changer d&apos;étape</span>
      </div>

      <div className="scrollbar-thin -mx-4 snap-x snap-mandatory overflow-x-auto px-4 pb-3 md:mx-0 md:snap-none md:px-0">
        <div className="flex min-w-max gap-3">
          {STAGES.map((stage) => {
            const items = visible.filter((l) => l.stage === stage);
            const total = items.reduce((s, l) => s + (l.budget ?? 0), 0);
            return (
              <section
                key={stage}
                aria-label={LEAD_STAGES[stage]}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (over !== stage) setOver(stage);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain") || dragId;
                  if (id) move(id, stage);
                  setOver(null);
                  setDragId(null);
                }}
                className={cn(
                  "flex w-[284px] shrink-0 snap-start flex-col rounded-xl border border-border bg-subtle transition-colors",
                  over === stage && "border-primary/50 bg-primary-soft",
                )}
              >
                <header className="flex items-center gap-2 px-3 pt-3 pb-2">
                  <span className="size-2 rounded-full" style={{ background: STAGE_DOT[stage] }} aria-hidden />
                  <h2 className="text-[13px] font-medium">{LEAD_STAGES[stage]}</h2>
                  <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground tabular">{items.length}</span>
                  {total > 0 && <span className="ml-auto text-[11px] text-muted-foreground tabular">{euro(total)}</span>}
                </header>
                <div className="flex min-h-32 flex-1 flex-col gap-2 px-2 pb-2">
                  {items.map((l) => (
                    <LeadCard
                      key={l.id}
                      lead={l}
                      now={now}
                      onOpen={() => setOpenId(l.id)}
                      dragging={dragId === l.id}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", l.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDragId(l.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border-strong py-6 text-xs text-muted-foreground [&_svg]:size-4">
                      <Inbox />
                      Aucun lead
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <Sheet open={!!opened} onClose={() => setOpenId(undefined)} label="Détail du lead" className="max-w-[480px]">
        {opened && (
          <LeadDetail
            lead={opened}
            callId={callByLead[opened.id]}
            onClose={() => setOpenId(undefined)}
            onStage={(s) => move(opened.id, s)}
          />
        )}
      </Sheet>
    </>
  );
}
