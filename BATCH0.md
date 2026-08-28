# Batch 0 — Garde-fous opérationnels minimaux

## Statut

Préparation validée ; implémentation à contre-vérifier avant clôture.

## Intention

Mettre en place les garde-fous opérationnels minimaux nécessaires pour que les règles déjà validées de Filora soient effectivement appliquées sans créer une nouvelle couche de gouvernance parallèle.

## Périmètre

Inclus :

- établir `test-preview` comme branche de validation disponible avant promotion vers `main` ;
- traiter l’Issue #7 par un contrôle opérationnel simple avant toute délégation externe payante ou limitée : mission exécutable, entrées nécessaires disponibles, paquet minimal ;
- traiter l’Issue #10 par un contrôle de clôture qui vérifie que `PROJECT_STATE.md` reflète l’état GitHub nouvellement établi avant de considérer une clôture de Phase ou de Batch comme complète ;
- produire des preuves reproductibles pour ces garde-fous.

Exclus :

- modification des contrats produit, données ou architecture ;
- ajout d’une dépendance ou d’une abstraction lourde ;
- automatisation générale de toute la gouvernance ;
- résolution de l’Issue #8 par création d’un nouvel outil d’édition tant que l’outillage disponible ne fournit pas une méthode ciblée sûre et que le coût d’en construire une n’est pas justifié.

## Décisions sur les findings ouverts

### Issue #7 — traiter dans Batch 0

Justification : le risque observé est réel et les règles canoniques exigent déjà un contexte minimal suffisant. Le Batch 0 doit rendre cette règle opérationnelle et vérifiable, sans imposer une procédure lourde à chaque revue.

Condition de preuve : démontrer sur une mission de revue simulée ou réelle que le contrôle refuse ou bloque une délégation lorsque les entrées nécessaires manquent et qu’il produit un paquet ciblé lorsque les entrées sont disponibles.

### Issue #8 — reporter

Justification : le connecteur GitHub actuellement disponible au coordinateur expose encore `update_file`, qui remplace le fichier complet, et ne fournit pas d’opération de patch/`old_text -> new_text` pour les écritures. Construire maintenant une abstraction supplémentaire uniquement pour contourner cette limite serait disproportionné.

Réévaluation : avant une modification ciblée importante d’un document volumineux, ou dès que l’outillage expose une édition ciblée sûre.

### Issue #10 — traiter dans Batch 0

Justification : l’incident après la Phase F a démontré qu’une obligation documentaire seule ne garantit pas la synchronisation du point de reprise.

Condition de preuve : simuler ou exécuter une transition de clôture et vérifier qu’elle n’est pas considérée complète si `PROJECT_STATE.md` est manifestement périmé ; puis vérifier qu’une nouvelle reprise retrouve directement l’état post-transition.

## Propriétés à démontrer

1. Le flux normal peut utiliser `test-preview` avant `main`.
2. Une délégation externe ne part pas sans entrées suffisantes et n’embarque pas un contexte manifestement surdimensionné.
3. Une clôture ne laisse pas `PROJECT_STATE.md` manifestement périmé.
4. Aucun contrat canonique n’est modifié pour rendre ces contrôles plus faciles à satisfaire.
5. Les mécanismes restent simples, proportionnés et vérifiables.

## Preuves attendues avant clôture

- état Git exact du Batch ;
- diff complet ;
- existence et base vérifiée de `test-preview` ;
- tests/scénarios reproductibles des garde-fous #7 et #10 ;
- contrôle que `PROJECT_STATE.md` correspond à l’état de clôture ;
- classification F4.2/F4.3 et F4.4 avec justification ;
- revue indépendante si la classification finale l’exige ;
- liste des findings/réserves restants.

## Condition de clôture

Le Batch 0 est clôturable uniquement lorsque les propriétés ci-dessus sont démontrées sur l’état Git exact proposé à la promotion et que les Issues #7 et #10 peuvent être fermées sur la base de preuves, pas sur la seule présence de règles écrites.
