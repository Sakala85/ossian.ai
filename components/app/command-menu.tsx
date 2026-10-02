"use client";

import { CornerDownLeft, Megaphone, Phone, Play, Search, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Kbd } from "@/components/ui/misc";
import { INTENTS, type Intent } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import { NAV_ALL } from "./nav";
import { Modal } from "./overlay";
import { useShell } from "./shell-context";

export type RecentCall = { id: string; label: string; intent: Intent; time: string };

type Cmd = { id: string; group: string; label: string; hint?: string; icon: React.ReactNode; href: string; keywords?: string };

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

export function CommandMenu({ open, onClose, recentCalls }: { open: boolean; onClose: () => void; recentCalls: RecentCall[] }) {
  const router = useRouter();
  const { workspace } = useShell();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const all = useMemo<Cmd[]>(
    () => [
      ...NAV_ALL.map((n) => {
        const Icon = n.icon;
        return { id: n.href, group: "Navigation", label: n.label, icon: <Icon />, href: n.href, keywords: n.keywords };
      }),
      { id: "a-test", group: "Actions", label: "Tester l'agent", hint: "Démo vocale", icon: <Play />, href: "/demo", keywords: "appeler léa démo" },
      ...(workspace.live
        ? []
        : [
            { id: "a-cmp", group: "Actions", label: "Nouvelle campagne", icon: <Megaphone />, href: "/app/campaigns?new=1", keywords: "sortant relance" },
            { id: "a-inv", group: "Actions", label: "Inviter un membre", icon: <UserPlus />, href: "/app/settings#equipe", keywords: "équipe utilisateur" },
          ]),
      ...recentCalls.map((c) => ({
        id: c.id,
        group: "Appels récents",
        label: c.label,
        hint: `${INTENTS[c.intent]} · ${c.time}`,
        icon: <Phone />,
        href: `/app/calls?id=${c.id}`,
        keywords: INTENTS[c.intent],
      })),
    ],
    [recentCalls, workspace.live],
  );

  const results = useMemo(() => {
    const n = normalize(q.trim());
    if (!n) return all;
    return all.filter((c) => normalize(`${c.label} ${c.hint ?? ""} ${c.keywords ?? ""}`).includes(n));
  }, [all, q]);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const run = (c: Cmd | undefined) => {
    if (!c) return;
    onClose();
    router.push(c.href);
  };

  const groups = [...new Set(results.map((r) => r.group))];

  return (
    <Modal open={open} onClose={onClose} label="Recherche et commandes" className="max-w-xl sm:mt-[-12vh]">
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              run(results[active]);
            }
          }}
          placeholder="Rechercher une page, un appel, une action…"
          className="h-13 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground/70"
          aria-label="Rechercher"
        />
        <Kbd>Esc</Kbd>
      </div>
      <div ref={listRef} className="scrollbar-thin max-h-[min(420px,60dvh)] overflow-y-auto p-1.5">
        {results.length === 0 && <p className="px-3 py-10 text-center text-sm text-muted-foreground">Aucun résultat pour « {q} »</p>}
        {groups.map((g) => (
          <div key={g} className="mb-1">
            <div className="px-2.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{g}</div>
            {results.map((c, i) =>
              c.group !== g ? null : (
                <button
                  key={c.id}
                  type="button"
                  data-index={i}
                  onMouseMove={() => setActive(i)}
                  onClick={() => run(c)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-[13.5px] transition-colors [&_svg]:size-4 [&_svg]:shrink-0",
                    i === active ? "bg-muted text-foreground" : "text-foreground/90",
                  )}
                >
                  <span className="text-muted-foreground">{c.icon}</span>
                  <span className="flex-1 truncate">{c.label}</span>
                  {c.hint && <span className="truncate text-xs text-muted-foreground">{c.hint}</span>}
                  {i === active && <CornerDownLeft className="text-muted-foreground" />}
                </button>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 border-t border-border bg-subtle px-4 py-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> naviguer
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↵</Kbd> ouvrir
        </span>
      </div>
    </Modal>
  );
}
