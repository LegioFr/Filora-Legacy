# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-31**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 8 — installation PWA Test et Officielle
- status: clôturé
- git: Batch 8 promu vers `main` par la PR #74 ; Filora Official est servie par `filora-app-nine.vercel.app` depuis `main` et Filora Test par `filora-test-stable.vercel.app` depuis `test-preview`
- next_action: ne pas démarrer automatiquement le Batch 9 ; lors de sa préparation, reconstruire l’état réel depuis GitHub, consulter les Issues/findings ouverts et proposer son périmètre avant toute modification

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et promu vers `main` par la PR #69.
- **Batch 4 :** clôturé, validé et promu vers `main` par la PR #70.
- **Batch 5 :** clôturé, intégré à `test-preview` par la PR #62 puis promu vers `main` par la PR #71.
- **Batch 6 :** clôturé, intégré à `test-preview` par la PR #64 puis promu vers `main` par la PR #72.
- **Batch 7 :** clôturé, intégré à `test-preview` par la PR #65 puis promu vers `main` par la PR #73, avec Playwright, CI, rollback navigateur et évaluation réelle de Graphify terminés. Graphify `0.9.53` a été essayé puis retiré ; verdict : **RETIRER pour Filora aujourd’hui**.
- **Risque Batch 7 :** Critique, car l’ajout d’un workflow sous `.github/workflows/` constitue une surface structurelle de contrôle selon le guard Filora.
- **Accord propriétaire F4.4 Batch 7 :** obtenu pour la correction du checkout sale et l’introduction de la CI Playwright minimale.
- **Revue indépendante Batch 7 :** `passed`. Codex a revu le candidat `0dd038681b6f51f9369cebf5624cbfd7e8a1bede`, trouvé un unique P2 documentaire dans ce fichier, puis ce finding a été corrigé dans `69798abfaa88dff57cdfb254155cf39876368a2d`, avec guard/e2e/sentinel verts et thread résolu. Une re-review supplémentaire de `69798ab...` a été demandée mais n’est pas utilisée comme preuve tant qu’elle n’a pas produit de verdict ; aucune boucle supplémentaire n’est requise pour ce correctif documentaire ciblé.
- **Jalon humain applicatif Batch 7 :** non requis ; le Batch 7 n’introduit pas de modification produit/UX.
- **Batch 8 :** **clôturé**. La PR #66 a intégré l’implémentation PWA dans `test-preview`. Après rattrapage séquentiel de `main` par #69 à #73, la PR #74 a promu le candidat Batch 8 exact vers `main` au merge `2a1b9221f28113de119d9aa7071c412d023564a1`. Filora Test et Filora Official sont installées séparément, lancées en standalone, identifiées sans ambiguïté et leurs données ont été démontrées isolées dans les deux sens sur la tablette réelle.
- **Risque Batch 8 :** Sensible pour l’implémentation PWA, conservé à **Critique** pour la promotion officielle. La PR #74 portait réellement la transition Batch 7 → Batch 8 ; l’ancienne justification par un diff cumulatif contenant `DEVELOPMENT.md` et le workflow Playwright était devenue obsolète et a été corrigée à la clôture.
- **Décision propriétaire Batch 8 :** obtenue pour le comportement produit, le découpage Test / Officielle / mise à jour contrôlée et le niveau Critique retenu pour la promotion.
- **Revue indépendante Batch 8 :** `passed`. Codex a revu le candidat exact de la PR #74, commit `0ed6227d46c4de5be7b2d0dfac900d4569792782`, base `795d68068fbaad47dda278e05345ff93eec6bc5c`. Aucun finding produit/PWA bloquant ; deux P2 documentaires ont été décidés non bloquants puis corrigés dans la synchronisation de clôture.
- **Jalon humain applicatif Batch 8 :** **acquis** : Filora Test installée/standalone/badge TEST/mise à jour contrôlée ; Filora Official installée séparément/standalone/sans badge TEST ; coexistence réelle ; isolation Test → Official et Official → Test démontrée.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.

`workflow/state.json` porte après clôture du Batch 8 : `current_batch: 8`, `batch_status: closed`, `risk: critical`, `independent_review: passed`, `owner_approval: obtained`, `next_batch_allowed: true`.

`next_batch_allowed: true` signifie que la préparation d’un Batch suivant est autorisée ; cela ne démarre pas le Batch 9 et ne dispense pas de son préflight.

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

## Batch 7 — Playwright acquis

Playwright `1.62.1` est versionné avec Chromium uniquement. Firefox et WebKit n’ont pas été ajoutés.

La suite E2E avant Batch 8 comprenait :

- 28 tests fonctionnels couvrant les parcours utilisateur déjà implémentés : navigation, création de bobines, références nouvelles/existantes, paramètres d’impression, achat/rangement, stock nominal/mesuré, création en série, modification de référence, changement de filament, sauvegarde/restauration et isolation ;
- 1 test navigateur de rollback inter-stockages IndexedDB / catalogue personnel ;
- 4 tests de viewports représentatifs : mobile `390×844`, tablette `800×1280`, PC `1440×900`, ultra-wide `2560×1080` ;
- soit **33 tests Playwright au total avant les tests PWA du Batch 8**.

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

