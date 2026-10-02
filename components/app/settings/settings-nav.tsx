"use client";

import { Building, CreditCard, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "organisation", label: "Organisation", icon: Building },
  { id: "equipe", label: "Équipe", icon: Users },
  { id: "facturation", label: "Facturation", icon: CreditCard },
  { id: "securite", label: "Sécurité & RGPD", icon: ShieldCheck },
];

/** Section index with scroll-spy. Vertical on desktop, horizontal chips on mobile. */
export function SettingsNav() {
  const [active, setActive] = useState(ITEMS[0]!.id);

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-72px 0px -55% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <nav aria-label="Sections des paramètres" className="lg:sticky lg:top-20 lg:self-start">
      <ul className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:grid lg:px-0">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          const on = active === it.id;
          return (
            <li key={it.id} className="shrink-0">
              <a
                href={`#${it.id}`}
                onClick={() => setActive(it.id)}
                className={cn(
                  "flex h-8.5 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors [&_svg]:size-4",
                  on ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border)]" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={on ? "text-primary" : undefined} />
                {it.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
