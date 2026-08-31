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

**Accord propriétaire obtenu.** Mickaël a approuvé le démarrage du Batch 9 de remédiation et le périmètre initial F-006 après présentation de l’intention, des conséquences et du chemin critique de validation. Après revue indépendante du premier candidat F-006, il a approuvé l’extension bornée du même finding à `.github/workflows/filora-guard.yml` pour traiter la même classe de contournement `npm postinstall`. Après la seconde revue indépendante, il a également approuvé la promotion de `package.json` et `package-lock.json` en surface Critique afin de fermer les contournements concrets restants de `guard` et `e2e` sans ajouter de nouvelle mécanique.

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

Les revues indépendantes de la PR #77 ont ensuite confirmé trois contournements réalistes de cette même cause racine :

1. un `postinstall` pouvait remplacer le runner Playwright ou les outils Node après `npm ci` ;
2. modifier les scripts `typecheck`/`build` de `package.json` pouvait rendre le `guard` faussement vert malgré `--ignore-scripts` ;
3. une dépendance locale pouvait exposer un faux binaire `playwright` dans `node_modules/.bin` même avec `--ignore-scripts`.

### Périmètre F-006 autorisé

- `.github/workflows/filora-guard-sentinel.yml` : considérer tout `.github/workflows/` comme surface critique et protéger aussi `playwright.config.ts`, `package.json` et `package-lock.json` ;
- `.github/workflows/playwright-e2e.yml` : appeler directement le binaire Playwright installé et installer les dépendances avec `npm ci --ignore-scripts` afin qu’un hook npm de cycle de vie ne puisse pas remplacer le runner avant son exécution ;
- `.github/workflows/filora-guard.yml` : appliquer la même protection `npm ci --ignore-scripts` à la chaîne Node du guard afin qu’un hook npm ne puisse pas falsifier `tsc` ou le build ;
- `workflow/contract.json` : déclarer `playwright.config.ts`, `package.json` et `package-lock.json` comme contrôles critiques durables ;
- état/documentation Batch 9 nécessaires à la reprise.

Aucune modification du contenu de `package.json` ou `package-lock.json`, aucun nouveau système de SHA de revue, aucun nouveau mécanisme de bypass et aucun changement métier ne font partie de F-006.

`claude-review-package.yml` a été vérifié séparément : il n’exécute aucun `npm ci` et n’est donc pas concerné par le vecteur `postinstall`.

### PR F-006 en cours

- PR critique : **#77** vers `test-preview` ;
- base à l’ouverture : `1803e5b22bafab09b29d68539ef7f0a9286596ec` ;
- HEAD à l’ouverture : `c0828a64177cdea614f01df9183a9bb491e06519` ;
- le diff à l’ouverture contenait exactement 6 fichiers, tous dans le périmètre F-006/état Batch 9 ;
- après l’événement `opened`, les runs GitHub Actions n’ont pas été immédiatement observables ; une synchronisation documentaire utile a produit un événement `synchronize` ;
- sur le candidat `3a173a04dcdeab888ab74992460f2b1de1c3e77a`, `guard` et `e2e` ont réellement réussi, tandis que `sentinel` a réellement échoué comme attendu parce que la PR touche sa propre surface critique ;
- la revue Codex indépendante de `3a173a04dcdeab888ab74992460f2b1de1c3e77a` a trouvé un **P1 réel** : `postinstall` pouvait remplacer `node_modules/.bin/playwright` après `npm ci` ;
- le candidat `59c130f407281c6db695c966b434b2df798cb524` a ensuite fermé ce premier P1 avec `npm ci --ignore-scripts --no-audit --no-fund` dans `e2e` et `guard` ; GitHub Actions a réellement produit `guard` SUCCESS avec 96 tests Python, architecture, typecheck et build, ainsi que `e2e` SUCCESS avec installation explicite de Chromium et **39/39 tests Playwright** ; `sentinel` a échoué comme attendu ;
- la seconde revue Codex indépendante du SHA exact `59c130f407281c6db695c966b434b2df798cb524` a confirmé le P1 `postinstall` fermé mais trouvé **deux nouveaux P1 réels** : scripts npm `typecheck`/`build` falsifiables et faux binaire `playwright` via une dépendance locale ;
- ces deux P1 bloquent tout bypass/intégration de `59c130f...` et justifient la promotion de `package.json` et `package-lock.json` en surface Critique, plutôt qu’une nouvelle série de rustines sur chaque commande.

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

Chemin requis :

1. candidat exact et diff borné ;
2. préflight ;
3. `guard` et `e2e` exécutés sur le SHA candidat lorsqu’ils sont applicables ;
4. revue indépendante du SHA exact ;
5. traitement explicite des findings ;
6. accord propriétaire Critique confirmé avant intégration ;
7. relecture immédiate du ruleset/bypass list avant utilisation ;
8. utilisation du bypass administrateur existant uniquement si le sentinel bloque exactement la modification critique validée ;
9. intégration vers `test-preview` ;
10. **immédiatement après l’intégration**, mise à jour du ruleset réel pour exiger `sentinel` + `guard` + `e2e`, après vérification des noms exacts des checks ;
11. preuve opérationnelle sur une vraie PR suivante ; **aucun travail F-002 ne commence avant que les trois checks soient réellement requis par GitHub**.

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
