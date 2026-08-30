# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 7 — automatisation des tests d’interface avec Playwright
- status: clôturé
- git: vérifier directement dans GitHub l’état de la PR #65, son HEAD, sa base `test-preview`, les checks, Issues, reviews et l’intégration réelle avant toute préparation du Batch 8
- next_action: si la PR #65 n’est pas encore fusionnée, vérifier les checks du candidat de clôture puis l’intégrer à `test-preview` selon les protections en vigueur ; si elle est déjà fusionnée, vérifier le HEAD de `test-preview` et l’intégration réelle avant toute préparation du Batch 8

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé et intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé et intégré à `test-preview` par la PR #64.
- **Batch 7 :** clôturé sur `batch7/playwright-automation` après automatisation Playwright, CI, rollback navigateur, décision Graphify et contre-revue Codex normale sans finding majeur. L’état réel de l’intégration de la PR #65 doit être vérifié depuis GitHub plutôt que mémorisé ici avant sa fusion.
- **Risque Batch 7 :** Critique, car l’ajout d’un workflow sous `.github/workflows/` est une surface structurelle de contrôle selon le guard Filora.
- **Accord propriétaire F4.4 :** obtenu ; Mickaël a explicitement autorisé le 2026-08-30 la correction du checkout sale puis le passage à la CI Playwright.
- **Revue indépendante :** passée sur le candidat pré-clôture `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` ; Codex GitHub n’a trouvé aucun problème majeur sur ce commit.
- **Jalon humain applicatif :** non requis pour ce Batch d’outillage.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail Batch 7 :** `batch7/playwright-automation`.

`workflow/state.json` doit porter à la clôture : `current_batch: 7`, `batch_status: closed`, `risk: critical`, `independent_review: passed`, `owner_approval: obtained`, `next_batch_allowed: true`.

`next_batch_allowed: true` signifie que les conditions internes du Batch sont satisfaites. Cela ne remplace pas la règle opérationnelle Filora : **aucun Batch 8 ne doit être préparé ou démarré avant vérification de l’intégration réelle du Batch 7 dans `test-preview`.**

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

## Batch 7 — résultat acquis

Playwright `1.62.1` est versionné avec Chromium uniquement. Firefox et WebKit n’ont pas été ajoutés.

La suite E2E comprend :

- 28 tests fonctionnels couvrant les parcours utilisateur déjà implémentés : navigation, création de bobines, références nouvelles/existantes, paramètres d’impression, achat/rangement, stock nominal/mesuré, création en série, modification de référence, changement de filament, sauvegarde/restauration et isolation ;
- 1 test navigateur supplémentaire de rollback inter-stockages IndexedDB / catalogue personnel ;
- 4 tests de viewports représentatifs : mobile `390×844`, tablette `800×1280`, PC `1440×900`, ultra-wide `2560×1080` ;
- soit **33 tests Playwright au total**.

Le test de rollback navigateur fabrique les états par l’interface dans deux contextes Chromium isolés, injecte une panne unique sur l’écriture du catalogue local après le remplacement IndexedDB, puis recharge l’application. Il vérifie alors que l’ancienne bobine est toujours réellement persistée, que la bobine cible n’a pas été laissée dans IndexedDB, que l’ancien choix personnalisé du catalogue est revenu et que le choix cible n’a pas fui. Aucun crochet de test n’a été ajouté au code produit.

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

### Preuves du candidat pré-clôture

Sur le SHA `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` :

- `e2e` : SUCCESS ;
- `guard` : SUCCESS ;
- `sentinel` : SUCCESS ;
- Playwright : **33/33 PASS** ;
- rollback navigateur inter-stockages : PASS ;
- checkout exact et propre : PASS ;
- architecture, typecheck, build et tests du guard : PASS.

Ces preuves sont rattachées à ce SHA. Le commit de clôture documentaire/état doit lui-même repasser les checks avant intégration.

## Revue indépendante Batch 7

Une contre-revue Codex normale a été déclenchée directement sur la PR #65 avec :

