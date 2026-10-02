# Ossian — Architecture & choix techniques

> Document de travail : il décrit ce qui est construit dans ce dépôt, l'architecture cible pour la production
> et **les décisions techniques** (section 6). Les chiffres de coûts sont des ordres de grandeur à valider.
>
> **Décidé :** téléphonie via **Vapi** (région UE) pour les pilotes — mise en place pas à pas dans [`docs/VAPI.md`](VAPI.md).

## 1. Le produit en une phrase

Ossian est un **agent vocal IA pour les concessions et ateliers automobiles** (équivalent de Sandra AI, YC F24) :
il décroche 100 % des appels 24h/24, dans la langue de l'appelant, **prend les rendez-vous atelier dans le DMS**,
donne l'avancement des réparations, **qualifie les projets d'achat VN/VO** et planifie les essais, **transfère** au bon
service avec une fiche contexte ou **programme un rappel**, et mène des **campagnes sortantes** (rappels d'entretien,
relances de devis, satisfaction, no-show). Les équipes pilotent tout depuis un tableau de bord (transcriptions,
résumés, KPI, CA généré).

## 2. Ce qui est dans ce dépôt

| Surface | Route | État |
|---|---|---|
| Site marketing | `/` | ✅ complet (ROI, tarifs, FAQ…) |
| **Démo vocale** (parler à l'agent dans le navigateur) | `/demo` | ✅ Claude en temps réel si `ANTHROPIC_API_KEY`, sinon mode simulé |
| **Onboarding automatique** (URL du site → agent prêt) | `/onboarding` | ✅ analyse IA (Claude + web fetch) ou simulée |
| Tableau de bord | `/app/*` | ✅ données de démonstration réalistes |
| Moteur conversationnel | `lib/agent/*`, `POST /api/agent` | ✅ prompt, 8 outils métier, boucle d'outils streamée |
| Analyse de site | `lib/onboarding/*`, `POST /api/onboarding/analyze` | ✅ |
| **Téléphonie Vapi** | `POST /api/voice/vapi`, `POST /api/voice/llm/chat/completions` | ✅ prêt, à brancher sur un numéro ([guide](VAPI.md)) |
| Mode pilote (vrais appels sans DMS) | `lib/agent/pilot-backend.ts`, `lib/server/notify.ts` | ✅ demandes de RDV, leads, rappels envoyés à l'équipe (Slack/Teams/Make…) |
| Script de configuration Vapi | `npm run vapi -- check \| numbers \| connect \| import-vonage` | ✅ |
| Voix premium (démo) | `POST /api/tts` | 🟡 activée si `ELEVENLABS_API_KEY` |
| Schéma base de données | `supabase/migrations/0001_init.sql` | 🟡 prêt, non déployé |

### Arborescence

```
app/
  page.tsx                    landing (components/marketing)
  demo/                       démo vocale (components/demo)
  onboarding/                 assistant d'onboarding (components/onboarding)
  app/                        tableau de bord (components/app)
  api/agent                   tour de conversation (NDJSON streaming)
  api/onboarding/analyze      analyse du site (NDJSON streaming)
  api/voice/vapi              webhook téléphonie
  api/voice/llm/...           endpoint LLM compatible "custom-llm" (Vapi)
  api/tts                     proxy ElevenLabs (optionnel)
lib/
  domain/types.ts             modèle métier unique (démo = prod)
  agent/prompt.ts             prompt système construit depuis le profil concession
  agent/tools.ts              8 outils (créneaux, RDV, statut OR, stock, lead, transfert, rappel, fin d'appel)
  agent/backend.ts            interface AgentBackend + DemoBackend (simule DMS/CRM)
  agent/runtime.ts            boucle Claude streamée + exécution des outils
  agent/simulated.ts          agent à règles (démo sans clé API)
  onboarding/analyze.ts       extraction du profil (Claude + web_fetch/web_search)
  agent/pilot-backend.ts      backend « vrais appels » sans DMS : rien n'est promis, tout est notifié
  voice/speech.ts             reconnaissance + synthèse vocale navigateur (démo)
  voice/vapi.ts               adapter Vapi (assistant transitoire, flux SSE compatible OpenAI)
  voice/call-session.ts       mémoire de l'appel (historique Claude complet par call id)
  server/dealerships.ts       numéro appelé → concession (KV, config/dealerships.json, sinon démo)
  server/store.ts             KV : Upstash Redis (REST) ou mémoire
  server/notify.ts            notifications équipe (webhook Slack/Teams/Make/Zapier)
  demo/*                      données de démonstration
config/dealerships.json       registre numéro → profil pour les pilotes (sans base de données)
scripts/vapi.mjs              configuration Vapi en ligne de commande (npm run vapi)
supabase/migrations/          schéma Postgres multi-tenant + RLS
```

## 3. Architecture cible (production)

```
 Appelant ──PSTN──▶ Numéro Ossian (renvoi sur non-réponse / débordement / 24h/24)
                         │
                         ▼
        ┌──────────── Plateforme voix temps réel ────────────┐
        │  SIP/PSTN · VAD · barge-in · STT streaming · TTS    │   (Vapi au départ,
        │  (Deepgram/Gladia)            (ElevenLabs)          │    self-hosted plus tard)
        └───────────────┬────────────────────────▲───────────┘
                texte   │                        │ texte à dire
                        ▼                        │
        ┌──────────── Cerveau Ossian (ce dépôt, Vercel) ─────┐
        │  /api/voice/llm → runtime Claude + outils métier    │
        │  prompt = profil concession (onboarding)            │
        │  AgentBackend → connecteurs DMS / CRM / agenda      │
        └──────┬───────────────┬───────────────┬─────────────┘
               ▼               ▼               ▼
        DMS (RDV, OR)    CRM (leads)    Notifications (SMS, e-mail, Slack/Teams)
               │
               ▼
        Postgres (Supabase, UE) : appels, transcriptions, RDV, leads, campagnes → Tableau de bord
```

**Principe clé : le "cerveau" (prompt, outils, connecteurs) vit dans notre code**, indépendamment du fournisseur
voix. On démarre sur Vapi puis on pourra migrer vers une stack auto-hébergée (Pipecat ou LiveKit Agents + Vonage,
Twilio ou Telnyx en WebSocket/SIP) quand le volume le justifie, sans réécrire l'agent.

### Déroulé d'un appel avec Vapi

1. L'appel arrive sur le numéro Ossian (renvoi depuis la ligne de la concession). Vapi envoie `assistant-request`
   à `/api/voice/vapi` ; on répond en < 7,5 s avec un **assistant transitoire** construit depuis le profil de la
   concession : message d'accueil, voix ElevenLabs Flash v2.5, transcription Deepgram Nova-3 (`multi`), outils
   Vapi `transferCall` (numéros des services) et `endCall`. Si Ossian ne répond pas, Vapi bascule sur le
   **numéro de secours** (l'accueil de la concession).
2. À chaque tour de parole, Vapi appelle `/api/voice/llm/chat/completions` (format OpenAI). On recharge
   **l'historique Claude complet de l'appel** (outils et résultats compris), on n'ajoute que la nouvelle phrase
   de l'appelant, puis Claude répond en streaming ; les outils métier s'exécutent chez nous.
3. Pour transférer ou raccrocher, notre réponse se termine par un appel d'outil Vapi (`transferCall` avec le
   numéro E.164 du service, ou `endCall`) : Vapi exécute l'action téléphonique.
4. En fin d'appel, `end-of-call-report` : résumé, transcription et enregistrement envoyés à l'équipe.

### Mode pilote : vrais appels sans DMS

Tant qu'aucun connecteur DMS/CRM n'est actif, `PilotBackend` garantit qu'Ossian **ne promet jamais ce que la
concession n'a pas vu** : les RDV deviennent des **demandes** confirmées par un conseiller (notifié
instantanément), les leads et rappels sont poussés à l'équipe, et le statut d'atelier ou le stock (non connectés)
se transforment en rappel plutôt qu'en réponse inventée. La concession de démo garde le backend simulé, sans
transfert réel (ses numéros sont fictifs).

