# BATCH7.md — Automatisation des tests d’interface avec Playwright

**Statut : clôturé**  
**Date de démarrage : 2026-08-30**  
**Date de clôture : 2026-08-30**

## Intention

Réduire la part de tests d’interface répétitifs réalisés manuellement en introduisant une automatisation Playwright simple, fiable et proportionnée, sans transformer les viewports simulés en fausse preuve de comportement sur appareils physiques et sans ajouter une infrastructure plus complexe que nécessaire.

Le Batch a suivi l’ordre décidé : faisabilité locale d’abord, suite E2E stable ensuite, viewports représentatifs, puis intégration CI seulement après stabilité locale.

## État de départ vérifié

- Batch 6 clôturé après validation humaine, CI verte et revue indépendante sans finding bloquant ;
- PR #64 réellement fusionnée dans `test-preview` ;
- HEAD de `test-preview` au démarrage : `cf221569f735e850b7f44bed84bae788612483b9` ;
- `workflow/state.json` du Batch 6 : `closed`, risque `sensitive`, revue indépendante `passed`, `next_batch_allowed: true` ;
- aucune Issue ni PR ouverte au contrôle préalable ;
- Filora guard #239 vert sur la clôture du Batch 6.

## Réalisations

### Playwright minimal et reproductible

- `@playwright/test` version exacte `1.62.1` ;
- `package-lock.json` versionné ;
- Chromium uniquement ;
- Firefox et WebKit non ajoutés ;
- configuration Playwright versionnée dans `playwright.config.ts` ;
- `forbidOnly` activé en CI ;
- trace et capture conservées uniquement en cas d’échec ;
- serveur Vite local géré par Playwright pour les tests.

La faisabilité Codex → Playwright a d’abord été démontrée avec un smoke test Stock → Ajouter une bobine → modale → retour Stock avant l’extension de la suite.

### Suite E2E fonctionnelle

La suite couvre les parcours utilisateur actuellement implémentés et rentables à automatiser, notamment :

- navigation Stock / Réglages ;
- statistiques latérales ;
- ouverture/fermeture de la création ;
- sections repliables et persistance de leur état ;
- validations empêchant les écritures invalides ;
- référence filament catalogue et personnalisée ;
- paramètres d’impression ;
- achat, fournisseur et rangement ;
- bobine nominale ;
- bobine mesurée ;
- presets de tare ;
- création en série et atomicité ;
- modification d’une référence simple ou partagée ;
- changement de filament d’une seule bobine ;
- sauvegarde JSON ;
- validation, annulation et restauration d’une sauvegarde ;
- refus d’un JSON invalide ;
- isolation entre contextes de test ;
- rollback réel entre IndexedDB et catalogue personnel.

### Viewports représentatifs

Un sous-ensemble critique vérifie l’utilisabilité des parcours retenus sur quatre tailles simulées :

- mobile `390×844` ;
- tablette `800×1280` ;
- PC `1440×900` ;
- ultra-wide `2560×1080`.

Ces profils restent des simulations Chromium de taille d’écran. Ils ne constituent pas une preuve que le comportement est identique sur des appareils physiques réels.

### Rollback navigateur inter-stockages

Le finding concernant le rollback IndexedDB / catalogue personnel est **traité**.

Le test navigateur :

1. crée un état initial par l’interface avec une bobine et une option personnalisée de catalogue ;
2. crée dans un second contexte Chromium isolé un état cible différent et télécharge sa sauvegarde par l’interface ;
3. importe cette sauvegarde dans le premier contexte ;
4. injecte une panne unique sur `Storage.prototype.setItem` au moment de l’écriture du catalogue personnel ;
5. laisse le mécanisme métier de restauration déclencher son rollback compensatoire ;
6. recharge réellement l’application ;
7. vérifie que l’ancienne bobine est toujours persistée dans IndexedDB et que la bobine cible n’y est pas restée ;
8. rouvre le catalogue et vérifie que l’ancienne option personnalisée est revenue tandis que l’option cible n’a pas fui.

Aucun crochet de test ni changement du code métier n’a été ajouté pour rendre cette injection possible.

### CI Playwright

Le workflow séparé `.github/workflows/playwright-e2e.yml` :

- s’exécute sur les PR vers `test-preview` et `main` ;
- checkout le SHA exact de la PR ;
- exige un checkout Git propre avant test ;
- utilise Node 22 ;
- exécute `npm ci --no-audit --no-fund` ;
- installe Chromium uniquement avec Playwright ;
- exécute la suite complète `npm run test:e2e` ;
- utilise `permissions: contents: read` ;
- n’utilise aucun secret ;
- conserve `test-results/` uniquement en cas d’échec.

Le workflow Critique existant `filora-guard.yml`, son sentinel, `DEVELOPMENT.md`, `workflow/contract.json` et les scripts de garde n’ont pas été modifiés.

## Preuves de pré-clôture

Sur le SHA `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452`, vérifié comme HEAD exact de la PR #65 avant la clôture :

- `e2e` : SUCCESS ;
- `guard` : SUCCESS ;
- `sentinel` : SUCCESS ;
- Playwright : **33 tests, 33 passés** ;
- le test `rollback navigateur restaure IndexedDB et le catalogue après une panne inter-stockages` : PASS ;
- le checkout exact et propre du job Playwright : PASS ;
- architecture, typecheck, build et tests du guard : PASS dans `Filora guard`.

Le commit de clôture qui met à jour ce document, `PROJECT_STATE.md` et `workflow/state.json` doit lui-même repasser les contrôles applicables. Les preuves de `f1c5e8af...` ne sont pas présentées comme une preuve automatique d’un SHA ultérieur.

## Correction du checkout sale / `gitDirty`

