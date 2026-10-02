import type { Metadata } from "next";
import { VoiceDemo } from "@/components/demo/voice-demo";

export const metadata: Metadata = {
  title: "Démo — Parlez à Léa",
  description: "Appelez l'agent vocal Ossian depuis votre navigateur : prise de rendez-vous atelier, suivi de réparation, essais, transfert d'appel.",
};

export default function DemoPage() {
  return <VoiceDemo />;
}
