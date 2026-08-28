# Batch 0 — Garde-fous opérationnels minimaux

## Statut

Batch 0 est **validé sur `test-preview`** après correction des bloqueurs et contre-vérification indépendante conforme du HEAD final de la PR #14. La promotion vers `main` n’est pas encore effectuée. L’Issue #7 est résolue. L’Issue #10 reste le seul bloqueur de clôture jusqu’à réussite d’un test indépendant de reprise.

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

### Issue #7 — résolue

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

Un test réel de délégation a produit `LINT ISSUE #7 : PASS` et la contre-vérification indépendante a conclu `PAQUET CIBLÉ ET EXÉCUTABLE : oui`. L’Issue #7 est fermée comme résolue.

### Issue #8 — report maintenu

Le finding reste reporté/fermé `not_planned` : l’outillage disponible ne fournit pas encore d’édition ciblée sûre et la création d’une abstraction dédiée serait disproportionnée. Réévaluer si l’outillage change ou avant une modification ciblée importante d’un document volumineux.

### Issue #10 — mécanisme présent, preuve finale à refaire

`PROJECT_STATE.md` contient une section `## Reprise structurée` avec exactement quatre clés d’autorité opérationnelle :

- `stage` ;
- `status` ;
- `git` ;
- `next_action`.

Le lint exige une section unique, des clés uniques, rejette les représentations ambiguës (dont blocs de code et citations) et permet de comparer exactement les valeurs attendues. Les anciens textes ailleurs dans le fichier ne peuvent donc plus satisfaire le contrôle à la place du champ d’autorité.

Les tests indépendants de reprise ont révélé un défaut de conception supplémentaire : inscrire dans `PROJECT_STATE.md` le SHA ou la PR qui effectue sa propre synchronisation rend le fichier mécaniquement périmé juste après le merge. Cette auto-référence volatile est supprimée. Le point de reprise décrit désormais des faits durables (`test-preview` contient Batch 0 ; `main` ne le contient pas encore ; #10 reste à valider) et laisse GitHub fournir les SHA/PR courants.

La condition de résolution #10 reste inchangée : un nouveau contexte doit retrouver directement l’état courant sans réparer une transition périmée.

## Traçabilité légère

Les contrôles mécaniques durables doivent référencer la règle ou le finding qu’ils protègent de manière lisible, sans registre central exhaustif. Les canoniques restent normatifs : un test ou un script vérifie un contrat, il ne le redéfinit pas. Toute contradiction contrôle/canonique ou canonique/canonique doit être rendue explicite et résolue, jamais corrigée automatiquement pour faire passer le contrôle.

## Preuves obtenues

- `test-preview` a été réalignée sur le `main` canonique avant reprise du Batch 0.
- La PR #14 a remplacé la PR #11 historique et a été contre-vérifiée `CONFORME` avant merge vers `test-preview`.
- Le workflow GitHub Actions a démontré le checkout et l’assertion du HEAD exact, la présence des canoniques, l’état structuré et les tests.
- L’Issue #7 a été démontrée par un paquet réel prévalidé puis fermée.
- Les tests Issue #10 ont correctement détecté deux reprises périmées successives ; la cause commune identifiée est l’auto-référence du point de reprise à son propre merge futur. La correction actuelle retire cette dépendance circulaire au lieu de répéter une nouvelle synchronisation auto-référente.
- L’absence de ruleset/protection bloquante reste explicitement une limite : le workflow contrôle automatiquement les PR concernées mais ne constitue pas une impossibilité technique absolue de merge manuel.

## Propriétés à démontrer avant clôture définitive

1. `test-preview` et le HEAD du Batch contiennent `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md` — **démontré**.
2. Le lint #7 rejette les faux positifs ciblés et un paquet réel passe après prévalidation — **démontré**.
3. Le lint #10 rejette doublons, sections concurrentes, historique non autoritaire, blocs de code et citations — **démontré**.
4. Les contrôles n’affirment pas démontrer davantage que ce qu’ils vérifient objectivement — **contre-vérifié conforme**.
5. Le runner automatique est rattaché au HEAD exact de PR et l’assertion de SHA a réussi — **démontré**.
6. **F4.2/F4.3 : Sensible** et **F4.4 : décision technique dans le périmètre approuvé du Batch 0** — **contre-vérifié acceptable**.
7. Issue #7 — **résolue**.
8. Issue #10 — **test indépendant final encore requis sur le point de reprise sans auto-référence volatile**.

## Classification finale proposée

- **F4.2/F4.3 : Sensible**.
- **F4.4 : décision technique dans le périmètre approuvé du Batch 0**, sans modification des contrats produit, données ou architecture.

## Condition de clôture

Batch 0 n’est clôturable définitivement que lorsque le nouveau test indépendant de reprise confirme que l’état courant est retrouvé directement sans réparation, que le point de reprise est cohérent avec GitHub sans dupliquer comme vérité persistante des identifiants volatils, et que la promotion applicable respecte le flux `test-preview` → `main`. Une propriété obligatoire non démontrée reste non validée.
