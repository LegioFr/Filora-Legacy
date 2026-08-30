# BATCH7.md — Automatisation des tests d’interface avec Playwright

**Statut : ouvert**  
**Date de démarrage : 2026-08-30**  
**Réouverture : 2026-08-30 — essai réel de Graphify effectué ; décision RETIRER acquise, clôture finale à revalider**

## Intention

Réduire la part de tests d’interface répétitifs réalisés manuellement en introduisant une automatisation Playwright simple, fiable et proportionnée, sans transformer les viewports simulés en fausse preuve de comportement sur appareils physiques et sans ajouter une infrastructure plus complexe que nécessaire.

Le Batch suit l’ordre décidé : faisabilité locale d’abord, suite E2E stable ensuite, viewports représentatifs, intégration CI après stabilité locale, puis essai réel de Graphify comme aide locale avant la clôture finale.

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

## Preuves Playwright / CI déjà acquises

Sur le SHA `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452`, vérifié comme HEAD exact de la PR #65 avant la première tentative de clôture :

- `e2e` : SUCCESS ;
- `guard` : SUCCESS ;
- `sentinel` : SUCCESS ;
- Playwright : **33 tests, 33 passés** ;
- le test `rollback navigateur restaure IndexedDB et le catalogue après une panne inter-stockages` : PASS ;
- le checkout exact et propre du job Playwright : PASS ;
- architecture, typecheck, build et tests du guard : PASS dans `Filora guard`.

Le candidat documentaire de première clôture `67dcfa3ddb395713131d895f78c6eb825cfb581d` a également obtenu `e2e`, `guard` et `sentinel` verts, avec **33/33 Playwright PASS**. Ces preuves restent valides pour ces SHA précis, mais la réouverture du Batch implique qu’un futur candidat final repasse les contrôles applicables.

## Correction du checkout sale / `gitDirty`

La dernière Preview Vercel vérifiée pendant le Batch correspond à l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` et ses métadonnées portent `gitDirty: 1`.

Les artefacts locaux connus responsables du bruit sont désormais ignorés :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière suffisamment contrôlée pour revendiquer `gitDirty: 0` dans les métadonnées Vercel. Cette absence n’est pas un blocage ; lorsqu’une prochaine Preview sera nécessaire, son SHA et son `gitDirty` devront être vérifiés directement.

## Graphify — essai réel effectué : RETIRER

La décision précédente « aide locale optionnelle » était prématurée. Graphify a donc été réellement installé et essayé sur l’environnement Windows/Codex utilisé pour Filora, puis retiré après l’essai.

Le rapport Codex local — conservé comme **rapport d’agent et non comme preuve mécanique** — indique pour Graphify `0.9.53` :

- génération effective d’un graphe AST Filora en mode `--code-only` ;
- taille observée : **851 nœuds, 1 966 arêtes, 45 communautés** ;
- le build par défaut a demandé une clé LLM à cause des documents détectés ;
- `graphify codex install` a tenté d’écrire dans le dépôt et d’ajouter un hook, comportement incompatible avec le périmètre local demandé ;
- l’intégration utilisateur a nécessité un contournement ;
- le sidecar `.graphify_python` attendu n’a pas été créé correctement ;
- les premières requêtes ont principalement produit du bruit autour des imports et n’ont pas immédiatement reconstruit le chemin métier utile ;
- l’effort d’installation, de dépannage et d’interrogation a dépassé le gain de compréhension démontré.

Le même rapport indique qu’après nettoyage :

- HEAD local et remote étaient tous deux `adb3b82263cc4e575751b0c6731ed94894029eb0` ;
- le worktree suivi par Git était propre ;
- Graphify, sa skill Codex, son cache nommé, `graphify-out/`, le dossier projet `.codex` vide et l’entrée locale `.git/info/exclude` ajoutée pour l’essai ont été supprimés ;
- aucun hook Graphify ne restait ;
- `uv 0.12.7` et son Python géré `3.12.14` ont été conservés comme outils utilisateur génériques ;
- aucun commit, push ou PR n’a été produit par l’essai.

GitHub confirme séparément que la branche distante n’a pas bougé pendant cet essai : son HEAD est resté `adb3b82263cc4e575751b0c6731ed94894029eb0` jusqu’à l’enregistrement documentaire de ce résultat.

**Décision Batch 7 : RETIRER Graphify pour Filora aujourd’hui.**

Cette décision ne signifie pas que Graphify est inutilisable en général. Elle concerne la version `0.9.53` dans cet environnement Windows/Codex/Filora. Un nouvel essai pourra être envisagé dans une version ultérieure si l’intégration devient sensiblement plus simple et si un gain réel de navigation dans le code peut être démontré sans contournements.

Graphify n’est donc pas ajouté au dépôt, à `package.json`, à la CI, aux hooks Git, aux garde-fous ni comme source de vérité ou preuve.

## Revue indépendante

Une contre-revue **Codex normal** a été déclenchée directement sur la PR #65 avec le SHA attendu `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` et la base attendue `cf221569f735e850b7f44bed84bae788612483b9`.

La mission demandait explicitement d’examiner le diff réel, la dépendance et le lockfile, la configuration Playwright, les 33 tests et viewports, le rollback navigateur, le nouveau workflow CI, les permissions/secrets/réseau, l’absence d’affaiblissement des guards, la cohérence de l’état Critique, F4.2/F4.3, F4.4 et les findings reportés.

Codex GitHub a indiqué : `Codex Review: Didn't find any major issues` et a identifié le commit revu comme `f1c5e8af46`.

