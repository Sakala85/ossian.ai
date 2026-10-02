# Ossian — Architecture & choix techniques

> Document de travail : il décrit ce qui est construit dans ce dépôt, l'architecture cible pour la production
> et **les décisions à prendre ensemble** (section 6). Les chiffres de coûts sont des ordres de grandeur à valider.

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
| Téléphonie (adapter Vapi) | `POST /api/voice/vapi`, `POST /api/voice/llm/chat/completions` | 🟡 squelette prêt, à brancher |
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
  voice/speech.ts             reconnaissance + synthèse vocale navigateur (démo)
  voice/vapi.ts               adapter téléphonie
  demo/*                      données de démonstration
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
voix. On peut démarrer vite sur une plateforme managée puis migrer vers une stack auto-hébergée (Pipecat ou
LiveKit Agents + Twilio/Telnyx SIP) quand le volume le justifie, sans réécrire l'agent.

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

## 4. Coûts unitaires (ordres de grandeur à valider)

| Poste (par minute d'appel) | Plateforme managée | Auto-hébergé |
|---|---|---|
| Téléphonie entrante FR | ~0,01 € | ~0,01 € |
| STT streaming | ~0,01 € | ~0,01 € |
| TTS (voix neurale) | 0,03–0,06 € | 0,03–0,06 € |
| LLM (Claude, prompt en cache) | 0,02–0,04 € | 0,02–0,04 € |
| Frais plateforme voix | ~0,05 € | 0 (+ serveurs) |
| **Total** | **≈ 0,12–0,17 €/min** | **≈ 0,07–0,12 €/min** |

Avec un appel moyen de ~2 min et ~1 500 appels/mois/site : ≈ 3 000 min → 360–510 € de coûts variables pour un
forfait de 490 €/site incluant 1 200 min + minutes supplémentaires à 0,25 €. **Le modèle de prix est à arbitrer
ensemble** (forfait + minutes, ou part variable au RDV/lead généré).

## 5. Sécurité, RGPD, conformité

- Hébergement UE (Supabase Francfort/Paris, fonctions Vercel `cdg1`), chiffrement au repos et en transit, RLS par organisation.
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
| 2 | Plateforme voix | Vapi · Retell · ElevenLabs Agents · Pipecat/LiveKit auto-hébergé | **Vapi pour les pilotes** (adapter prêt), auto-hébergé à partir de ~50 sites |
| 3 | LLM | Claude Opus 5.5 (effort bas) · Sonnet 5.5 · Haiku 4.5 | Démarrer sur Opus 5.5, **benchmark de latence sur appels réels** avant de figer |
| 4 | Voix (TTS) | ElevenLabs · Cartesia · Azure Neural | **ElevenLabs** (meilleure qualité FR), voix maison à créer |
| 5 | Transcription (STT) | Deepgram Nova-3 · Gladia (FR) · Speechmatics | Benchmark sur accents, bruit d'atelier et **épellation d'immatriculations** |
| 6 | Téléphonie | Numéros Vapi · Twilio · Telnyx · SIP client | Twilio/Telnyx + **pool de numéros FR pré-provisionnés** |
| 7 | Base & auth | Supabase (UE) · Neon + Clerk | **Supabase** (Postgres + Auth + Vault + RLS) |
| 8 | Hébergement | Vercel Pro · AWS | **Vercel Pro** (le plan Hobby actuel est réservé à un usage non commercial) |
| 9 | DMS prioritaires | Nextlane · Keyloop · Kerridge · CDK · incadea | **Selon vos premiers clients** — à lister ensemble |
| 10 | Facturation | Stripe abonnements + usage | Stripe |
| 11 | Prix | Forfait/site + minutes · au résultat (RDV/lead) | À tester avec les premiers clients |
| 12 | Marque de l'agent | « Léa » par défaut · nom/voix par client | Nom et voix personnalisables par concession |

## 7. Feuille de route proposée

1. **Semaine 1–3 — Pilote réel** : Supabase (auth + persistance), Vapi + numéro FR, `/api/voice/*` branchés,
   agenda Ossian intégré (sans DMS), récap e-mail après chaque appel, 1 à 3 concessions pilotes.
2. **Semaine 4–8 — Intégrations** : premier connecteur DMS (selon clients), CRM, campagnes sortantes, Stripe,
   multi-sites, alertes Slack/Teams.
3. **Ensuite** : pipeline voix auto-hébergé (marge), WhatsApp, SSO, analytics avancés, amélioration continue
   automatique du prompt à partir des transcriptions.
