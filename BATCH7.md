# BATCH7.md — Automatisation des tests d’interface avec Playwright

**Statut : clôturé**  
**Date de démarrage : 2026-08-30**  
**Date de clôture : 2026-08-30**  
**Réouverture intermédiaire : 2026-08-30 — essai réel de Graphify effectué avant clôture finale**

## Intention

Réduire la part de tests d’interface répétitifs réalisés manuellement en introduisant une automatisation Playwright simple, fiable et proportionnée, sans transformer les viewports simulés en fausse preuve de comportement sur appareils physiques et sans ajouter une infrastructure plus complexe que nécessaire.

Le Batch a suivi l’ordre décidé : faisabilité locale d’abord, suite E2E stable ensuite, viewports représentatifs, intégration CI après stabilité locale, test navigateur du rollback inter-stockages, puis essai réel de Graphify avant clôture.

## État de départ vérifié

- Batch 6 clôturé après validation humaine, CI verte et revue indépendante sans finding bloquant ;
- PR #64 réellement fusionnée dans `test-preview` ;
- HEAD de `test-preview` au démarrage : `cf221569f735e850b7f44bed84bae788612483b9` ;
- `workflow/state.json` du Batch 6 : `closed`, risque `sensitive`, revue indépendante `passed`, `next_batch_allowed: true` ;
- aucune Issue ni PR ouverte au contrôle préalable ;
- Filora guard #239 vert sur la clôture du Batch 6.

## Réalisations acquises

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

## Preuves Playwright / CI acquises

Sur `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` :

- `e2e` : SUCCESS ;
- `guard` : SUCCESS ;
- `sentinel` : SUCCESS ;
- Playwright : **33 tests, 33 passés** ;
- rollback navigateur : PASS ;
- checkout exact et propre : PASS ;
- architecture, typecheck, build et tests du guard : PASS.

Le premier candidat documentaire de clôture `67dcfa3ddb395713131d895f78c6eb825cfb581d` a également obtenu `e2e`, `guard`, `sentinel` et **33/33 Playwright PASS**.

Après l’essai Graphify, `0dd038681b6f51f9369cebf5624cbfd7e8a1bede` a obtenu `guard`, `sentinel` et la suite Playwright complète en SUCCESS. La revue Codex de ce SHA a remonté un seul P2 documentaire dans `PROJECT_STATE.md`.

Le correctif exact de ce P2, `69798abfaa88dff57cdfb254155cf39876368a2d`, a ensuite obtenu `guard`, `sentinel` et la suite Playwright E2E complète en SUCCESS. Le thread Codex correspondant a été résolu.

Le commit de clôture qui met à jour ce document, `PROJECT_STATE.md` et `workflow/state.json` doit lui-même repasser les contrôles applicables avant toute intégration.

## Correction du checkout sale / `gitDirty`

