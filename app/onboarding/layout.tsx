import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer votre agent",
  description:
    "Collez l'adresse de votre concession : Ossian analyse votre site et configure en 2 minutes un agent vocal prêt à décrocher, que vous pouvez appeler tout de suite.",
  robots: { index: false, follow: false },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>;
}
