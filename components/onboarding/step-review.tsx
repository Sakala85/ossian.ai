"use client";

import {
  Building,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  Info,
  MessageCircleQuestionMark,
  PhoneForwarded,
  Plus,
  Sparkles,
  TriangleAlert,
  Wrench,
  MapPin,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Separator } from "@/components/ui/misc";
import { DEPARTMENTS, type DealershipProfile, type DepartmentKey } from "@/lib/domain/types";
import { cn } from "@/lib/utils";
import {
  AiBadge,
  Callout,
  ChipEditor,
  FormField,
  RemoveButton,
  Section,
  StepActions,
  StepHeader,
  UnitInput,
  missingClass,
} from "./shared";
import { EASE, SITES_BUCKETS, hostOf, isMissing, plural, uid, type ProfileSource, type SitesBucket, type UpdateProfile } from "./lib";

type SectionId = "identity" | "sites" | "hours" | "services" | "departments" | "policies";
const SECTION_IDS: SectionId[] = ["identity", "sites", "hours", "services", "departments", "policies"];

function MissingBadge({ n }: { n: number }) {
  if (!n) return null;
  return (
    <Badge tone="warning" className="shrink-0">
      <TriangleAlert />
      {n} à compléter
    </Badge>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="justify-self-start">
      <Plus />
      {children}
    </Button>
  );
}

const rowMotion = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, transition: { duration: 0.12 } },
  transition: { duration: 0.22, ease: EASE },
} as const;