La dernière Preview Vercel vérifiée pendant le Batch correspond à l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` et ses métadonnées portent `gitDirty: 1`.

Les artefacts locaux connus responsables du bruit sont désormais ignorés :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière suffisamment contrôlée pour revendiquer `gitDirty: 0` dans les métadonnées Vercel. Cette absence n’est pas un blocage ; lorsqu’une prochaine Preview sera nécessaire, son SHA et son `gitDirty` devront être vérifiés directement.

## Graphify — essai réel effectué : RETIRER

Graphify `0.9.53` a été réellement installé et essayé sur l’environnement Windows/Codex utilisé pour Filora, puis retiré après l’essai.

Le rapport Codex local — conservé comme **rapport d’agent et non comme preuve mécanique** — indique :

- génération effective d’un graphe AST Filora en mode `--code-only` ;
- taille observée : **851 nœuds, 1 966 arêtes, 45 communautés** ;
- le build par défaut a demandé une clé LLM à cause des documents détectés ;
- `graphify codex install` a tenté d’écrire dans le dépôt et d’ajouter un hook ;
- l’intégration utilisateur a nécessité un contournement ;
- le sidecar `.graphify_python` attendu n’a pas été créé correctement ;
- les premières requêtes ont principalement produit du bruit autour des imports et n’ont pas immédiatement reconstruit le chemin métier utile ;
- l’effort d’installation, de dépannage et d’interrogation a dépassé le gain de compréhension démontré.

Le même rapport indique qu’après nettoyage :

- le worktree suivi par Git était propre ;
- Graphify, sa skill Codex, son cache nommé, `graphify-out/`, le dossier projet `.codex` vide et l’entrée locale `.git/info/exclude` ajoutée pour l’essai ont été supprimés ;
- aucun hook Graphify ne restait ;
- `uv 0.12.7` et son Python géré `3.12.14` ont été conservés comme outils utilisateur génériques ;
- aucun commit, push ou PR n’a été produit par l’essai.

GitHub a confirmé séparément que la branche distante n’avait pas bougé pendant l’essai local.

**Décision Batch 7 : RETIRER Graphify pour Filora aujourd’hui.**

Cette décision concerne Graphify `0.9.53` dans l’environnement Windows/Codex/Filora testé. Un nouvel essai pourra être envisagé dans une version ultérieure si l’intégration devient sensiblement plus simple et si un gain réel peut être démontré sans contournements.

Graphify n’est ajouté ni au dépôt, ni à `package.json`, ni à la CI, ni aux hooks Git, ni aux garde-fous, et ne constitue ni une source de vérité ni une preuve.

## Revue indépendante

Une première contre-revue **Codex normal** a examiné `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` et n’a trouvé aucun problème majeur.

Après l’essai Graphify, une nouvelle revue Codex a examiné `0dd038681b6f51f9369cebf5624cbfd7e8a1bede`. Elle n’a pas remis en cause les propriétés Playwright/CI et a trouvé un unique finding P2 documentaire : `PROJECT_STATE.md` indiquait encore que Graphify restait à tester.

Ce finding a été corrigé dans `69798abfaa88dff57cdfb254155cf39876368a2d`, dont le diff est limité à l’alignement de `PROJECT_STATE.md`. Les trois contrôles GitHub applicables y sont verts et le thread de review a été résolu.

Une demande supplémentaire de re-review de `69798ab...` a été déclenchée, mais elle n’est pas utilisée comme preuve tant qu’elle n’a pas produit de verdict. Pour éviter une boucle de revue sans réduction de risque, la condition de revue indépendante est considérée satisfaite par la revue Codex de `0dd038...`, son finding explicite, sa correction ciblée et les contrôles verts du correctif.

Aucun finding bloquant indépendant ne reste ouvert.

## Findings / décisions

### Traités

- faisabilité Codex → Playwright ;
- dépendance et lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- quatre viewports représentatifs ;
- intégration CI Playwright minimale ;
- artefacts Python/Vercel responsables du checkout sale exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel par un vrai test Chromium ;
- Graphify `0.9.53` réellement essayé : verdict **RETIRER** ;
- finding P2 Codex sur l’index de reprise Graphify : corrigé et thread résolu.

### Reportés

Ces points restent hors du périmètre du Batch 7 et ne remettent pas en cause les propriétés démontrées :

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- Graphify comme outil Filora permanent dans la version `0.9.53` et l’environnement Windows/Codex testé ; réévaluation future autorisée si les conditions changent.

## Classification F4.2 / F4.3

**Critique.**

La classification initiale était Sensible en raison de la nouvelle dépendance. Dès l’ajout du workflow `.github/workflows/playwright-e2e.yml`, le guard Filora a objectivement exigé `critical` car tout nouveau chemin sous `.github/workflows/` constitue une surface structurelle de contrôle.

Aucun garde-fou n’a été modifié ou affaibli pour contourner ce résultat.

## Classification F4.4

**Décision propriétaire acquise.**

L’autorisation donnée pour la correction du problème `gitDirty` puis le passage à la CI couvre l’introduction de la CI Playwright minimale. L’état machine conserve `owner_approval: obtained`.

L’essai Graphify n’a produit aucune dépendance permanente, aucun hook, aucune CI et aucun changement de gouvernance dans Filora.

### Jalon humain requis — NON REQUIS

Le Batch 7 porte sur l’outillage et l’automatisation des tests et n’introduit pas de modification produit/UX. Une validation humaine applicative n’est donc pas requise pour sa clôture.

## Conditions de clôture

Les conditions du Batch 7 sont satisfaites :

1. faisabilité Codex → Playwright démontrée : oui ;
2. Playwright minimal et reproductible : oui ;
3. suite E2E utile couvrant les fonctions actuellement implémentées : oui ;
4. quatre viewports représentatifs : oui ;
5. CI Playwright minimale et sans secret : oui ;
6. rollback navigateur IndexedDB / catalogue personnel réellement automatisé : oui ;
7. Graphify réellement essayé et décision proportionnée acquise : oui, **RETIRER** ;
8. Issues ouvertes pertinentes : aucune au préflight de clôture ;
9. finding Codex P2 Graphify : corrigé et résolu ;
10. revue indépendante : satisfaite sans finding bloquant restant ;
11. accord propriétaire F4.4 : obtenu ;
12. jalon humain applicatif : non requis.

Le Batch 7 est **clôturé et intégré à `test-preview`**.

## Intégration

La PR #65 a été fusionnée dans `test-preview` le 2026-08-30 après succès des contrôles applicables du commit de clôture.

Le HEAD post-fusion de `test-preview` a été vérifié à `810b4e3cbbac81ce1565a9cb303634d0888ccf69`, commit de merge de la PR #65. Les conditions de transition vers la préparation du Batch 8 ont donc été satisfaites.
