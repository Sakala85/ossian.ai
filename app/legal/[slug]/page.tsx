import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/brand/logo";

const DOCS: Record<string, { title: string; intro: string }> = {
  "mentions-legales": { title: "Mentions légales", intro: "Éditeur du site, hébergeur et directeur de la publication." },
  confidentialite: { title: "Politique de confidentialité", intro: "Données traitées, finalités, durées de conservation et exercice de vos droits (RGPD)." },
  cgv: { title: "Conditions générales de vente", intro: "Conditions d'abonnement, de facturation à l'usage et de résiliation." },
  dpa: { title: "Accord de traitement des données (DPA)", intro: "Engagements d'Ossian en tant que sous-traitant au sens de l'article 28 du RGPD." },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: DOCS[slug]?.title ?? "Document" };
}

export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = DOCS[slug];
  if (!doc) notFound();
  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" aria-label="Accueil">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-6 pt-10 pb-24">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">Légal</p>
        <h1 className="font-display mt-3 text-4xl font-medium md:text-5xl">{doc.title}</h1>
        <p className="mt-5 text-muted-foreground">{doc.intro}</p>
        <div className="mt-10 rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
          Ce document est en cours de finalisation. Pour l&apos;obtenir dès maintenant, écrivez-nous à{" "}
          <a className="text-primary hover:underline" href="mailto:contact@ossian.ai">
            contact@ossian.ai
          </a>
          .
        </div>
      </main>
    </div>
  );
}
