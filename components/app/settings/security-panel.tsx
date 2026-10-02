"use client";

import { Download, EyeOff, FileText, KeyRound, LockKeyhole, Server, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Panel, ToggleRow } from "../form-bits";
import { useShell } from "../shell-context";

export function SecurityPanel() {
  const { toast } = useShell();
  const [retention, setRetention] = useState("90");
  const [masking, setMasking] = useState(true);
  const [mfa, setMfa] = useState(true);
  const [sso, setSso] = useState(false);
  const [provider, setProvider] = useState<"entra" | "google" | "saml">("entra");

  return (
    <Panel id="securite" title="Sécurité & RGPD" description="Conservation des données, conformité et accès à l'espace de travail.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Field
          label="Rétention des enregistrements"
          hint="Audio et transcriptions nominatives. Les statistiques anonymisées sont conservées 24 mois."
        >
          <Select value={retention} onChange={(e) => setRetention(e.target.value)}>
            <option value="30">30 jours</option>
            <option value="90">90 jours (recommandé)</option>
            <option value="180">180 jours</option>
            <option value="365">12 mois</option>
          </Select>
        </Field>
        <div className="grid gap-1.5">
          <span className="text-[13px] font-medium">Hébergement des données</span>
          <div className="flex h-9.5 items-center gap-2.5 rounded-[10px] border border-input bg-subtle px-3 text-sm">
            <Server className="size-4 text-muted-foreground" />
            Union européenne · Paris
            <Badge tone="success" className="ml-auto">
              ISO 27001
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">Aucune donnée n&apos;est utilisée pour entraîner des modèles tiers.</p>
        </div>
      </div>

      <div className="mt-6 divide-y divide-border border-t border-border pt-5">
        <ToggleRow
          icon={<EyeOff />}
          title="Masquage des données sensibles"
          description="Numéros de carte, IBAN et données de santé sont masqués dans les transcriptions et les exports."
          checked={masking}
          onChange={setMasking}
        />
        <ToggleRow
          icon={<LockKeyhole />}
          title="Double authentification obligatoire"
          description="Tous les membres doivent valider leur connexion par application ou clé de sécurité."
          checked={mfa}
          onChange={setMfa}
        />
        <ToggleRow
          icon={<KeyRound />}
          title="Authentification unique (SSO)"
          description="Connectez-vous avec l'annuaire de votre groupe ; les comptes sont désactivés automatiquement au départ d'un collaborateur."
          checked={sso}
          onChange={(v) => {
            setSso(v);
            if (v) toast("SSO : configuration à finaliser avec votre administrateur", "info");
          }}
        >
          <Segmented
            value={provider}
            onChange={setProvider}
            options={[
              { value: "entra", label: "Microsoft Entra ID" },
              { value: "google", label: "Google Workspace" },
              { value: "saml", label: "SAML 2.0" },
            ]}
          />
        </ToggleRow>
      </div>

      <div className="mt-6 grid gap-3 border-t border-border pt-5 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-border p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success [&_svg]:size-4">
            <ShieldCheck />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium">Accord de traitement (DPA)</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Signé le 12 mars 2026 · art. 28 RGPD · sous-traitants listés</p>
            <Button variant="outline" size="xs" className="mt-3" onClick={() => toast("DPA téléchargé (PDF)")}>
              <FileText /> Télécharger le DPA
            </Button>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border p-4">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4">
            <Download />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-medium">Export des données</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Appels, transcriptions, RDV et leads (JSON + audio). Droit à la portabilité.</p>
            <Button variant="outline" size="xs" className="mt-3" onClick={() => toast("Export lancé : vous recevrez un lien par e-mail", "info")}>
              Demander un export
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color-mix(in_oklch,var(--danger)_25%,var(--border))] p-4">
        <div>
          <p className="text-[13.5px] font-medium">Supprimer l&apos;espace de travail</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Supprime définitivement les données, numéros et enregistrements après 30 jours.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-[color-mix(in_oklch,var(--danger)_35%,var(--border))] text-danger hover:bg-danger-soft"
          onClick={() => toast("Action réservée au propriétaire du compte", "danger")}
        >
          Supprimer
        </Button>
      </div>
    </Panel>
  );
}
