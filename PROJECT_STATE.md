# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 7 — automatisation Playwright + essai local Graphify
- status: ouvert
- git: PR #65 ouverte vers `test-preview`, branche `batch7/playwright-automation`; vérifier son HEAD, les checks, Issues/reviews et l’état machine directement dans GitHub avant toute action
- next_action: installer/configurer Graphify localement via Codex, réaliser un petit essai réel sur Filora sans l’intégrer arbitrairement au dépôt, vérifier le graphe contre le code, puis décider conserver/retirer avant nouveau candidat de clôture

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé et intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé et intégré à `test-preview` par la PR #64.
- **Batch 7 :** **rouvert** après une première clôture prématurée : Playwright, CI et rollback navigateur sont acquis, mais Graphify doit encore être installé/configuré et essayé réellement sur l’environnement local Filora avant décision finale.
- **Risque Batch 7 :** Critique, car l’ajout d’un workflow sous `.github/workflows/` est une surface structurelle de contrôle selon le guard Filora.
- **Accord propriétaire F4.4 :** obtenu pour la correction du checkout sale et l’introduction de la CI Playwright minimale.
- **Revue indépendante :** une revue Codex GitHub positive existe sur le candidat Playwright/CI `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452`, mais le Batch rouvert exige une nouvelle revue du futur candidat final ; état courant `pending`.
- **Jalon humain applicatif :** non requis pour ce Batch d’outillage tant qu’aucun changement produit/UX n’est introduit.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail Batch 7 :** `batch7/playwright-automation`.

`workflow/state.json` doit porter pendant la réouverture : `current_batch: 7`, `batch_status: open`, `risk: critical`, `independent_review: pending`, `owner_approval: obtained`, `next_batch_allowed: false`.

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

Le premier candidat documentaire de clôture `67dcfa3ddb395713131d895f78c6eb825cfb581d` a également passé `e2e`, `guard`, `sentinel` et **33/33 Playwright**. Ces preuves restent rattachées à leurs SHA ; le futur candidat final après Graphify devra repasser les contrôles applicables.

## Revue indépendante Batch 7

Une contre-revue Codex normale a examiné le candidat `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` avec la base attendue `cf221569f735e850b7f44bed84bae788612483b9` et une mission couvrant le diff, Playwright/lockfile, les 33 tests, le rollback, la CI, permissions/secrets/réseau, guards, F4.2/F4.3, F4.4 et findings.

Codex GitHub a répondu `Codex Review: Didn't find any major issues` et identifié le commit revu comme `f1c5e8af46`.

Cette revue ne vaut pas revue finale du Batch rouvert. `independent_review` repasse à `pending` et une nouvelle revue devra viser le futur SHA final.

## Correction du checkout sale / `gitDirty`

La Preview Vercel vérifiée pour l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` était `READY` mais portait `gitDirty: 1`.

Les artefacts locaux connus sont désormais exclus de Git :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière contrôlée ; `gitDirty: 0` dans Vercel n’est donc pas revendiqué.

## Graphify — point ouvert du Batch 7

Graphify avait été évalué conceptuellement mais **pas réellement configuré ni essayé**. La décision précédente de le considérer comme aide locale optionnelle est donc retirée comme conclusion finale et devient une hypothèse à tester.

Prochaine mission locale :

- installer/configurer Graphify sur le PC de développement via Codex ;
- ne pas l’ajouter à `package.json`, à la CI, aux hooks Git ou aux garde-fous sans besoin concret et nouvelle décision ;
- ne pas versionner de cache, graphe ou rapport généré par défaut ;
- l’utiliser sur un petit cas transversal réel de Filora ;
- vérifier les relations proposées directement dans le code ;
- noter les omissions/faux liens éventuels et le gain pratique de compréhension ;
- décider ensuite **conserver comme aide locale** ou **retirer**.

Graphify ne sera jamais source de vérité ni preuve : GitHub, le code, les tests et les preuves rattachées à un SHA restent autoritaires.

## Findings / décisions Batch 7

### Traités

- faisabilité Codex → Playwright ;
- dépendance et lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- viewports mobile/tablette/PC/ultra-wide ;
- CI Playwright minimale ;
- artefacts locaux Python/Vercel exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel par un vrai test Chromium.

### À traiter avant clôture

- Graphify : configuration/installation locale + essai réel + décision finale conserver/retirer.

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

- aucun finding.

## Classification courante

### F4.2 / F4.3

**Critique.** Le nouveau workflow `.github/workflows/playwright-e2e.yml` constitue objectivement une surface structurelle de contrôle. Le guard Filora a rejeté la classification initiale Sensible et l’état a été remonté à `critical` sans affaiblissement du guard.

### F4.4

**Accord propriétaire obtenu pour la CI Playwright minimale.** Cet accord ne vaut pas autorisation implicite d’ajouter Graphify comme dépendance permanente, service externe, workflow ou hook.

### Jalon humain applicatif

**NON REQUIS à ce stade.** Aucun changement produit/UX n’est introduit par l’essai d’outillage local.

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

1. configurer et essayer réellement Graphify ;
2. décider conserver/retirer selon le résultat ;
3. recontrôler Issues/findings pertinents ;
4. produire un nouveau candidat de clôture cohérent ;
5. obtenir les checks applicables verts ;
6. obtenir la revue indépendante finale du SHA exact ;
7. seulement ensuite intégrer la PR #65 à `test-preview` ;
8. vérifier le HEAD de `test-preview` et la présence réelle du merge avant tout Batch 8.

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
