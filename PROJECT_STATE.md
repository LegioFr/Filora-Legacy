# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 7 — automatisation des tests d’interface avec Playwright
- status: ouvert
- git: lire le HEAD de `batch7/playwright-automation`, la PR #65 vers `test-preview`, les workflows, Issues, PR et findings directement depuis GitHub avant toute décision de validation ou d’intégration
- next_action: Playwright, sa CI et le rollback navigateur inter-stockages sont en place ; Graphify a reçu sa décision explicite ; effectuer maintenant le préflight final puis la revue indépendante requise par le risque Critique avant toute clôture ou fusion

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé et intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé et intégré à `test-preview` par la PR #64.
- **Batch 7 :** ouvert sur `batch7/playwright-automation` ; PR #65 ouverte en brouillon vers `test-preview` uniquement comme support de validation, pas encore prête à fusionner.
- **Risque Batch 7 :** `critical`, car l’ajout d’un workflow sous `.github/workflows/` est une surface structurelle de contrôle selon le guard Filora.
- **Accord propriétaire :** `obtained` ; Mickaël a explicitement autorisé le 2026-08-30 la correction du checkout sale puis le passage à la CI Playwright.
- **Revue indépendante :** `pending`.
- **Jalon humain applicatif :** non requis pour ce Batch d’outillage.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail :** `batch7/playwright-automation`.

`workflow/state.json` porte actuellement : `current_batch: 7`, `batch_status: open`, `risk: critical`, `independent_review: pending`, `owner_approval: obtained`, `next_batch_allowed: false`.

## Playwright — état acquis

Playwright `1.62.1` est versionné avec Chromium uniquement. Firefox et WebKit n’ont pas été ajoutés.

La suite E2E comprend actuellement :

- 28 tests fonctionnels initiaux couvrant les parcours utilisateur déjà implémentés : navigation, création de bobines, références nouvelles/existantes, paramètres d’impression, achat/rangement, stock nominal/mesuré, création en série, modification de référence, changement de filament, sauvegarde/restauration et isolation ;
- 1 test navigateur supplémentaire de rollback inter-stockages IndexedDB / catalogue personnel ;
- 4 tests de viewports représentatifs : mobile `390×844`, tablette `800×1280`, PC `1440×900`, ultra-wide `2560×1080` ;
- soit **33 tests Playwright au total**.

Le test de rollback navigateur fabrique les états par l’interface dans deux contextes Chromium isolés, injecte une panne unique sur l’écriture du catalogue local après le remplacement IndexedDB, puis recharge l’application. Il vérifie alors que l’ancienne bobine est toujours réellement persistée, que la bobine cible n’a pas été laissée dans IndexedDB, que l’ancien choix personnalisé du catalogue est revenu et que le choix cible n’a pas fui. Aucun crochet de test n’a été ajouté au code produit.

La démonstration visible des quatre viewports a été réalisée. Ces tailles restent des simulations Chromium et ne constituent pas une preuve matérielle sur appareil physique.

Le workflow séparé `.github/workflows/playwright-e2e.yml` :

- se déclenche sur les PR vers `test-preview` et `main` ;
- checkout le SHA exact de la PR et exige un checkout propre ;
- utilise Node 22 ;
- exécute `npm ci --no-audit --no-fund` ;
- installe Chromium uniquement avec Playwright ;
- exécute la suite complète `npm run test:e2e` ;
- utilise seulement `permissions: contents: read` ;
- n’utilise aucun secret ;
- conserve les traces/captures d’échec uniquement lorsque nécessaire.

`playwright.config.ts` interdit `test.only` en CI avec `forbidOnly`, et conserve trace/capture uniquement en cas d’échec.

### Preuves CI acquises

Sur le candidat `f7dd2775454ede1f4fe5161e901022f0a2f66937` :

- **Filora guard #245 : SUCCESS** ;
- **Playwright E2E : 33/33 PASS** sur la suite complète ;
- le test `rollback navigateur restaure IndexedDB et le catalogue après une panne inter-stockages` : PASS ;
- checkout exact et propre : SUCCESS ;
- installation des dépendances : SUCCESS ;
- installation Chromium uniquement : SUCCESS ;
- typecheck, build, architecture et tests du guard : SUCCESS dans le guard ;
- sentinel applicable : non modifié.

Le premier essai CI a correctement révélé que `risk: sensitive` sous-classait le diff objectif : tout nouveau workflow GitHub Actions exige `critical`. Le guard n’a pas été modifié ni affaibli ; l’état a été corrigé en `critical` avec `owner_approval: obtained`.

Les mises à jour documentaires postérieures à `f7dd277...` doivent naturellement repasser les checks sur leur HEAD final avant clôture ; les preuves ci-dessus ne doivent pas être transplantées automatiquement sur un SHA ultérieur.

## Correction du checkout sale / `gitDirty`

