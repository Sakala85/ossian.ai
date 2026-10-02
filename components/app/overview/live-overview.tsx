import { CalendarClock, Mic, PhoneCall, PhoneIncoming, Sparkles, UserRound } from "lucide-react";
import { ActivityFeed } from "@/components/app/overview/activity-feed";
import { EmptyState } from "@/components/app/empty-state";
import { fmtDayShort, fmtTime, parisParts, relTime } from "@/components/app/format";
import { Page } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { goLiveState, toCallRecords } from "@/lib/server/account-view";
import type { Dashboard } from "@/lib/server/db";
import { formatFrench } from "@/lib/voice/phone";
import { GoLivePanel } from "./go-live-panel";

const phone = (p: string) => (p.startsWith("+") ? formatFrench(p) : p);

function ListCard({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      {children.length ? (
        <ul className="divide-y divide-border">{children}</ul>
      ) : (
        <p className="px-5 py-6 text-[13px] text-muted-foreground">{empty}</p>
      )}
    </Card>
  );
}

/** Overview for a real dealership (signed in with its private access link). */
export function LiveOverview({ account, welcome }: { account: Dashboard; welcome: boolean }) {
  const now = new Date();
  const s = goLiveState(account);
  const calls = toCallRecords(account.calls);
  const day = 86_400_000;
  const today = calls.filter((c) => now.getTime() - new Date(c.startedAt).getTime() < day).length;
  const afterHours = calls.filter((c) => c.afterHours).length;
  const openCallbacks = account.callbacks.filter((c) => !c.done_at);
  const hour = parisParts(now).hour;
  const hello = hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour";
  const live = Boolean(s.forwardingVerifiedAt);

  return (
    <Page
      title={hello}
      crumb="Vue d'ensemble"
      subtitle={
        live ? (
          <>
            {s.agentName} a décroché <span className="font-medium text-foreground tabular">{calls.length}</span> appel{calls.length > 1 ? "s" : ""}{" "}
            depuis la mise en service, dont <span className="font-medium text-foreground tabular">{afterHours}</span> hors horaires.
          </>
        ) : (
          <>
            {s.agentName} est configurée pour {account.dealership.name}. Renvoyez vos appels et elle décroche dès aujourd&apos;hui.
          </>
        )
      }
      actions={
        <LinkButton href="/demo" size="sm" variant={live ? "outline" : "primary"}>
          <Mic /> Parler à {s.agentName}
        </LinkButton>
      }
    >
      <div className="grid gap-4 md:gap-5">
        {!live && <GoLivePanel agentName={s.agentName} phone={s.phone} firstCallAt={s.forwardingVerifiedAt} welcome={welcome} />}

        <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
          <StatTile label="Appels décrochés" icon={<PhoneIncoming />} value={calls.length} hint={`${today} sur les dernières 24 h`} />
          <StatTile
            label="Demandes de RDV"
            icon={<CalendarClock />}
            value={account.appointments.length}
            hint="À confirmer dans votre agenda"
          />
          <StatTile label="Leads" icon={<Sparkles />} value={account.leads.length} hint="Ventes VN / VO, reprises" />
          <StatTile
            label="Rappels à faire"
            icon={<PhoneCall />}
            value={openCallbacks.length}
            hint={openCallbacks.some((c) => c.priority === "haute") ? <Badge tone="danger">Priorité haute</Badge> : "Demandés par vos clients"}
          />
        </div>

        <div className="grid gap-4 md:gap-5 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            {calls.length ? (
              <ActivityFeed calls={calls.slice(0, 8)} now={now.toISOString()} />
            ) : (
              <Card>
                <EmptyState
                  icon={<PhoneIncoming />}
                  title="Aucun appel pour l'instant"
                  description={`Chaque appel décroché par ${s.agentName} apparaîtra ici avec son résumé, les informations notées et la transcription.`}
                />
              </Card>
            )}
          </div>
          <div className="grid content-start gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-1">
            <ListCard title="Rappels à faire" description="Clients qui attendent un appel de votre équipe" empty="Aucun rappel en attente.">
              {openCallbacks.slice(0, 6).map((c) => (
                <li key={c.id} className="flex items-start gap-3 px-5 py-3">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                      <span className="truncate">{c.name ?? phone(c.phone)}</span>
                      {c.priority === "haute" && <Badge tone="danger">Urgent</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.reason} · {c.department}
                    </p>
                  </div>
                  <a href={`tel:${c.phone}`} className="shrink-0 font-mono text-xs text-primary tabular hover:underline">
                    {phone(c.phone)}
                  </a>
                </li>
              ))}
            </ListCard>
            <ListCard title="Demandes de rendez-vous" description="Créneaux proposés par l'agent, à confirmer" empty="Aucune demande pour l'instant.">
              {account.appointments.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {a.customer_name} · {a.service}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[a.vehicle.label, a.vehicle.plate, a.courtesy_vehicle ? "véhicule de courtoisie" : null].filter(Boolean).join(" · ") ||
                        phone(a.phone)}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-xs text-muted-foreground tabular">
                    {fmtDayShort(a.starts_at)}
                    <br />
                    {fmtTime(a.starts_at)}
                  </span>
                </li>
              ))}
            </ListCard>
            <ListCard title="Leads" description="Projets d'achat détectés au téléphone" empty="Aucun lead pour l'instant.">
              {account.leads.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {l.name} · {l.interest}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{[l.vehicle, l.note].filter(Boolean).join(" · ") || phone(l.phone)}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{relTime(l.created_at, now)}</span>
                </li>
              ))}
            </ListCard>
          </div>
        </div>
      </div>
    </Page>
  );
}
