"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { STEPS, TOTAL_STEPS, type StepId } from "./lib";

export function TopBar({ step, live, onSaveQuit }: { step: StepId; live: boolean; onSaveQuit: () => void }) {
  const label = STEPS.find((s) => s.id === step)?.label;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="relative mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Ossian — accueil" className="rounded-md">
          <Logo markClassName="size-6" />
        </Link>
        <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[13px] sm:flex">
          {live ? (
            <span className="font-medium text-foreground">Configuration terminée</span>
          ) : (
            <>
              <span className="font-medium text-foreground tabular">
                Étape {step} sur {TOTAL_STEPS}
              </span>
              <span className="hidden text-border-strong md:inline">·</span>
              <span className="hidden text-muted-foreground md:inline">{label}</span>
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onSaveQuit}>
          {live ? "Quitter" : "Enregistrer et quitter"}
          <LogOut />
        </Button>
      </div>
    </header>
  );
}
