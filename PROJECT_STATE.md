# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 7 — automatisation Playwright, essai Graphify terminé
- status: ouvert
- git: PR #65 ouverte vers `test-preview`, branche `batch7/playwright-automation`; vérifier son HEAD, les checks, Issues/reviews et l’état machine directement dans GitHub avant toute action
- next_action: recontrôler le candidat courant après correction du finding documentaire Codex, puis préparer la clôture finale cohérente du Batch 7 et obtenir les contrôles/revue indépendante du SHA final avant intégration

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé et intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé et intégré à `test-preview` par la PR #64.
- **Batch 7 :** **ouvert**, avec Playwright, CI et rollback navigateur acquis. L’essai local Graphify 0.9.53 a été réalisé puis arrêté : le verdict proportionné est **RETIRER pour Filora aujourd’hui**, sans intégration au dépôt.
- **Risque Batch 7 :** Critique, car l’ajout d’un workflow sous `.github/workflows/` est une surface structurelle de contrôle selon le guard Filora.
- **Accord propriétaire F4.4 :** obtenu pour la correction du checkout sale et l’introduction de la CI Playwright minimale.
- **Revue indépendante :** la revue Codex GitHub du candidat `0dd038681b6f51f9369cebf5624cbfd7e8a1bede` a trouvé un unique finding P2 documentaire dans ce fichier : il indiquait à tort que Graphify restait à tester. Ce finding est corrigé par le commit courant ; `independent_review` reste `pending` jusqu’à la revue du futur candidat final.
- **Jalon humain applicatif :** non requis pour ce Batch d’outillage tant qu’aucun changement produit/UX n’est introduit.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail Batch 7 :** `batch7/playwright-automation`.

`workflow/state.json` doit porter pendant cette phase : `current_batch: 7`, `batch_status: open`, `risk: critical`, `independent_review: pending`, `owner_approval: obtained`, `next_batch_allowed: false`.

Aucun Batch 8 ne doit être préparé ou démarré tant que le Batch 7 n’est pas reclôturé puis réellement intégré à `test-preview`.

## Base fonctionnelle acquise avant Batch 7

Le domaine `spools` sait notamment :

- créer une bobine avec identité stable ;
- créer plusieurs bobines physiques distinctes reliées à une même référence filament ;
- séparer référence filament commune et bobine physique ;
- persister un poids brut réellement mesuré ;
- persister une tare et son origine ;
- calculer le filament disponible à partir des faits applicables ;
- distinguer stock nominal / non vérifié et stock mesuré ;
- refuser une tare supérieure au poids brut ;
- protéger les nouvelles identités contre les doublons insensibles à la casse tout en préservant les IDs historiques sensibles à la casse ;
- relire et afficher l’ensemble du stock local ;
- corriger une référence partagée avec avertissement sur les bobines affectées ;
- réaffecter une seule bobine vers un autre produit sans modifier les autres ;
- sauvegarder et restaurer références filament, emplacements, bobines, catalogue personnel et relations dans le backup v2 ;
- importer encore un backup Batch 5 v1 sans invention de données ;
- restaurer par remplacement cohérent avec rollback compensatoire entre les stockages techniques ;
- démontrer réellement le recovery sur navigateur/appareil.

La persistance métier actuelle utilise IndexedDB direct sans Dexie, conformément à la décision acceptée tant qu’aucun besoin concret ne justifie cette dépendance.

## Batch 7 — acquis Playwright

Playwright `1.62.1` est versionné avec Chromium uniquement. Firefox et WebKit n’ont pas été ajoutés.

La suite E2E comprend :

- 28 tests fonctionnels couvrant les parcours utilisateur déjà implémentés : navigation, création de bobines, références nouvelles/existantes, paramètres d’impression, achat/rangement, stock nominal/mesuré, création en série, modification de référence, changement de filament, sauvegarde/restauration et isolation ;
- 1 test navigateur de rollback inter-stockages IndexedDB / catalogue personnel ;
- 4 tests de viewports représentatifs : mobile `390×844`, tablette `800×1280`, PC `1440×900`, ultra-wide `2560×1080` ;
- soit **33 tests Playwright au total**.

Le test de rollback navigateur fabrique les états par l’interface dans deux contextes Chromium isolés, injecte une panne unique sur l’écriture du catalogue local après le remplacement IndexedDB, puis recharge l’application. Il vérifie que l’ancienne bobine est réellement restaurée, que la bobine cible n’est pas restée dans IndexedDB, que l’ancien choix personnalisé du catalogue est revenu et que le choix cible n’a pas fui. Aucun crochet de test n’a été ajouté au code produit.

La démonstration visible des quatre viewports a été réalisée. Ces tailles restent des simulations Chromium et ne constituent pas une preuve matérielle sur appareil physique.

## CI Playwright

Le workflow séparé `.github/workflows/playwright-e2e.yml` :

