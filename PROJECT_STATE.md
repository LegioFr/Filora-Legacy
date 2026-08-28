# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## État courant

- **Étape :** finalisation de la Phase F, avant Batch 0.
- **Phase F :** PR #6 mergée ; Issues #2 à #5 vérifiées après merge et fermées ; clôture formelle restant à établir.
- **Batch 0 :** non démarré.
- **Branche officielle :** `main`.
- **Branche de validation prévue :** `test-preview`.
- **État Git pertinent :** PR #6 mergée dans `main` par le commit `762271f34b3f730531a2344d9e78617d60bf3b74`. Le test de reprise a ensuite été validé et `PROJECT_STATE.md` a été actualisé sur `main`.

## Findings / Issues pertinents

- Issue #7 — éviter les consommations externes inutiles avant délégation : à décider explicitement avant ou pendant la préparation de Batch 0.
- Issue #8 — édition GitHub ciblée sans réécriture complète des fichiers : à décider explicitement avant ou pendant la préparation de Batch 0.

Les Issues #2, #3, #4 et #5 ont été vérifiées après merge de la PR #6 puis fermées comme résolues. L’Issue #4 a été fermée après un test de reprise équivalent exécuté à partir de ce point d’entrée et des sources GitHub.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- `DEVELOPMENT.md` porte encore le statut `candidat à contre-revue — Phase F4`. La Phase F ne doit donc pas être déclarée formellement clôturée tant que ce statut n’a pas été traité de manière contrôlée et cohérente avec les preuves de revue déjà obtenues.
- Batch 0 n’est pas démarré.

## Prochaine action

1. Traiter de manière contrôlée le statut de `DEVELOPMENT.md` afin de rendre explicite l’état final réel de la Phase F.
2. Vérifier que cette transition n’introduit aucune autre modification sémantique.
3. Une fois la Phase F formellement clôturée, préparer Batch 0 en consultant tous les findings ouverts pertinents et en décidant explicitement pour chacun : traiter/intégrer, reporter, accepter ou rejeter.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
