import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ossian.ai"),
  title: {
    default: "Ossian — L'agent vocal IA des concessions automobiles",
    template: "%s · Ossian",
  },
  description:
    "Ossian décroche 100 % des appels de vos concessions et ateliers, 24h/24, en 30 langues. Prise de rendez-vous après-vente, qualification des leads VN/VO, transfert intelligent. Opérationnel en 15 minutes.",
  openGraph: {
    title: "Ossian — L'agent vocal IA des concessions automobiles",
    description: "Plus aucun appel manqué. Ossian répond, qualifie et prend les rendez-vous à votre place, 24h/24.",
    type: "website",
    locale: "fr_FR",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b10" },
  ],
};

// Applies the saved theme before first paint (no flash).
const themeScript = `(()=>{try{var t=localStorage.getItem('ossian-theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
