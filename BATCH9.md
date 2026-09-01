# BATCH9 — Remédiation de l’audit global pré-Batch-9

**Statut : en cours**

## Intention

Le Batch 9 ne démarre aucune nouvelle fonctionnalité métier. Il sert à lever les findings confirmés de l’audit global exhaustif réalisé après la clôture du Batch 8, afin de retrouver un état fiable avant de reprendre les évolutions métier.

L’audit de référence a authentifié :

- `main` : `6cac8e8facac3e048bef5d1f8c26a72b049870e7` ;
- `test-preview` : `1803e5b22bafab09b29d68539ef7f0a9286596ec` ;
- tree commun : `e577d63cba6ddeea8eb770452bbab7f4c1c0072f` ;
- 0 Issue ouverte et 0 PR ouverte au préflight de démarrage ;
- verdict global : **NO-GO** pour la poursuite métier tant que les findings sérieux confirmés ne sont pas traités.

L’audit est une preuve d’entrée pour le Batch 9, pas une autorité remplaçant les documents canoniques. Chaque finding doit être vérifié et décidé avant correction.

## Classification

### F4.2 / F4.3

**Critique.** Le premier finding traité, F-006, modifie directement la chaîne de contrôle GitHub (`sentinel`, workflow Playwright et contrat de contrôle). Le Batch reste donc classé Critique tant qu’il est ouvert, sans baisse opportuniste du niveau de risque entre sous-étapes.

### F4.4

**Accord propriétaire obtenu.** Mickaël a approuvé le démarrage du Batch 9 de remédiation et le périmètre initial F-006 après présentation de l’intention, des conséquences et du chemin critique de validation. Après revue indépendante du premier candidat F-006, il a approuvé l’extension bornée du même finding à `.github/workflows/filora-guard.yml` pour traiter la même classe de contournement `npm postinstall`. Après la seconde revue indépendante, il a également approuvé la promotion de `package.json` et `package-lock.json` en surface Critique afin de fermer les contournements concrets restants de `guard` et `e2e` sans ajouter de nouvelle mécanique. Après la troisième revue indépendante, il a approuvé l’extension bornée de cette même surface Critique à `.npmrc` et au préfixe `tests/e2e/`, ainsi que la correction documentaire associée. Après la revue suivante et le probe d’architecture en lecture seule, il a approuvé le remplacement global du serveur `vite dev` des E2E par le test du `dist/` réellement construit, servi statiquement, avec adaptation ciblée du test PWA ; cette extension porte la PR #77 à neuf fichiers modifiés au maximum. Après la revue Codex du candidat `b0fb30789005749553a0875f518a98357d87f35d`, il a approuvé le remplacement du job E2E unique par deux jobs isolés `build` puis `e2e`, sur deux runners distincts, avec transfert de `dist/` uniquement et sans partage de `node_modules` ni de cache npm entre les deux jobs. Après la revue Codex du candidat `f82efb1b56986a565fae9d02552a6f36fb0de90b` et la contre-analyse de l’arbre Git, il a approuvé l’inversion du sentinel : une allowlist fail-closed fondée sur la base GitHub autorise seulement les surfaces non critiques connues ; tout autre chemin devient Critique par défaut, sans nouvelle liste noire fichier par fichier.

### Jalon humain requis — EN ATTENTE

Le Batch 9 comprendra des corrections produit/persistance après F-006. Les validations humaines réellement nécessaires seront définies au moment des corrections concernées. Aucun jalon applicatif n’est revendiqué acquis au démarrage.

## Findings de l’audit — décisions de périmètre

### À traiter dans le Batch 9 avant checkpoint

1. **F-006 — garde-fous / fraîcheur de preuve** : la chaîne de validation peut être affaiblie par une modification de workflow/configuration alors que le ruleset réel n’exige actuellement que `sentinel`.
2. **F-002 — identité historique A/a** : une réaffectation peut viser la mauvaise bobine lorsque deux IDs historiques ne diffèrent que par la casse.
3. **F-001 — concurrence IndexedDB** : des mutations fondées sur un snapshot obsolète peuvent perdre silencieusement une écriture ou laisser passer un doublon concurrent.
4. **F-003 — intégrité incertaine après échec de rollback** : l’application ne bloque pas les mutations après une restauration dont l’intégrité ne peut plus être garantie.
5. **F-005 — commit réussi mais refresh échoué** : l’UI peut présenter comme échouée une mutation déjà commitée.
6. **F-004 — support physique obligatoire** : `supportKind: null` doit rester lisible pour le legacy mais ne doit pas être accepté pour une nouvelle bobine active.

