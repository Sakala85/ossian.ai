import { forwardingCodes } from "@/lib/voice/forwarding";
import { formatFrench } from "@/lib/voice/phone";
import { sendEmail } from "./notify";

/** Welcome email sent right after activation: number, forwarding codes, private dashboard link. */
export function sendWelcomeEmail(opts: { to: string; dealership: string; agent: string; phone: string | null; accessUrl: string }) {
  const { to, dealership, agent, phone, accessUrl } = opts;
  const lines = [`Bonjour,`, ``, `${agent}, l'assistante téléphonique de ${dealership}, est configurée.`, ``];
  if (phone) {
    const codes = forwardingCodes(phone);
    lines.push(
      `1. Votre numéro Ossian : ${formatFrench(phone)}`,
      ``,
      `2. Renvoyez vos appels vers ce numéro. Depuis le téléphone de la concession, composez :`,
      ...codes.map((c) => `   • ${c.label}${c.recommended ? " (recommandé)" : ""} : ${c.code}`),
      `   Ligne fixe ou standard : créez un renvoi « sur non-réponse » vers ce numéro dans l'espace client de votre opérateur.`,
      ``,
      `3. Appelez votre numéro habituel depuis un portable et laissez sonner : si ${agent} décroche, tout est en place.`,
    );
  } else {
    lines.push(`Votre numéro Ossian est en cours d'attribution : vous le recevrez très vite par e-mail, avec les codes de renvoi.`);
  }
  lines.push(
    ``,
    `Votre tableau de bord (lien privé, ne le transférez pas) :`,
    accessUrl,
    ``,
    `Vous y retrouverez chaque appel avec son résumé, les demandes de rendez-vous, les leads et les rappels à faire. Ces informations vous sont aussi envoyées par e-mail après chaque appel.`,
  );
  const subject = phone ? `${agent} est prête : dernière étape pour ${dealership}` : `${agent} est configurée pour ${dealership}`;
  return sendEmail(to, subject, lines.join("\n"));
}
