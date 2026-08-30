# BATCH7.md — Automatisation des tests d’interface avec Playwright

**Statut : ouvert**  
**Date de démarrage : 2026-08-30**

## Intention

Réduire la part de tests d’interface répétitifs réalisés manuellement en introduisant une automatisation Playwright simple, fiable et proportionnée, sans transformer les viewports simulés en fausse preuve de comportement sur appareils physiques et sans ajouter une infrastructure plus complexe que nécessaire.

Le Batch a suivi l’ordre prévu : faisabilité locale d’abord, suite E2E stable ensuite, puis intégration CI seulement après stabilité locale.

## État de départ vérifié

- Batch 6 clôturé après validation humaine, CI verte et revue indépendante sans finding bloquant ;
- PR #64 réellement fusionnée dans `test-preview` ;
- HEAD de `test-preview` au démarrage : `cf221569f735e850b7f44bed84bae788612483b9` ;
- `workflow/state.json` du Batch 6 : `closed`, risque `sensitive`, revue indépendante `passed`, `next_batch_allowed: true` ;
- aucune Issue ni PR ouverte au contrôle préalable ;
- Filora guard #239 vert sur la clôture du Batch 6.

## Périmètre décidé

### À traiter

1. **Faisabilité Codex → Playwright**
   - Chromium uniquement ;
   - scénario minimal Stock → Ajouter une bobine → modale → retour Stock ;
   - conserver des tests Playwright classiques même si le pilotage interactif Codex devenait indisponible.

2. **Dépendance reproductible**
   - version Playwright explicite ;
   - lockfile versionné et examiné ;
   - navigateur/binaires minimaux ;
   - pas de Firefox/WebKit sans besoin démontré.

3. **Suite E2E utile**
   - navigation, boutons, modales, formulaires, validations, persistance ;
   - création nominale/mesurée et en série ;
   - références filament, modification et réaffectation ;
   - sauvegarde/restauration ;
   - isolation des contextes de test.

4. **Viewports simulés**
   - mobile `390×844` ;
   - tablette `800×1280` ;
   - PC `1440×900` ;
   - ultra-wide `2560×1080`.

Ces profils sont des simulations Chromium de taille d’écran. Ils ne remplacent pas une validation sur appareil physique lorsque la propriété dépend réellement du matériel, du navigateur ou du confort humain.

5. **CI Playwright**
   - intégration seulement après stabilité locale ;
   - Chromium uniquement ;
   - permissions GitHub Actions minimales ;
   - aucun secret ;
   - suite E2E complète ;
   - preuve d’échec conservée uniquement si nécessaire.

6. **Rollback navigateur IndexedDB / catalogue personnel**
   - évaluer un vrai test de panne entre les deux restaurations ;
   - ne l’ajouter que si l’injection de panne et la vérification du rollback restent propres et proportionnées ;
   - ne pas modifier artificiellement le code produit pour rendre ce test possible ;
   - sinon maintenir explicitement ce point reporté.

### À évaluer séparément

**Graphify** peut être évalué comme aide locale à la compréhension du dépôt et à l’analyse d’impact pour les IA. Il ne devient jamais source de vérité ni preuve ; toute conclusion importante doit être vérifiée dans le code et GitHub. Il n’est conservé que si le gain pratique est réel.

## État d’avancement Playwright au 2026-08-30

