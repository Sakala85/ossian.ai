import { Logo } from "@/components/brand/logo";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="dark flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground">
      <Logo />
      <h1 className="font-display text-5xl font-medium">
        Page <span className="font-serif-accent">introuvable</span>
      </h1>
      <p className="max-w-sm text-muted-foreground">Cette page n&apos;existe pas. Léa, elle, décroche toujours.</p>
      <div className="flex gap-3">
        <LinkButton href="/" variant="outline">
          Accueil
        </LinkButton>
        <LinkButton href="/demo">Parler à Léa</LinkButton>
      </div>
    </div>
  );
}