### Preuves acquises avant le commit de clôture du Batch 7

Sur `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` : `e2e`, `guard` et `sentinel` SUCCESS, Playwright **33/33 PASS**, rollback navigateur PASS, checkout exact/propre PASS, architecture/typecheck/build/tests du guard PASS.

Le premier candidat documentaire de clôture `67dcfa3ddb395713131d895f78c6eb825cfb581d` a également passé `e2e`, `guard`, `sentinel` et **33/33 Playwright**.

Après l’essai Graphify, `0dd038681b6f51f9369cebf5624cbfd7e8a1bede` a obtenu `guard`, `sentinel` et la suite Playwright complète en SUCCESS. La revue Codex de ce SHA a remonté uniquement l’incohérence documentaire de `PROJECT_STATE.md`.

Le correctif `69798abfaa88dff57cdfb254155cf39876368a2d` a ensuite obtenu `guard`, `sentinel` et la suite Playwright E2E complète en SUCCESS ; le thread correspondant a été résolu.

Le commit de clôture `981d20b097bdb699bfb5721d9ac8c3dbb4f759b8` a lui-même obtenu les contrôles applicables verts avant fusion de la PR #65.

## Revue indépendante Batch 7

Une première contre-revue Codex normale a examiné `f1c5e8af46eb226d8698e6a9fd6155bcdacd2452` avec une mission couvrant le diff, Playwright/lockfile, les 33 tests, le rollback, la CI, permissions/secrets/réseau, guards, F4.2/F4.3, F4.4 et findings. Codex GitHub a répondu qu’il n’avait trouvé aucun problème majeur.

Après l’essai Graphify, Codex a revu `0dd038681b6f51f9369cebf5624cbfd7e8a1bede`. Il n’a pas remis en cause les propriétés Playwright/CI mais a identifié un finding P2 documentaire : cet index indiquait encore que Graphify restait à installer/tester alors que `BATCH7.md` enregistrait déjà l’essai et le verdict RETIRER.

Ce finding a été corrigé dans `69798abfaa88dff57cdfb254155cf39876368a2d`. Le diff de correction est documentaire, les contrôles du SHA sont verts et le thread a été résolu. Cette chaîne de revue + correction vérifiée satisfait la revue indépendante sans ajouter une boucle de relecture obligatoire sans réduction de risque.

Une demande de re-review supplémentaire de `69798ab...` a été déclenchée ; son éventuel résultat ultérieur doit être traité s’il apporte un nouveau finding concret, mais il n’est pas présenté ici comme une preuve acquise.

## Correction du checkout sale / `gitDirty`

La Preview Vercel vérifiée pour l’ancien SHA `8d63454d1ffb1c0e0c33827f8162ce471744b968` était `READY` mais portait `gitDirty: 1`.

Les artefacts locaux connus sont désormais exclus de Git :

- `__pycache__/` ;
- `*.py[cod]` ;
- `.vercel/`.

La CI Playwright prouve qu’un checkout GitHub neuf du candidat est propre avant exécution. Aucune nouvelle Preview Vercel du checkout corrigé n’a été créée de manière contrôlée ; `gitDirty: 0` dans Vercel n’est donc pas revendiqué.

## Graphify — essai terminé, verdict RETIRER

Graphify `0.9.53` a été réellement installé et essayé localement avec Codex sur l’environnement Windows de développement, puis retiré à l’issue de l’essai.

Le rapport Codex local — **déclaration d’agent, pas preuve GitHub** — indique notamment :

- graphe AST généré en mode `--code-only` : 851 nœuds, 1 966 arêtes, 45 communautés ;
- build par défaut bloqué par une demande de clé LLM à cause des documents détectés ;
- `graphify codex install` a tenté d’écrire dans le dépôt et d’installer un hook ;
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
- Graphify `0.9.53` : essai local réalisé, utilité insuffisante dans l’environnement Windows/Codex actuel, verdict **RETIRER** ;
- finding P2 Codex sur l’index de reprise Graphify : corrigé et thread résolu.

### Reportés

- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

Ces éléments restent hors du périmètre du Batch 7 et doivent être réévalués explicitement dans un futur Batch avant traitement.

### Rejetés

- Graphify comme outil local permanent dans sa version `0.9.53` et l’environnement Windows/Codex testé ; réévaluation future autorisée si les conditions changent.

## Classification Batch 7

### F4.2 / F4.3

**Critique.** Le nouveau workflow `.github/workflows/playwright-e2e.yml` constitue objectivement une surface structurelle de contrôle. Le guard Filora a rejeté la classification initiale Sensible et l’état a été remonté à `critical` sans affaiblissement du guard.

### F4.4

**Accord propriétaire obtenu.** L’autorisation de corriger le checkout sale puis de passer à la CI couvre l’introduction de la CI Playwright minimale. Graphify n’étant finalement pas intégré, aucun accord supplémentaire n’est nécessaire pour cet outil.

### Jalon humain applicatif

**NON REQUIS.** Aucun changement produit/UX n’est introduit par le Batch 7.

