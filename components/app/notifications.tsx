"use client";

import { Bell, CalendarX, Flame, Megaphone, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Popover } from "./popover";

const ITEMS = [
  {
    id: "n1",
    icon: TriangleAlert,
    tone: "text-danger bg-danger-soft",
    title: "Réclamation · Martine Dupuis",
    body: "Écart devis / facture de 86 €. Rappel du chef d'atelier attendu avant 17h.",
    time: "Il y a 2 h",
    href: "/app/calls?id=call_9K4C",
  },
  {
    id: "n2",
    icon: Flame,
    tone: "text-primary bg-primary-soft",
    title: "Lead chaud · Thomas Lefèvre",
    body: "E-3008 GT, budget ≈ 45 k€, score 86. Essai samedi 10h.",
    time: "Il y a 38 min",
    href: "/app/calls?id=call_8M1P",
  },
  {
    id: "n3",
    icon: CalendarX,
    tone: "text-[color-mix(in_oklch,var(--warning)_75%,var(--foreground))] bg-warning-soft",
    title: "No-show à reprogrammer",
    body: "Léa peut proposer un nouveau créneau automatiquement.",
    time: "Ce matin",
    href: "/app/appointments",
  },
  {
    id: "n4",
    icon: Megaphone,
    tone: "text-info bg-info-soft",
    title: "Campagne « Rappel entretien »",
    body: "148 rendez-vous pris sur 516 appels passés.",
    time: "Hier",
    href: "/app/campaigns",
  },
];

export function Notifications() {
  const [unread, setUnread] = useState(new Set(["n1", "n2", "n3"]));
  return (
    <Popover
      align="end"
      panelClassName="w-[min(360px,calc(100vw-24px))] p-0"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-label={`Notifications (${unread.size} non lues)`}
          className={cn(
            "relative inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4",
            open && "bg-muted text-foreground",
          )}
        >
          <Bell />
          {unread.size > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />}
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-medium">Notifications</p>
            <button
              type="button"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              disabled={unread.size === 0}
              onClick={() => setUnread(new Set())}
            >
              Tout marquer comme lu
            </button>
          </div>
          <ul className="p-1.5">
            {ITEMS.map((n) => {
              const Icon = n.icon;
              const isUnread = unread.has(n.id);
              return (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    onClick={() => {
                      setUnread((s) => {
                        const x = new Set(s);
                        x.delete(n.id);
                        return x;
                      });
                      close();
                    }}
                    className="flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted"
                  >
                    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4", n.tone)}>
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[13px] font-medium">{n.title}</span>
                        {isUnread && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Non lue" />}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">{n.time}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Popover>
  );
}
