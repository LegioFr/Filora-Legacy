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

**Accord propriétaire obtenu.** Mickaël a approuvé le démarrage du Batch 9 de remédiation et le périmètre initial F-006 après présentation de l’intention, des conséquences et du chemin critique de validation.

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

### Réserve supplémentaire explicitement reportée

Le risque théorique d’un downgrade futur de `@playwright/test` via `package.json`/`package-lock.json` est conservé comme **réserve non bloquante et non traitée par F-006**. Le Batch 9 ne transforme pas F-006 en chantier général de gouvernance des dépendances. Cette réserve devra être réévaluée explicitement au checkpoint ou dans un finding ultérieur si une preuve de risque concret apparaît.

## Première correction — F-006

### Problème confirmé

Le ruleset GitHub réel actif sur `main` et `test-preview` exige actuellement uniquement le check `sentinel`. Les checks réellement publiés sur les PR sont exactement `sentinel`, `guard` et `e2e`.

Le sentinel actuel protège une liste exacte de surfaces critiques, mais cette liste n’inclut pas le workflow Playwright ni `playwright.config.ts`. Le workflow Playwright exécute en outre la suite via `npm run test:e2e`, ce qui crée une dépendance inutile à un script modifiable hors de la surface protégée par le sentinel.

### Périmètre F-006 autorisé

- `.github/workflows/filora-guard-sentinel.yml` : considérer tout `.github/workflows/` comme surface critique et protéger aussi `playwright.config.ts` ;
- `.github/workflows/playwright-e2e.yml` : appeler directement le binaire Playwright installé au lieu de dépendre du script npm pour l’exécution critique ;
- `workflow/contract.json` : déclarer `playwright.config.ts` comme contrôle critique durable ;
- état/documentation Batch 9 nécessaires à la reprise.

Aucune modification de `package.json`, aucun nouveau système de SHA de revue, aucun nouveau mécanisme de bypass et aucun changement métier ne font partie de F-006.

### PR F-006 en cours

- PR critique : **#77** vers `test-preview` ;
- base à l’ouverture : `1803e5b22bafab09b29d68539ef7f0a9286596ec` ;
- HEAD à l’ouverture : `c0828a64177cdea614f01df9183a9bb491e06519` ;
- le diff à l’ouverture contenait exactement 6 fichiers, tous dans le périmètre F-006/état Batch 9 ;
- après l’événement `opened`, aucun run GitHub Actions `sentinel`, `guard` ou `e2e` n’a été observé sur ce HEAD ; seule la vérification Vercel Preview Comments était présente. Cette absence ne constitue ni un succès ni l’échec `sentinel` attendu ;
- une synchronisation documentaire de cette même PR est donc effectuée afin de produire un événement `synchronize` et de revérifier la chaîne. Le HEAD courant doit toujours être relu directement depuis GitHub avant toute revue ou intégration.

### Preuve et intégration F-006

La modification touche volontairement la propre surface protégée du sentinel. Un échec `sentinel` sur la PR candidate est donc **attendu** et ne doit jamais être corrigé en affaiblissant le contrôle.

Chemin requis :

1. candidat exact et diff borné ;
2. préflight ;
3. `guard` et `e2e` exécutés sur le SHA candidat lorsqu’ils sont applicables ;
4. revue indépendante du SHA exact ;
5. traitement explicite des findings ;
6. accord propriétaire Critique confirmé avant intégration ;
7. utilisation du bypass administrateur existant uniquement si le sentinel bloque exactement la modification critique validée ;
8. intégration vers `test-preview` ;
9. mise à jour du ruleset réel pour exiger `sentinel` + `guard` + `e2e`, après vérification des noms exacts des checks ;
10. preuve opérationnelle sur une vraie PR suivante avant de considérer F-006 acquis.

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
