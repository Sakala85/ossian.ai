import { ArrowRight, Moon, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LiveDot } from "@/components/ui/misc";
import type { CallRecord } from "@/lib/domain/types";
import { IntentBadge, OutcomeBadge } from "../badges";
import { relTime, siteShort } from "../format";

export function ActivityFeed({ calls, now }: { calls: CallRecord[]; now: string }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-medium tracking-tight">Activité en direct</h2>
          <LiveDot />
        </div>
        <Link
          href="/app/calls"
          className="inline-flex items-center gap-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground [&_svg]:size-3.5"
        >
          Tous les appels <ArrowRight />
        </Link>
      </div>
      <ul className="px-2 pb-2">
        {calls.map((c) => {
          const Dir = c.direction === "outbound" ? PhoneOutgoing : PhoneIncoming;
          return (
            <li key={c.id}>
              <Link
                href={`/app/calls?id=${c.id}`}
                className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-subtle"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground [&_svg]:size-3.5">
                  <Dir />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">{c.caller.name ?? c.caller.phone}</span>
                    {c.afterHours && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground [&_svg]:size-3" title="Hors horaires">
                        <Moon /> <span className="hidden sm:inline">Hors horaires</span>
                      </span>
                    )}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular">{relTime(c.startedAt, now)}</span>
                  </span>
                  <span className="mt-0.5 line-clamp-1 block text-[13px] text-muted-foreground">{c.summary}</span>
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <IntentBadge intent={c.intent} />
                    <OutcomeBadge outcome={c.outcome} />
                    <span className="text-[11px] text-muted-foreground">· {siteShort(c.siteId)}</span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