- base attendue `cf221569f735e850b7f44bed84bae788612483b9` ;
- HEAD attendu `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` ;
- mission strictement en lecture seule ;
- examen demandé du diff, Playwright/lockfile, configuration, 33 tests, rollback, CI, permissions, secrets/réseau, guards, classifications F4.2/F4.3 et F4.4 et findings.

Codex GitHub a répondu : `Codex Review: Didn't find any major issues` et a identifié le commit revu comme `f1c5e8af46`.

Une demande de clarification des champs Filora a produit le même verdict automatique. La granularité du rendu GitHub reste donc limitée : elle n’est pas réinterprétée comme une attestation détaillée de propriétés que le commentaire ne développe pas. La mission couvrait néanmoins explicitement ces propriétés et aucun finding majeur n’a été remonté.

## Correction du checkout sale / `gitDirty`

La Preview Vercel vérifiée pendant le Batch pour l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` était `READY` mais ses métadonnées indiquaient `gitDirty: 1`.

Les artefacts locaux connus sont désormais exclus de Git :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière contrôlée ; `gitDirty: 0` dans Vercel n’est donc pas revendiqué. Cette vérification devra être faite la prochaine fois qu’une Preview réelle du bon SHA sera nécessaire.

## Graphify — décision Batch 7

Graphify est conservé **comme aide locale optionnelle uniquement**, sans intégration au dépôt.

- son graphe peut aider à comprendre des dépendances transversales lorsque Filora grandira ;
- il n’est ni source de vérité, ni preuve, ni contrôle de conformité ;
- aucune dépendance Graphify n’est ajoutée au projet ;
- aucun workflow CI, hook Git, serveur MCP ou `graphify-out/` n’est ajouté/versionné ;
- toute conclusion importante doit rester vérifiée dans le code et GitHub ;
- aucun gain mesuré sur l’environnement Windows local de Mickaël n’est prétendu pendant le Batch 7.

## Findings / décisions Batch 7

### Traités

- faisabilité Codex → Playwright ;
- dépendance et lockfile Playwright reproductibles ;
- suite E2E fonctionnelle ;
- viewports mobile/tablette/PC/ultra-wide ;
- CI Playwright minimale ;
- artefacts locaux Python/Vercel exclus du suivi Git ;
- rollback navigateur IndexedDB / catalogue personnel par un vrai test Chromium ;
- Graphify : décision acquise, aide locale optionnelle non intégrée.

### Reportés

- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

Ces éléments sont explicitement hors périmètre du Batch 7 et ne remettent pas en cause les propriétés qu’il devait démontrer.

### Rejetés

- aucun finding.

## Classifications de clôture

### F4.2 / F4.3

**Critique.** Le nouveau workflow `.github/workflows/playwright-e2e.yml` constitue objectivement une surface structurelle de contrôle. Le guard Filora a rejeté la classification initiale Sensible et l’état a été correctement remonté à `critical` sans affaiblissement du guard.

### F4.4

**Accord propriétaire obtenu.** Mickaël a explicitement autorisé le 2026-08-30 la correction du problème `gitDirty` puis le passage à la CI Playwright. `workflow/state.json` enregistre `owner_approval: obtained`.

### Jalon humain applicatif

**NON REQUIS.** Le Batch 7 ne modifie pas le produit ou l’UX ; la validation humaine applicative n’est pas utilisée pour certifier les propriétés techniques de l’outillage.

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

Le Batch 7 est **clôturé sur sa branche de travail**. Son état machine de clôture est `closed / critical / independent_review: passed / owner_approval: obtained / next_batch_allowed: true`.

Avant toute préparation du Batch 8 :

1. vérifier les checks du commit de clôture ;
2. vérifier l’état réel de la PR #65 ;
3. intégrer le Batch 7 à `test-preview` si ce n’est pas encore fait et si les protections l’autorisent ;
4. vérifier ensuite directement le HEAD de `test-preview` et la présence réelle du merge du Batch 7 ;
5. recontrôler Issues/findings pertinents.

Ne pas déduire l’intégration à partir de ce document seul.

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
