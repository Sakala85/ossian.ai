"use client";

import { Check, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DbCallback } from "@/lib/server/db";
import { formatFrench } from "@/lib/voice/phone";
import { useAccountAction } from "./use-account-action";

const phone = (p: string) => (p.startsWith("+") ? formatFrench(p) : p);

/** Callbacks requested by callers, ticked off by the team once done. */
export function CallbackList({ callbacks }: { callbacks: DbCallback[] }) {
  const { update, pending } = useAccountAction();
  return (
    <ul className="divide-y divide-border">
      {callbacks.map((c) => (
        <li key={c.id} className="flex items-start gap-3 px-5 py-3">
          <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[13px] font-medium text-foreground">
              <span className="truncate">{c.name ?? phone(c.phone)}</span>
              {c.priority === "haute" && <Badge tone="danger">Urgent</Badge>}
            </p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {c.reason} · {c.department}
            </p>
            {c.phone && (
              <a href={`tel:${c.phone}`} className="mt-1 inline-block font-mono text-xs text-primary tabular hover:underline">
                {phone(c.phone)}
              </a>
            )}
          </div>
          <Button
            size="xs"
            variant="outline"
            disabled={pending === c.id}
            onClick={() => update(c.id, { kind: "callback", value: "done" }, `Rappel de ${c.name ?? phone(c.phone)} fait`)}
          >
            <Check /> Fait
          </Button>
        </li>
      ))}
    </ul>
  );
}
