import { CalendarX, ClipboardCheck, FileText, Mail, MessageCircle, MessageSquare, Phone, Star, Target, Wrench, type LucideIcon } from "lucide-react";
import type { Tone } from "@/components/ui/badge";
import type { Campaign } from "@/lib/domain/types";

export type CampaignType = Campaign["type"];
export type Channel = Campaign["channel"][number];

export const TYPE_META: Record<
  CampaignType,
  { label: string; icon: LucideIcon; result: string; description: string; audience: number; benchmark: string; script: string; segment: string }
> = {
  rappel_entretien: {
    label: "Rappel entretien",
    icon: Wrench,
    result: "RDV pris",
    description: "Relancez les clients dont la révision arrive à échéance (date ou kilométrage).",
    audience: 842,
    benchmark: "≈ 29 % de RDV",
    segment: "Révision échue dans les 30 jours",
    script:
      "Bonjour {prénom}, ici Léa de Mistral Automobiles. Votre {véhicule} arrive à l'échéance de sa révision : souhaitez-vous que je vous propose un créneau ?",
  },
  relance_devis: {
    label: "Relance devis",
    icon: FileText,
    result: "devis acceptés",
    description: "Rappelez les devis atelier non signés sous 72 h et levez les objections.",
    audience: 126,
    benchmark: "≈ 33 % d'acceptation",
    segment: "Devis atelier non signés > 72 h",
    script: "Bonjour {prénom}, Léa de Mistral Automobiles. Je reviens vers vous au sujet du devis pour votre {véhicule} : avez-vous des questions ?",
  },
  satisfaction: {
    label: "Satisfaction J+2",
    icon: Star,
    result: "avis recueillis",
    description: "Recueillez l'avis client deux jours après l'intervention et détectez les insatisfaits.",
    audience: 388,
    benchmark: "≈ 74 % de réponses",
    segment: "Interventions terminées il y a 2 jours",
    script: "Bonjour {prénom}, Léa de Mistral Automobiles. Votre {véhicule} est passé à l'atelier mardi : tout s'est bien passé ?",
  },
  no_show: {
    label: "No-show",
    icon: CalendarX,
    result: "reprogrammés",
    description: "Reprogrammez automatiquement les rendez-vous manqués le jour même.",
    audience: 37,
    benchmark: "≈ 60 % reprogrammés",
    segment: "Absents à leur RDV (J0)",
    script: "Bonjour {prénom}, Léa de Mistral Automobiles. Nous vous attendions ce matin pour votre {véhicule} : voulez-vous un nouveau créneau ?",
  },
  rappel_ct: {
    label: "Contrôle technique",
    icon: ClipboardCheck,
    result: "RDV CT",
    description: "Prévenez 30 jours avant l'échéance du CT et proposez le pré-contrôle offert.",
    audience: 214,
    benchmark: "≈ 24 % de RDV",
    segment: "CT à échéance dans 30 jours",
    script: "Bonjour {prénom}, Léa de Mistral Automobiles. Le contrôle technique de votre {véhicule} arrive à échéance : je vous propose un pré-contrôle offert ?",
  },
  relance_lead: {
    label: "Relance leads",
    icon: Target,
    result: "leads réactivés",
    description: "Réactivez les prospects VN/VO restés sans suite depuis plus de 7 jours.",
    audience: 96,
    benchmark: "≈ 20 % réactivés",
    segment: "Leads sans activité > 7 jours",
    script: "Bonjour {prénom}, Léa de Mistral Automobiles. Vous vous intéressiez au {véhicule} : votre projet est-il toujours d'actualité ?",
  },
};

export const STATUS_META: Record<Campaign["status"], { label: string; tone: Tone }> = {
  active: { label: "En cours", tone: "success" },
  planifiee: { label: "Planifiée", tone: "info" },
  terminee: { label: "Terminée", tone: "neutral" },
  brouillon: { label: "Brouillon", tone: "neutral" },
};

export const CHANNEL_META: Record<Channel, { label: string; icon: LucideIcon }> = {
  voix: { label: "Voix", icon: Phone },
  sms: { label: "SMS", icon: MessageSquare },
  whatsapp: { label: "WhatsApp", icon: MessageCircle },
  email: { label: "E-mail", icon: Mail },
};
