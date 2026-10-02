# Mettre Ossian sur un vrai numéro avec Vapi

Temps estimé : 30 à 45 minutes, plus le délai de l'opérateur pour un numéro français (dossier réglementaire).

Vapi gère l'audio (téléphonie, détection de parole, interruptions, transcription, voix). Le « cerveau » reste
Ossian : à chaque tour de parole, Vapi appelle notre API sur Vercel, qui fait répondre Claude avec les outils
métier, puis renvoie le texte à prononcer.

## 1. Créer le compte Vapi en région UE

1. Créez l'organisation sur **https://dashboard.eu.vapi.ai** (et non `dashboard.vapi.ai`). Une organisation
   appartient à une seule région : la région UE garde les appels et les données en Europe.
2. *API Keys* → copiez la **clé privée** → ce sera `VAPI_API_KEY`.
3. Ajoutez du crédit, ou demandez un essai à Vapi. Profitez-en pour confirmer avec eux la disponibilité de la
   région UE et la parité de fonctionnalités avec les États-Unis.

## 2. Obtenir un numéro français

Les numéros fournis directement par Vapi sont américains : pour un numéro français, on importe un numéro d'opérateur.

| Option | Comment | Remarques |
|---|---|---|
| **Vonage** | Achetez un numéro FR dans le dashboard Vonage, puis dans Vapi : page *Keys* → identifiants Vonage (API key + secret), dont on récupère l'id | Import en une commande : `npm run vapi -- import-vonage +33XXXXXXXXX --credential <id>` |
| **Twilio** | Achetez un numéro FR (regulatory bundle), puis Vapi → *Phone Numbers* → *Import* → Twilio | Ensuite `npm run vapi -- connect <id>` |
| **Telnyx / trunk SIP** | Vapi → *Phone Numbers* → *Import* (Telnyx) ou *BYO SIP trunk* | Pour un opérateur français ou le standard IPBX du client |

> Les numéros géographiques français exigent un justificatif (Kbis, adresse). Comptez quelques jours la première
> fois : c'est pourquoi on gardera ensuite un **pool de numéros pré-provisionnés** pour l'onboarding automatique.

## 3. Configurer Vercel

Projet `ossian-ai` → *Settings → Environment Variables*, puis redéployez :

| Variable | Valeur |
|---|---|
| `ANTHROPIC_API_KEY` | votre clé Anthropic (sinon l'agent tourne en mode simulé) |
| `OSSIAN_VOICE_SECRET` | une longue chaîne aléatoire (ex. `openssl rand -hex 32`), partagée avec Vapi |
| `NEXT_PUBLIC_SITE_URL` | `https://ossian-ai.vercel.app` (ou votre domaine) |
| `OSSIAN_NOTIFY_WEBHOOK_URL` | webhook Slack, Teams, Make ou Zapier qui reçoit les demandes de RDV, leads, rappels et comptes-rendus |
| `ELEVENLABS_VOICE_ID` | *(optionnel)* l'identifiant de la voix ElevenLabs à utiliser |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | *(recommandé)* Vercel → *Storage* → Upstash Redis : mémoire d'appel partagée entre instances |

Sans Redis, la mémoire de l'appel reste dans l'instance qui traite l'appel : suffisant pour un test, à ajouter
avant les vrais pilotes.

## 4. Tester les endpoints, puis brancher le numéro

Dans le dépôt, créez `.env.local` (non versionné) :

```bash
VAPI_API_KEY=...
VAPI_API_BASE=https://api.eu.vapi.ai
OSSIAN_BASE_URL=https://ossian-ai.vercel.app
OSSIAN_VOICE_SECRET=...            # la même valeur que sur Vercel
```

Puis :

```bash
npm run vapi -- check       # simule un appel : assistant renvoyé + première réponse de l'agent et sa latence
npm run vapi -- numbers     # liste vos numéros Vapi et leur id
npm run vapi -- connect <phoneNumberId> --fallback +33XXXXXXXXX
```

`connect` règle le **Server URL** du numéro sur `/api/voice/vapi` (avec le secret) et le **numéro de secours** :
si Ossian ne répond pas, l'appel est renvoyé vers l'accueil de la concession. Appelez le numéro : sans profil
associé, c'est la concession de démo (Mistral Automobiles) qui répond, sans transfert réel.

## 5. Associer la vraie concession au numéro

1. Faites l'onboarding (`/onboarding`) avec le site de la concession, vérifiez surtout **les numéros des
   services** (ils servent aux transferts) et les horaires.
2. Sur `/demo`, carte « Concession » → **Exporter (JSON)**.
3. Associez le profil au numéro, au choix :
   - **Redis** (recommandé) : `npm run vapi -- connect <phoneNumberId> --fallback +33… --profile ossian-profil-xxx.json`
   - **Sans base** : ajoutez-le dans `config/dealerships.json` sous la forme `{ "+33XXXXXXXXX": { …profil… } }`,
     puis commitez et poussez (Vercel redéploie).

Dès qu'un profil réel est associé, le **mode pilote** s'active : les RDV deviennent des demandes confirmées par
un conseiller, chaque demande, lead, rappel ou transfert part sur le webhook de l'équipe, et les transferts vers
les services sont réels.

## 6. Activer le renvoi chez la concession

Depuis la ligne de la concession, renvoyez vers le numéro Ossian :

| Mode | Code (mobiles et la plupart des lignes) |
|---|---|
| Sur non-réponse (recommandé pour démarrer) | `**61*<numéro Ossian>#` |
| Sur occupation | `**67*<numéro Ossian>#` |
| Permanent (24h/24) | `**21*<numéro Ossian>#` |
| Tout désactiver | `##002#` |

Pour un standard IPBX (3CX, Ringover, Aircall, Orange Business…), configurez un débordement vers le numéro Ossian.

## Vérifier et dépanner

- **Vapi → Logs → Calls** : transcription, latences, appels aux outils `transferCall` et `endCall`.
- **Vercel → Logs** : lignes `[voice/llm]`, `[notify:…]` et `[vapi]`.
- `401` : `OSSIAN_VOICE_SECRET` différent entre Vercel et `.env.local`.
- Réponses rigides qui ignorent les questions libres : l'agent tourne en mode simulé, `ANTHROPIC_API_KEY` est absent sur Vercel (ou pas encore redéployé).
- Latence trop élevée : essayez `OSSIAN_AGENT_MODEL=claude-sonnet-5-5`, puis comparez sur de vrais appels.
