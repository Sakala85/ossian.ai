import type { DealershipProfile } from "@/lib/domain/types";

/** Fictional dealership used across the demo (dashboard, voice demo, onboarding preview). */
export const DEMO_PROFILE: DealershipProfile = {
  id: "demo-mistral",
  name: "Mistral Automobiles",
  group: "Groupe Mistral",
  website: "https://www.mistral-automobiles.fr",
  description:
    "Concessionnaire multimarque implanté en région lyonnaise depuis 1987 : ventes de véhicules neufs et d'occasion, atelier toutes marques, carrosserie agréée et magasin de pièces.",
  brands: ["Peugeot", "Citroën", "Toyota", "Occasions toutes marques"],
  sites: [
    {
      id: "lyon-est",
      name: "Mistral Automobiles Lyon Est",
      address: "48 avenue Jean Mermoz",
      city: "69008 Lyon",
      phone: "04 72 00 48 48",
      brands: ["Peugeot", "Citroën"],
    },
    {
      id: "villeurbanne",
      name: "Mistral Automobiles Villeurbanne",
      address: "112 cours Émile Zola",
      city: "69100 Villeurbanne",
      phone: "04 78 00 11 12",
      brands: ["Toyota"],
    },
    {
      id: "bron",
      name: "Mistral Occasions Bron",
      address: "7 route de Genas",
      city: "69500 Bron",
      phone: "04 78 00 70 07",
      brands: ["Occasions toutes marques"],
    },
  ],
  hours: [
    { label: "Showroom", value: "Lundi–vendredi 9h–19h, samedi 9h–18h" },
    { label: "Atelier", value: "Lundi–vendredi 7h45–12h et 13h30–18h30, samedi 8h–12h" },
    { label: "Magasin pièces", value: "Lundi–vendredi 8h–12h et 13h30–18h" },
    { label: "Carrosserie", value: "Lundi–vendredi 8h–12h et 13h30–18h" },
  ],
  services: [
    { name: "Révision constructeur", durationMin: 120, priceFrom: 189, description: "Entretien selon carnet constructeur, garantie préservée" },
    { name: "Vidange + filtres", durationMin: 60, priceFrom: 89 },
    { name: "Diagnostic électronique / voyant allumé", durationMin: 45, priceFrom: 59 },
    { name: "Freinage (plaquettes / disques)", durationMin: 90, priceFrom: 129 },
    { name: "Pneumatiques (montage + équilibrage)", durationMin: 45, priceFrom: 25, description: "Par pneu, hors fourniture" },
    { name: "Climatisation (recharge + contrôle)", durationMin: 60, priceFrom: 79 },
    { name: "Pré-contrôle technique", durationMin: 30, priceFrom: 0, description: "Offert pour les clients atelier" },
    { name: "Expertise carrosserie / devis sinistre", durationMin: 30, priceFrom: 0 },
    { name: "Batterie (test + remplacement)", durationMin: 30, priceFrom: 119 },
  ],
  departments: [
    { key: "apres_vente", label: "Réception atelier", phone: "04 72 00 48 50", email: "atelier@mistral-automobiles.fr", hours: "Lun–ven 7h45–18h30, sam 8h–12h" },
    { key: "vn", label: "Ventes véhicules neufs", phone: "04 72 00 48 60", email: "vn@mistral-automobiles.fr", hours: "Lun–sam 9h–19h" },
    { key: "vo", label: "Ventes occasions", phone: "04 78 00 70 08", email: "vo@mistral-automobiles.fr", hours: "Lun–sam 9h–19h" },
    { key: "pieces", label: "Magasin pièces", phone: "04 72 00 48 70", email: "pieces@mistral-automobiles.fr", hours: "Lun–ven 8h–18h" },
    { key: "carrosserie", label: "Carrosserie", phone: "04 72 00 48 80", email: "carrosserie@mistral-automobiles.fr", hours: "Lun–ven 8h–18h" },
    { key: "comptabilite", label: "Comptabilité / factures", phone: "04 72 00 48 90", email: "compta@mistral-automobiles.fr", hours: "Lun–ven 9h–17h" },
  ],
  policies: [
    "Véhicule de courtoisie disponible sur réservation pour les interventions de plus de 3 heures (permis de plus de 3 ans).",
    "Paiement par carte bancaire, chèque ou virement. Facilités de paiement en 3 fois sans frais dès 300 €.",
    "Atelier agréé toutes marques : l'entretien chez nous préserve la garantie constructeur.",
    "Devis carrosserie gratuit, prise en charge directe avec la plupart des assurances.",
    "Les prix annoncés au téléphone sont indicatifs ; le devis définitif est établi par le conseiller service.",
  ],
  faq: [
    { q: "Proposez-vous un service de jockeying ?", a: "Oui, prise en charge et restitution à domicile ou au travail dans un rayon de 15 km, 29 € l'aller-retour." },
    { q: "Peut-on attendre sur place ?", a: "Oui, espace d'attente avec Wi-Fi et café pour les interventions de moins d'une heure." },
    { q: "Reprenez-vous les véhicules ?", a: "Oui, estimation gratuite de reprise en 30 minutes sur rendez-vous, toutes marques." },
    { q: "Faites-vous les véhicules électriques ?", a: "Oui, techniciens habilités haute tension et bornes de recharge disponibles sur les trois sites." },
  ],
  agent: {
    name: "Léa",
    voiceId: "lea-fr",
    languages: ["fr", "en", "es", "it", "de", "pt", "ar"],
    tone: "chaleureux",
    greeting: "Mistral Automobiles bonjour, je suis Léa, l'assistante de la concession. Comment puis-je vous aider ?",
    transferPolicy: "business_hours",
    smsConfirmation: true,
    recordCalls: true,
  },
};

export const ADVISORS = ["Karim Benali", "Sophie Martin", "Julien Morel", "Camille Roux"];
export const SALESPEOPLE = ["Thomas Girard", "Inès Fontaine", "Marc Dubois", "Laura Petit"];
