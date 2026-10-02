import type { CallOutcome } from "@/lib/domain/types";

/**
 * Scripted showcase calls (adapted from the demo scenarios in lib/demo/calls.ts).
 * Fictional customers and dealership — illustrative only.
 */
export type ShowcaseTurn =
  | { role: "agent" | "caller"; text: string }
  | { role: "tool"; name: string; result: string };

export interface ShowcaseScenario {
  id: string;
  tab: string;
  icon: "wrench" | "car" | "gauge" | "shield" | "languages";
  context: { line: string; when: string; duration: string; language: string; afterHours?: boolean };
  turns: ShowcaseTurn[];
  result: {
    outcome: CallOutcome;
    title: string;
    summary: string;
    data: [string, string][];
    actions: string[];
    assignee: { name: string; role: string };
  };
}

export const SCENARIOS: ShowcaseScenario[] = [
  {
    id: "apv",
    tab: "Après-vente",
    icon: "wrench",
    context: { line: "Atelier · client connu", when: "Mardi 8h04", duration: "2 min 34", language: "FR" },
    turns: [
      { role: "agent", text: "Bonjour, je suis Léa, l'assistante virtuelle de la concession. Comment puis-je vous aider ?" },
      { role: "caller", text: "Bonjour, je voudrais prendre rendez-vous pour la révision de ma 3008, elle arrive aux 60 000." },
      { role: "tool", name: "lookup_customer", result: "N. Garnier · 3008 Hybrid GH-482-TL" },
      { role: "tool", name: "check_availability", result: "3 créneaux avec courtoisie" },
      { role: "agent", text: "Bien sûr madame Garnier. Avec un véhicule de courtoisie, je peux vous proposer jeudi 8h30, vendredi 8h ou lundi 9h15." },
      { role: "caller", text: "Jeudi 8h30, c'est parfait." },
      { role: "tool", name: "book_appointment", result: "RDV-48211 · Karim B." },
      { role: "agent", text: "C'est noté : jeudi 8h30 avec Karim, et une voiture vous attendra. Vous recevez un SMS de confirmation." },
    ],
    result: {
      outcome: "rdv_pris",
      title: "Révision 60 000 km réservée",
      summary:
        "Cliente connue, révision des 60 000 km sur 3008 Hybrid. RDV jeudi 8h30 avec véhicule de courtoisie. Confirmation SMS envoyée.",
      data: [
        ["Prestation", "Révision constructeur"],
        ["Véhicule", "Peugeot 3008 Hybrid · GH-482-TL"],
        ["Kilométrage", "61 200 km"],
        ["Créneau", "Jeudi 8h30"],
        ["Courtoisie", "Oui"],
      ],
      actions: ["RDV créé dans le DMS", "Véhicule de courtoisie réservé", "SMS de confirmation envoyé"],
      assignee: { name: "Karim Benali", role: "Conseiller service" },
    },
  },
  {
    id: "ventes",
    tab: "Ventes VN/VO",
    icon: "car",
    context: { line: "Showroom · nouveau prospect", when: "Jeudi 18h42", duration: "3 min 32", language: "FR" },
    turns: [
      { role: "agent", text: "Bonsoir, je suis Léa, l'assistante virtuelle de la concession. Que puis-je faire pour vous ?" },
      { role: "caller", text: "J'ai vu la nouvelle E-3008 sur votre site, j'aimerais l'essayer." },
      { role: "agent", text: "Avec plaisir ! Plutôt finition Allure ou GT ? Et avez-vous un véhicule à faire reprendre ?" },
      { role: "caller", text: "La GT. J'ai une Golf 7 de 2018 à reprendre, et un budget autour de 45 000 €." },
      { role: "tool", name: "check_availability", result: "Essai · samedi 10h, 14h30" },
      { role: "agent", text: "Je vous propose un essai samedi à 10h ; nous estimerons votre Golf sur place. Cela vous convient ?" },
      { role: "caller", text: "Samedi 10h, parfait." },
      { role: "tool", name: "create_lead", result: "Score 86 · Inès F." },
    ],
    result: {
      outcome: "lead_cree",
      title: "Lead VN chaud · essai planifié",
      summary:
        "Prospect intéressé par une E-3008 GT, budget ≈ 45 k€, reprise d'une Golf 7. Essai samedi 10h, estimation de reprise sur place.",
      data: [
        ["Intérêt", "Peugeot E-3008 GT"],
        ["Budget", "≈ 45 000 €"],
        ["Reprise", "VW Golf 7 · 2018 · 98 000 km"],
        ["Essai", "Samedi 10h"],
        ["Score", "86 / 100"],
      ],
      actions: ["Lead créé dans le CRM", "Fiche véhicule envoyée par e-mail", "Commerciale notifiée"],
      assignee: { name: "Inès Fontaine", role: "Conseillère commerciale VN" },
    },
  },
  {
    id: "suivi",
    tab: "Suivi réparation",
    icon: "gauge",
    context: { line: "Atelier · client connu", when: "Lundi 15h27", duration: "1 min 11", language: "FR" },
    turns: [
      { role: "agent", text: "Bonjour, je suis Léa, l'assistante virtuelle de la concession. Comment puis-je vous aider ?" },
      { role: "caller", text: "Bonjour, c'est pour savoir si ma voiture est prête, un C-HR." },
      { role: "tool", name: "get_repair_status", result: "OR terminé · dispo 17h · 412,60 €" },
      { role: "agent", text: "Bonne nouvelle monsieur Haddad : l'intervention est terminée et le contrôle qualité validé. Elle est disponible dès 17h, pour 412,60 €." },
      { role: "caller", text: "Super, je passe vers 18h alors." },
      { role: "agent", text: "Parfait, l'atelier ferme à 18h30. Je préviens la réception de votre passage." },
    ],
    result: {
      outcome: "info_donnee",
      title: "Statut communiqué, sans mobiliser l'atelier",
      summary:
        "Client demande si son C-HR est prêt. Intervention terminée, véhicule disponible dès 17h, montant communiqué. Passage prévu vers 18h.",
      data: [
        ["Véhicule", "Toyota C-HR · FX-219-PB"],
        ["Statut OR", "Terminé · contrôle qualité OK"],
        ["Montant", "412,60 €"],
        ["Restitution", "Aujourd'hui vers 18h"],
      ],
      actions: ["Statut lu dans le DMS", "Réception prévenue du passage"],
      assignee: { name: "Sophie Martin", role: "Réception atelier" },
    },
  },
  {
    id: "carrosserie",
    tab: "Carrosserie",
    icon: "shield",
    context: { line: "Carrosserie · nouveau client", when: "Samedi 11h16", duration: "1 min 35", language: "FR" },
    turns: [
      { role: "agent", text: "Bonjour, je suis Léa, l'assistante virtuelle de la concession. Comment puis-je vous aider ?" },
      { role: "caller", text: "Bonjour, on m'a embouti le pare-choc arrière de ma 208 sur un parking. Je voudrais un devis." },
      { role: "agent", text: "Je suis désolée pour ce désagrément. Avez-vous rempli un constat avec l'autre conducteur ?" },
      { role: "caller", text: "Oui, constat fait, et mon assurance est prévenue." },
      { role: "tool", name: "check_availability", result: "Expertise · mardi 11h" },
      { role: "agent", text: "L'expertise est gratuite et nous traitons directement avec votre assurance. Je vous propose mardi 11h : pensez au constat et à la carte grise." },
      { role: "tool", name: "book_appointment", result: "RDV-48236 · Carrosserie" },
    ],
    result: {
      outcome: "rdv_pris",
      title: "Expertise carrosserie planifiée",
      summary:
        "Accrochage sur parking, pare-choc arrière de 208. Constat amiable rempli. Expertise gratuite réservée mardi 11h, pièces à apporter rappelées par SMS.",
      data: [
        ["Dommage", "Pare-choc arrière"],
        ["Véhicule", "Peugeot 208 · 2022"],
        ["Sinistre", "Constat amiable · assureur prévenu"],
        ["Créneau", "Mardi 11h · expertise"],
      ],
      actions: ["RDV expertise créé", "SMS : constat + carte grise", "Chef carrossier notifié"],
      assignee: { name: "Julien Morel", role: "Chef d'atelier carrosserie" },
    },
  },
  {
    id: "anglais",
    tab: "Appel en anglais",
    icon: "languages",
    context: { line: "Atelier · hors horaires", when: "Mardi 22h47", duration: "2 min 13", language: "EN", afterHours: true },
    turns: [
      { role: "agent", text: "Good evening, I'm Léa, the dealership's virtual assistant. How can I help?" },
      { role: "caller", text: "Hi, I'm driving a rental C5 Aircross and an orange engine light just came on. Is it safe to drive?" },
      { role: "agent", text: "An orange light usually isn't an emergency, but I'd avoid long trips. If it starts flashing, please stop safely. Shall I book a diagnostic first thing tomorrow?" },
      { role: "caller", text: "Yes please, as early as possible." },
      { role: "tool", name: "check_availability", result: "Demain · 8h00, 9h30" },
      { role: "tool", name: "book_appointment", result: "RDV-48214 · diagnostic" },
      { role: "agent", text: "You're booked tomorrow at 8 a.m. I've just texted you the address. Anything else?" },
    ],
    result: {
      outcome: "rdv_pris",
      title: "Diagnostic réservé à 22h47",
      summary:
        "Touriste britannique en véhicule de location, voyant moteur orange. Consignes de sécurité données, diagnostic réservé demain 8h. Synthèse traduite en français.",
      data: [
        ["Langue", "Anglais · détectée automatiquement"],
        ["Problème", "Voyant moteur orange"],
        ["Prestation", "Diagnostic électronique"],
        ["Créneau", "Demain 8h00"],
      ],
      actions: ["RDV créé dans le DMS", "SMS avec l'adresse envoyé", "Résumé traduit pour l'équipe"],
      assignee: { name: "Camille Roux", role: "Conseillère service" },
    },
  },
];
