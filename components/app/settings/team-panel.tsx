"use client";

import { MailPlus, UserPlus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/misc";
import { Panel } from "../form-bits";
import { Modal, OverlayHeader } from "../overlay";
import { useShell } from "../shell-context";

const ROLES = ["Administrateur", "Manager", "Conseiller service", "Vendeur", "Lecture seule"] as const;
type Role = (typeof ROLES)[number];

type Member = { name: string; email: string; title: string; role: Role; sites: string; active: string; pending?: boolean };

const MEMBERS: Member[] = [
  { name: "Claire Fontaine", email: "claire.fontaine@mistral-automobiles.fr", title: "Directrice APV", role: "Administrateur", sites: "Tous les sites", active: "En ligne" },
  { name: "Thomas Girard", email: "thomas.girard@mistral-automobiles.fr", title: "Chef des ventes", role: "Manager", sites: "Tous les sites", active: "Il y a 12 min" },
  { name: "Karim Benali", email: "karim.benali@mistral-automobiles.fr", title: "Chef d'atelier", role: "Manager", sites: "Lyon Est", active: "Il y a 1 h" },
  { name: "Sophie Martin", email: "sophie.martin@mistral-automobiles.fr", title: "Conseillère service", role: "Conseiller service", sites: "Lyon Est", active: "Il y a 3 h" },
  { name: "Julien Morel", email: "julien.morel@mistral-automobiles.fr", title: "Conseiller service", role: "Conseiller service", sites: "Villeurbanne", active: "Hier" },
  { name: "Inès Fontaine", email: "ines.fontaine@mistral-automobiles.fr", title: "Vendeuse VN", role: "Vendeur", sites: "Lyon Est", active: "Il y a 40 min" },
  { name: "Marc Dubois", email: "marc.dubois@mistral-automobiles.fr", title: "Vendeur VO", role: "Vendeur", sites: "Bron", active: "Il y a 2 h" },
];

export function TeamPanel() {
  const { toast } = useShell();
  const [members, setMembers] = useState<Member[]>(MEMBERS);
  const [invite, setInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Conseiller service");
  const [site, setSite] = useState("Lyon Est");

  const send = () => {
    const name = email.split("@")[0]!.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    setMembers((m) => [...m, { name, email, title: "Invitation envoyée", role, sites: site, active: "—", pending: true }]);
    setInvite(false);
    setEmail("");
    toast(`Invitation envoyée à ${email}`);
  };

  return (
    <Panel
      id="equipe"
      title="Équipe"
      description="Qui peut consulter les appels, gérer les rendez-vous et configurer l'agent."
      action={
        <Button size="sm" onClick={() => setInvite(true)}>
          <UserPlus /> Inviter
        </Button>
      }
      bodyClassName="px-0 pb-0 pt-4"
    >
      <div className="scrollbar-thin overflow-x-auto">
        <table className="w-full min-w-[720px] text-[13px]">
          <thead>
            <tr className="border-y border-border bg-subtle text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 pl-5 font-medium">Membre</th>
              <th className="px-3 py-2 font-medium">Rôle</th>
              <th className="px-3 py-2 font-medium">Sites</th>
              <th className="py-2 pr-5 pl-3 text-right font-medium">Activité</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m, i) => (
              <tr key={m.email} className="border-b border-border last:border-b-0">
                <td className="py-2.5 pr-3 pl-5">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} size={30} className={m.pending ? "opacity-50" : undefined} />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        {m.name}
                        {i === 0 && <span className="text-xs font-normal text-muted-foreground">(vous)</span>}
                        {m.pending && <Badge tone="warning">En attente</Badge>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.pending ? m.email : `${m.title} · ${m.email}`}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <Select
                    value={m.role}
                    disabled={i === 0}
                    onChange={(e) => {
                      const r = e.target.value as Role;
                      setMembers((ms) => ms.map((x) => (x.email === m.email ? { ...x, role: r } : x)));
                      toast(`${m.name} est maintenant ${r.toLowerCase()}`);
                    }}
                    className="h-8 w-44 rounded-lg py-0 pr-8 pl-2.5 text-[13px] bg-[right_8px_center]"
                    aria-label={`Rôle de ${m.name}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </Select>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{m.sites}</td>
                <td className="py-2.5 pr-5 pl-3 text-right text-xs">
                  {m.active === "En ligne" ? (
                    <span className="inline-flex items-center gap-1.5 text-success">
                      <span className="size-1.5 rounded-full bg-success" /> En ligne
                    </span>
                  ) : (
                    <span className="text-muted-foreground">{m.active}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={invite} onClose={() => setInvite(false)} label="Inviter un membre" className="max-w-md">
        <OverlayHeader title="Inviter un membre" description="Un e-mail d'invitation valable 7 jours sera envoyé." onClose={() => setInvite(false)} />
        <form
          className="grid gap-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.includes("@")) send();
          }}
        >
          <Field label="Adresse e-mail">
            <Input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@mistral-automobiles.fr" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rôle">
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="Site">
              <Select value={site} onChange={(e) => setSite(e.target.value)}>
                {["Tous les sites", "Lyon Est", "Villeurbanne", "Bron"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setInvite(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={!email.includes("@")}>
              <MailPlus /> Envoyer l&apos;invitation
            </Button>
          </div>
        </form>
      </Modal>
    </Panel>
  );
}
