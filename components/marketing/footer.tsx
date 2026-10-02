import Link from "next/link";
import { Logo } from "@/components/brand/logo";

type FooterLink = { label: string; href: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "#fonctionnalites" },
      { label: "Intégrations", href: "#integrations" },
      { label: "Tarifs", href: "#tarifs" },
      { label: "Sécurité", href: "#securite" },
      { label: "Démo en direct", href: "/demo" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Cas d'usage", href: "#cas-usage" },
      { label: "Calculateur de ROI", href: "#roi" },
      { label: "FAQ", href: "#faq" },
      { label: "Créer mon agent", href: "/onboarding" },
      { label: "Espace client", href: "/app" },
    ],
  },
  {
    title: "Société",
    links: [
      { label: "Contact", href: "mailto:contact@ossian.ai" },
      { label: "Partenaires & intégrateurs", href: "mailto:partenaires@ossian.ai" },
      { label: "Presse", href: "mailto:presse@ossian.ai" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/legal/mentions-legales" },
      { label: "Confidentialité", href: "/legal/confidentialite" },
      { label: "CGV", href: "/legal/cgv" },
      { label: "DPA (sous-traitance RGPD)", href: "/legal/dpa" },
    ],
  },
];

function FooterAnchor({ href, children }: { href: string; children: React.ReactNode }) {
  const className = "text-[13.5px] text-muted-foreground transition-colors hover:text-foreground";
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted-foreground">
              L&apos;agent vocal IA qui répond à 100&nbsp;% des appels des concessions et ateliers automobiles, 24h/24.
            </p>
          </div>
          <nav aria-label="Pied de page" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="text-[13px] font-medium text-foreground">{col.title}</p>
                <ul className="mt-4 grid gap-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <FooterAnchor href={l.href}>{l.label}</FooterAnchor>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Ossian SAS · Fait à Paris</p>
          <p>Prix indiqués hors taxes. Données hébergées dans l&apos;Union européenne.</p>
        </div>
      </div>
    </footer>
  );
}