Ordre prévu : **F-006 → F-002 → F-001 → F-003 + F-005 → F-004 → checkpoint complet**.

### À réévaluer au checkpoint, sans traitement opportuniste avant décision

- **F-007** validation sémantique des backups/références ;
- **F-008** scripts npm non reproductibles depuis PowerShell Windows ;
- **F-009** gestion du focus des modales ;
- **F-010** préfixes `localStorage` dupliqués et échecs silencieux ;
- **F-011** compteur de sauvegarde issu d’un snapshot UI potentiellement obsolète ;
- **F-012** fichiers/CSS orphelins ;
- **F-013** encodage implicite du guard sous Windows.

### Observations non bloquantes conservées

- **F-014** formulation Dexie encore présente comme stratégie candidate dans `DATA.md` ;
- **F-015** `localeCompare()` sans locale explicite ;
- **F-016** branches historiques/temporaires nombreuses mais sans contribution utile non intégrée identifiée par l’audit ;
- **F-017** GitHub Actions référencées par tags majeurs plutôt que SHA immuables.

### Réserve dépendances — décision F-006

L’audit initial avait conservé comme réserve non bloquante le risque d’un downgrade futur de `@playwright/test` via `package.json`/`package-lock.json`. Les revues indépendantes de #77 ont ensuite produit des preuves concrètes montrant que ces deux fichiers peuvent plus largement décider de ce que `guard` et `e2e` exécutent : hooks npm, scripts `typecheck`/`build`, versions et graphe de dépendances, ainsi que création de binaires dans `node_modules/.bin`.

Cette réserve n’est donc plus laissée comme simple observation pour F-006 : `package.json` et `package-lock.json` deviennent des **surfaces Critiques**. Leur contenu n’est pas modifié par #77 ; seule leur classification/protection est renforcée. Toute évolution future de dépendance ou de script npm devra suivre le chemin Critique tant que cette règle reste en vigueur.

## Première correction — F-006

### Problème confirmé

Le ruleset GitHub réel actif sur `main` et `test-preview` exige actuellement uniquement le check `sentinel`. Les checks réellement publiés sur les PR sont exactement `sentinel`, `guard` et `e2e`.

Le sentinel initial protégeait une liste exacte de surfaces critiques, mais cette liste n’incluait pas le workflow Playwright ni `playwright.config.ts`. Le workflow Playwright exécutait en outre la suite via `npm run test:e2e`, ce qui créait une dépendance inutile à un script modifiable hors de la surface protégée par le sentinel.

Les revues indépendantes de la PR #77 ont ensuite confirmé huit contournements réalistes de cette même cause racine :

1. un `postinstall` pouvait remplacer le runner Playwright ou les outils Node après `npm ci` ;
2. modifier les scripts `typecheck`/`build` de `package.json` pouvait rendre le `guard` faussement vert malgré `--ignore-scripts` ;
3. une dépendance locale pouvait exposer un faux binaire `playwright` dans `node_modules/.bin` même avec `--ignore-scripts` ;
4. un `.npmrc` de projet pouvait imposer `script-shell=./fake-shell.sh` et rendre `npm run typecheck` / `npm run build` faussement verts sans modifier `package.json` ;
5. une PR ordinaire pouvait réduire `tests/e2e/` à une suite vide/triviale, laissant le check `e2e` vert sans préserver la valeur des 39 scénarios attendus ;
6. `vite.config.ts` pouvait faire diverger le comportement de `vite dev` du résultat de `vite build`, de sorte que les E2E testent une application différente de l’artefact réellement construit ;
7. même après passage au vrai `dist/`, `vite.config.ts`, exécuté comme code Node pendant `vite build`, pouvait modifier `node_modules/.bin/playwright` sur le même runner avant l’installation Chromium et les tests, ce qui permettait encore un faux vert ;
8. après séparation en deux runners, une PR ordinaire pouvait encore ajouter `npm-shrinkwrap.json`, prioritaire sur `package-lock.json` pour npm, et y orienter une dépendance vers un paquet local exposant un faux binaire `playwright` sur le runner E2E neuf.