- faisabilité locale Codex → Playwright : démontrée ;
- `@playwright/test` : version exacte `1.62.1` ;
- Chromium : installé/utilisé ; Firefox/WebKit : non ajoutés ;
- smoke initial : PASS local ;
- suite fonctionnelle initiale : 28 tests ;
- test navigateur de rollback inter-stockages : 1 test supplémentaire ;
- viewports représentatifs : 4 tests dédiés ;
- total actuel : **33 tests Playwright** ;
- CI Playwright sur `f7dd2775454ede1f4fe5161e901022f0a2f66937` : **33/33 PASS** ;
- le test de rollback navigateur passe réellement en Chromium après injection d’une panne unique de `localStorage`, puis recharge l’application pour vérifier que l’ancien IndexedDB et l’ancien catalogue personnel sont revenus ;
- aucun crochet de test ni modification du code métier n’a été nécessaire pour cette injection ;
- validation locale précédemment rapportée : typecheck, build et architecture verts ;
- démonstration visible des quatre viewports réalisée ;
- aucun bug produit découvert lors de ces parcours ;
- la suite visible n’est qu’un complément : la couverture automatisée applicable complète reste obligatoire en arrière-plan ;
- `.gitignore` ignore désormais `__pycache__/`, `*.py[cod]` et `.vercel/` afin que les artefacts locaux de Python/Vercel ne salissent plus le checkout utilisé pour les tests et previews ;
- le workflow `.github/workflows/playwright-e2e.yml` a été ajouté séparément sans modifier `filora-guard.yml` ;
- CI Playwright : `permissions: contents: read`, aucun secret, Node 22, `npm ci`, Chromium uniquement, suite `npm run test:e2e` complète, traces/captures conservées seulement en cas d’échec ;
- `playwright.config.ts` utilise `forbidOnly` en CI et conserve trace/capture uniquement en cas d’échec ;
- PR #65 ouverte en brouillon vers `test-preview` pour obtenir les preuves CI sans déclarer le Batch prêt à fusionner ;
- Filora guard a correctement refusé la classification initiale `sensitive` car l’ajout d’un workflow GitHub Actions exige objectivement un risque `critical` ;
- aucun garde-fou n’a été affaibli pour contourner ce résultat ;
- après alignement de `workflow/state.json` sur `risk: critical` et `owner_approval: obtained`, le guard est redevenu vert ;
- sur le candidat `f7dd2775454ede1f4fe5161e901022f0a2f66937`, Filora guard #245 est réellement **SUCCESS** et la suite Playwright complète est **SUCCESS** ;
- Filora guard sentinel reste applicable et n’a pas été modifié.

## Décision Graphify

Graphify est **conservé comme aide locale optionnelle**, sans intégration au projet.

Décision proportionnée :

- l’outil open source peut construire localement un graphe du code à partir de l’AST et sait s’intégrer à Codex ;
- ce graphe peut être utile pour des analyses d’impact transversales lorsque Filora grandira ;
- Graphify n’est ni une source de vérité, ni une preuve, ni un contrôle de conformité ;
- aucune dépendance Graphify n’est ajoutée à `package.json` ou aux outils du dépôt ;
- aucun workflow CI, hook Git ou serveur MCP Graphify n’est ajouté au projet ;
- `graphify-out/`, caches et rapports Graphify ne sont pas destinés à être versionnés dans Filora ;
- toute conclusion importante issue du graphe doit être vérifiée dans le code et GitHub ;
- aucune preuve de gain mesuré sur l’environnement Windows local de Mickaël n’est revendiquée à ce stade. L’outil reste disponible comme accélérateur facultatif si un futur changement transversal justifie réellement son coût de préparation.

## Garde-fou d’exécution des tests d’interface

Le garde-fou permanent détaillé se trouve dans `PROJECT_STATE.md` et s’applique aux futurs Batches :

1. avant une session locale/manuelle de tests d’interface, demander à Mickaël **VISIBLE** ou **ARRIÈRE-PLAN** ;
2. VISIBLE = navigateur visible, maximisé lorsque possible, ralentissement seulement pour les scénarios réellement observés ;
3. ARRIÈRE-PLAN = headless rapide ;
4. la suite automatisée applicable complète reste exécutée : le mode visible ne la remplace jamais ;
5. fournir une Preview HTTPS correspondant au SHA testé lorsqu’elle existe et peut être vérifiée ; ne jamais inventer de lien ;
6. réutiliser le chemin Playwright déjà fonctionnel plutôt que refaire des préparations sans valeur ;
7. cette interaction ne s’applique pas aux exécutions automatiques de CI déjà autorisées.

## Findings / décisions

### Traités ou intégrés au Batch 7