## Garde-fou permanent — tests d’interface interactifs

Cette règle s’applique aux futurs Batches et aux sessions locales/manuelles de tests d’interface. Elle ne bloque pas les exécutions automatiques de CI.

Avant une nouvelle session locale/manuelle, demander explicitement :

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
- ne pas transférer à l’utilisateur la détection manuelle de régressions que Playwright peut raisonnablement vérifier.

Objectif : **réduire le temps perdu autour des tests, jamais leur qualité, afin que les contrôles automatiques prennent réellement en charge les régressions automatisables.**

## Batch 8 — PWA Test et Officielle acquis

Le Batch 8 fournit désormais deux applications installables séparément :

- **Filora Test** sur `https://filora-test-stable.vercel.app`, origine stable liée à `test-preview` ;
- **Filora** sur `https://filora-app-nine.vercel.app`, origine stable liée à `main`.

Les deux origines sont réellement distinctes et l’isolation a été démontrée sur la tablette : `SP-0001` présente dans Test était absente d’Official, puis une donnée créée dans Official a été confirmée absente de Test.

La version Test est visuellement identifiable par le badge **TEST**. Le mécanisme de mise à jour annonce une nouvelle version et laisse l’utilisateur choisir **Mettre à jour** avant activation/rechargement. Aucun cache métier offline, cloud, compte ou synchronisation n’a été ajouté.

Les 33 tests Playwright préexistants ont été conservés et 6 tests PWA ajoutés, soit **39 tests Playwright**. La CI continue d’exécuter la suite complète.

La promotion officielle a été réalisée par la PR #74 : base `795d68068fbaad47dda278e05345ff93eec6bc5c`, head `0ed6227d46c4de5be7b2d0dfac900d4569792782`, merge `2a1b9221f28113de119d9aa7071c412d023564a1`.

Le déploiement Production Official correspondant est `READY`. Le manifeste Official sert `Filora`, le manifeste Test sert `Filora Test`, et le service worker Official est versionné sur le merge `2a1b9221...` tandis que le stable Test reste sur le déploiement Production `test-preview` `0ed6227d...` au moment de la clôture.

## Findings / décisions Batch 8

### Traités

- installation PWA distincte de Filora Test et Filora officielle ;
- origines HTTPS stables et réellement distinctes ;
- isolation démontrée des données locales dans les deux sens ;
- différenciation visible de la version Test ;
- mise à jour contrôlée avec action utilisateur ;
- validation humaine des deux installations et de leur coexistence ;
- synchronisation documentaire post-merge Batch 7 ;
- findings Codex PWA de la PR #66, corrigés avant intégration ;
- P2 Codex de #74 sur la justification Critique devenue obsolète après rattrapage séquentiel de `main` ; corrigé à la clôture ;
- P2 Codex de #74 sur l’action de reprise demandant encore d’ouvrir la PR de promotion ; corrigé à la clôture.

### Reportés

- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI ;
- consommations et mouvements de filament : **Batch 9** ;
- pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- Graphify comme outil Filora permanent dans la version `0.9.53` et l’environnement Windows/Codex testé ; réévaluation future autorisée si les conditions changent ;
- ajout des consommations métier au Batch 8.

## Classification Batch 8

### F4.2 / F4.3

**Critique.** L’implémentation PWA était Sensible ; la promotion officielle est restée surclassée à Critique avec accord propriétaire. Après rattrapage de `main` jusqu’au Batch 7, le diff réel de #74 était limité à Batch 7 → Batch 8. La classification Critique n’est donc plus justifiée par la présence de `DEVELOPMENT.md` ou du workflow Playwright dans le diff ; elle a été conservée comme surclassement volontaire pour la promotion officielle du mécanisme PWA durable d’installation/mise à jour et des deux canaux.

### F4.4

**Décision propriétaire — accord obtenu.** Deux applications séparées, canaux Test/Official distincts, isolation locale et mise à jour contrôlée ont été explicitement approuvés, ainsi que le niveau Critique retenu pour la promotion.

### Jalon humain applicatif

**ACQUIS.** Installation Test et Official, coexistence, standalone, distinction visuelle, mise à jour contrôlée et isolation bidirectionnelle ont été validés sur la tablette réelle.

## Revue indépendante Batch 8

Codex a revu le candidat exact de la PR #74, `0ed6227d46c4de5be7b2d0dfac900d4569792782`, sur la base exacte `795d68068fbaad47dda278e05345ff93eec6bc5c`.

La revue n’a trouvé aucun finding produit/PWA bloquant. Elle a trouvé deux P2 documentaires, tous deux traités dans la synchronisation de clôture. La revue indépendante est donc enregistrée `passed` sans boucle supplémentaire de relecture pour ces corrections documentaires ciblées.

## Conditions de transition

Le Batch 8 est **clôturé**. Son état machine est `closed / critical / independent_review: passed / owner_approval: obtained / next_batch_allowed: true`.

La clôture du Batch 8 ne démarre pas le Batch 9. Avant tout Batch suivant, reconstruire l’état GitHub, consulter les Issues/findings ouverts pertinents et vérifier les conditions de transition habituelles.

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