### Le moteur conversationnel (`lib/agent`)

- **Prompt** construit à partir du `DealershipProfile` (horaires, prestations, services, politiques, FAQ) : partie
  stable mise en cache (prompt caching), contexte volatile (heure, numéro appelant) après le point de cache.
- **Outils** : `check_availability`, `book_appointment`, `get_repair_status`, `search_inventory`, `create_lead`,
  `transfer_call`, `schedule_callback`, `end_call`. Entrées validées (Zod) avant exécution.
- **Garde-fous** : jamais de créneau/prix/statut inventé (outils obligatoires), transparence IA, sécurité routière,
  pas de données bancaires, rappel prioritaire pour les réclamations.
- **Modèle** : `claude-opus-5-5` en effort `low` par défaut (tours courts) ; configurable via `OSSIAN_AGENT_MODEL`
  pour comparer latence/coût. Repli serveur (`fallbacks: "default"`) activé en cas de refus.

### Onboarding le plus automatique possible

| Étape | Automatisation | Temps client |
|---|---|---|
| 1. Inscription | lien magique / Google, organisation créée | 30 s |
| 2. URL du site | **Claude lit le site** (web fetch + search) et remplit horaires, marques, sites, prestations, services, FAQ | 0 (≈ 60–90 s d'attente) |
| 3. Vérification | champs pré-remplis marqués « IA », édition inline | 2–3 min |
| 4. Agent | voix, langues, ton, accueil générés ; aperçu en direct | 1 min |
| 5. Connexions | DMS/CRM **non bloquants** : l'agent démarre avec l'agenda Ossian + confirmation au conseiller par e-mail/SMS ; le connecteur DMS s'active ensuite | 1 min |
| 6. Test | appel depuis le navigateur avec le profil généré | 2 min |
| 7. Ligne | **numéro pris dans un pool pré-provisionné** (évite le délai réglementaire des numéros FR), codes de renvoi affichés, **détection automatique du premier appel renvoyé** | 2 min |
| 8. Paiement | Stripe Checkout, 14 jours d'essai | 1 min |
| Après mise en ligne | récap quotidien, rapport hebdo, **suggestions d'amélioration auto** (questions sans réponse → FAQ) | — |

La même chaîne sert de **générateur de démo personnalisée** : avant un rendez-vous prospect, on colle l'URL de la
concession et on arrive avec un agent qui connaît déjà ses horaires et ses services.

## 4. Coûts unitaires (ordres de grandeur, prix publics à confirmer)

Par minute d'appel, en $ :

| Poste | Vapi + opérateur (choix actuel) | Opérateur (Vonage…) + pipeline maison |
|---|---|---|
| Orchestration voix | 0,05 (frais Vapi) | 0 (+ serveurs ≈ 100–300 €/mois au total) |
| Téléphonie FR entrante | ≈ 0,01 | ≈ 0,01–0,015 (jambe WebSocket comprise) |
| Transcription (Deepgram) | ≈ 0,01 | ≈ 0,01 |
| Synthèse vocale (ElevenLabs) | 0,03–0,06 | 0,03–0,06 |
| LLM Claude | voir ci-dessous | voir ci-dessous |
| **Total avec Sonnet 5.5** | **≈ 0,12–0,18** | **≈ 0,07–0,12** |

Le LLM pèse directement sur la marge (≈ 6 requêtes/min, prompt système en cache) :

| Modèle | Prix (entrée / sortie, par M tokens) | ≈ $/min d'appel |
|---|---|---|
| Claude Opus 5.5 (défaut actuel, effort bas) | 4 $ / 20 $ | 0,04–0,07 |
| Claude Sonnet 5.5 | 2 $ / 10 $ | 0,02–0,035 |
| Claude Haiku 4.5 | 1 $ / 5 $ | 0,01–0,02 |

Le choix se fera après un **test de latence et de qualité sur de vrais appels** (variable `OSSIAN_AGENT_MODEL`).

**Exemple — un site à ~1 000 appels/mois (≈ 2 000 min)**, forfait Performance 490 € (1 200 min incluses)
+ 800 min × 0,25 € ≈ **690 € facturés** :

| | Coût variable | Marge brute |
|---|---|---|
| Vapi | ≈ 250–330 € | ≈ 50–60 % |
| Pipeline maison | ≈ 150–220 € | ≈ 70 % |

Au-delà de **~20 à 50 sites** (≈ 5 000 €/mois d'écart à 50 sites), la migration vers un pipeline maison hébergé
en France se justifie (≈ 1 mois de développement). Vonage AI Studio (outil no-code, plan Advanced à 1 100 $/mois)
n'est pas adapté : le cerveau de l'agent doit rester le nôtre.

## 5. Sécurité, RGPD, conformité

- Hébergement UE (Supabase Francfort/Paris, fonctions Vercel `cdg1`), chiffrement au repos et en transit, RLS par organisation.
- **Vapi en région UE** (`dashboard.eu.vapi.ai`, `api.eu.vapi.ai`, `sip.eu.vapi.ai`, documentée par Vapi) : créer
  l'organisation directement dans cette région (une organisation appartient à une seule région). À confirmer avec
  Vapi à l'ouverture du compte : disponibilité de l'offre UE et parité de fonctionnalités avec la région US.
- Endpoints téléphonie protégés par un secret partagé (`OSSIAN_VOICE_SECRET`, en-tête `x-ossian-key`), fermés en
  production si le secret n'est pas défini.
- RGPD : DPA client, durée de conservation des enregistrements configurable (90 j par défaut), export/suppression.
- **AI Act (transparence)** : l'agent se présente comme assistante virtuelle ; mention de l'enregistrement en début d'appel.
- Appels sortants : distinguer les rappels de service aux clients existants du démarchage commercial ; vérifier le
  cadre légal en vigueur (consentement, Bloctel) avec un juriste avant d'activer les campagnes commerciales.
- Secrets d'intégration dans Supabase Vault ; webhooks protégés par secret partagé.
- Endpoints de démo publics : ajouter un rate-limit (Vercel Firewall ou Upstash) avant diffusion large.

## 6. Décisions à prendre ensemble

| # | Sujet | Options | Recommandation |
|---|---|---|---|
| 1 | Périmètre | Auto uniquement (comme Sandra) · multi-verticales | **Auto d'abord**, le modèle de données reste générique |
| 2 | Plateforme voix | Vapi · Retell · ElevenLabs Agents · Pipecat/LiveKit auto-hébergé | ✅ **Décidé : Vapi (région UE)** pour les pilotes ; pipeline maison à partir de ~20–50 sites |
| 3 | LLM | Claude Opus 5.5 (effort bas) · Sonnet 5.5 · Haiku 4.5 | Démarrer sur Opus 5.5, **benchmark de latence sur appels réels** avant de figer |
| 4 | Voix (TTS) | ElevenLabs · Cartesia · Azure Neural | **ElevenLabs** (meilleure qualité FR), voix maison à créer |
| 5 | Transcription (STT) | Deepgram Nova-3 · Gladia (FR) · Speechmatics | Benchmark sur accents, bruit d'atelier et **épellation d'immatriculations** |
| 6 | Opérateur (numéros FR sous Vapi) | Vonage · Twilio · Telnyx · trunk SIP d'un opérateur français | Vonage ou Twilio (import natif dans Vapi) + **pool de numéros FR pré-provisionnés** ; dossier réglementaire (Kbis, adresse) à prévoir |
| 7 | Base & auth | Supabase (UE) · Neon + Clerk | **Supabase** (Postgres + Auth + Vault + RLS) |
| 8 | Hébergement | Vercel Pro · AWS | **Vercel Pro** (le plan Hobby actuel est réservé à un usage non commercial) |
| 9 | DMS prioritaires | Nextlane · Keyloop · Kerridge · CDK · incadea | **Selon vos premiers clients** — à lister ensemble |
| 10 | Facturation | Stripe abonnements + usage | Stripe |
| 11 | Prix | Forfait/site + minutes · au résultat (RDV/lead) | À tester avec les premiers clients |
| 12 | Marque de l'agent | « Léa » par défaut · nom/voix par client | Nom et voix personnalisables par concession |

## 7. Feuille de route proposée

1. **Maintenant — Premier numéro réel** : compte Vapi UE + opérateur, `OSSIAN_VOICE_SECRET` et
   `ANTHROPIC_API_KEY` sur Vercel, `npm run vapi -- check` puis `connect` ([guide](VAPI.md)). Notifications de
   l'équipe via un webhook Slack/Teams. Test interne, puis 1 à 3 concessions pilotes en renvoi sur non-réponse.
2. **Semaines 2–4** : Supabase (auth + historique des appels dans le tableau de bord), Upstash Redis (mémoire
   d'appel partagée), benchmark Opus / Sonnet / Haiku sur appels réels, SMS de confirmation.
3. **Semaines 4–8 — Intégrations** : premier connecteur DMS (selon clients), CRM, campagnes sortantes, Stripe,
   multi-sites.
4. **Ensuite** : pipeline voix maison hébergé en France (marge, maîtrise des données), WhatsApp, SSO, analytics
   avancés, amélioration continue automatique du prompt à partir des transcriptions.
