"use client";

import { ChevronRight, Menu, Search } from "lucide-react";
import Link from "next/link";
import { Segmented } from "@/components/ui/segmented";
import { Kbd } from "@/components/ui/misc";
import { cn } from "@/lib/utils";
import { Notifications } from "./notifications";
import { useShell, type Range } from "./shell-context";

const RANGES: { value: Range; label: string }[] = [
  { value: "7j", label: "7 j" },
  { value: "30j", label: "30 j" },
  { value: "90j", label: "90 j" },
];

/**
 * Page chrome: sticky top bar (breadcrumb · période · recherche · notifications)
 * followed by the page title row and the page body container.
 */
export function Page({
  title,
  subtitle,
  crumb,
  actions,
  range = false,
  children,
  className,
  bodyClassName,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Breadcrumb label (defaults to the title when it is a string). */
  crumb?: string;
  actions?: React.ReactNode;
  range?: boolean;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const shell = useShell();
  const crumbLabel = crumb ?? (typeof title === "string" ? title : "");

  return (
    <div className={cn("flex min-h-dvh flex-col", className)}>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-2 px-4 md:px-6">
          <button
            type="button"
            onClick={shell.openNav}
            aria-label="Ouvrir le menu"
            className="-ml-1.5 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden [&_svg]:size-4.5"
          >
            <Menu />
          </button>
          <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-1.5 text-[13px]">
            <Link href="/app" className="hidden truncate text-muted-foreground transition-colors hover:text-foreground sm:inline">
              Groupe Mistral
            </Link>
            <ChevronRight className="hidden size-3.5 shrink-0 text-muted-foreground/60 sm:inline" />
            <span className="truncate font-medium text-foreground">{crumbLabel}</span>
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            {range && (
              <Segmented
                size="sm"
                value={shell.range}
                onChange={shell.setRange}
                options={RANGES}
                className="mr-1 hidden sm:inline-flex"
              />
            )}
            <button
              type="button"
              onClick={shell.openCommand}
              className="hidden h-8 w-52 items-center gap-2 rounded-lg border border-border bg-card px-2.5 text-[13px] text-muted-foreground shadow-soft transition-colors hover:border-border-strong hover:text-foreground lg:inline-flex"
            >
              <Search className="size-3.5" />
              <span className="flex-1 text-left">Rechercher…</span>
              <Kbd>⌘K</Kbd>
            </button>
            <button
              type="button"
              onClick={shell.openCommand}
              aria-label="Rechercher"
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden [&_svg]:size-4"
            >
              <Search />
            </button>
            <Notifications />
          </div>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-[1400px] flex-1 px-4 pt-6 pb-10 md:px-6", bodyClassName)}>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.025em] text-foreground md:text-2xl">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
