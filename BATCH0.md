# Batch 0 — Garde-fous opérationnels minimaux

## Statut

Implémentation initiale réalisée ; preuves locales disponibles ; contre-vérification et promotion vers `test-preview` à faire avant clôture.

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

Justification : le risque observé est réel et les règles canoniques exigent déjà un contexte minimal suffisant. Le Batch 0 rend cette règle opérationnelle avec `tools/filora_guard.py review-packet`.

Le contrôle exige :

- une mission non vide ;
- un SHA Git exact ;
- des entrées contenant réellement le contenu nécessaire, pas seulement une URL ou une déclaration ;
- une justification (`purpose`) pour chaque entrée ;
- l’absence de contenu dupliqué ;
- un budget de contexte explicite propre à la mission et non dépassé.

### Issue #8 — reporter

Justification : le connecteur GitHub actuellement disponible au coordinateur expose encore `update_file`, qui remplace le fichier complet, et ne fournit pas d’opération de patch/`old_text -> new_text` pour les écritures. Construire maintenant une abstraction supplémentaire uniquement pour contourner cette limite serait disproportionné.

Réévaluation : avant une modification ciblée importante d’un document volumineux, ou dès que l’outillage expose une édition ciblée sûre.

### Issue #10 — traiter dans Batch 0

Justification : l’incident après la Phase F a démontré qu’une obligation documentaire seule ne garantit pas la synchronisation du point de reprise.

Le contrôle `tools/filora_guard.py project-state` échoue si `PROJECT_STATE.md` ne contient pas les trois faits attendus fournis au moment de la transition : étape, état Git et prochaine action.

## Propriétés à démontrer

1. Le flux normal peut utiliser `test-preview` avant `main`.
2. Une délégation externe ne part pas sans entrées suffisantes et n’embarque pas un contexte manifestement surdimensionné au regard du budget déclaré pour la mission.
3. Une clôture ne laisse pas `PROJECT_STATE.md` manifestement périmé sur les faits vérifiés.
4. Aucun contrat canonique n’est modifié pour rendre ces contrôles plus faciles à satisfaire.
5. Les mécanismes restent simples, proportionnés et vérifiables.

## Preuves disponibles

- `test-preview` a été créée depuis `main` au commit `75409c6b27079748bc94431c65f80de8d569437a`.
- la branche de travail est `batch0/operational-guardrails`.
- `tools/filora_guard.py` utilise uniquement la bibliothèque standard Python.
- `tests/test_filora_guard.py` couvre 6 scénarios : 2 succès/échecs de synchronisation du point de reprise et 4 scénarios de paquet de revue, dont URL seule, duplication et dépassement de budget.
- exécution locale des 6 tests sur le contenu vérifié depuis la branche GitHub : `Ran 6 tests ... OK`.
- `review-packet.example.json` fournit un format de paquet minimal sans imposer un contexte permanent ou un seuil universel.

## Preuves encore attendues avant clôture

- état Git exact final du Batch ;
- diff complet final ;
- contre-vérification indépendante si la classification finale l’exige ;
- test de transition final avec `PROJECT_STATE.md` mis à jour sur l’état proposé à la promotion ;
- fermeture de #7 et #10 uniquement si leurs conditions de résolution sont réellement démontrées.

## Classification provisoire

- **F4.2/F4.3 : Sensible par prudence**, car le Batch introduit des mécanismes de contrôle utilisés dans la gouvernance opérationnelle, même s’il ne modifie aucun document canonique.
- **F4.4 : décision technique dans le périmètre déjà autorisé**, sous réserve de la vérification finale ; aucune décision produit, données ou architecture n’est introduite.

Cette classification doit être contre-vérifiée sur le diff final avant clôture.

## Condition de clôture

Le Batch 0 est clôturable uniquement lorsque les propriétés ci-dessus sont démontrées sur l’état Git exact proposé à la promotion et que les Issues #7 et #10 peuvent être fermées sur la base de preuves, pas sur la seule présence de règles écrites.