Le sixième finding a déclenché la règle de sortie convenue : ne plus ajouter des chemins protégés un par un, mais changer le modèle de preuve pour que la suite E2E teste l’artefact réellement produit par le build. Le septième a montré que l’artefact unique ne suffit pas si le build et la certification restent dans le même environnement mutable : la frontière de confiance doit être physique entre deux runners GitHub Actions distincts. Le huitième a démontré que même cette isolation ne rend pas durable une liste noire de fichiers de configuration : le modèle d’admission du sentinel doit être inversé afin que tout chemin non explicitement admis par une base GitHub de confiance soit Critique par défaut.

Filora reste vérifié mono-package sur le candidat concerné : un seul `package.json` et un seul `package-lock.json` à la racine, aucun workspace npm et aucun `.npmrc` suivi. Le finding `npm-shrinkwrap.json` montre toutefois qu’une protection fondée sur l’énumération des noms connus n’est pas une propriété durable ; aucune nouvelle variante de manifeste/configuration n’est ajoutée individuellement à une liste noire.

### Modèle d’admission fail-closed retenu

Le sentinel est exécuté via `pull_request_target` depuis la branche de base. Il utilise le **SHA exact de base** comme autorité pour lire `workflow/state.json` et `workflow/contract.json` ; il ne déduit jamais le Batch autorisé depuis l’état proposé par la PR.

Une PR non critique peut modifier :

- `src/**` ;
- `public/**` ;
- `index.html` ;
- `tests/*_check.ts` à la racine de `tests/` ;
- `tests/check_pwa_icons.py` ;
- `PROJECT_STATE.md` ;
- les chemins déjà classés `sensitive_paths` dans le **contrat de la base**, lesquels restent soumis au niveau Sensible par le guard ;
- un seul fichier Batch déterminé par l’état de la base : si le Batch de base est ouvert, `BATCH<base>.md` ; s’il est fermé et `next_batch_allowed: true`, uniquement `BATCH<base+1>.md`.

Tout autre chemin — connu ou inconnu — est rejeté par défaut par le sentinel et doit suivre le chemin Critique. Les renommages sont évalués sur le nouveau et l’ancien chemin. Cette règle rejette donc sans connaissance préalable `npm-shrinkwrap.json`, `yarn.lock`, `pnpm-lock.yaml`, une nouvelle configuration de build, `tests/e2e/**`, les workflows, les outils de garde et les fichiers de contrôle hors surfaces admises.

Le candidat a également vérifié en lecture seule que `vite.config.ts` n’importe aucun fichier sous `src/**`; l’allowlist applicative actuelle n’est donc pas exécutée comme configuration Node par le build Vite. Toute future modification Critique de la configuration de build devra préserver cette frontière ou la réévaluer explicitement.

Des probes adversariaux sont intégrés directement au script base-side du sentinel afin de vérifier à chaque exécution de cette version la classification de chemins ordinaires, de `npm-shrinkwrap.json`, `vite.config.ts`, `tests/e2e/**`, d’un chemin inconnu et des transitions Batch synthétiques. Aucun dixième fichier de test mutable n’est créé.

### Périmètre F-006 autorisé

- `.github/workflows/filora-guard-sentinel.yml` : remplacer la blacklist de fichiers dangereux par l’admission fail-closed décrite ci-dessus, lire état/contrat au SHA exact de base avec `contents: read`, vérifier ancien et nouveau chemin des renommages et exécuter les probes adversariaux embarqués ;
- `.github/workflows/playwright-e2e.yml` : séparer la preuve en deux jobs. Le job `build` checkout le SHA exact, installe les dépendances avec `npm ci --ignore-scripts`, construit une seule fois le vrai `dist/`, vérifie ses fichiers PWA essentiels et publie **uniquement `dist/`** comme artefact. Le job `e2e`, sur un runner distinct et dépendant du succès de `build`, checkout le même SHA exact, effectue une nouvelle installation `npm ci --ignore-scripts`, installe Chromium, télécharge uniquement l’artefact `dist/` et exécute les 39 tests contre cet artefact ; aucun `node_modules`, workspace ou cache npm n’est partagé entre les deux jobs ;
- `.github/workflows/filora-guard.yml` : appliquer la même protection `npm ci --ignore-scripts` à la chaîne Node du guard afin qu’un hook npm ne puisse pas falsifier `tsc` ou le build ;
- `playwright.config.ts` : ne plus lancer `vite dev`, mais servir `dist/` par `python3 -m http.server` sur le même port 4173 ;
- `tests/e2e/pwa.spec.ts` : vérifier le shell/cache réellement déclaré par le service worker du build, y compris ses assets JS/CSS, au lieu d’imposer la liste réduite propre au serveur de développement ;
- `workflow/contract.json` : déclarer `playwright.config.ts`, `package.json`, `package-lock.json` et `tests/e2e/` comme contrôles critiques durables existants ;
- état/documentation Batch 9 nécessaires à la reprise.

