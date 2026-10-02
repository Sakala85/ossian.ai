"use client";

import { Bell, Search, SearchX, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Integration } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "../empty-state";
import { useShell } from "../shell-context";
import { ConnectModal } from "./connect-modal";
import { Monogram } from "./monogram";

const CATEGORIES: Integration["category"][] = ["DMS", "CRM", "Agenda", "Téléphonie", "Messagerie", "Automatisation", "Avis clients"];

const STATUS = {
  connecte: { label: "Connecté", tone: "success" as const },
  disponible: { label: "Disponible", tone: "neutral" as const },
  bientot: { label: "Bientôt", tone: "info" as const },
};

export function IntegrationsView({ integrations }: { integrations: Integration[] }) {
  const { toast } = useShell();
  const [items, setItems] = useState(integrations);
  const [cat, setCat] = useState<Integration["category"] | "all">("all");
  const [q, setQ] = useState("");
  const [current, setCurrent] = useState<Integration | null>(null);
  const [open, setOpen] = useState(false);

  const visible = useMemo(
    () =>
      items.filter(
        (i) => (cat === "all" || i.category === cat) && (!q.trim() || `${i.name} ${i.description}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, cat, q],
  );
  const connected = items.filter((i) => i.status === "connecte").length;

  const setStatus = (id: string, status: Integration["status"]) => {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, status } : x)));
    setCurrent((c) => (c && c.id === id ? { ...c, status } : c));
  };

  const openFor = (i: Integration) => {
    if (i.status === "bientot") {
      toast(`Nous vous préviendrons dès que ${i.name} sera disponible`, "info");
      return;
    }
    setCurrent(i);
    setOpen(true);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="scrollbar-none -mx-4 flex max-w-[calc(100%+2rem)] items-center gap-1.5 overflow-x-auto px-4 md:mx-0 md:max-w-full md:px-0">
          {(["all", ...CATEGORIES] as const).map((c) => {
            const count = c === "all" ? items.length : items.filter((i) => i.category === c).length;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors",
                  cat === c ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
                )}
              >
                {c === "all" ? "Toutes" : c}
                <span className={cn("text-[11px] tabular", cat === c ? "text-background/70" : "text-muted-foreground/70")}>{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative ml-auto w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher une intégration"
            className="h-8 w-full rounded-lg border border-input bg-card pr-3 pl-8 text-[13px] outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary-soft"
          />
        </div>
      </div>

      <p className="mb-4 text-[13px] text-muted-foreground">
        <span className="font-medium text-foreground tabular">{connected}</span> intégrations connectées · synchronisation temps réel
      </p>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong">
          <EmptyState icon={<SearchX />} title="Aucune intégration trouvée" description="Votre outil n'est pas listé ? Notre équipe connecte tout DMS disposant d'une API." />
        </div>
      ) : (
        <div className="grid gap-8">
          {CATEGORIES.filter((c) => visible.some((i) => i.category === c)).map((c) => (
            <section key={c}>
              <h2 className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">{c}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {visible
                  .filter((i) => i.category === c)
                  .map((i) => {
                    const st = STATUS[i.status];
                    return (
                      <article
                        key={i.id}
                        className={cn(
                          "flex flex-col rounded-xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-border-strong",
                          i.status === "bientot" && "bg-subtle shadow-none",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Monogram mono={i.mono} hue={i.hue} className={i.status === "bientot" ? "opacity-60 grayscale-[40%]" : undefined} />
                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-[13.5px] font-medium">{i.name}</h3>
                            <p className="text-xs text-muted-foreground">{i.category}</p>
                          </div>
                          <Badge tone={st.tone} dot={i.status === "connecte"}>
                            {st.label}
                          </Badge>
                        </div>
                        <p className="mt-3 flex-1 text-[13px] leading-snug text-muted-foreground">{i.description}</p>
                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                          <span className="text-xs text-muted-foreground">
                            {i.status === "connecte" ? "Synchronisé il y a 4 min" : i.status === "bientot" ? "En certification" : "Installation en 2 min"}
                          </span>
                          {i.status === "connecte" ? (
                            <Button variant="outline" size="xs" onClick={() => openFor(i)}>
                              <Settings2 /> Gérer
                            </Button>
                          ) : i.status === "bientot" ? (
                            <Button variant="ghost" size="xs" onClick={() => openFor(i)}>
                              <Bell /> M&apos;avertir
                            </Button>
                          ) : (
                            <Button variant="inverted" size="xs" onClick={() => openFor(i)}>
                              Connecter
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      <ConnectModal
        integration={current}
        open={open}
        onClose={() => setOpen(false)}
        onConnected={(id) => {
          setStatus(id, "connecte");
          toast(`${items.find((x) => x.id === id)?.name ?? "Intégration"} connecté`);
        }}
        onDisconnect={(id) => {
          setStatus(id, "disponible");
          toast(`${items.find((x) => x.id === id)?.name ?? "Intégration"} déconnecté`, "info");
        }}
      />
    </>
  );
}