La dernière Preview Vercel vérifiée pendant le Batch correspond à l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` et ses métadonnées portent `gitDirty: 1`.

Les artefacts locaux connus responsables du bruit sont désormais ignorés :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière suffisamment contrôlée pour revendiquer `gitDirty: 0` dans les métadonnées Vercel. Cette absence de nouvelle Preview n’est pas un blocage de clôture : le Batch n’introduit aucun changement produit/UX nécessitant un jalon humain ou une Preview applicative. Lorsqu’une prochaine Preview sera nécessaire, son SHA et son `gitDirty` devront être vérifiés directement.

## Décision Graphify

Graphify est **conservé comme aide locale optionnelle**, sans intégration au projet.

- il peut aider à visualiser les dépendances du code pour une analyse transversale future ;
- il n’est ni source de vérité, ni preuve, ni contrôle de conformité ;
- aucune dépendance Graphify n’est ajoutée à `package.json` ;
- aucun workflow CI, hook Git ou serveur MCP Graphify n’est ajouté au dépôt ;
- aucun `graphify-out/`, cache ou rapport n’est versionné ;
- toute conclusion importante doit être revérifiée dans le code et GitHub ;
- aucun gain mesuré sur l’environnement Windows local de Mickaël n’est revendiqué pendant ce Batch.

Cette décision ferme le point d’évaluation sans ajouter d’infrastructure permanente inutile.

## Revue indépendante

Une contre-revue **Codex normal** a été déclenchée directement sur la PR #65 avec le SHA attendu `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` et la base attendue `cf221569f735e850b7f44bed84bae788612483b9`.

La mission demandait explicitement d’examiner le diff réel, la dépendance et le lockfile, la configuration Playwright, les 33 tests et viewports, le rollback navigateur, le nouveau workflow CI, les permissions/secrets/réseau, l’absence d’affaiblissement des guards, la cohérence de l’état Critique, F4.2/F4.3, F4.4 et les findings reportés.

Codex GitHub a indiqué : `Codex Review: Didn't find any major issues` et a identifié le commit revu comme `f1c5e8af46`.

L’intégration GitHub de Codex restitue ce verdict dans son format automatique et n’a pas détaillé champ par champ F4.2/F4.3 ou F4.4 malgré une relance de clarification. Le reviewer a néanmoins été mandaté explicitement sur ces propriétés et n’a remonté aucun finding majeur. Cette limitation de granularité du rendu est conservée comme réserve de forme ; elle ne transforme pas le verdict en une attestation plus précise qu’il ne l’est.

Aucun finding bloquant Codex n’a été produit.

## Findings / décisions

### Traités

- faisabilité Codex → Playwright ;
- dépendance et lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- quatre viewports représentatifs ;
- intégration CI Playwright minimale ;
- artefacts Python/Vercel responsables du checkout sale exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel par un vrai test Chromium ;
- Graphify : décision acquise comme aide locale optionnelle non intégrée.

### Reportés

Ces points restent hors du périmètre du Batch 7 et ne remettent pas en cause les propriétés qu’il devait démontrer :

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- aucun finding.

## Classification F4.2 / F4.3

**Critique.**

La classification initiale était Sensible en raison de la nouvelle dépendance. Dès l’ajout du workflow `.github/workflows/playwright-e2e.yml`, le guard Filora a objectivement exigé `critical` car tout nouveau chemin sous `.github/workflows/` constitue une surface structurelle de contrôle.

Le premier essai CI a donc correctement refusé `risk: sensitive`. Aucun garde-fou n’a été modifié ou affaibli pour contourner ce résultat ; `workflow/state.json` a été aligné sur `risk: critical`.

## Classification F4.4

**Décision propriétaire explicitement acquise.**

Mickaël a autorisé le 2026-08-30 la correction du problème `gitDirty` puis le passage à la CI. Cette décision couvre l’introduction de la CI Playwright minimale décrite ci-dessus. L’état machine enregistre donc `owner_approval: obtained`.

Cet accord ne remplace pas les contrôles techniques ; ceux-ci ont été exécutés séparément.

### Jalon humain requis — NON REQUIS

Le Batch 7 porte sur l’outillage et l’automatisation des tests et n’introduit pas de modification produit/UX. Une validation humaine applicative n’est donc pas requise pour sa clôture. L’accord propriétaire requis par la classification Critique est une décision de gouvernance distincte et est acquis.

## Conditions de clôture

Les conditions définies à l’ouverture sont satisfaites :

1. faisabilité Codex → Playwright documentée : oui ;
2. Playwright minimal et reproductible : oui ;
3. dépendance, lockfile et navigateur examinés : oui ;
4. suite E2E utile et stable : oui ;
5. viewports présentés pour leur portée réelle : oui ;
6. CI Playwright proportionnée et verte sur le candidat pré-clôture : oui ;
7. rollback navigateur décidé et traité : oui ;
8. Graphify décidé : oui ;
9. tests, typecheck, build, architecture et garde-fous verts sur le candidat pré-clôture : oui ;
10. revue indépendante adaptée au risque acquise sans finding bloquant : oui ;
11. accord propriétaire Critique : oui ;
12. Issues/findings du Batch traités, reportés ou rejetés explicitement : oui.

Le Batch 7 est donc **clôturé sur sa branche de travail**, sous réserve normale que le commit de clôture lui-même conserve les checks applicables verts avant intégration.

## Intégration

La PR #65 reste le véhicule d’intégration vers `test-preview`. L’état réel de son intégration doit toujours être lu directement depuis GitHub ; ce document ne doit pas être utilisé pour supposer qu’une fusion a déjà eu lieu.

Aucun Batch 8 ne doit démarrer avant vérification de l’intégration réelle du Batch 7 dans `test-preview`.