Aucune modification du contenu de `package.json` ou `package-lock.json`, aucun nouveau système de SHA de revue, aucun nouveau mécanisme de bypass, aucun nouveau fichier de test et aucun changement métier ne font partie de F-006.

`claude-review-package.yml` a été vérifié séparément : il n’exécute aucun `npm ci` et n’est donc pas concerné par le vecteur `postinstall`.

### PR F-006 en cours

- PR critique : **#77** vers `test-preview` ;
- base à l’ouverture : `1803e5b22bafab09b29d68539ef7f0a9286596ec` ;
- HEAD à l’ouverture : `c0828a64177cdea614f01df9183a9bb491e06519` ;
- le diff à l’ouverture contenait exactement 6 fichiers, tous dans le périmètre F-006/état Batch 9 ;
- après l’événement `opened`, les runs GitHub Actions n’ont pas été immédiatement observables ; une synchronisation documentaire utile a produit un événement `synchronize` ;
- sur le candidat `3a173a04dcdeab888ab74992460f2b1de1c3e77a`, `guard` et `e2e` ont ensuite réellement réussi, tandis que `sentinel` a réellement échoué comme attendu parce que la PR touche sa propre surface critique ;
- la revue Codex indépendante de `3a173a04dcdeab888ab74992460f2b1de1c3e77a` a trouvé un **P1 réel** : `postinstall` pouvait remplacer `node_modules/.bin/playwright` après `npm ci` ;
- le candidat `59c130f407281c6db695c966b434b2df798cb524` a ensuite fermé ce premier P1 avec `npm ci --ignore-scripts --no-audit --no-fund` dans `e2e` et `guard` ; GitHub Actions a réellement produit `guard` SUCCESS avec 96 tests Python, architecture, typecheck et build, ainsi que `e2e` SUCCESS avec installation explicite de Chromium et **39/39 tests Playwright** ; `sentinel` a échoué comme attendu ;
- la seconde revue Codex indépendante du SHA exact `59c130f407281c6db695c966b434b2df798cb524` a confirmé le P1 `postinstall` fermé mais trouvé **deux nouveaux P1 réels** : scripts npm `typecheck`/`build` falsifiables et faux binaire `playwright` via une dépendance locale ;
- le candidat `68564b56855786b8b505ee5ba81fb7517c88b2e5` a ensuite promu `package.json` et `package-lock.json` en surface Critique ; sur ce SHA exact, `guard` a réellement réussi avec checkout exact, 96 tests Python, architecture, `npm ci --ignore-scripts`, typecheck et build, et `e2e` a réellement installé Chromium puis exécuté **39/39 tests Playwright** ; `sentinel` a échoué comme attendu ;
- la troisième revue Codex indépendante du SHA exact `68564b56855786b8b505ee5ba81fb7517c88b2e5` a confirmé que les P1 précédents étaient fermés mais trouvé **deux nouveaux P1 réels** : contournement de `npm run` via `.npmrc` / `script-shell` et remplacement de la valeur du check `e2e` par modification libre de `tests/e2e/`. Elle a aussi signalé un **P2 documentaire** : `PROJECT_STATE.md` présentait encore le risque de downgrade Playwright comme reporté alors que la protection Critique de `package.json`/`package-lock.json` avait déjà été décidée ;
- le candidat `62bc3de4a7677bb3887841815fd7d5c46fb8e7c7` a appliqué la protection `.npmrc`/`tests/e2e/` et corrigé le P2 documentaire, mais son `guard` a **échoué volontairement/fail-closed** à l’étape `workflow-state` avant le reste de la suite : `critical control path(s) declared in contract are missing from candidate: .npmrc`. Cette preuve montre que le contrat exige que tous ses chemins critiques existent ; le candidat n’est donc pas valide et n’est pas envoyé en revue ;
- correction retenue sans élargissement : conserver `.npmrc` dans le sentinel comme chemin prospectif bloqué, le retirer du contrat plutôt que d’ajouter artificiellement un fichier `.npmrc` ou de modifier `tools/filora_guard.py`, conserver `tests/e2e/` dans le contrat puisqu’il existe réellement, puis refaire toute la CI sur un nouveau SHA ;
- le candidat `aee6bf1e36b05be6207cd7fb36b3a4b7f6bf0906` a obtenu `guard` SUCCESS, `e2e` SUCCESS avec **39/39 tests**, et `sentinel` FAILURE attendu. La revue Codex de ce SHA a toutefois trouvé un **nouveau P1 réel** : les E2E lançaient toujours `vite dev`, donc `vite.config.ts` pouvait faire diverger l’application testée de l’artefact `vite build` ; conformément à la règle de sortie, aucune protection fichier par fichier supplémentaire n’a été ajoutée ;
- un probe strictement sans commit sur ce même SHA a validé `npm ci`, architecture, typecheck et build `dist/` avec identifiant de SHA incorporé, puis le service de `dist/` par `python3 -m http.server 4173 --directory dist`. Les headers observés étaient corrects (`text/html`, `application/manifest+json`, `text/javascript`, `text/css`) et aucune route profonde n’est requise par Filora. Le probe a obtenu **37/39** : quatre des six tests PWA ont passé ; un échec révélait que le vrai service worker de `dist/` précache aussi les assets JS/CSS alors que le test historique attendait uniquement l’enveloppe du mode développement ; l’autre échec d’installabilité était lié au Chrome de secours utilisé parce que le téléchargement du Chromium Playwright attendu était bloqué en HTTP 403 dans cet environnement. Aucun échec MIME n’a été observé ;
- décision architecturale autorisée : le check GitHub `e2e` doit désormais construire une seule fois le vrai `dist/`, servir cet artefact par un serveur statique indépendant de Vite, exécuter les **39 tests** contre ce même artefact et adapter seulement les assertions PWA devenues fausses parce qu’elles décrivaient `vite dev` ;
- le candidat `b0fb30789005749553a0875f518a98357d87f35d` a ensuite obtenu `guard` SUCCESS et `e2e` SUCCESS avec le vrai build Vite, le Chromium Playwright officiel, le serveur Python et **39/39 tests**. La revue Codex de ce SHA a néanmoins trouvé un **nouveau P1 réel** : `vite.config.ts`, exécuté pendant le build dans le même job, pouvait réécrire le binaire Playwright avant les tests ; le candidat reste donc non intégrable ;
- la contre-vérification en lecture seule a confirmé que `cache: npm` ne partage pas `node_modules`, que le projet actuel se construit réellement avec `npm ci --ignore-scripts`, et qu’aucun `postinstall` indispensable au build n’a été identifié dans le graphe actuel. La correction retenue est donc une isolation stricte : deux runners, deux installations fraîches, aucun cache npm dans ces jobs, et transfert de **`dist/` uniquement** du job `build` vers le job final `e2e` ;
- le candidat `f82efb1b56986a565fae9d02552a6f36fb0de90b` a prouvé sur GitHub deux jobs verts réellement séparés, transfert de `dist/` seul et **39/39 Playwright**, avec `guard` SUCCESS et `sentinel` FAILURE attendu. La revue Codex de ce SHA a trouvé un **nouveau P1 réel** : `npm-shrinkwrap.json`, prioritaire sur le lockfile, permettait encore à une PR ordinaire de fournir un faux binaire Playwright sur le runner E2E neuf ;
- l’analyse de l’arbre exact `f82efb1b...` a conduit à l’inversion du modèle : allowlist non critique minimale, chemins Sensibles issus du contrat **de base**, fichier Batch autorisé calculé depuis `workflow/state.json` **de base**, tout autre chemin Critique par défaut. La logique ne fait jamais confiance au `current_batch` proposé par la PR. Le premier commit d’implémentation de ce modèle est `095be57ad4e29afd64fa30083b22c0a04c82dfab`.