export function StepReview({
  profile,
  update,
  source,
  isAi,
  markEdited,
  sitesBucket,
  onBack,
  onNext,
  embedded = false,
}: {
  profile: DealershipProfile;
  update: UpdateProfile;
  source: ProfileSource | null;
  isAi: (path: string) => boolean;
  markEdited: (path: string) => void;
  sitesBucket: SitesBucket | null;
  onBack?: () => void;
  onNext?: () => void;
  /** Rendered inside the dashboard: no wizard header, banners or navigation. */
  embedded?: boolean;
}) {
  const ids = useId();
  const [open, setOpen] = useState<Record<SectionId, boolean>>({
    identity: true,
    sites: true,
    hours: false,
    services: false,
    departments: false,
    policies: false,
  });
  const [showErrors, setShowErrors] = useState(false);
  const allOpen = SECTION_IDS.every((s) => open[s]);
  const toggle = (s: SectionId) => setOpen((o) => ({ ...o, [s]: !o[s] }));
  const edit = (path: string, recipe: (d: DealershipProfile) => void) => {
    update(recipe);
    markEdited(path);
  };

  const nameId = `${ids}-name`;
  const nameError = showErrors && !profile.name.trim() ? "Indiquez le nom de votre concession pour continuer." : null;
  const host = hostOf(profile.website);

  const sitesMissing = profile.sites.reduce((n, s) => n + [s.address, s.city, s.phone].filter(isMissing).length, 0);
  const deptMissing = profile.departments.filter((d) => isMissing(d.phone)).length;
  const bucket = SITES_BUCKETS.find((b) => b.value === sitesBucket);
  const bucketGap = bucket && profile.sites.length < bucket.min;

  const next = () => {
    if (!profile.name.trim()) {
      setShowErrors(true);
      setOpen((o) => ({ ...o, identity: true }));
      requestAnimationFrame(() => {
        const el = document.getElementById(nameId);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        el?.focus({ preventScroll: true });
      });
      return;
    }
    onNext?.();
  };

  const usedKeys = new Set(profile.departments.map((d) => d.key));
  const freeKey = (Object.keys(DEPARTMENTS) as DepartmentKey[]).find((k) => !usedKeys.has(k)) ?? "accueil";

  return (
    <div>
      {!embedded && (
        <>
      <StepHeader
        step={3}
        title={
          <>
            Vérifiez <span className="font-serif-accent">l&apos;essentiel</span>.
          </>
        }
        description="Votre agent répondra avec ces informations. Tout est modifiable ici, et plus tard depuis le tableau de bord."
      />

      <div className="mb-5 grid gap-3">
        {source === "ai" && (
          <Callout tone="primary" icon={<Sparkles />}>
            Pré-rempli par l&apos;IA à partir de <span className="font-mono">{host}</span>. Les champs marqués <AiBadge className="mx-0.5 align-[-3px]" />{" "}
            sont à vérifier.
          </Callout>
        )}
        {(source === "simulated" || source === "template" || source === "demo") && (
          <Callout tone="neutral" icon={<Info />}>
            Seuls le nom{host ? " et le site" : ""} sont pré-remplis : rien n&apos;est inventé. Ajoutez vos horaires, vos prestations et les numéros de vos
            services (les champs vides sont signalés).
          </Callout>
        )}
      </div>

        </>
      )}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">6 rubriques</p>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setOpen(Object.fromEntries(SECTION_IDS.map((s) => [s, !allOpen])) as Record<SectionId, boolean>)}
        >
          {allOpen ? <ChevronsDownUp /> : <ChevronsUpDown />}
          {allOpen ? "Tout replier" : "Tout déplier"}
        </Button>
      </div>

      <div className="grid gap-3">
        {/* Identité ------------------------------------------------ */}
        <Section
          id={`${ids}-identity`}
          icon={<Building />}
          title="Identité"
          summary={[profile.name || "Nom à indiquer", plural(profile.brands.length, "marque")].join(" · ")}
          open={open.identity}
          onToggle={() => toggle("identity")}
          badge={!profile.name.trim() ? <MissingBadge n={1} /> : undefined}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id={nameId} label="Nom de la concession" ai={isAi("name")} error={nameError}>
              <Input
                id={nameId}
                value={profile.name}
                placeholder="Garage Dupont"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? `${nameId}-error` : undefined}
                className={cn(nameError && "border-danger focus:border-danger focus:ring-danger-soft")}
                onChange={({ target: { value } }) => edit("name", (d) => void (d.name = value))}
              />
            </FormField>
            <FormField id={`${ids}-group`} label="Groupe" optional ai={isAi("group") && !!profile.group}>
              <Input
                id={`${ids}-group`}
                value={profile.group ?? ""}
                placeholder="Groupe Dupont"
                onChange={({ target: { value } }) => edit("group", (d) => void (d.group = value || undefined))}
              />
            </FormField>
            <FormField id={`${ids}-web`} label="Site web" optional className="sm:col-span-2">
              <Input
                id={`${ids}-web`}
                value={profile.website ?? ""}
                inputMode="url"
                spellCheck={false}
                placeholder="https://garage-dupont.fr"
                className="font-mono text-[13px]"
                onChange={({ target: { value } }) => edit("website", (d) => void (d.website = value || undefined))}
              />
            </FormField>
            <FormField id={`${ids}-desc`} label="Présentation" optional ai={isAi("description") && !!profile.description} className="sm:col-span-2">
              <Textarea
                id={`${ids}-desc`}
                value={profile.description ?? ""}
                placeholder="Concession multimarque : ventes VN / VO, atelier toutes marques, carrosserie…"
                className="min-h-20"
                onChange={({ target: { value } }) => edit("description", (d) => void (d.description = value))}
              />
            </FormField>
            <FormField
              id={`${ids}-brands`}
              label="Marques distribuées"
              ai={isAi("brands") && profile.brands.length > 0}
              hint="Entrée ou virgule pour ajouter une marque."
              className="sm:col-span-2"
            >
              <ChipEditor
                id={`${ids}-brands`}
                label="Ajouter une marque"
                values={profile.brands}
                placeholder={profile.brands.length ? "Ajouter…" : "Peugeot, Toyota…"}
                onChange={(v) =>
                  edit("brands", (d) => {
                    const removed = d.brands.filter((b) => !v.includes(b));
                    d.brands = v;
                    if (removed.length) d.sites.forEach((s) => (s.brands = s.brands.filter((b) => !removed.includes(b))));
                  })
                }
              />
            </FormField>
          </div>
        </Section>

        {/* Sites ---------------------------------------------------- */}
        <Section
          id={`${ids}-sites`}
          icon={<MapPin />}
          title="Sites"
          summary={profile.sites.map((s) => s.city || s.name).filter(Boolean).join(" · ") || plural(profile.sites.length, "site")}
          open={open.sites}
          onToggle={() => toggle("sites")}
          badge={<MissingBadge n={sitesMissing} />}
        >
          <div className="grid gap-3">
            {bucketGap && (
              <Callout tone="warning" icon={<Info />}>
                Vous avez indiqué {bucket!.label} sites ; nous en avons trouvé {profile.sites.length}. Ajoutez les sites manquants ci-dessous — l&apos;import
                par fichier arrive bientôt.
              </Callout>
            )}
            <AnimatePresence initial={false}>
              {profile.sites.map((site, i) => {
                const path = `site:${site.id}`;
                const sid = `${ids}-site-${site.id}`;
                const set = (recipe: (s: DealershipProfile["sites"][number]) => void) =>
                  edit(path, (d) => {
                    const s = d.sites.find((x) => x.id === site.id);
                    if (s) recipe(s);
                  });
                return (
                  <motion.div key={site.id} layout="position" {...rowMotion} className="rounded-lg border border-border bg-subtle p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground tabular">Site {i + 1}</span>
                      {isAi(path) && <AiBadge />}
                      <RemoveButton
                        className="ml-auto"
                        label={`Supprimer ${site.name || `le site ${i + 1}`}`}
                        disabled={profile.sites.length <= 1}
                        onClick={() => edit("sites", (d) => void (d.sites = d.sites.filter((x) => x.id !== site.id)))}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField id={`${sid}-name`} label="Nom du site" className="sm:col-span-2">
                        <Input id={`${sid}-name`} value={site.name} placeholder={profile.name || "Nom du site"} onChange={({ target: { value } }) => set((s) => (s.name = value))} />
                      </FormField>
                      <FormField id={`${sid}-addr`} label="Adresse">
                        <Input
                          id={`${sid}-addr`}
                          value={site.address}
                          autoComplete="off"
                          placeholder="À compléter"
                          className={cn(isMissing(site.address) && missingClass)}
                          onChange={({ target: { value } }) => set((s) => (s.address = value))}
                        />
                      </FormField>
                      <FormField id={`${sid}-city`} label="Code postal et ville">
                        <Input
                          id={`${sid}-city`}
                          value={site.city}
                          autoComplete="off"
                          placeholder="69008 Lyon"
                          className={cn(isMissing(site.city) && missingClass)}
                          onChange={({ target: { value } }) => set((s) => (s.city = value))}
                        />
                      </FormField>
                      <FormField id={`${sid}-phone`} label="Téléphone">
                        <Input
                          id={`${sid}-phone`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="off"
                          value={site.phone}
                          placeholder="04 72 00 00 00"
                          className={cn("font-mono text-[13px] tabular", isMissing(site.phone) && missingClass)}
                          onChange={({ target: { value } }) => set((s) => (s.phone = value))}
                        />
                      </FormField>
                      {profile.brands.length > 0 && (
                        <div className="grid content-start gap-1.5">
                          <span className="text-[13px] font-medium text-foreground">Marques du site</span>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.brands.map((b) => {
                              const on = site.brands.includes(b);
                              return (
                                <button
                                  key={b}
                                  type="button"
                                  aria-pressed={on}
                                  onClick={() => set((s) => (s.brands = on ? s.brands.filter((x) => x !== b) : [...s.brands, b]))}
                                  className={cn(
                                    "h-7 rounded-md border px-2.5 text-[13px] transition-colors",
                                    on
                                      ? "border-[color-mix(in_oklch,var(--primary)_35%,transparent)] bg-primary-soft text-primary"
                                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                                  )}
                                >
                                  {b}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <AddButton
              onClick={() =>
                edit("sites", (d) =>
                  d.sites.push({ id: uid("site"), name: "", address: "", city: "", phone: "", brands: [] }),
                )
              }
            >
              Ajouter un site
            </AddButton>
          </div>
        </Section>

        {/* Horaires ------------------------------------------------- */}
        <Section
          id={`${ids}-hours`}
          icon={<Clock />}
          title="Horaires"
          ai={isAi("hours") && profile.hours.length > 0}
          summary={profile.hours.map((h) => h.label).filter(Boolean).join(" · ") || "Aucune plage horaire"}
          open={open.hours}
          onToggle={() => toggle("hours")}
        >
          <div className="grid gap-2">
            <div className="hidden grid-cols-[11rem_1fr] gap-2 pr-9 text-xs text-muted-foreground sm:grid">
              <span>Service</span>
              <span>Horaires</span>
            </div>
              {profile.hours.map((h, i) => (
                <motion.div key={i} {...rowMotion} className="flex gap-2">
                  <div className="grid flex-1 gap-2 sm:grid-cols-[11rem_1fr]">
                    <Input
                      aria-label={`Service, plage ${i + 1}`}
                      value={h.label}
                      placeholder="Atelier"
                      onChange={({ target: { value } }) => edit("hours", (d) => void (d.hours[i]!.label = value))}
                    />
                    <Input
                      aria-label={`Horaires, plage ${i + 1}`}
                      value={h.value}
                      placeholder="Lundi–vendredi 8h–12h et 14h–18h"
                      onChange={({ target: { value } }) => edit("hours", (d) => void (d.hours[i]!.value = value))}
                    />
                  </div>
                  <RemoveButton
                    className="mt-1"
                    label={`Supprimer la plage ${h.label || i + 1}`}
                    onClick={() => edit("hours", (d) => void d.hours.splice(i, 1))}
                  />
                </motion.div>
              ))}
            <div className="pt-1">
              <AddButton onClick={() => edit("hours", (d) => void d.hours.push({ label: "", value: "" }))}>Ajouter une plage</AddButton>
            </div>
          </div>
        </Section>

        {/* Prestations ---------------------------------------------- */}
        <Section
          id={`${ids}-services`}
          icon={<Wrench />}
          title="Prestations atelier"
          ai={isAi("services") && profile.services.length > 0}
          summary={plural(profile.services.length, "prestation") + (profile.services.some((s) => s.priceFrom != null) ? " · tarifs indicatifs" : "")}
          open={open.services}
          onToggle={() => toggle("services")}
        >
          <div className="grid gap-2">
            <div className="hidden grid-cols-[1fr_6.5rem_7.5rem] gap-2 pr-9 text-xs text-muted-foreground sm:grid">
              <span>Prestation</span>
              <span>Durée</span>
              <span>À partir de</span>
            </div>
              {profile.services.map((s, i) => (
                <motion.div key={i} {...rowMotion} className="flex gap-2">
                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[1fr_6.5rem_7.5rem]">
                    <Input
                      aria-label={`Prestation ${i + 1}`}
                      value={s.name}
                      placeholder="Révision constructeur"
                      className="col-span-2 sm:col-span-1"
                      onChange={({ target: { value } }) => edit("services", (d) => void (d.services[i]!.name = value))}
                    />
                    <UnitInput
                      unit="min"
                      type="number"
                      inputMode="numeric"
                      min={5}
                      step={5}
                      aria-label={`Durée de ${s.name || `la prestation ${i + 1}`}, en minutes`}
                      value={s.durationMin || ""}
                      onChange={({ target: { value } }) => edit("services", (d) => void (d.services[i]!.durationMin = Math.max(0, Number(value) || 0)))}
                    />
                    <UnitInput
                      unit="€"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      aria-label={`Prix à partir de, ${s.name || `prestation ${i + 1}`}, en euros`}
                      placeholder="Devis"
                      value={s.priceFrom ?? ""}
                      onChange={({ target: { value } }) =>
                        edit("services", (d) => {
                          const v = value;
                          d.services[i]!.priceFrom = v === "" ? undefined : Math.max(0, Number(v) || 0);
                        })
                      }
                    />
                  </div>
                  <RemoveButton
                    className="mt-1"
                    label={`Supprimer ${s.name || `la prestation ${i + 1}`}`}
                    onClick={() => edit("services", (d) => void d.services.splice(i, 1))}
                  />
                </motion.div>
              ))}
            <p className="pt-1 text-xs text-muted-foreground">Prix indicatifs annoncés « à partir de ». Laissez vide pour « sur devis », 0 pour une prestation offerte.</p>
            <div className="pt-1">
              <AddButton onClick={() => edit("services", (d) => void d.services.push({ name: "", durationMin: 60 }))}>Ajouter une prestation</AddButton>
            </div>
          </div>
        </Section>

        {/* Services & transferts ------------------------------------ */}
        <Section
          id={`${ids}-departments`}
          icon={<PhoneForwarded />}
          title="Services & transferts"
          ai={isAi("departments") && profile.departments.length > 0}
          summary={profile.departments.map((d) => d.label || DEPARTMENTS[d.key]).join(" · ") || "Aucun service"}
          open={open.departments}
          onToggle={() => toggle("departments")}
          badge={<MissingBadge n={deptMissing} />}
        >
          <div className="grid gap-3">
            <p className="text-[13px] text-muted-foreground">
              Quand l&apos;appelant demande un conseiller, l&apos;agent transfère vers ces numéros pendant leurs horaires — et programme un rappel sinon.
            </p>
              {profile.departments.map((dep, i) => {
                const did = `${ids}-dep-${i}`;
                return (
                  <motion.div key={`dep-${i}`} {...rowMotion} className="rounded-lg border border-border bg-subtle p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Select
                        aria-label="Type de service"
                        value={dep.key}
                        className="h-8 w-auto max-w-[70%] text-[13px]"
                        onChange={({ target: { value } }) =>
                          edit("departments", (d) => {
                            const k = value as DepartmentKey;
                            const x = d.departments[i]!;
                            if (!x.label || x.label === DEPARTMENTS[x.key]) x.label = DEPARTMENTS[k];
                            x.key = k;
                          })
                        }
                      >
                        {(Object.keys(DEPARTMENTS) as DepartmentKey[]).map((k) => (
                          <option key={k} value={k}>
                            {DEPARTMENTS[k]}
                          </option>
                        ))}
                      </Select>
                      <RemoveButton
                        className="ml-auto"
                        label={`Supprimer ${dep.label || DEPARTMENTS[dep.key]}`}
                        onClick={() => edit("departments", (d) => void d.departments.splice(i, 1))}
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FormField id={`${did}-label`} label="Nom annoncé à l'appelant">
                        <Input
                          id={`${did}-label`}
                          value={dep.label}
                          placeholder={DEPARTMENTS[dep.key]}
                          onChange={({ target: { value } }) => edit("departments", (d) => void (d.departments[i]!.label = value))}
                        />
                      </FormField>
                      <FormField id={`${did}-phone`} label="Numéro de transfert">
                        <Input
                          id={`${did}-phone`}
                          type="tel"
                          inputMode="tel"
                          autoComplete="off"
                          value={dep.phone}
                          placeholder="04 72 00 00 00"
                          className={cn("font-mono text-[13px] tabular", isMissing(dep.phone) && missingClass)}
                          onChange={({ target: { value } }) => edit("departments", (d) => void (d.departments[i]!.phone = value))}
                        />
                      </FormField>
                      <FormField id={`${did}-hours`} label="Joignable" className="sm:col-span-2">
                        <Input
                          id={`${did}-hours`}
                          value={dep.hours}
                          placeholder="Lun–ven 8h–18h"
                          onChange={({ target: { value } }) => edit("departments", (d) => void (d.departments[i]!.hours = value))}
                        />
                      </FormField>
                    </div>
                  </motion.div>
                );
              })}
            <AddButton
              onClick={() =>
                edit("departments", (d) => void d.departments.push({ key: freeKey, label: DEPARTMENTS[freeKey], phone: "", hours: "" }))
              }
            >
              Ajouter un service
            </AddButton>
          </div>
        </Section>

        {/* Politiques & FAQ ----------------------------------------- */}
        <Section
          id={`${ids}-policies`}
          icon={<MessageCircleQuestionMark />}
          title="Politiques & FAQ"
          ai={(isAi("policies") && profile.policies.length > 0) || (isAi("faq") && profile.faq.length > 0)}
          summary={`${plural(profile.policies.length, "règle")} · ${plural(profile.faq.length, "question")}`}
          open={open.policies}
          onToggle={() => toggle("policies")}
        >
          <div className="grid gap-6">
            <div className="grid gap-2">
              <div>
                <p className="text-[13px] font-medium text-foreground">Règles et politiques</p>
                <p className="text-xs text-muted-foreground">Ce que l&apos;agent doit savoir et respecter : véhicule de courtoisie, paiement, garanties…</p>
              </div>
                {profile.policies.map((x, i) => (
                  <motion.div key={i} {...rowMotion} className="flex gap-2">
                    <Textarea
                      aria-label={`Règle ${i + 1}`}
                      value={x}
                      className="min-h-16 flex-1"
                      onChange={({ target: { value } }) => edit("policies", (d) => void (d.policies[i] = value))}
                    />
                    <RemoveButton className="mt-1" label={`Supprimer la règle ${i + 1}`} onClick={() => edit("policies", (d) => void d.policies.splice(i, 1))} />
                  </motion.div>
                ))}
              <div className="pt-1">
                <AddButton onClick={() => edit("policies", (d) => void d.policies.push(""))}>Ajouter une règle</AddButton>
              </div>
            </div>
            <Separator />
            <div className="grid gap-2">
              <div>
                <p className="text-[13px] font-medium text-foreground">Questions fréquentes</p>
                <p className="text-xs text-muted-foreground">Réponses que l&apos;agent peut donner mot pour mot.</p>
              </div>
                {profile.faq.map((f, i) => (
                  <motion.div key={i} {...rowMotion} className="flex gap-2">
                    <div className="grid flex-1 gap-2 rounded-lg border border-border bg-subtle p-3">
                      <Input
                        aria-label={`Question ${i + 1}`}
                        value={f.q}
                        placeholder="Proposez-vous un véhicule de courtoisie ?"
                        className="font-medium"
                        onChange={({ target: { value } }) => edit("faq", (d) => void (d.faq[i]!.q = value))}
                      />
                      <Textarea
                        aria-label={`Réponse ${i + 1}`}
                        value={f.a}
                        placeholder="Oui, sur réservation…"
                        className="min-h-16"
                        onChange={({ target: { value } }) => edit("faq", (d) => void (d.faq[i]!.a = value))}
                      />
                    </div>
                    <RemoveButton className="mt-1" label={`Supprimer la question ${i + 1}`} onClick={() => edit("faq", (d) => void d.faq.splice(i, 1))} />
                  </motion.div>
                ))}
              <div className="pt-1">
                <AddButton onClick={() => edit("faq", (d) => void d.faq.push({ q: "", a: "" }))}>Ajouter une question</AddButton>
              </div>
            </div>
          </div>
        </Section>
      </div>

      {!embedded && <StepActions onBack={onBack} onNext={next} nextLabel="Configurer l'agent" />}
    </div>
  );
}
