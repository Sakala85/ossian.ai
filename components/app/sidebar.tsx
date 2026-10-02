"use client";

import { Building, Check, ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/brand/theme-toggle";
import { LinkButton } from "@/components/ui/button";
import { Avatar, LiveDot } from "@/components/ui/misc";
import { Orb } from "@/components/voice/orb";
import { cn } from "@/lib/utils";
import { MiniOrb } from "./mini-orb";
import { NAV_CONFIG, NAV_MAIN, isActive, type NavItem } from "./nav";
import { MenuItem, MenuLabel, Popover } from "./popover";
import { useShell } from "./shell-context";

export type SiteFilter = "all" | "lyon-est" | "villeurbanne" | "bron";

export const SITE_OPTIONS: { value: SiteFilter; label: string; hint: string }[] = [
  { value: "all", label: "Tous les sites", hint: "3 sites" },
  { value: "lyon-est", label: "Lyon Est", hint: "Peugeot · Citroën" },
  { value: "villeurbanne", label: "Villeurbanne", hint: "Toyota" },
  { value: "bron", label: "Bron", hint: "Occasions" },
];

/*
 * Rail behaviour (desktop aside only):
 *  - md → lg : always icon-only
 *  - lg+     : full width, collapsible to icons (data-collapsed on the aside)
 * In the mobile drawer everything is shown.
 */
const RAIL = {
  hide: "md:hidden lg:block lg:group-data-[collapsed=true]/sb:hidden",
  hideFlex: "md:hidden lg:flex lg:group-data-[collapsed=true]/sb:hidden",
  show: "hidden md:flex lg:hidden lg:group-data-[collapsed=true]/sb:flex",
};
const FULL = { hide: "", hideFlex: "", show: "hidden" };

export function Sidebar({
  mobile = false,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  liveCount,
  site,
  onSiteChange,
}: {
  mobile?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
  liveCount: number;
  site: SiteFilter;
  onSiteChange: (s: SiteFilter) => void;
}) {
  const pathname = usePathname() ?? "/app";
  const { workspace } = useShell();
  const r = mobile ? FULL : RAIL;
  const current = SITE_OPTIONS.find((s) => s.value === site) ?? SITE_OPTIONS[0]!;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center gap-2 px-4">
        <Link href="/app" onClick={onNavigate} className={cn("rounded-md", r.hideFlex)} aria-label="Ossian — Vue d'ensemble">
          <Logo markClassName="size-6.5" />
        </Link>
        <Link href="/app" onClick={onNavigate} className={cn("mx-auto rounded-md", r.show)} aria-label="Ossian — Vue d'ensemble">
          <LogoMark className="size-7" />
        </Link>
        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Déplier la barre latérale" : "Replier la barre latérale"}
            title={collapsed ? "Déplier" : "Replier"}
            className="ml-auto hidden size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex lg:group-data-[collapsed=true]/sb:hidden [&_svg]:size-4"
          >
            <PanelLeftClose />
          </button>
        )}
      </div>

      {/* Workspace switcher */}
      <div className="px-3 pb-2">
        <Popover
          className="w-full"
          panelClassName="w-64"
          trigger={({ toggle, open }) => (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label="Changer d'espace de travail ou de site"
              className={cn(
                "flex w-full items-center gap-2.5 rounded-[10px] border border-transparent p-1 text-left transition-colors hover:border-border hover:bg-card",
                open && "border-border bg-card",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-foreground text-[11px] font-semibold tracking-tight text-background">
                {workspace.initials}
              </span>
              <span className={cn("min-w-0 flex-1", r.hide)}>
                <span className="block truncate text-[13px] leading-tight font-medium">{workspace.name}</span>
                <span className="block truncate text-xs leading-tight text-muted-foreground">{workspace.subtitle ?? current.label}</span>
              </span>
              <ChevronsUpDown className={cn("size-3.5 shrink-0 text-muted-foreground", r.hide)} />
            </button>
          )}
        >
          {(close) =>
            workspace.live ? (
              <>
                <MenuLabel>Concession</MenuLabel>
                <MenuItem onClick={close}>
                  <Building />
                  <span className="flex-1">
                    <span className="block">{workspace.name}</span>
                    {workspace.subtitle && <span className="block text-xs text-muted-foreground">{workspace.subtitle}</span>}
                  </span>
                  <Check className="!text-primary" />
                </MenuItem>
                <div className="my-1 h-px bg-border" />
                <a
                  href="/acces/sortie"
                  className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
                >
                  <LogOut /> Se déconnecter de cet appareil
                </a>
              </>
            ) : (
            <>
              <MenuLabel>Sites</MenuLabel>
              {SITE_OPTIONS.map((s) => (
                <MenuItem
                  key={s.value}
                  onClick={() => {
                    onSiteChange(s.value);
                    close();
                  }}
                >
                  <Building />
                  <span className="flex-1">
                    <span className="block">{s.label}</span>
                    <span className="block text-xs text-muted-foreground">{s.hint}</span>
                  </span>
                  {site === s.value && <Check className="!text-primary" />}
                </MenuItem>
              ))}
              <div className="my-1 h-px bg-border" />
              <Link
                href="/app/settings"
                onClick={() => {
                  close();
                  onNavigate?.();
                }}
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
              >
                <Settings /> Gérer les sites
              </Link>
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&_svg]:size-4"
                onClick={close}
              >
                <Plus /> Nouvel espace de travail
              </button>
            </>
            )
          }
        </Popover>
      </div>

      {/* Navigation */}
      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label="Navigation principale">
        <NavGroup items={NAV_MAIN} pathname={pathname} r={r} liveCount={liveCount} onNavigate={onNavigate} />
        <div className={cn("mt-5 mb-1 px-2.5 text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase", r.hide)}>
          Configuration
        </div>
        <div className={cn("mx-2 my-3 h-px bg-border", r.show)} />
        <NavGroup items={NAV_CONFIG} pathname={pathname} r={r} liveCount={liveCount} onNavigate={onNavigate} />

        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Déplier la barre latérale"
            title="Déplier"
            className="mt-3 hidden size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:group-data-[collapsed=true]/sb:inline-flex [&_svg]:size-4"
          >
            <PanelLeftOpen />
          </button>
        )}
      </nav>

      {/* Agent status */}
      <div className="shrink-0 px-3 pb-3">
        <div className={cn("rounded-xl border border-border bg-card p-3 shadow-soft", r.hide)}>
          <div className="flex items-center gap-2.5">
            <div className="-m-1.5">
              <Orb size={44} state="idle" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[13px] font-medium">
                {workspace.agent.name}
                {workspace.agent.online ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-normal text-success">
                    <LiveDot className="size-1.5" /> En ligne
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-warning" /> Renvoi à faire
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{workspace.agent.summary}</p>
            </div>
          </div>
          <LinkButton href="/demo" variant="outline" size="xs" className="mt-3 w-full" onClick={onNavigate}>
            Tester l&apos;agent
          </LinkButton>
        </div>
        <Link
          href="/demo"
          title={`${workspace.agent.name} · ${workspace.agent.online ? "En ligne" : "Renvoi à faire"} — Tester l'agent`}
          aria-label={`${workspace.agent.name} : ${workspace.agent.online ? "en ligne" : "renvoi d'appel à faire"}. Tester l'agent`}
          className={cn("mx-auto size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted", r.show)}
        >
          <MiniOrb size={22} live={workspace.agent.online} />
        </Link>
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2.5 border-t border-border px-3 py-3">
        <button
          type="button"
          className={cn("flex min-w-0 flex-1 items-center gap-2.5 rounded-lg p-1 text-left transition-colors hover:bg-muted", !mobile && "md:flex-none lg:flex-1")}
          title={`${workspace.user} · ${workspace.role}`}
        >
          <Avatar name={workspace.user} size={28} />
          <span className={cn("min-w-0", r.hide)}>
            <span className="block truncate text-[13px] leading-tight font-medium">{workspace.user}</span>
            <span className="block truncate text-xs leading-tight text-muted-foreground">{workspace.role}</span>
          </span>
        </button>
        <ThemeToggle className={cn("shrink-0", r.hideFlex)} />
      </div>
    </div>
  );
}

function NavGroup({
  items,
  pathname,
  r,
  liveCount,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  r: typeof RAIL;
  liveCount: number;
  onNavigate?: () => void;
}) {
  return (
    <ul className="grid gap-0.5">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        const Icon = it.icon;
        return (
          <li key={it.href}>
            <Link
              href={it.href}
              onClick={onNavigate}
              title={it.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group/item relative flex h-8.5 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-card text-foreground shadow-[0_0_0_1px_var(--border),0_1px_2px_0_oklch(0_0_0/5%)]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground")} />
              <span className={cn("flex-1 truncate", r.hide)}>{it.label}</span>
              {it.live && liveCount > 0 && (
                <>
                  <span
                    className={cn(
                      "items-center gap-1.5 rounded-full border border-border bg-card px-1.5 py-px text-[11px] text-muted-foreground tabular",
                      r.hideFlex || "flex",
                    )}
                    title="Appels des dernières 24 h"
                  >
                    <span className="size-1.5 rounded-full bg-success" />
                    {liveCount}
                  </span>
                  <span className={cn("absolute top-1.5 right-1.5 size-1.5 rounded-full bg-success", r.show)} />
                </>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