Le HEAD courant doit toujours être relu directement depuis GitHub avant toute revue ou intégration ; aucun SHA de candidat n’est considéré durable après une nouvelle modification.

### État réel du ruleset observé pendant F-006

La configuration GitHub doit être relue avant tout futur bypass ; elle n’est pas une vérité permanente. Au moment de la vérification F-006 :

- ruleset `Filora critical guard protection` : **active** ;
- branches ciblées : `main` et `test-preview` ;
- required status checks : **`sentinel` uniquement** ;
- bypass list observée : une entrée `RepositoryRole`, `actor_id: 5`, mode `pull_request`, correspondant au rôle administrateur ;
- aucune entrée `Integration`/GitHub App/bot n’a été observée dans la bypass list.

Cette photographie sert de preuve de contexte, pas de configuration supposée éternelle. Avant tout futur bypass Critique, la bypass list et les required checks doivent être relus depuis GitHub.

### Preuve et intégration F-006

La modification touche volontairement la propre surface protégée du sentinel. Un échec `sentinel` sur la PR candidate est donc **attendu** et ne doit jamais être corrigé en affaiblissant le contrôle.

Le nouveau modèle d’allowlist est lui-même présent dans #77 mais ne peut pas servir de preuve opérationnelle pour #77 : `pull_request_target` exécute la version du sentinel déjà présente sur la base `test-preview`. Sa preuve réelle doit donc être obtenue **après intégration**, sur une PR suivante, avant tout travail F-002.

