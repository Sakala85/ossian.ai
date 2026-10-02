# Ossian.ai

**L'agent vocal IA des concessions et ateliers automobiles.** Ossian décroche 100 % des appels, 24h/24, dans la
langue de l'appelant : prise de rendez-vous atelier dans le DMS, suivi de réparation, qualification des leads VN/VO
et essais, transfert intelligent, rappels, campagnes sortantes — et un tableau de bord pour piloter l'impact.

**En ligne : https://ossian-ai.vercel.app** (Vercel, région Paris `cdg1`, déploiement automatique à chaque push).

| | |
|---|---|
| `/` | Site marketing |
| `/demo` | **Démo vocale** : appelez l'agent depuis le navigateur (micro) ou par écrit |
| `/onboarding` | **Onboarding en un clic** : URL du site → agent configuré → **Activer** (compte + numéro + accès) → renvoi d'appel vérifié en direct |
| `/app` | Tableau de bord : données réelles de la concession connectée, démo sinon |

## Démarrer

```bash
npm install
cp .env.example .env.local   # ajoutez ANTHROPIC_API_KEY pour activer l'IA
npm run dev                  # http://localhost:3000
```

Sans `ANTHROPIC_API_KEY`, tout fonctionne en **mode simulé** (agent à règles, analyse de site simulée) : pratique
pour une démo hors ligne. Avec la clé, l'agent et l'analyse d'onboarding tournent sur Claude en temps réel.
La démo vocale utilise la reconnaissance vocale du navigateur (Chrome, Edge ou Safari) ; ajoutez
`ELEVENLABS_API_KEY` pour une voix premium.

## Activer l'IA en production

Dans Vercel → projet `ossian-ai` → *Settings → Environment Variables*, ajoutez `ANTHROPIC_API_KEY`
(et optionnellement `ELEVENLABS_API_KEY` pour la voix premium), puis redéployez. Le badge de `/demo` passe
de « Mode simulé » à « IA en direct ».

## Téléphonie (Vapi)

Ossian répond sur de vrais numéros via **Vapi** (région UE). Mise en service pas à pas :
[`docs/VAPI.md`](docs/VAPI.md) — en résumé : `npm run vapi -- check`, puis `npm run vapi -- pool-add <phoneNumberId>`
pour chaque numéro du stock. Chaque concession qui s'active sur `/onboarding` reçoit ensuite un numéro
automatiquement.

## Base de données

Supabase (projet « ossian », région Paris) : schéma multi-tenant + fonctions d'onboarding dans
`supabase/migrations/`. Variables : `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `OSSIAN_DB_KEY` (clé serveur,
voir `docs/ARCHITECTURE.md`). Sans ces variables, l'onboarding reste en mode démonstration (local).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Anthropic SDK (Claude) · Zod ·
Supabase (Postgres, RPC + RLS) · Vapi (téléphonie) · Resend (e-mails) · déployé sur Vercel.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — architecture, onboarding automatisé, coûts, conformité,
  **décisions techniques à prendre ensemble** et feuille de route.
- [`docs/VAPI.md`](docs/VAPI.md) — brancher un vrai numéro (Vapi + opérateur), mode pilote, renvoi d'appel.
- [`docs/DEMO.md`](docs/DEMO.md) — déroulé de démo chez un prospect.
- [`docs/DESIGN.md`](docs/DESIGN.md) — design system.
