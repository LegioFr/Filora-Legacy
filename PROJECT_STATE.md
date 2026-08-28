# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 0
- status: en cours — réalignement et correction des garde-fous
- git: batch0/operational-guardrails-v2 basée sur main b634903da4197937f3200396a13a4a0612f472fe ; test-preview réalignée sur ce même commit
- next_action: terminer les contrôles corrigés, exécuter les preuves sur le HEAD final puis demander une contre-vérification indépendante

## État courant

- **Étape :** Batch 0 en cours après réalignement sur l’état canonique restauré.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** en cours sur `batch0/operational-guardrails-v2`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`, réalignée par fast-forward sur `main` `b634903da4197937f3200396a13a4a0612f472fe` avant reprise du Batch 0.
- **État Git pertinent :** les quatre canoniques sont présents sur `main` et `test-preview`; la PR #11 historique reste non fusionnable dans son état initial et sera remplacée/fermée après ouverture de la PR réalignée.

## Findings / Issues pertinents

- Issue #7 — traiter dans Batch 0 : corriger le lint de paquet externe pour éviter budget auto-déclaré illimité, placeholder, URL sans accès établi et claims excessifs.
- Issue #8 — report maintenu ; Issue fermée `not_planned` après décision explicite, à réévaluer si l’outillage d’édition ciblée évolue.
- Issue #10 — traiter dans Batch 0 : remplacer la recherche globale de sous-chaînes par une section de reprise structurée à clés uniques et tests adversariaux.

L’Issue #12 — documents canoniques référencés mais absents du dépôt — est résolue et fermée après restauration de `PRODUCT.md`, `DATA.md` et `ARCHITECTURE.md` via la PR #13, validation explicite de F3 pour `ARCHITECTURE.md`, contre-vérification Codex conforme et merge dans `main`.

Les Issues #2, #3, #4 et #5 ont été vérifiées puis fermées comme résolues.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- PR #11 actuelle : NO-GO pour merge/clôture ; elle repose sur l’ancienne base et ses contrôles #7/#10 sont insuffisants.
- Batch 0 reste **Sensible** provisoirement car il modifie des mécanismes de contrôle opérationnels.
- Les contrôles de données, persistance, recovery, architecture et UI sont reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.
- L’effectivité réellement bloquante des checks GitHub doit être vérifiée ; un workflow non protégé ne doit pas être présenté comme une impossibilité de merge.

## Prochaine action

1. Finaliser la branche `batch0/operational-guardrails-v2` avec contrôles corrigés, tests adversariaux et runner unique.
2. Vérifier le diff et les résultats sur le HEAD exact.
3. Fermer/remplacer proprement la PR #11 historique par une PR réalignée vers `test-preview`.
4. Obtenir une contre-vérification indépendante du nouveau HEAD avant toute promotion.
5. Fermer #7 et #10 uniquement si leurs conditions de résolution sont démontrées.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