- automatisation Playwright des parcours répétitifs ;
- faisabilité Codex → Playwright ;
- dépendance et lockfile reproductibles ;
- 28 parcours fonctionnels initiaux automatisés ;
- 4 viewports représentatifs ;
- intégration CI Playwright minimale ;
- correction des artefacts locaux responsables d’un checkout sale lors de la Preview précédente ;
- rollback navigateur IndexedDB / catalogue personnel : **traité** par un vrai test Chromium de panne inter-stockages, sans modification du code produit ;
- Graphify : **décision acquise**, conservé uniquement comme aide locale optionnelle non intégrée au dépôt.

### Reportés

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur du téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication actuelle des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- aucun finding à ce stade.

## Routage des revues

Le routage par défaut reste **Codex normal**. Codex Security n’est pas demandé par réflexe.

L’intégration CI doit être examinée sur ses propriétés concrètes : permissions GitHub Actions, secrets, accès réseau, dépendances, lockfile, navigateur installé et capacité du workflow à exécuter la suite complète. Le workflow actuel utilise uniquement `contents: read`, aucun secret et Chromium. Si une propriété de sécurité précise apparaît et que Codex normal est insuffisant pour l’évaluer, le routage vers Codex Security redevient pertinent conformément à `DEVELOPMENT.md`.

## Classification

**Critique.**

La classification initiale était Sensible, mais elle est devenue objectivement Critique dès l’ajout de `.github/workflows/playwright-e2e.yml`. Le guard Filora classe tout nouveau chemin sous `.github/workflows/` comme surface structurelle de contrôle et a correctement refusé la sous-classification `sensitive`.

Cette montée de risque ne signifie pas que le workflow actuel affaiblit la sécurité : elle impose le niveau de validation supérieur prévu pour une modification de mécanisme de contrôle. Le workflow existant `filora-guard.yml`, son sentinel et les scripts de garde n’ont pas été modifiés.

Classification F4.4 : Mickaël a explicitement autorisé le 2026-08-30 la correction du problème `gitDirty` puis le passage à la CI. Cette autorisation couvre l’introduction de la CI Playwright minimale décrite ci-dessus. `workflow/state.json` enregistre donc `owner_approval: obtained`. La revue indépendante reste `pending` tant qu’elle n’a pas été réellement acquise.

### Jalon humain requis — NON REQUIS

Le Batch 7 porte sur l’outillage et l’automatisation des tests, sans modification produit/UX dans son périmètre. Une validation humaine applicative n’est donc pas exigée pour sa clôture. L’accord propriétaire requis par le niveau Critique est une décision de gouvernance distincte et est déjà enregistré comme obtenu.

## Hors périmètre

- nouvelles fonctionnalités métier de stock ;
- consommations/mouvements/inventaire ;
- refonte visuelle ;
- cloud ou synchronisation ;
- comptes utilisateurs ;
- nettoyage opportuniste des références ;
- promotion vers `main`.

## Conditions de clôture

Le Batch 7 ne pourra être déclaré clôturé que si :

1. la faisabilité Codex → Playwright est documentée fidèlement ;
2. Playwright reste minimal et reproductible ;
3. dépendance, lockfile et navigateur sont examinés ;
4. la suite E2E utile reste stable ;
5. les viewports sont présentés pour ce qu’ils prouvent réellement ;
6. la CI Playwright reste verte avec permissions/accès proportionnés ;
7. le finding rollback navigateur reçoit une décision explicite ;
8. Graphify reçoit une décision explicite ;
9. tests applicables, typecheck, build, architecture et garde-fous sont verts sur le candidat final ;
10. la revue indépendante requise par le niveau Critique est acquise sans finding bloquant non décidé ;
11. l’accord propriétaire reste enregistré comme obtenu ;
12. les Issues/findings apparus pendant le Batch sont tous traités, reportés, acceptés ou rejetés explicitement avant clôture.

Les conditions 1 à 8 et 11 sont maintenant acquises. Les prochaines étapes sont le préflight final, la revue indépendante Critique, la décision sur tout finding de revue, puis la clôture et ses preuves finales.
