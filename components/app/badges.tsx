import {
  ArrowLeftRight,
  Banknote,
  Car,
  CarFront,
  Clock,
  FileText,
  Gauge,
  Hammer,
  MessageCircle,
  Package,
  TriangleAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INTENTS, LANGUAGES, OUTCOMES, type CallOutcome, type Intent, type LanguageCode, type Sentiment } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

export const INTENT_ICONS: Record<Intent, LucideIcon> = {
  rdv_atelier: Wrench,
  suivi_reparation: Clock,
  devis: FileText,
  achat_vn: CarFront,
  achat_vo: Car,
  essai: Gauge,
  reprise: ArrowLeftRight,
  pieces: Package,
  carrosserie: Hammer,
  financement: Banknote,
  reclamation: TriangleAlert,
  autre: MessageCircle,
};

export function IntentBadge({ intent, className }: { intent: Intent; className?: string }) {
  const Icon = INTENT_ICONS[intent];
  return (
    <Badge tone={intent === "reclamation" ? "danger" : "neutral"} className={cn("bg-card", className)}>
      <Icon aria-hidden />
      {INTENTS[intent]}
    </Badge>
  );
}

export function OutcomeBadge({ outcome, className }: { outcome: CallOutcome; className?: string }) {
  const o = OUTCOMES[outcome];
  return (
    <Badge tone={o.tone} dot className={className}>
      {o.label}
    </Badge>
  );
}

const SENTIMENT: Record<Sentiment, { label: string; cls: string }> = {
  positif: { label: "Sentiment positif", cls: "bg-success" },
  neutre: { label: "Sentiment neutre", cls: "bg-border-strong" },
  negatif: { label: "Sentiment négatif", cls: "bg-danger" },
};

export function SentimentDot({ sentiment, withLabel }: { sentiment: Sentiment; withLabel?: boolean }) {
  const s = SENTIMENT[sentiment];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground" title={s.label}>
      <span className={cn("size-2 rounded-full", s.cls)} aria-hidden />
      {withLabel ? <span className="capitalize">{sentiment}</span> : <span className="sr-only">{s.label}</span>}
    </span>
  );
}

export function LangFlag({ code, withLabel }: { code: LanguageCode; withLabel?: boolean }) {
  const l = LANGUAGES[code];
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground" title={l.label}>
      <span className="text-[15px] leading-none" aria-hidden>
        {l.flag}
      </span>
      {withLabel ? l.label : <span className="font-mono text-[11px] uppercase">{code}</span>}
    </span>
  );
}

export function KnownBadge() {
  return (
    <span className="inline-flex h-4.5 items-center rounded-[5px] border border-border bg-muted px-1.5 text-[10.5px] font-medium text-muted-foreground">
      Client
    </span>
  );
}
