# Ossian — Design system

Direction : **"calm precision"**. Interface éditoriale et technique, inspirée de Linear / Vercel / Attio / ElevenLabs.
Beaucoup d'air, hairlines 1px, une seule couleur d'accent (violet *signal*), typographie très resserrée
pour les titres, une touche d'italique serif pour l'émotion. Le site marketing est sombre, le produit (dashboard)
suit le thème système (clair/sombre).

## Tokens (app/globals.css)

Utiliser **uniquement** les tokens Tailwind ci-dessous (jamais de couleurs en dur, sauf data-viz/orb) :

| Rôle | Classes |
|---|---|
| Fond / texte | `bg-background`, `text-foreground`, `text-muted-foreground` |
| Surfaces | `bg-card` (cartes), `bg-muted` (zones secondaires, pistes), `bg-subtle` (hover léger) |
| Bordures | `border-border` (défaut), `border-border-strong` (hover/emphase) |
| Accent | `bg-primary`, `text-primary`, `bg-primary-soft` (fond teinté), `text-primary-foreground` |
| Sémantique | `success`, `warning`, `danger`, `info` + variantes `-soft` |
| Data-viz | `chart-1` … `chart-6` (via `var(--chart-n)` en SVG) |

Rayons : `rounded-lg` (14px) pour les cartes, `rounded-xl` / `rounded-2xl` pour les grands panneaux, `rounded-[10px]` pour les contrôles.
Ombres : `shadow-soft` (cartes), `shadow-float` (popovers, éléments flottants, mockups).

## Typographie

- Sans : Geist (`font-sans`). Mono : Geist Mono (`font-mono`) pour chiffres techniques, numéros, IDs.
- Titres display : `font-display` + `text-5xl…text-7xl font-medium` (tracking -0.045em, line-height 0.98).
- Accent émotionnel : `<span className="font-serif-accent">…</span>` (Instrument Serif italique) sur 1-3 mots d'un titre.
- Chiffres : `tabular` pour les KPI et tableaux.
- Corps : `text-sm` (14px) dans l'app, `text-[15px]`/`text-base` en marketing, `text-muted-foreground` pour le secondaire.

## Utilitaires d'effet

`bg-grid`, `bg-dots`, `mask-fade-b`, `mask-fade-x`, `mask-radial`, `text-gradient`, `text-aurora`, `shimmer-text`,
`ring-gradient` (bordure dégradée 1px, à mettre sur un élément `relative` arrondi), animations `animate-fade-up`,
`animate-marquee`, `animate-pulse-ring`, `animate-spin-slow`.

## Composants (components/ui)

- `Button`, `LinkButton`, `buttonVariants` — variants `primary | secondary | outline | ghost | danger | inverted`, sizes `xs | sm | md | lg | icon | icon-sm`.
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`.
- `Badge` — tones `neutral | primary | success | warning | danger | info`, prop `dot`.
- `Input`, `Textarea`, `Select`, `Label`, `Field`.
- `Switch`, `Segmented`.
- `Separator`, `Kbd`, `Avatar` (initiales sur dégradé), `Progress`, `SectionLabel`, `LiveDot`.
- Marque : `Logo`, `LogoMark` (components/brand/logo.tsx), `ThemeToggle`.
- Voix : `Orb` (components/voice/orb.tsx) — orbe liquide canvas, props `state: idle|listening|thinking|speaking`, `level 0..1`, `size`.

Icônes : `lucide-react`, taille 16px par défaut (les boutons/badges les dimensionnent automatiquement).
Animations : `motion/react` pour les transitions d'entrée/sortie et les listes ; rester sobre (durées 150–400ms, easing `[0.22,1,0.36,1]`).

## Règles

1. Langue de l'interface : **français** (vouvoiement). Code et noms de variables en anglais.
2. Densité : app = dense mais aérée (`gap-4`/`gap-6`, cartes `p-5`). Marketing = sections `py-24 md:py-32`, conteneur `max-w-6xl mx-auto px-6`.
3. Pas de couleurs vives en aplat sur de grandes surfaces : l'accent sert aux actions, états actifs et highlights.
4. Toujours prévoir les états vides, chargement (skeleton `bg-muted animate-pulse`) et hover.
5. Mobile : tout doit tenir à 375px de large (grilles qui s'empilent, tableaux scrollables horizontalement).
6. Accessibilité : contrastes AA, `aria-label` sur les boutons-icônes, focus visibles (déjà global).
