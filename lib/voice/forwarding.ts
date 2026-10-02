/**
 * Call-forwarding codes (GSM / 3GPP supplementary services, standard across
 * French mobile operators) pointing to a dealership's Ossian number. Fixed
 * lines and PBXs configure the same rules in the operator's customer area.
 */
export interface ForwardCode {
  id: "no_answer" | "busy" | "always" | "off";
  label: string;
  hint: string;
  code: string;
  recommended?: boolean;
}

/** "+33428293031" → "0428293031" (other countries keep the + form). */
export function dialable(e164: string) {
  return e164.startsWith("+33") ? `0${e164.slice(3)}` : e164;
}

export function forwardingCodes(e164: string): ForwardCode[] {
  const n = dialable(e164);
  return [
    { id: "no_answer", label: "Si personne ne décroche", hint: "Après ~20 s de sonnerie : votre équipe reste prioritaire", code: `**61*${n}#`, recommended: true },
    { id: "busy", label: "Si la ligne est occupée", hint: "Plus aucun appel perdu aux heures de pointe", code: `**67*${n}#` },
    { id: "always", label: "Tous les appels", hint: "Renvoi immédiat, par exemple le soir et le week-end", code: `**21*${n}#` },
    { id: "off", label: "Tout désactiver", hint: "Annule tous les renvois de la ligne", code: "##002#" },
  ];
}

