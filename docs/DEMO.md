# Faire la démo chez un prospect

## Avant le rendez-vous (5 min)

1. Ouvrez `/onboarding`, collez l'URL du site de la concession → l'agent est généré avec ses horaires,
   marques, sites et prestations. Corrigez ce qui doit l'être à l'étape « Vérification ».
2. Allez jusqu'à l'étape 6 : le profil est enregistré dans le navigateur. `/demo` affiche alors la concession
   du prospect (badge « Profil personnalisé »). Le bouton « Profil démo » revient à Mistral Automobiles.
3. Vérifiez le micro sur Chrome (ou Edge/Safari) et le badge en haut à droite :
   **« IA en direct »** = Claude répond en temps réel (clé `ANTHROPIC_API_KEY` configurée sur Vercel) ;
   « Mode simulé » = agent à règles, suffisant pour les scénarios guidés mais pas pour l'improvisation.

## Pendant le rendez-vous (10 min)

| Temps | Quoi montrer | Où |
|---|---|---|
| 1 min | Le problème : 30–40 % d'appels manqués, 80 % des RDV atelier par téléphone | `/` (section chiffres) |
| 3 min | **Appel en direct** : « Je voudrais faire la révision de ma 3008 » → créneaux → RDV → SMS | `/demo` |
| 1 min | Laissez le prospect appeler lui-même, dans sa langue (anglais, espagnol…) | `/demo` |
| 1 min | Ce que reçoit l'équipe : carte RDV, lead, rappel, compte-rendu | `/demo` (colonne droite) |
| 2 min | Le pilotage : appels traités, CA généré, transcriptions, campagnes | `/app` |
| 1 min | ROI chiffré avec ses volumes | `/` (calculateur) |
| 1 min | Mise en ligne : renvoi d'appel, 15 minutes, sans engagement | `/onboarding` étape 6 |

Phrases de démo qui marchent bien : « Ma voiture est-elle prête ? C'est la GH-482-TL », « J'aimerais essayer
la nouvelle E-3008 samedi », « Je suis mécontent de ma facture », « Hello, my engine light is on ».

## Questions fréquentes en rendez-vous

- **« Et si l'IA se trompe ? »** Elle ne propose que des créneaux lus dans le planning, transfère ou programme
  un rappel dès que la demande sort de son périmètre, et chaque appel est transcrit et résumé.
- **« Il faut changer d'opérateur ? »** Non, un simple renvoi sur non-réponse / occupation (`**61*`, `**67*`)
  ou un débordement dans le standard.
- **« Et notre DMS ? »** L'agent démarre sans intégration (agenda Ossian + notification du conseiller), le
  connecteur DMS s'ajoute ensuite.
