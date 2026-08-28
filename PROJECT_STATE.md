# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 0
- status: clôture démontrée — promotion vers main autorisée
- git: test-preview contient l’état Batch 0 validé ; Issue #7 et Issue #10 sont résolues ; lire les SHA, PR et branches courants directement depuis GitHub
- next_action: si Batch 0 n’est pas encore présent sur main, promouvoir test-preview vers main ; s’il est déjà présent sur main, reprendre depuis GitHub et examiner les findings ouverts pertinents avant tout nouveau Batch

## État courant

- **Étape :** Batch 0 clôturable et prêt pour promotion vers `main`.
- **Phase F :** clôturée.
- **Batch 0 :** garde-fous opérationnels minimaux validés sur `test-preview`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #7 — fermée comme résolue après preuve réelle d’un paquet de délégation ciblé et prévalidé.
- Issue #8 — fermée `not_planned` avec report explicite ; à réévaluer seulement si l’outillage d’édition ciblée évolue.
- Issue #10 — fermée comme résolue après test indépendant réussi : reprise sans réparation, aucune auto-référence volatile et aucune contradiction avec GitHub.
- Issue #12 — résolue et fermée après restauration des documents canoniques manquants.
- Issues #2, #3, #4 et #5 — résolues et fermées.

Toujours vérifier l’état réel des Issues dans GitHub avant de préparer ou démarrer un nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; le workflow GitHub Actions est un contrôle automatique, pas une barrière technique totale.
- Les contrôles de données, persistance, recovery, architecture et UI restent reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.

## Prochaine action

1. Vérifier sur GitHub si Batch 0 est déjà présent sur `main`.
2. S’il ne l’est pas, effectuer la promotion `test-preview` → `main` après CI conforme.
3. S’il l’est, reconstruire l’état courant depuis GitHub et examiner les Issues/findings ouverts pertinents avant toute préparation d’un nouveau Batch.
4. Ne pas démarrer de nouveau Batch uniquement parce que Batch 0 semble terminé : vérifier d’abord ses conditions réelles de clôture et l’état GitHub courant.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
