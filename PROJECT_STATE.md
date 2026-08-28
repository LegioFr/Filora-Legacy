# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## État courant

- **Étape :** pré-Batch 0.
- **Batch 0 :** non démarré.
- **Branche officielle :** `main`.
- **Branche de validation prévue :** `test-preview`.

## Findings à vérifier avant Batch 0

- Issue #2 — autonomie GitHub et consultation des findings avant Batch.
- Issue #3 — séparation `test-preview` / `main`.
- Issue #4 — reprise fiable entre conversations.
- Issue #5 — contexte Claude sans accès GitHub.

Toujours vérifier leur état réel dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Prochaine action

Consulter les Issues et PR ouvertes pertinentes dans GitHub :

- si l’intégration de gouvernance #2 à #5 est encore en revue, poursuivre sa vérification sans démarrer Batch 0 ;
- si elle est mergée, vérifier individuellement les conditions de résolution des Issues puis fermer uniquement celles réellement satisfaites ;
- lorsque les préconditions restantes sont satisfaites, préparer Batch 0 selon `DEVELOPMENT.md`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
