# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 0
- status: validé sur test-preview — Issue #10 à revalider avant promotion vers main
- git: test-preview contient l’état Batch 0 validé ; main ne contient pas encore Batch 0 ; les SHA et PR courants doivent être lus directement depuis GitHub
- next_action: lancer un test indépendant sans contexte préalable pour vérifier que ce point de reprise décrit directement l’état courant ; si conforme, fermer Issue #10 puis préparer la promotion de test-preview vers main

## État courant

- **Étape :** Batch 0 validé sur `test-preview`, pas encore promu vers `main`.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** garde-fous minimaux intégrés et état de clôture préparé sur `test-preview`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`, qui contient l’état Batch 0 à valider avant promotion.
- **État Git pertinent :** les PR #14, #15 et #16 ont été mergées vers `test-preview` pendant Batch 0. Les identifiants de HEAD et l’état courant des PR doivent être vérifiés directement sur GitHub, sans les dupliquer ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #7 — résolue et fermée après preuve réelle : lint `PASS`, SHA vérifié, paquet ciblé et exécutable confirmé indépendamment.
- Issue #8 — fermée `not_planned` avec report explicite ; à réévaluer seulement si l’outillage d’édition ciblée évolue.
- Issue #10 — reste ouverte : le mécanisme et les tests sont en place ; la dernière preuve requise est qu’un nouveau contexte retrouve directement l’état courant depuis GitHub et ce point de reprise, sans corriger une transition périmée.

L’Issue #12 — documents canoniques référencés mais absents du dépôt — est résolue et fermée après restauration de `PRODUCT.md`, `DATA.md` et `ARCHITECTURE.md` via la PR #13.

Les Issues #2, #3, #4 et #5 ont été vérifiées puis fermées comme résolues.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Batch 0 reste **Sensible** jusqu’à sa clôture et sa promotion finale.
- Issue #10 bloque encore la promotion vers `main` jusqu’à réussite du test indépendant de reprise.
- Aucun ruleset/protection de branche n’est actuellement disponible comme preuve de blocage mécanique d’un merge manuel ; le workflow est un contrôle automatique, pas une interdiction technique absolue.
- Les contrôles de données, persistance, recovery, architecture et UI restent reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.

## Prochaine action

1. Effectuer un test indépendant dans un contexte neuf à partir de GitHub et de ce point de reprise.
2. Fermer Issue #10 uniquement si l’état courant est retrouvé sans réparation.
3. Préparer ensuite la promotion de `test-preview` vers `main`.
4. Après promotion, mettre à jour ce point de reprise avec un état durable qui décrit la nouvelle étape sans recopier un SHA auto-référentiel.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
