# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## État courant

- **Étape :** préparation de Batch 0 après clôture de la Phase F.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** non démarré.
- **Branche officielle :** `main`.
- **Branche de validation prévue :** `test-preview`.
- **État Git pertinent :** PR #9 mergée dans `main` par le commit `7cf4028b08fa1d1eb6ae81313a065f2d078744fb` après contre-vérification Codex conforme sur le HEAD `8d64d4ba0c26971bf6c7c7b9f05b3510b2a42f77`.

## Findings / Issues pertinents

- Issue #7 — éviter les consommations externes inutiles avant délégation : à décider explicitement avant ou pendant la préparation de Batch 0.
- Issue #8 — édition GitHub ciblée sans réécriture complète des fichiers : à décider explicitement avant ou pendant la préparation de Batch 0.
- Issue #10 — maintenir mécaniquement le point de reprise lors des clôtures : à intégrer/décider dans Batch 0 afin qu’une clôture ne laisse pas `PROJECT_STATE.md` périmé.

Les Issues #2, #3, #4 et #5 ont été vérifiées après merge de la PR #6 puis fermées comme résolues. L’Issue #4 a été fermée après un test de reprise équivalent exécuté à partir de ce point d’entrée et des sources GitHub.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Aucun blocage connu sur la clôture de la Phase F.
- Batch 0 n’est pas démarré.
- Les findings ouverts pertinents doivent recevoir une décision explicite avant ou pendant sa préparation.

## Prochaine action

1. Consulter l’ensemble des Issues/findings ouverts pertinents pour Batch 0.
2. Décider explicitement pour chacun : traiter/intégrer, reporter, accepter ou rejeter.
3. Définir ensuite le périmètre et les preuves de Batch 0 avant de le démarrer.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
