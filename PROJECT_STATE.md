# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: post-Batch 0
- status: Batch 0 clôturé et présent sur main
- git: main contient Batch 0 ; test-preview doit rester synchronisée avec l’état officiel avant toute nouvelle préparation ; lire les SHA, PR et branches courants directement depuis GitHub
- next_action: avant tout nouveau Batch, vérifier GitHub et les findings ouverts puis déterminer le prochain périmètre depuis les documents canoniques ; ne rien démarrer automatiquement

## État courant

- **Étape :** post-Batch 0.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main` après validation sur `test-preview`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #7 — fermée comme résolue après preuve réelle d’un paquet de délégation ciblé et prévalidé.
- Issue #8 — fermée `not_planned` avec report explicite ; à réévaluer seulement si l’outillage d’édition ciblée évolue.
- Issue #10 — fermée comme résolue après test indépendant réussi : reprise sans réparation, aucune auto-référence volatile et aucune contradiction avec GitHub.
- Issue #12 — résolue et fermée après restauration des documents canoniques manquants.
- Issues #2, #3, #4 et #5 — résolues et fermées.

Au moment de cette clôture, GitHub ne signale aucun finding/Issue ouvert dans le dépôt. Toujours revérifier l’état réel des Issues avant de préparer ou démarrer un nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; le workflow GitHub Actions est un contrôle automatique, pas une barrière technique totale.
- Les contrôles de données, persistance, recovery, architecture et UI restent reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.

## Prochaine action

1. Repartir de l’état réel de `main` et vérifier que `test-preview` est synchronisée avant toute préparation.
2. Vérifier les Issues/findings ouverts pertinents ; s’il n’y en a pas, ne rien inventer.
3. Consulter les documents canoniques nécessaires pour déterminer le prochain objectif concret.
4. Définir un périmètre de Batch seulement lorsqu’un travail réel et vérifiable est identifié.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
