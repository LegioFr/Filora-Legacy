# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 0
- status: en cours — corrections appliquées après contre-vérification indépendante NON CONFORME
- git: PR #14 ouverte sur batch0/operational-guardrails-v2 ; base test-preview b634903da4197937f3200396a13a4a0612f472fe ; corrections post-revue en cours de validation
- next_action: vérifier CI sur le nouveau HEAD exact puis effectuer une contre-vérification indépendante ciblée des corrections avant merge vers test-preview

## État courant

- **Étape :** Batch 0 en cours après réalignement sur l’état canonique restauré et correction des bloqueurs trouvés par la contre-vérification indépendante.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** en cours sur `batch0/operational-guardrails-v2` via la PR #14.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`, réalignée par fast-forward sur `main` `b634903da4197937f3200396a13a4a0612f472fe` avant reprise du Batch 0.
- **État Git pertinent :** PR #11 fermée sans merge ; PR #14 ouverte comme remplacement réaligné. La contre-vérification du HEAD `10bfc815644cf07f68b7e84d5aabbc41764ad24d` a conclu `NON CONFORME` et identifié des corrections ciblées désormais appliquées sur la branche de PR.

## Findings / Issues pertinents

- Issue #7 — traiter dans Batch 0 : lint de paquet externe corrigé pour éviter budget auto-déclaré illimité, placeholder manifeste, URL sans accès établi et claims excessifs ; validation finale encore requise.
- Issue #8 — report maintenu ; Issue fermée `not_planned` après décision explicite, à réévaluer si l’outillage d’édition ciblée évolue.
- Issue #10 — traiter dans Batch 0 : reprise structurée à clés uniques renforcée contre blocs de code/citations ; validation finale encore requise.

L’Issue #12 — documents canoniques référencés mais absents du dépôt — est résolue et fermée après restauration de `PRODUCT.md`, `DATA.md` et `ARCHITECTURE.md` via la PR #13, validation explicite de F3 pour `ARCHITECTURE.md`, contre-vérification Codex conforme et merge dans `main`.

Les Issues #2, #3, #4 et #5 ont été vérifiées puis fermées comme résolues.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Batch 0 reste **Sensible** car il modifie des mécanismes de contrôle opérationnels.
- La PR #14 ne doit pas être mergée tant que la CI du nouveau HEAD et la contre-vérification indépendante des corrections ne sont pas conformes.
- Les contrôles de données, persistance, recovery, architecture et UI sont reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.
- Aucun ruleset/protection de branche n’est actuellement disponible comme preuve de blocage mécanique d’un merge manuel ; le workflow doit être présenté comme contrôle automatique, pas comme interdiction technique absolue.

## Prochaine action

1. Vérifier les résultats GitHub Actions rattachés au nouveau HEAD exact de la PR #14.
2. Vérifier que le workflow checkout et asserte le SHA exact de la PR.
3. Vérifier les nouveaux scénarios adversariaux #7/#10, notamment URL non vérifiée avec contenu et clés dans bloc de code/citation.
4. Effectuer une contre-vérification indépendante ciblée du nouveau HEAD.
5. Merger vers `test-preview` uniquement si cette contre-vérification est acceptable.
6. Fermer #7 et #10 uniquement si leurs conditions de résolution sont démontrées.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