- se déclenche sur les PR vers `test-preview` et `main` ;
- checkout le SHA exact de la PR et exige un checkout propre ;
- utilise Node 22 ;
- exécute `npm ci --no-audit --no-fund` ;
- installe Chromium uniquement ;
- exécute la suite complète `npm run test:e2e` ;
- utilise seulement `permissions: contents: read` ;
- n’utilise aucun secret ;
- conserve les preuves Playwright uniquement en cas d’échec.

`playwright.config.ts` interdit `test.only` en CI avec `forbidOnly` et conserve trace/capture uniquement en cas d’échec.

Le workflow `filora-guard.yml`, son sentinel, `DEVELOPMENT.md`, `workflow/contract.json` et les scripts de garde n’ont pas été modifiés par le Batch 7.

### Preuves déjà acquises

Sur `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` : `e2e`, `guard` et `sentinel` SUCCESS, Playwright **33/33 PASS**, rollback navigateur PASS, checkout exact/propre PASS, architecture/typecheck/build/tests du guard PASS.

Le premier candidat documentaire de clôture `67dcfa3ddb395713131d895f78c6eb825cfb581d` a également passé `e2e`, `guard`, `sentinel` et **33/33 Playwright**.

Après l’essai Graphify, le candidat `0dd038681b6f51f9369cebf5624cbfd7e8a1bede` a lui aussi obtenu `guard`, `sentinel` et la suite Playwright complète en SUCCESS. La revue Codex de ce SHA a remonté uniquement l’incohérence documentaire de `PROJECT_STATE.md` corrigée ici.

Ces preuves restent rattachées à leurs SHA ; le futur candidat final devra repasser les contrôles applicables.

## Revue indépendante Batch 7

Une première contre-revue Codex normale a examiné le candidat `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` avec la base attendue `cf221569f735e850b7f44bed84bae788612483b9` et une mission couvrant le diff, Playwright/lockfile, les 33 tests, le rollback, la CI, permissions/secrets/réseau, guards, F4.2/F4.3, F4.4 et findings. Codex GitHub a répondu `Codex Review: Didn't find any major issues` et identifié le commit revu comme `f1c5e8af46`.

Après l’essai Graphify, une nouvelle revue Codex a examiné `0dd038681b6f51f9369cebf5624cbfd7e8a1bede`. Elle n’a pas remis en cause les propriétés Playwright/CI, mais a identifié un finding P2 documentaire : cet index de reprise indiquait encore que Graphify restait à installer/tester alors que `BATCH7.md` enregistrait déjà l’essai et le verdict RETIRER.

Ce finding est corrigé dans le commit courant. La revue de `0dd038...` ne vaut pas revue du futur SHA final ; `independent_review` reste donc `pending` jusqu’à la contre-revue finale.

## Correction du checkout sale / `gitDirty`

