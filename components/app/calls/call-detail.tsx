"use client";

import {
  ArrowUpRight,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Download,
  Moon,
  Phone,
  PhoneForwarded,
  PhoneIncoming,
  PhoneOutgoing,
  Sparkles,
  Star,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar } from "@/components/ui/misc";
import { DEPARTMENTS, type CallRecord } from "@/lib/domain/types";
import { cn, duration } from "@/lib/utils";
import { IntentBadge, KnownBadge, LangFlag, OutcomeBadge, SentimentDot } from "../badges";
import { fmtDayLong, fmtTime, relTime, siteShort } from "../format";
import { CloseButton } from "../overlay";
import { useShell } from "../shell-context";
import { AudioPlayer, usePlayback } from "./audio-player";
import { Transcript } from "./transcript";

export function CallDetail({
  call,
  now,
  onClose,
  onPrev,
  onNext,
}: {
  call: CallRecord;
  now: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { toast, workspace } = useShell();
  const live = workspace.live;
  const playback = usePlayback(call.durationSec);
  const name = call.caller.name ?? "Numéro non identifié";
  const extracted = call.extracted ?? derived(call);
  const partial = call.transcript.length <= 2 || call.transcript.some((l) => l.text.trim().endsWith("…"));
  const Dir = call.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground [&_svg]:size-3.5">
          <Dir />
          {call.direction === "outbound" ? "Appel sortant" : "Appel entrant"}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground/70">{call.id}</span>
        <div className="ml-auto flex items-center gap-0.5">
          <IconBtn label="Appel précédent (K)" onClick={onPrev} disabled={!onPrev}>
            <ChevronUp />
          </IconBtn>
          <IconBtn label="Appel suivant (J)" onClick={onNext} disabled={!onNext}>
            <ChevronDown />
          </IconBtn>
          <span className="mx-1 h-4 w-px bg-border" />
          <CloseButton onClick={onClose} className="mr-0" />
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5">
          <div className="flex items-start gap-3.5">
            {call.caller.name ? (
              <Avatar name={call.caller.name} size={44} />
            ) : (
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
                <Phone />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold tracking-tight">{name}</h2>
                {call.caller.known && <KnownBadge />}
              </div>
              <p className="mt-0.5 font-mono text-[13px] text-muted-foreground">{call.caller.phone}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {fmtDayLong(call.startedAt)} · {fmtTime(call.startedAt)} <span className="text-muted-foreground/60">·</span>{" "}
                <span className="tabular">{duration(call.durationSec)}</span> <span className="text-muted-foreground/60">·</span>{" "}
                {siteShort(call.siteId)}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <IntentBadge intent={call.intent} />
            <OutcomeBadge outcome={call.outcome} />
            {call.afterHours && (
              <Badge tone="primary">
                <Moon /> Hors horaires
              </Badge>
            )}
            {call.transferredTo && (
              <Badge tone="info">
                <PhoneForwarded /> {DEPARTMENTS[call.transferredTo]}
              </Badge>
            )}
            {!live && (
              <>
                <span className="mx-1 h-4 w-px bg-border" />
                <LangFlag code={call.language} withLabel />
                <span className="mx-1 h-4 w-px bg-border" />
                <SentimentDot sentiment={call.sentiment} withLabel />
              </>
            )}
            {call.csat && (
              <>
                <span className="mx-1 h-4 w-px bg-border" />
                <span className="inline-flex items-center gap-0.5" title={`Satisfaction ${call.csat}/5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={cn("size-3", i < call.csat! ? "fill-warning text-warning" : "text-border-strong")} />
                  ))}
                </span>
              </>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {live ? (
              call.caller.phone.match(/\d/) && (
                <a href={`tel:${call.caller.phone.replace(/\s/g, "")}`} className={buttonVariants({ size: "sm" })}>
                  <Phone /> Rappeler
                </a>
              )
            ) : (
              <>
                <Button size="sm" onClick={() => toast(`Appel en cours vers ${call.caller.phone}…`, "info")}>
                  <Phone /> Rappeler
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast("Rendez-vous pré-rempli · à confirmer dans le planning")}>
                  <CalendarPlus /> Créer un RDV
                </Button>
              </>
            )}
            <Button variant="ghost" size="sm" onClick={() => downloadTranscript(call, workspace.agent.name)}>
              <Download /> Exporter
            </Button>
          </div>
        </div>

        <div className="grid gap-5 px-5 pt-5 pb-8">
          {/* AI summary */}
          <section className="rounded-xl border border-[color-mix(in_oklch,var(--primary)_20%,var(--border))] bg-primary-soft p-4">
            <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-primary [&_svg]:size-3.5">
              <Sparkles /> Résumé par {workspace.agent.name}
            </div>
            <p className="text-[13.5px] leading-relaxed text-foreground">{call.summary}</p>
            {(call.appointmentId || call.leadId) && (
              <div className="mt-3 flex flex-wrap gap-3 text-[13px]">
                {call.appointmentId && (
                  <Link href="/app/appointments" className="inline-flex items-center gap-1 font-medium text-primary hover:opacity-80 [&_svg]:size-3.5">
                    Voir le rendez-vous <ArrowUpRight />
                  </Link>
                )}
                {call.leadId && (
                  <Link href="/app/leads" className="inline-flex items-center gap-1 font-medium text-primary hover:opacity-80 [&_svg]:size-3.5">
                    Voir le lead <ArrowUpRight />
                  </Link>
                )}
              </div>
            )}
          </section>

          {/* Extracted data */}
          {Object.keys(extracted).length > 0 && (
            <section>
              <SectionTitle>Données extraites</SectionTitle>
              <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2">
                {Object.entries(extracted).map(([k, v]) => (
                  <div key={k} className="bg-card px-3.5 py-2.5 sm:last:odd:col-span-2">
                    <dt className="text-[11px] text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-[13px] font-medium text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Recording */}
          {live ? (
            call.recordingUrl && (
              <section>
                <SectionTitle hint={relTime(call.startedAt, now)}>Enregistrement</SectionTitle>
                <audio controls preload="none" src={call.recordingUrl} className="w-full" />
              </section>
            )
          ) : (
            <section>
              <SectionTitle hint={relTime(call.startedAt, now)}>Enregistrement</SectionTitle>
              <AudioPlayer id={call.id} playback={playback} onDownload={() => toast("Téléchargement de l'enregistrement (MP3)")} />
            </section>
          )}

          {/* Transcript */}
          <section>
            <SectionTitle hint={`${call.transcript.filter((l) => l.role !== "tool").length} messages · ${call.transcript.filter((l) => l.role === "tool").length} actions`}>
              Transcription
            </SectionTitle>
            <Transcript
              lines={call.transcript}
              activeT={live ? -1 : playback.t}
              onSeek={(t) => playback.seek(t)}
              partial={partial}
              callerName={call.caller.name}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/** Plain-text transcript download (summary, extracted data, dialogue). */
function downloadTranscript(call: CallRecord, agent: string) {
  const who = (r: string) => (r === "agent" ? agent : r === "caller" ? (call.caller.name ?? "Client") : "Action");
  const lines = [
    `Appel ${call.direction === "outbound" ? "sortant" : "entrant"} · ${fmtDayLong(call.startedAt)} ${fmtTime(call.startedAt)} · ${call.caller.phone}`,
    "",
    `Résumé : ${call.summary}`,
    ...Object.entries(call.extracted ?? {}).map(([k, v]) => `${k} : ${v}`),
    "",
    ...call.transcript.map((l) => `[${Math.floor(l.t / 60)}:${String(Math.floor(l.t % 60)).padStart(2, "0")}] ${who(l.role)} : ${l.text}`),
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `appel-${call.startedAt.slice(0, 10)}-${call.id.slice(0, 8)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function derived(call: CallRecord): Record<string, string> {
  const out: Record<string, string> = {};
  if (call.vehicle) out["Véhicule"] = [call.vehicle.make, call.vehicle.model, call.vehicle.plate].filter(Boolean).join(" · ");
  if (call.transferredTo) out["Transfert"] = DEPARTMENTS[call.transferredTo];
  out["Site"] = siteShort(call.siteId);
  return out;
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</h3>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}
