"use client";

import { Check, Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FirstCallStatus, ForwardingSetup, useFirstCall } from "@/components/golive/line-setup";
import { LinkButton } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GoLivePanelProps {
  agentName: string;
  phone: { e164: string; display: string } | null;
  firstCallAt: string | null;
  welcome?: boolean;
}

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children?: React.ReactNode }) {
  return (
    <li className="relative flex gap-4 pb-7 last:pb-0">
      <span
        aria-hidden
        className={cn(
          "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs",
          done ? "bg-primary text-primary-foreground" : "border border-primary bg-card text-primary shadow-[0_0_0_4px_var(--primary-soft)]",
        )}
      >
        {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn("text-sm font-medium", done ? "text-muted-foreground" : "text-foreground")}>
          {title}
          {done && <span className="sr-only"> (terminé)</span>}
        </p>
        {children && <div className="relative mt-3 -ml-11 sm:ml-0">{children}</div>}
      </div>
    </li>
  );
}

/** "Mise en service" checklist shown on the overview until the line receives its first call. */
export function GoLivePanel({ agentName, phone, firstCallAt: initial, welcome }: GoLivePanelProps) {
  const router = useRouter();
  const firstCallAt = useFirstCall(initial, Boolean(phone));

  // Pull the new call into the dashboard as soon as it is detected.
  useEffect(() => {
    if (firstCallAt && !initial) router.refresh();
  }, [firstCallAt, initial, router]);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-medium tracking-tight">{welcome ? `Bienvenue ! ${agentName} est prête.` : "Mise en service"}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Il reste une seule étape : renvoyer vos appels vers Ossian. Comptez 2 minutes.
          </p>
        </div>
        <LinkButton href="/demo" variant="outline" size="sm">
          <Mic /> Parler à {agentName}
        </LinkButton>
      </div>
      <ol className="relative px-5 py-5">
        <span aria-hidden className="absolute top-8 bottom-8 left-[33px] w-px bg-border" />
        <Step n={1} done title={`Agent ${agentName} configuré à partir de votre site`} />
        <Step n={2} done={Boolean(phone)} title={phone ? `Numéro attribué : ${phone.display}` : "Numéro en cours d'attribution"}>
          {!phone && (
            <p className="text-[13px] text-muted-foreground">
              Nous finalisons votre ligne : vous recevrez le numéro par e-mail, en général dans l&apos;heure ouvrée.
            </p>
          )}
        </Step>
        <Step n={3} done={Boolean(firstCallAt)} title="Renvoyez vos appels vers ce numéro">
          {phone && !firstCallAt && <ForwardingSetup e164={phone.e164} display={phone.display} />}
        </Step>
        <Step n={4} done={Boolean(firstCallAt)} title="Vérification par un premier appel">
          {phone && <FirstCallStatus firstCallAt={firstCallAt} agentName={agentName} />}
        </Step>
      </ol>
    </Card>
  );
}