La Preview Vercel vérifiée pour l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` était `READY` mais portait `gitDirty: 1`.

Les artefacts locaux connus sont désormais exclus de Git :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière contrôlée ; `gitDirty: 0` dans Vercel n’est donc pas revendiqué.

## Graphify — essai terminé, verdict RETIRER

Graphify 0.9.53 a été réellement installé et essayé localement avec Codex sur l’environnement Windows de développement, puis retiré à l’issue de l’essai.

Le rapport Codex local — **déclaration d’agent, pas preuve GitHub** — indique notamment :

- graphe AST généré en mode `--code-only` : 851 nœuds, 1 966 arêtes, 45 communautés ;
- build par défaut bloqué par une demande de clé LLM à cause des documents détectés ;
- `graphify codex install` a tenté d’écrire dans le dépôt et d’installer un hook, ce qui a nécessité une annulation/alternative ;
- l’intégration utilisateur et le sidecar `.graphify_python` ont nécessité des contournements ;
- les premières requêtes ont surtout produit du bruit autour des imports et n’ont pas reconstitué immédiatement le chemin métier recherché ;
- selon le rapport local, le dépôt suivi est resté propre après nettoyage et les éléments Graphify ont été désinstallés/supprimés ; `uv` et son Python géré ont été conservés.

Décision Batch 7 : **RETIRER Graphify pour Filora aujourd’hui**. L’effort de configuration et de dépannage observé est supérieur au gain de compréhension démontré dans cet environnement. Aucun package Graphify, hook, workflow, MCP, cache, graphe ou rapport n’est intégré/versionné dans Filora.

Graphify pourra être réévalué dans une version ultérieure si l’intégration Windows/Codex devient plus simple et si un gain concret peut être démontré sans contournements. Il ne sera dans tous les cas ni source de vérité ni preuve : GitHub, le code, les tests et les preuves rattachées à un SHA restent autoritaires.

## Findings / décisions Batch 7

### Traités

- faisabilité Codex → Playwright ;
- dépendance et lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- viewports mobile/tablette/PC/ultra-wide ;
- CI Playwright minimale ;
- artefacts locaux Python/Vercel exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel par un vrai test Chromium ;
- Graphify 0.9.53 : essai local réalisé, utilité insuffisante dans l’environnement Windows/Codex actuel, verdict **RETIRER** ;
- finding P2 Codex sur l’index de reprise Graphify : corrigé dans le commit courant.

### Reportés

- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

Ces éléments restent hors périmètre du Batch 7 tant qu’aucune décision explicite ne les réintègre.

### Rejetés

- Graphify comme outil local permanent dans sa version 0.9.53 et dans l’environnement Windows/Codex testé ;
- aucun autre finding rejeté.

## Classification courante

### F4.2 / F4.3

**Critique.** Le nouveau workflow `.github/workflows/playwright-e2e.yml` constitue objectivement une surface structurelle de contrôle. Le guard Filora a rejeté la classification initiale Sensible et l’état a été remonté à `critical` sans affaiblissement du guard.

### F4.4

**Accord propriétaire obtenu pour la CI Playwright minimale.** Aucun accord supplémentaire n’est requis pour conserver Graphify puisque la décision finale est précisément de ne pas l’intégrer au projet.

### Jalon humain applicatif

**NON REQUIS.** Aucun changement produit/UX n’est introduit par l’essai d’outillage local.

## Garde-fou permanent — tests d’interface interactifs

Cette règle s’applique aux futurs Batches et aux sessions locales/manuelles de tests d’interface. Elle ne bloque pas les exécutions automatiques de CI.

Avant une nouvelle session locale/manuelle, demander explicitement à Mickaël :

- **VISIBLE** : navigateur visible, maximisé lorsque possible, ralentissement léger seulement pour les scénarios réellement observés ;
- **ARRIÈRE-PLAN** : exécution headless rapide.

Le choix est redemandé pour chaque nouvelle session pertinente.

Au même moment, fournir une **Preview HTTPS vérifiée** correspondant à l’état réellement testé lorsqu’elle existe. Ne jamais inventer une URL ni présenter localhost/une IP LAN comme Preview HTTPS. Si aucune Preview vérifiable n’existe, le dire explicitement ; une adresse locale peut seulement être proposée séparément comme solution de repli.

### Simplicité sans perte d’efficacité

Lorsque les tests et le runtime existent déjà :

- réutiliser le chemin Playwright connu au lieu de refaire une cartographie du dépôt ou plusieurs contournements techniques ;
- ne pas créer de wrapper/configuration temporaire ou contrôle Windows supplémentaire si la commande connue fonctionne ;
- la maximisation de fenêtre est un confort, pas une propriété technique exigeant une preuve séparée ;
- ne ralentir que la démonstration visible, jamais les contrôles headless/typecheck/build/architecture ;
- ne pas recréer une Preview si une Preview du bon SHA existe déjà et reste accessible.

La simplification ne doit **jamais** réduire l’efficacité des tests :

- exécuter la suite automatisée applicable complète en arrière-plan ;
- une démonstration VISIBLE est complémentaire et ne remplace jamais la suite complète ;
- ne jamais supprimer, ignorer, contourner ou affaiblir un test pour gagner du temps ;
- comprendre tout échec avant de poursuivre ;
- étendre la suite lorsque de nouveaux comportements deviennent automatisables de manière proportionnée ;
- ne pas transférer à Mickaël la détection manuelle de régressions que Playwright peut raisonnablement vérifier.

Objectif : **réduire le temps perdu autour des tests, jamais leur qualité, afin que Mickaël n’ait normalement pas besoin de repasser derrière les contrôles automatiques.**

## Conditions de transition

Le Batch 7 est **ouvert**. Son état machine doit rester `open / critical / independent_review: pending / owner_approval: obtained / next_batch_allowed: false`.

Avant clôture puis intégration :

1. recontrôler Issues/findings pertinents après la correction documentaire Graphify ;
2. produire un candidat de clôture cohérent pour `BATCH7.md`, `PROJECT_STATE.md` et `workflow/state.json` ;
3. obtenir les checks applicables verts sur le SHA final ;
4. obtenir la revue indépendante finale du SHA exact ;
5. seulement ensuite intégrer la PR #65 à `test-preview` ;
6. vérifier le HEAD de `test-preview` et la présence réelle du merge avant tout Batch 8.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Les fichiers `BATCH<n>.md` documentent un Batch mais ne remplacent pas les contrats canoniques.

## Règles opérationnelles

- GitHub est la source de vérité pour branches, commits, PR, checks, Issues et preuves GitHub.
- Une déclaration d’agent n’est pas une preuve mécanique.
- Avant une intégration ou un nouveau Batch, effectuer le préflight applicable.
- Ne pas modifier un garde-fou pour faire passer un changement qu’il refuse.
- Réserver les revues renforcées aux propriétés qui les justifient réellement.
- Éviter les boucles de revue et la gouvernance sans réduction de risque réelle.
- Ne pas traiter opportunément un finding reporté sans décision de périmètre.