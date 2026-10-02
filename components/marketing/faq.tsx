import { ArrowUpRight } from "lucide-react";
import { FaqAccordion, type FaqItem } from "./faq-accordion";
import { Reveal } from "./reveal";
import { Accent, Section, SectionHeader } from "./section";

const FAQ: FaqItem[] = [
  {
    q: "Dois-je changer de ligne ou d'opérateur ?",
    a: "Non. Vous gardez vos numéros, votre opérateur et votre standard. Un simple renvoi d'appel (sur non-réponse, sur occupation ou permanent) vers le numéro Ossian suffit. Il s'active et se désactive en quelques secondes depuis votre téléphone ou votre IPBX.",
  },
  {
    q: "Et si l'IA ne sait pas répondre ?",
    a: "Ossian n'invente jamais une réponse. S'il lui manque une information, il transfère l'appel à la bonne personne avec une fiche contexte, ou programme un rappel et prévient l'équipe concernée. Vous définissez les règles de transfert par service et par plage horaire.",
  },
  {
    q: "Quel DMS est compatible ?",
    a: "Ossian se connecte aux principaux DMS du marché (Nextlane, Keyloop, Kerridge, CDK Global, incadea…) pour lire les disponibilités atelier, créer les rendez-vous et consulter le statut des réparations. Les connecteurs sont déployés selon votre éditeur. Sans intégration DMS, Ossian fonctionne avec votre agenda Google ou Outlook, ou transmet les demandes par e-mail.",
  },
  {
    q: "La voix est-elle vraiment naturelle ?",
    a: "Oui : voix neuronales de dernière génération, réponse en moins d'une seconde, gestion des interruptions et des hésitations. Le plus simple est d'en juger par vous-même : appelez Léa, notre agent de démonstration, depuis votre navigateur.",
  },
  {
    q: "Combien de temps faut-il pour démarrer ?",
    a: "Une quinzaine de minutes : collez l'adresse de votre site, validez la configuration proposée, activez le renvoi d'appel. La connexion au DMS et au CRM peut se faire dans un second temps, avec notre équipe si vous le souhaitez.",
  },
  {
    q: "Vos clients savent-ils qu'ils parlent à une IA ?",
    a: "Oui. Par transparence, et conformément à l'AI Act, l'agent se présente comme l'assistante virtuelle de la concession. Le client peut demander à tout moment à parler à un conseiller.",
  },
  {
    q: "Gérez-vous les groupes multi-sites ?",
    a: "Oui. Un agent par site ou un standard central qui oriente vers la bonne concession, avec des horaires, des marques et des règles propres à chaque site, un tableau de bord consolidé, le SSO et la gestion des rôles.",
  },
  {
    q: "Y a-t-il un engagement ?",
    a: "Aucun. Les formules mensuelles sont sans engagement, avec 14 jours d'essai et une mise en service offerte. La facturation annuelle vous fait économiser 15 %.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader
            align="left"
            index="09"
            eyebrow="FAQ"
            title={
              <>
                Questions <Accent>fréquentes.</Accent>
              </>
            }
            description="Vous ne trouvez pas votre réponse ? Écrivez-nous, notre équipe vous répond directement."
          >
            <a
              href="mailto:contact@ossian.ai"
              className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-primary"
            >
              contact@ossian.ai
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </SectionHeader>
        </div>
        <Reveal delay={0.1}>
          <FaqAccordion items={FAQ} />
        </Reveal>
      </div>
    </Section>
  );
}