Chemin requis :

1. candidat exact et diff borné ;
2. préflight ;
3. `guard` et `e2e` exécutés sur le SHA candidat lorsqu’ils sont applicables ;
4. revue indépendante du SHA exact, incluant l’allowlist base-side et ses probes ;
5. traitement explicite des findings ;
6. accord propriétaire Critique confirmé avant intégration ;
7. relecture immédiate du ruleset/bypass list avant utilisation ;
8. utilisation du bypass administrateur existant uniquement si le sentinel bloque exactement la modification critique validée ;
9. intégration vers `test-preview` ;
10. **immédiatement après l’intégration**, mise à jour du ruleset réel pour exiger `sentinel` + `guard` + `e2e`, après vérification des noms exacts des checks ;
11. preuve opérationnelle sur une vraie PR suivante, comprenant au minimum un chemin métier admis et un chemin inconnu/toolchain rejeté ; **aucun travail F-002 ne commence avant que les trois checks soient réellement requis par GitHub et que le nouveau sentinel ait démontré son fail-closed**.

Aucun nouveau mécanisme de bypass ne doit être créé.

## Suite du Batch 9

Après F-006 :

- F-002 doit centraliser la résolution d’identité exacte/ambiguë sans changer le schéma IndexedDB ;
- F-001 doit ensuite traiter la concurrence IndexedDB en réutilisant cette autorité d’identité ;
- F-003 et F-005 sont regroupés car ils concernent la vérité de l’état après mutation/rafraîchissement ;
- F-004 sépare la compatibilité legacy de la validation des nouvelles créations actives.

Après ces six findings sérieux : checkpoint complet, décision explicite sur les mineurs, petite contre-vérification Codex ciblée, puis audit Codex Security dédié adapté à l’architecture réelle de Filora. Le Batch métier prévu avant l’audit est reporté après cette remédiation.

## Conditions de clôture

Le Batch 9 ne peut être clôturé que si :

- tous les findings sérieux retenus sont traités, reportés ou rejetés avec preuve et justification ;
- les propriétés corrigées sont testées par des scénarios capables de les mettre réellement en défaut ;
- la suite applicable complète est verte ;
- les contrôles GitHub réellement requis sont vérifiés ;
- la contre-vérification ciblée post-corrections n’apporte pas de finding bloquant non décidé ;
- l’audit Codex Security dédié ne laisse pas de finding bloquant non décidé ;
- les validations humaines nécessaires aux propriétés observables sont terminées ;
- `PROJECT_STATE.md` et `workflow/state.json` reflètent l’état réel ;
- aucune clôture documentaire ne précède les preuves requises.

Le Batch 9 n’est pas une autorisation implicite de démarrer le Batch suivant.