La Preview Vercel existante du SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` est vérifiée `READY` mais ses métadonnées portent `gitDirty: 1`.

Les artefacts locaux connus responsables de ce bruit sont désormais exclus de Git avec :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

Le workflow Playwright CI prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. En revanche, aucune nouvelle Preview Vercel du checkout corrigé n’a encore été créée de manière vérifiable ; `gitDirty: 0` dans les métadonnées Vercel n’est donc pas revendiqué comme preuve acquise. Lorsqu’une prochaine Preview sera réellement nécessaire, sa correspondance au SHA et son `gitDirty` devront être vérifiés directement.

## Graphify — décision Batch 7

Graphify est **conservé comme aide locale optionnelle uniquement**, sans intégration au dépôt.

Le choix est volontairement minimal :

- son graphe de code peut aider une IA à comprendre des dépendances transversales lorsque Filora grandira ;
- il ne devient ni source de vérité, ni preuve, ni contrôle de conformité ;
- aucune dépendance Graphify n’est ajoutée au projet ;
- aucun workflow CI, hook Git, serveur MCP ou fichier `graphify-out/` n’est ajouté/versionné ;
- toute conclusion importante doit rester vérifiée dans le code et GitHub ;
- aucun gain mesuré sur l’environnement Windows local de Mickaël n’est prétendu à ce stade.

Graphify peut donc être utilisé ponctuellement plus tard si son gain pratique devient réel, sans créer d’obligation permanente dans Filora.

## Findings / décisions Batch 7

### Traités

- faisabilité Codex → Playwright ;
- dépendance/lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- viewports mobile/tablette/PC/ultra-wide ;
- CI Playwright minimale ;
- artefacts locaux Python/Vercel exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel : traité par un vrai test Chromium de panne inter-stockages, CI verte ;
- Graphify : décision acquise, conservé uniquement comme aide locale optionnelle non intégrée au dépôt.

### Reportés

- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- aucun finding à ce stade.

## Routage des revues Batch 7

Le Batch est **Critique** à cause de l’ajout du workflow CI, pas parce qu’un garde-fou existant a été affaibli.

Le routage par défaut reste **Codex normal**. Avant clôture, la revue indépendante doit examiner notamment :

- dépendance et lockfile Playwright ;
- installation Chromium ;
- workflow CI ajouté ;
- permissions GitHub Actions ;
- absence de secrets ;
- accès réseau réellement nécessaires ;
- pertinence et couverture des 33 tests ;
- injection de panne du test rollback et validité de la preuve obtenue ;
- adéquation des preuves CI avec le SHA candidat.

Codex Security n’est utilisé que si une propriété de sécurité précise apparaît et que Codex normal est insuffisant conformément à `DEVELOPMENT.md`.

## Garde-fou permanent — tests d’interface interactifs

Cette règle s’applique à tous les futurs Batches et aux sessions locales/manuelles de tests d’interface. Elle ne bloque pas les exécutions automatiques de CI.

Avant une nouvelle session locale/manuelle, demander explicitement à Mickaël :

- **VISIBLE** : navigateur visible, maximisé lorsque possible, ralentissement léger seulement pour les scénarios réellement observés ;
- **ARRIÈRE-PLAN** : exécution headless rapide.

Le choix est redemandé pour chaque nouvelle session pertinente.

Au même moment, fournir une **Preview HTTPS vérifiée** correspondant à l’état réellement testé lorsqu’elle existe. Ne jamais inventer une URL ni présenter localhost/une IP LAN comme Preview HTTPS. Si aucune Preview vérifiable n’existe, le dire explicitement ; une adresse locale peut seulement être proposée séparément comme solution de repli.

### Simplicité sans perte d’efficacité

Lorsque les tests et le runtime existent déjà :

- réutiliser le chemin Playwright connu au lieu de refaire une cartographie du dépôt ou plusieurs contournements techniques ;
- ne pas créer de wrapper/configuration temporaire ou contrôle Windows supplémentaire si la commande connue fonctionne ;
- la maximisation de fenêtre est un confort, pas une propriété technique qui exige une preuve séparée ;
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

Le Batch 7 reste **ouvert**. Aucun Batch 8 ne peut être préparé ou démarré tant que le Batch 7 n’est pas réellement clôturé et intégré selon `DEVELOPMENT.md`.

Le rollback navigateur et Graphify ont maintenant reçu leurs décisions explicites. Avant clôture, il reste au minimum :

1. préflight final sur le HEAD courant ;
2. revue indépendante adaptée au risque Critique ;
3. traitement/décision de tout finding issu de cette revue ;
4. mise à jour finale de `BATCH7.md`, `PROJECT_STATE.md` et `workflow/state.json` ;
5. CI finale verte sur le candidat de clôture ;
6. passage de la PR #65 hors brouillon seulement lorsque les conditions de clôture sont réellement satisfaites.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Les fichiers `BATCH<n>.md` documentent un Batch mais ne remplacent pas les contrats canoniques.

## Règles opérationnelles

- GitHub est la source de vérité pour branches, commits, PR, checks, Issues et preuves GitHub.
- Une déclaration d’agent n’est pas une preuve.
- Avant une PR de validation/intégration ou une mise à jour destinée aux contrôles, effectuer le préflight applicable.
- Ne pas modifier un garde-fou pour faire passer un changement qu’il refuse.
- Réserver les revues renforcées aux propriétés qui les justifient réellement.
- Éviter les boucles de revue et la gouvernance sans réduction de risque réelle.
- Ne pas traiter opportunément un finding reporté sans décision de périmètre.
