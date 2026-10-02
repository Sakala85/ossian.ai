import { Building, CalendarDays, Database, KeyRound, LogOut, Mail, Megaphone, Phone, PhoneForwarded, ShieldCheck, Users, Webhook } from "lucide-react";
import { Mono } from "@/components/onboarding/shared";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dashboard } from "@/lib/server/db";
import { formatFrench } from "@/lib/voice/phone";
import { EmptyState } from "../empty-state";
import { fmtDateLong } from "../format";
import { Page } from "../page-header";
import { RequestButton } from "./request-button";

const phone = (p?: string | null) => (p ? (p.startsWith("+") ? formatFrench(p) : p) : null);

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export function LiveCampaigns({ account }: { account: Dashboard }) {
  const agent = account.dealership.agent_name ?? "Léa";
  return (
    <Page title="Campagnes" subtitle={`Appels sortants passés par ${agent} : rappels d'entretien, relances de devis, enquêtes de satisfaction.`}>
      <Card>
        <EmptyState
          icon={<Megaphone />}
          title="Les campagnes sortantes ne sont pas encore ouvertes sur votre compte"
          description={`Pour l'instant, ${agent} répond aux appels entrants. Dites-nous quelles relances vous intéressent : nous les préparons avec vous.`}
          action={<RequestButton topic="campaigns" label="Ça m'intéresse" />}
        />
      </Card>
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Integrations                                                        */
/* ------------------------------------------------------------------ */

const CONNECTORS = [
  { group: "Logiciel atelier (DMS)", hint: "Lecture du planning et création des rendez-vous", items: [
    { name: "Nextlane", mono: "NX" }, { name: "Keyloop / Autoline", mono: "KL" }, { name: "Kerridge", mono: "KD" }, { name: "CDK Global", mono: "CDK" }, { name: "incadea", mono: "IN" },
  ] },
  { group: "CRM", hint: "Envoi des leads ventes à vos vendeurs", items: [{ name: "Salesforce", mono: "SF" }, { name: "HubSpot", mono: "HS" }] },
  { group: "Agenda", hint: "Créneaux par service", items: [{ name: "Google Agenda", mono: "G" }, { name: "Microsoft Outlook", mono: "O" }] },
  { group: "Messagerie d'équipe", hint: "Alertes en temps réel", items: [{ name: "Slack", mono: "SL" }, { name: "Microsoft Teams", mono: "MT" }] },
];

export function LiveIntegrations({ account }: { account: Dashboard }) {
  const email = account.dealership.contact_email;
  return (
    <Page title="Intégrations" subtitle="Les connexions à vos outils sont mises en place avec notre équipe. Demandez celles dont vous avez besoin.">
      <div className="grid gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Actif sur votre compte</CardTitle>
              <CardDescription>Fonctionne dès l&apos;activation, sans intégration</CardDescription>
            </div>
          </CardHeader>
          <ul className="divide-y divide-border">
            <li className="flex items-center gap-3 px-5 py-3.5">
              <Mono>
                <Mail className="size-3.5" />
              </Mono>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Comptes-rendus par e-mail</p>
                <p className="truncate text-xs text-muted-foreground">Demandes de RDV, leads, rappels et fin d&apos;appel · {email ?? "adresse non renseignée"}</p>
              </div>
              <Badge tone="success" dot>
                Actif
              </Badge>
            </li>
            <li className="flex items-center gap-3 px-5 py-3.5">
              <Mono>
                <CalendarDays className="size-3.5" />
              </Mono>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Tableau de bord Ossian</p>
                <p className="truncate text-xs text-muted-foreground">Appels, demandes de rendez-vous, leads et rappels</p>
              </div>
              <Badge tone="success" dot>
                Actif
              </Badge>
            </li>
          </ul>
        </Card>

        {CONNECTORS.map((g) => (
          <Card key={g.group}>
            <CardHeader>
              <div>
                <CardTitle>{g.group}</CardTitle>
                <CardDescription>{g.hint}</CardDescription>
              </div>
            </CardHeader>
            <ul className="divide-y divide-border">
              {g.items.map((c) => (
                <li key={c.name} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <Mono>{c.mono}</Mono>
                  <p className="min-w-0 flex-1 text-sm font-medium">{c.name}</p>
                  <Badge>Non connecté</Badge>
                  <RequestButton topic="integration" detail={c.name} label="Demander la connexion" />
                </li>
              ))}
            </ul>
          </Card>
        ))}

        <Card>
          <EmptyState
            icon={<Webhook />}
            title="Un autre outil ?"
            description="Webhook, API ou logiciel métier non listé : décrivez votre besoin, nous regardons avec vous."
            action={<RequestButton topic="integration" detail="Autre outil / webhook / API" label="Nous contacter" />}
          />
        </Card>
      </div>
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <span className="mt-0.5 text-muted-foreground [&_svg]:size-4">{icon}</span>
      <dt className="w-40 shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-[13px] text-foreground">{children}</dd>
    </div>
  );
}

export function LiveSettings({ account }: { account: Dashboard }) {
  const d = account.dealership;
  const sites = d.profile.sites ?? [];
  return (
    <Page title="Paramètres" subtitle={`Compte de ${d.name}.`}>
      <div className="grid max-w-[860px] gap-5">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Concession</CardTitle>
              <CardDescription>Modifiable depuis la page Agent, onglet Concession</CardDescription>
            </div>
          </CardHeader>
          <dl className="divide-y divide-border">
            <Row icon={<Building />} label="Nom">
              {d.name}
            </Row>
            <Row icon={<Database />} label="Site web">
              {d.website ?? "—"}
            </Row>
            <Row icon={<Phone />} label="Numéro Ossian">
              {account.phone ? <span className="font-mono tabular">{formatFrench(account.phone.e164)}</span> : "En cours d'attribution"}
            </Row>
            <Row icon={<PhoneForwarded />} label="Numéro de transfert">
              {phone(d.fallback_number) ?? "—"}
            </Row>
            <Row icon={<CalendarDays />} label="Compte créé le">
              {fmtDateLong(d.created_at)}
            </Row>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sites</CardTitle>
              <CardDescription>
                {sites.length} site{sites.length > 1 ? "s" : ""} connus de l&apos;agent
              </CardDescription>
            </div>
          </CardHeader>
          {sites.length ? (
            <ul className="divide-y divide-border">
              {sites.map((s) => (
                <li key={s.id} className="px-5 py-3">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[s.address, s.city].filter(Boolean).join(", ") || "Adresse non renseignée"}
                    {s.phone ? ` · ${phone(s.phone)}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-5 text-[13px] text-muted-foreground">Aucun site renseigné.</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Accès</CardTitle>
              <CardDescription>Le tableau de bord s&apos;ouvre avec le lien privé reçu à l&apos;activation</CardDescription>
            </div>
          </CardHeader>
          <dl className="divide-y divide-border">
            <Row icon={<Mail />} label="E-mail du compte">
              {d.contact_email ?? "—"}
            </Row>
            <Row icon={<KeyRound />} label="Cet appareil">
              <a href="/acces/sortie" className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline">
                <LogOut className="size-3.5" /> Se déconnecter
              </a>
            </Row>
            <Row icon={<Users />} label="Collaborateurs">
              <span className="flex flex-wrap items-center gap-3">
                Partagez le lien privé, ou demandez des accès nominatifs.
                <RequestButton topic="team" label="Demander des accès" />
              </span>
            </Row>
          </dl>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Données</CardTitle>
              <CardDescription>Où sont conservées les informations de vos appels</CardDescription>
            </div>
          </CardHeader>
          <dl className="divide-y divide-border">
            <Row icon={<ShieldCheck />} label="Base de données">
              Union européenne (Paris)
            </Row>
            <Row icon={<Mail />} label="Une question ?">
              <RequestButton topic="help" label="Contacter l'équipe Ossian" />
            </Row>
          </dl>
        </Card>
      </div>
    </Page>
  );
}
