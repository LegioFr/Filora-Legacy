# BATCH7.md — Automatisation des tests d’interface avec Playwright

**Statut : ouvert**  
**Date de démarrage : 2026-08-30**

## Intention

Réduire la part de tests d’interface répétitifs réalisés manuellement en introduisant une automatisation Playwright simple, fiable et proportionnée, sans transformer les viewports simulés en fausse preuve de comportement sur appareils physiques et sans ajouter une infrastructure plus complexe que nécessaire.

Le Batch commence par une preuve de faisabilité minimale Codex → Playwright. La CI n’est envisagée qu’après obtention d’une petite suite E2E réellement stable en local.

## État de départ vérifié

- Batch 6 clôturé après validation humaine, CI verte et revue indépendante sans finding bloquant ;
- PR #64 réellement fusionnée dans `test-preview` ;
- HEAD de `test-preview` vérifié au démarrage : `cf221569f735e850b7f44bed84bae788612483b9`, merge de la PR #64 ;
- `workflow/state.json` du Batch 6 indiquait `closed`, risque `sensitive`, revue indépendante `passed` et `next_batch_allowed: true` ;
- aucune Issue GitHub ouverte au contrôle préalable ;
- aucune PR GitHub ouverte au contrôle préalable ;
- aucun commentaire, review ou thread en attente sur la PR #64 au contrôle préalable ;
- la CI de clôture du Batch 6 (`Filora guard` #239) est vérifiée verte sur son commit de clôture ;
- aucun Playwright n’est actuellement déclaré dans `package.json`.

## Périmètre décidé

### À traiter

1. **Faisabilité Codex → Playwright en premier**
   - installer Playwright de manière minimale ;
   - commencer avec Chromium uniquement ;
   - vérifier que l’environnement Windows actuel permet réellement à Codex de lancer Filora et d’exécuter un scénario simple ;
   - scénario initial : `Stock → Ajouter une bobine → vérifier l’ouverture de la modale → fermer → vérifier le retour au Stock` ;
   - si le pilotage Codex → Playwright n’est pas fiable ou disponible, ne pas bloquer le Batch : conserver des tests Playwright classiques exécutables localement.

2. **Contrôle reproductible de la dépendance**
   - version Playwright explicitement enregistrée ;
   - `package-lock.json` versionné avec la dépendance ;
   - examiner le diff du lockfile et les dépendances réellement introduites ;
   - identifier les navigateurs/binaires réellement installés ;
   - vérifier les scripts d’installation/exécution introduits par la chaîne de dépendances ;
   - ne pas télécharger plusieurs moteurs navigateur sans besoin démontré.

3. **Petite suite E2E locale utile, seulement après réussite du smoke test**
   - navigation Stock / Réglages ;
   - actions et boutons principaux ;
   - ouverture/fermeture des modales ;
   - sections ouvertes/repliées ;
   - validations et messages d’erreur importants ;
   - création d’une bobine sur un scénario représentatif ;
   - résultat visible et persistance après rechargement ;
   - contrôles de débordement/accessibilité des actions et de la grille de stock lorsque cela apporte une preuve utile.

4. **Viewports simulés**
   - mobile ;
   - tablette ;
   - PC classique ;
   - ultra-wide / grand écran.

Ces profils restent des tailles de viewport simulées. Ils ne remplacent pas une validation sur appareils physiques lorsqu’une propriété dépend réellement du matériel, du navigateur ou du confort d’utilisation réel.

5. **CI Playwright, dans un second temps seulement**
   - ne pas intégrer Playwright à la CI après le seul smoke test ;
   - attendre qu’une petite suite locale soit stable ;
   - au moment de modifier réellement le workflow CI, vérifier explicitement les permissions GitHub Actions, l’accès aux secrets et les accès réseau nécessaires ;
   - ne pas augmenter ces permissions ou accès sans besoin concret ;
   - garder l’installation navigateur minimale, Chromium seulement tant qu’aucun autre moteur n’est nécessaire.

6. **Rollback navigateur IndexedDB / catalogue personnel, si simple et utile**
   - évaluer un vrai test navigateur de panne entre restauration IndexedDB et restauration du catalogue personnel ;
   - l’ajouter uniquement si l’injection de panne et la vérification du rollback restent propres, compréhensibles et proportionnées ;
   - ne pas modifier artificiellement le code de production uniquement pour faire passer ce test ;
   - sinon conserver ce point comme finding reporté.

### À évaluer séparément

**Graphify** peut être testé comme aide locale à la compréhension du dépôt et à l’analyse d’impact pour les IA.

Conditions :

- ne jamais le considérer comme source de vérité ;
- ne jamais utiliser son résultat comme preuve de conformité ;
- vérifier les conclusions importantes dans le code et GitHub ;
- ne le conserver que si le gain pratique est réel ;
- ne pas laisser son évaluation ralentir l’adoption initiale de Playwright.

## Findings / décisions à l’ouverture

### Traités ou intégrés au Batch 7

- automatisation Playwright des parcours d’interface répétitifs ;
- faisabilité Codex → Playwright avant complexification ;
- viewports mobile, tablette, PC et ultra-wide simulés ;
- contrôle reproductible de la nouvelle dépendance et du lockfile ;
- éventuelle preuve navigateur du rollback inter-stockages si elle reste simple et utile.

### Reportés

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur du téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication actuelle des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- aucun finding à l’ouverture du Batch 7.

## Routage des revues

Le niveau de revue par défaut reste **Codex normal**.

L’introduction de Playwright et l’évolution éventuelle de la CI sont des changements sensibles, mais Codex Security n’est pas demandé par simple précaution générale.

Avant décision de clôture, les nouvelles dépendances, le lockfile, les scripts d’installation, les binaires navigateurs et, si elle est ajoutée, la modification de CI doivent être examinés. Codex Security n’est utilisé que si une propriété de sécurité précise est identifiée et si Codex normal est insuffisant pour l’évaluer conformément à `DEVELOPMENT.md`.

## Hors périmètre

- nouvelles fonctionnalités métier de stock ;
- consommations et mouvements ;
- pesées successives et recalages ;
- inventaire ;
- refonte visuelle de Filora ;
- cloud ou synchronisation ;
- comptes utilisateurs ;
- nettoyage des références inutilisées ;
- refactoring opportuniste des dettes techniques reportées ;
- promotion vers `main`.

## Classification

**Sensible.**

Justification : le Batch introduira au minimum une nouvelle dépendance de développement liée aux tests. S’il atteint l’étape CI, il modifiera également un mécanisme de contrôle. `package.json`, `package-lock.json` et les mécanismes CI sont explicitement couverts par les règles de sensibilité de Filora.

Aucun critère Critique n’est prévu à l’ouverture : le Batch ne doit ni affaiblir un garde-fou, ni modifier l’autorité métier, ni contourner des permissions, ni introduire une migration destructive.

Classification F4.4 : le périmètre ci-dessus a été présenté à Mickaël et explicitement autorisé avant le démarrage. Les détails techniques réversibles d’implémentation restent du ressort technique tant qu’ils ne changent pas ce périmètre ou une décision produit.

### Jalon humain requis — NON REQUIS

Le Batch 7 porte sur l’outillage et l’automatisation de tests, sans changement produit ou UX prévu dans son périmètre. Une validation humaine applicative n’est donc pas exigée pour sa clôture. Cela ne supprime pas les contrôles humains futurs sur appareils physiques lorsqu’un Batch fonctionnel modifie réellement le rendu ou le comportement observable.

## Conditions de clôture

Le Batch 7 ne pourra être déclaré clôturé que si :

1. le résultat réel de la faisabilité Codex → Playwright est documenté sans transformer un échec ou une indisponibilité en réussite ;
2. Playwright est installé de façon minimale et reproductible si l’essai est conservé ;
3. la dépendance et le lockfile sont examinés avec un résultat explicite ;
4. une petite suite E2E locale utile et stable existe, ou l’abandon de Playwright est explicitement justifié si la faisabilité échoue ;
5. les viewports simulés sont présentés pour ce qu’ils prouvent réellement ;
6. toute intégration CI éventuelle n’est réalisée qu’après stabilité locale et avec permissions/accès vérifiés ;
7. le finding rollback navigateur reçoit une décision explicite : traité ou maintenu reporté ;
8. Graphify reçoit une décision explicite : conservé comme aide locale ou abandonné ;
9. tests automatisés applicables, typecheck, build, architecture et garde-fous sont verts sur le candidat final ;
10. une revue indépendante adaptée au risque est acquise sans finding bloquant non décidé ;
11. les Issues/findings apparus pendant le Batch sont tous traités, reportés, acceptés ou rejetés explicitement avant clôture.
