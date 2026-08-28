# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## État courant

- **Étape :** finalisation de la Phase F, avant Batch 0.
- **Phase F :** PR #6 mergée ; vérifications post-merge en cours.
- **Batch 0 :** non démarré.
- **Branche officielle :** `main`.
- **Branche de validation prévue :** `test-preview`.
- **État Git pertinent :** PR #6 mergée dans `main` ; commit de merge `762271f34b3f730531a2344d9e78617d60bf3b74`.

## Findings / Issues pertinents

- Issue #4 — reprise fiable entre conversations : test réel de reprise post-merge restant à démontrer avant fermeture.
- Issue #7 — éviter les consommations externes inutiles avant délégation : à décider explicitement avant ou pendant la préparation de Batch 0.
- Issue #8 — édition GitHub ciblée sans réécriture complète des fichiers : à décider explicitement avant ou pendant la préparation de Batch 0.

Les Issues #2, #3 et #5 ont été vérifiées après merge de la PR #6 puis fermées comme résolues.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Batch 0 ne doit pas démarrer tant que la condition de test réel de reprise de l’Issue #4 n’est pas satisfaite.
- La clôture de la Phase F doit être vérifiée après cette dernière condition ; elle ne découle pas automatiquement du merge de la PR #6.

## Prochaine action

1. Exécuter un test de reprise depuis un contexte neuf ou équivalent en partant de ce fichier et des sources GitHub qu’il indique.
2. Si le test démontre une reprise fiable, documenter la preuve et fermer l’Issue #4.
3. Vérifier alors les conditions réelles de clôture de la Phase F.
4. Seulement après clôture de la Phase F, préparer Batch 0 en consultant tous les findings ouverts pertinents et en décidant explicitement pour chacun : traiter/intégrer, reporter, accepter ou rejeter.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
