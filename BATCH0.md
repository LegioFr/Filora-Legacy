# Batch 0 — Garde-fous opérationnels minimaux

## Statut

Batch 0 réaligné sur l’état canonique restauré de `main`. Implémentation corrigée en cours ; aucune clôture ni promotion vers `main` n’est autorisée avant preuves sur le HEAD final et contre-vérification indépendante.

## Intention

Rendre mécaniques uniquement les contrôles déjà justifiés par des incidents réels ou par une propriété objective simple, sans créer une seconde gouvernance parallèle.

## Périmètre immédiat

Inclus :

- maintenir `test-preview` alignée sur la base canonique pertinente avant promotion vers `main` ;
- vérifier la présence des quatre documents canoniques sur la base et le HEAD proposés ;
- traiter l’Issue #7 avec un lint de paquet de revue externe qui contrôle uniquement des propriétés de forme et de borne objectivement vérifiables ;
- traiter l’Issue #10 avec une section de reprise structurée à clés uniques dans `PROJECT_STATE.md`, sans recherche globale de sous-chaînes ;
- ajouter des scénarios adversariaux couvrant les faux positifs démontrés par les contre-analyses ;
- exécuter les contrôles et tests sur les PR vers `test-preview` et `main` via un runner unique GitHub Actions ;
- conserver une déclaration de clôture unique dans ce document plutôt que multiplier templates et registres.

Reporté jusqu’à apparition de leur objet :

- contrôles d’architecture par imports/cycles ;
- invariants métier DATA ;
- persistance, migrations, atomicité et concurrence ;
- récupération end-to-end ;
- contrôles UI, réseau, cloud, synchronisation et authentification.

Lorsqu’un futur Batch introduit un objet couvert par une règle objectivement testable, il doit soit ajouter le contrôle applicable dans ce travail, soit déclarer explicitement le report, son risque résiduel et son point de réévaluation. Les jalons canoniques non reportables restent obligatoires à leur frontière, notamment la récupération avant que Filora devienne la source principale de données réelles.

## Décisions sur les findings pertinents

### Issue #7 — traiter dans Batch 0

Le mécanisme est volontairement qualifié de **lint de forme**, pas de preuve de minimalité ou de suffisance sémantique.

Il vérifie notamment :

- mission et question non vides ;
- SHA Git au format exact et attestation que l’état cible a été vérifié ;
- vérification locale optionnelle que le SHA résout vers un commit lorsqu’un checkout Git est disponible ;
- au moins une entrée avec type et finalité ;
- contenu embarqué ou URL dont l’accès a été explicitement établi ;
- rejet des placeholders manifestes et contenus dupliqués ;
- budget déclaré positif mais plafonné par le mécanisme ;
- comptage du paquet sérialisé complet, pas uniquement de `inputs[].content`.

Ce contrôle **ne prouve pas** que le paquet est sémantiquement suffisant, réellement minimal, authentique ou correctement interprété. Ces propriétés restent à reviewer.

### Issue #8 — report maintenu

Le finding reste reporté/fermé `not_planned` : l’outillage disponible ne fournit pas encore d’édition ciblée sûre et la création d’une abstraction dédiée serait disproportionnée. Réévaluer si l’outillage change ou avant une modification ciblée importante d’un document volumineux.

### Issue #10 — traiter dans Batch 0

`PROJECT_STATE.md` contient une section `## Reprise structurée` avec exactement quatre clés d’autorité opérationnelle :

- `stage` ;
- `status` ;
- `git` ;
- `next_action`.

Le lint exige une section unique, des clés uniques et permet de comparer exactement les valeurs attendues. Les anciens textes ailleurs dans le fichier ne peuvent donc plus satisfaire le contrôle à la place du champ d’autorité.

Les findings et réserves pertinents restent une responsabilité de revue ; le parseur ne prétend pas les déduire automatiquement.

## Traçabilité légère

Les contrôles mécaniques durables doivent référencer la règle ou le finding qu’ils protègent de manière lisible, sans registre central exhaustif. Les canoniques restent normatifs : un test ou un script vérifie un contrat, il ne le redéfinit pas. Toute contradiction contrôle/canonique ou canonique/canonique doit être rendue explicite et résolue, jamais corrigée automatiquement pour faire passer le contrôle.

## Propriétés à démontrer avant clôture

1. `test-preview` et le HEAD du Batch contiennent `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md`.
2. Le lint #7 rejette les faux positifs démontrés : budget arbitrairement énorme, placeholder, payload hors `content`, URL sans accès établi et état non vérifié.
3. Le lint #10 rejette les doublons, sections concurrentes et valeurs attendues présentes seulement dans de l’historique non autoritaire.
4. Les contrôles n’affirment pas démontrer davantage que ce qu’ils vérifient objectivement.
5. Le runner automatique est rattaché au HEAD de PR. Si GitHub ne permet pas de rendre le check bloquant par protection de branche, cette limite reste une réserve explicite et le Batch ne prétend pas empêcher mécaniquement un merge manuel.
6. Les classifications F4.2/F4.3 et F4.4 sont déclarées sur le diff final.
7. `PROJECT_STATE.md` est synchronisé sur l’état final proposé avant clôture.
8. Les Issues #7 et #10 ne sont fermées que lorsque leurs conditions de résolution sont réellement démontrées.

## Classification provisoire

- **F4.2/F4.3 : Sensible**, car le Batch modifie des mécanismes de contrôle opérationnels et leur exécution.
- **F4.4 : décision technique dans le périmètre approuvé du Batch 0**, sans modification des contrats produit, données ou architecture.

Une contre-vérification indépendante du HEAD final est obligatoire avant clôture.

## Condition de clôture

Batch 0 n’est clôturable que lorsque les propriétés ci-dessus sont démontrées sur le HEAD exact proposé à `test-preview`, puis que la promotion applicable respecte le flux `test-preview` → `main`. Une propriété obligatoire non démontrée reste non validée ; un test vert ne suffit pas à lui seul à certifier les propriétés sémantiques laissées à la revue.
