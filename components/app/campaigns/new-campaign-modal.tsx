"use client";

import { ArrowLeft, Check, Rocket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import type { Campaign } from "@/lib/domain/types";
import { cn, num } from "@/lib/utils";
import { Modal, OverlayHeader } from "../overlay";
import { CHANNEL_META, TYPE_META, type CampaignType, type Channel } from "./meta";

const TYPES = Object.keys(TYPE_META) as CampaignType[];
const CHANNELS = Object.keys(CHANNEL_META) as Channel[];

export function NewCampaignModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (c: Omit<Campaign, "id" | "startedAt"> & { startsIn: number }) => void;
}) {
  const [type, setType] = useState<CampaignType | null>(null);
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["voix", "sms"]);
  const [when, setWhen] = useState<"now" | "later">("now");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("Lun–ven · 10h–12h et 14h–19h");
  const [script, setScript] = useState("");

  useEffect(() => {
    if (!open) {
      const id = setTimeout(() => setType(null), 250);
      return () => clearTimeout(id);
    }
  }, [open]);

  const choose = (t: CampaignType) => {
    setType(t);
    setName(`${TYPE_META[t].label} — ${new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "Europe/Paris" }).format(new Date())}`);
    setScript(TYPE_META[t].script);
    setChannels(t === "satisfaction" || t === "no_show" ? ["voix", "sms"] : ["voix"]);
  };

  const toggleChannel = (c: Channel) =>
    setChannels((cs) => (cs.includes(c) ? (cs.length > 1 ? cs.filter((x) => x !== c) : cs) : [...cs, c]));

  const meta = type ? TYPE_META[type] : null;

  return (
    <Modal open={open} onClose={onClose} label="Nouvelle campagne" className="max-w-2xl">
      <OverlayHeader
        title={meta ? meta.label : "Nouvelle campagne"}
        description={meta ? "Configurez l'audience, les canaux et le script de Léa." : "Choisissez un modèle : Léa appelle vos clients et prend les rendez-vous."}
        onClose={onClose}
      >
        {meta && (
          <button
            type="button"
            onClick={() => setType(null)}
            className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-3.5"
          >
            <ArrowLeft /> Modèles
          </button>
        )}
      </OverlayHeader>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-5">
        {!type ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {TYPES.map((t) => {
              const m = TYPE_META[t];
              const Icon = m.icon;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => choose(t)}
                  className="group flex flex-col rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_0_0_4px_var(--primary-soft)]"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary [&_svg]:size-4">
                    <Icon />
                  </span>
                  <span className="mt-3 text-sm font-medium">{m.label}</span>
                  <span className="mt-1 text-[13px] leading-snug text-muted-foreground">{m.description}</span>
                  <span className="mt-3 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 [&_svg]:size-3">
                      <Users /> <span className="tabular">{num(m.audience)}</span> éligibles
                    </span>
                    <span className="ml-auto text-foreground">{m.benchmark}</span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          meta && (
            <div className="grid gap-5">
              <Field label="Nom de la campagne">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Audience" hint="Calculée depuis votre DMS, mise à jour chaque nuit.">
                  <div className="flex h-9.5 items-center gap-2 rounded-[10px] border border-input bg-subtle px-3 text-sm">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="truncate">{meta.segment}</span>
                    <span className="ml-auto font-medium tabular">{num(meta.audience)}</span>
                  </div>
                </Field>
                <Field label="Plage d'appels">
                  <Select value={slot} onChange={(e) => setSlot(e.target.value)}>
                    <option>Lun–ven · 10h–12h et 14h–19h</option>
                    <option>Lun–sam · 9h–19h</option>
                    <option>Lun–ven · 17h–19h30 uniquement</option>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-1.5">
                <span className="text-[13px] font-medium">Canaux</span>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((c) => {
                    const on = channels.includes(c);
                    const CI = CHANNEL_META[c].icon;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggleChannel(c)}
                        className={cn(
                          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] transition-colors [&_svg]:size-3.5",
                          on ? "border-primary/40 bg-primary-soft text-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {on ? <Check className="text-primary" /> : <CI />}
                        {CHANNEL_META[c].label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">Léa appelle d&apos;abord ; les autres canaux servent de relance si le client ne décroche pas.</p>
              </div>

              <Field label="Accroche de Léa" hint="Les variables {prénom} et {véhicule} sont remplacées pour chaque client.">
                <Textarea value={script} onChange={(e) => setScript(e.target.value)} className="min-h-20" />
              </Field>

              <div className="flex flex-wrap items-end gap-3">
                <div className="grid gap-1.5">
                  <span className="text-[13px] font-medium">Démarrage</span>
                  <Segmented
                    value={when}
                    onChange={setWhen}
                    options={[
                      { value: "now", label: "Immédiatement" },
                      { value: "later", label: "Programmer" },
                    ]}
                  />
                </div>
                {when === "later" && (
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" aria-label="Date de démarrage" />
                )}
              </div>
            </div>
          )
        )}
      </div>

      {meta && type && (
        <div className="flex items-center gap-3 border-t border-border bg-subtle px-5 py-3">
          <p className="hidden text-xs text-muted-foreground sm:block">
            Estimation : <span className="font-medium text-foreground">{meta.benchmark}</span> sur {num(meta.audience)} clients
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={() =>
                onCreate({
                  name: name.trim() || meta.label,
                  type,
                  status: when === "now" ? "active" : "planifiee",
                  audience: meta.audience,
                  called: 0,
                  reached: 0,
                  converted: 0,
                  channel: channels,
                  startsIn: when === "now" ? 0 : Math.max(1, Math.round((new Date(date || Date.now() + 86_400_000).getTime() - Date.now()) / 86_400_000)),
                })
              }
            >
              <Rocket /> {when === "now" ? "Lancer la campagne" : "Programmer"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