Cette revue reste une preuve positive du candidat Playwright/CI examiné. **Elle ne clôt plus le Batch courant**, car le Batch a été rouvert pour l’essai Graphify. Une nouvelle revue indépendante du futur candidat final devra être obtenue après l’enregistrement du verdict Graphify.

## Findings / décisions

### Traités

- faisabilité Codex → Playwright ;
- dépendance et lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- quatre viewports représentatifs ;
- intégration CI Playwright minimale ;
- artefacts Python/Vercel responsables du checkout sale exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel par un vrai test Chromium ;
- Graphify `0.9.53` réellement essayé sur l’environnement local : **RETIRER**, car l’effort et les contournements ont dépassé le gain démontré.

### Reportés

Ces points restent hors du périmètre du Batch 7 et ne remettent pas en cause les propriétés déjà démontrées :

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- Graphify comme outil Filora conservé aujourd’hui : rejeté après l’essai réel `0.9.53` ; réévaluation future autorisée si les conditions changent.

## Classification F4.2 / F4.3

**Critique.**

La classification initiale était Sensible en raison de la nouvelle dépendance. Dès l’ajout du workflow `.github/workflows/playwright-e2e.yml`, le guard Filora a objectivement exigé `critical` car tout nouveau chemin sous `.github/workflows/` constitue une surface structurelle de contrôle.

Aucun garde-fou n’a été modifié ou affaibli pour contourner ce résultat ; `workflow/state.json` reste aligné sur `risk: critical`.

## Classification F4.4

**Décision propriétaire acquise pour l’introduction de la CI Playwright.**

Mickaël a autorisé le 2026-08-30 la correction du problème `gitDirty` puis le passage à la CI. L’état machine conserve donc `owner_approval: obtained`.

L’essai Graphify n’a produit aucune dépendance permanente, aucun hook, aucune CI et aucun changement de gouvernance dans Filora.

### Jalon humain requis — NON REQUIS à ce stade

Le Batch 7 porte sur l’outillage et l’automatisation des tests et n’introduit pas de modification produit/UX. Une validation humaine applicative n’est donc pas requise pour les propriétés déjà automatisées. L’essai Graphify était un essai d’outillage local.

## Conditions de clôture

Les travaux fonctionnels et d’outillage prévus sont maintenant traités. Les conditions **restantes** avant clôture finale sont :

1. recontrôler Issues/findings pertinents ;
2. laisser les contrôles applicables vérifier le candidat qui enregistre le verdict Graphify ;
3. obtenir la revue indépendante finale adaptée au risque Critique sur ce candidat ;
4. remettre `BATCH7.md`, `PROJECT_STATE.md` et `workflow/state.json` en état de clôture ;
5. exécuter les contrôles applicables sur le commit de clôture ;
6. seulement ensuite préparer l’intégration de la PR #65 vers `test-preview`.

Le Batch 7 est donc **encore ouvert uniquement pour sa revalidation/clôture finale**.

## Intégration

La PR #65 reste le véhicule d’intégration vers `test-preview`, mais **elle ne doit pas être fusionnée tant que le Batch 7 n’est pas reclôturé et revalidé**.

Aucun Batch 8 ne doit démarrer avant clôture réelle du Batch 7 puis vérification de son intégration réelle dans `test-preview`.