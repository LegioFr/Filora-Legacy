# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 7 — automatisation des tests d’interface avec Playwright
- status: ouvert
- git: lire le HEAD de `batch7/playwright-automation`, sa base `test-preview`, les workflows, Issues, PR et findings directement depuis GitHub avant toute décision de validation ou d’intégration
- next_action: préparer l’intégration CI Playwright maintenant que la suite fonctionnelle et les 4 viewports représentatifs sont stables localement ; avant tout lancement Playwright local interactif, appliquer le garde-fou permanent de choix visible/arrière-plan, de simplicité d’exécution et de Preview HTTPS vérifiée si disponible

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`, non encore promu vers `main`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé, validé et réellement intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé, validé et réellement intégré à `test-preview` par la PR #64 ; le HEAD de `test-preview` a été vérifié après fusion avant l’ouverture du Batch 7.
- **Batch 7 :** ouvert sur `batch7/playwright-automation`. La faisabilité Codex → Playwright est démontrée localement avec Chromium ; Playwright `1.62.1` est versionné ; une suite E2E fonctionnelle de 28 tests et 4 tests de viewports représentatifs est présente sur la branche. Codex rapporte localement 32 tests Playwright verts au total, ainsi que typecheck, build et architecture PASS ; ce résultat local n’est pas encore une preuve CI distante indépendante.
- **HEAD Batch 7 vérifié après ajout des viewports :** `8d63454d1ffb1c0e0c33827f8162ce471744b968`.
- **Issues GitHub ouvertes au contrôle d’ouverture du Batch 7 :** aucune.
- **PR GitHub ouvertes au contrôle d’ouverture du Batch 7 :** aucune.
- **Commentaires/reviews/threads GitHub en attente sur la PR #64 au contrôle d’ouverture :** aucun.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail courante :** `batch7/playwright-automation`.
- **Protection externe GitHub :** ruleset actif sur `main` et `test-preview`, PR et check `sentinel` requis, suppressions et force-push interdits.

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
- restaurer par remplacement cohérent avec rollback compensatoire prévu entre les stockages techniques ;
- démontrer réellement le recovery sur navigateur/appareil.

La persistance métier actuelle utilise IndexedDB direct sans Dexie, conformément à la décision acceptée tant qu’aucun besoin concret ne justifie cette dépendance.

## Batch 7 — périmètre courant

Le Batch 7 a pour intention de réduire les tests manuels répétitifs d’interface et de navigation en ajoutant une automatisation Playwright proportionnée.

L’ordre de travail est volontairement progressif :

1. tester la faisabilité réelle Codex → Playwright dans l’environnement Windows actuel ;
2. commencer avec Chromium uniquement et un scénario minimal ;
3. examiner la dépendance, le lockfile, les scripts d’installation et les binaires réellement introduits ;
4. construire seulement ensuite une petite suite E2E locale stable couvrant les parcours rentables ;
5. n’intégrer Playwright à la CI qu’après cette stabilité locale ;
6. évaluer Graphify séparément comme aide locale à la compréhension du code ;
7. ajouter éventuellement un test navigateur du rollback IndexedDB / catalogue personnel seulement si cela reste simple, propre et utile.

Les étapes 1 à 4 sont réalisées localement. Les 4 viewports représentatifs mobile `390×844`, tablette `800×1280`, PC `1440×900` et ultra-wide `2560×1080` sont également couverts par un sous-ensemble critique dédié. La prochaine étape Playwright est l’intégration CI minimale.

La suite E2E couvre notamment navigation, création de bobines, références nouvelles/existantes, stock nominal/mesuré, création en série, modification de référence, changement de filament, sauvegarde/restauration, isolation des contextes et utilisabilité critique sur les quatre tailles de viewport retenues.

Les viewports mobile, tablette, PC et ultra-wide sont principalement des **simulations de taille d’écran**. Ils ne constituent pas une preuve que le comportement est identique sur les appareils physiques réels.

Graphify, s’il est essayé, ne devient ni une source de vérité ni une preuve. Ses conclusions importantes doivent être vérifiées dans le code et GitHub, et l’outil n’est conservé que si son gain pratique est réel.

## Findings / décisions de l’ouverture du Batch 7

### À traiter dans Batch 7

- intégration progressive de Playwright comme automatisation réelle des tests d’interface et de navigation ;
- petit test de faisabilité Codex → Playwright avant toute complexification ;
- contrôle reproductible de la nouvelle dépendance et de `package-lock.json` ;
- automatisation des parcours répétitifs rentables : navigation, boutons, modales, sections, formulaires, validations, messages d’erreur, persistance visible et principaux viewports ;
- décision explicite sur un éventuel vrai test navigateur du rollback inter-stockages.

### À évaluer

- Graphify comme aide locale à la compréhension du code et à l’analyse d’impact pour les IA, sans autorité ni valeur de preuve.

### Reportés

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur du téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication actuelle des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine.

### Rejetés

- aucun finding à l’ouverture du Batch 7.

## Routage des revues Batch 7

Le Batch 7 est classé **Sensible** car il introduit au minimum une nouvelle dépendance de développement liée aux tests et pourra modifier la CI si la suite locale devient suffisamment stable.

Le routage par défaut reste **Codex normal**. Codex Security ne doit pas être demandé par réflexe. Il devient pertinent uniquement si l’examen de la dépendance, du lockfile, des scripts, des binaires navigateurs ou d’une future modification CI révèle une propriété de sécurité précise que Codex normal ne peut pas suffisamment évaluer.

L’éventuelle modification de CI doit être examinée au moment où elle est réellement préparée, notamment pour les permissions GitHub Actions, les secrets et les accès réseau nécessaires. Ces permissions ou accès ne doivent pas être augmentés sans besoin concret.

## Garde-fou permanent — tests d’interface interactifs

Cette règle s’applique à tous les futurs Batches et à toute session locale/manuelle de tests d’interface de Filora, avec Playwright ou un outil équivalent. Elle ne bloque pas les exécutions automatiques de CI déjà autorisées.

Avant de lancer une session locale/manuelle de tests d’interface, le coordinateur doit demander explicitement à Mickaël quel mode il souhaite pour cette session :

- **VISIBLE** : navigateur visible, fenêtre maximisée lorsque possible, sans petit viewport artificiel sauf si le test porte précisément sur un viewport, et ralentissement léger uniquement si nécessaire pour rendre les actions observables ;
- **ARRIÈRE-PLAN** : exécution headless rapide, sans fenêtre visible.

Le choix doit être redemandé pour chaque nouvelle session pertinente ; il ne doit pas être déduit silencieusement du choix précédent.

Au même moment, le coordinateur doit fournir à Mickaël, lorsqu’elle existe et peut être vérifiée, une **adresse HTTPS de Preview** correspondant à l’état réellement testé afin qu’il puisse ouvrir Filora et effectuer sa propre vérification s’il le souhaite. La correspondance de la Preview avec la branche ou le commit pertinent doit être vérifiée avant de présenter le lien comme valide.

Si aucune Preview HTTPS vérifiable n’est disponible, le coordinateur doit le dire explicitement. Il ne doit jamais inventer une URL ni présenter une adresse locale `http://127.0.0.1`, `http://192.168.x.x` ou équivalente comme si elle constituait la Preview HTTPS attendue. Une adresse locale peut être proposée séparément comme solution de repli lorsque cela est utile, avec sa nature locale clairement indiquée.

### Principe de simplicité pour les sessions répétées

Lorsque les tests concernés existent déjà et qu’un runtime Playwright fonctionnel a déjà été établi sur la machine, la session suivante doit **réutiliser ce chemin connu** et démarrer les tests directement. Une simple démonstration ne doit pas déclencher à nouveau une cartographie générale du dépôt, une réanalyse complète des tests existants ou une exploration de plusieurs méthodes d’exécution si une méthode connue fonctionne déjà.

En mode VISIBLE :

- utiliser en priorité le lancement Playwright headed déjà connu comme fonctionnel ;
- la maximisation de la fenêtre est un confort d’observation et non une propriété technique à prouver par un outil Windows séparé ; `--start-maximized` ou l’équivalent peut être demandé sans créer une chaîne de contrôle supplémentaire ;
- ne pas construire de wrapper, configuration temporaire, serveur intermédiaire ou adaptation npm/pnpm supplémentaire si la commande connue fonctionne ; si un contournement est réellement nécessaire, choisir le plus simple, le garder hors du dépôt et ne pas poursuivre l’exploration après obtention d’un chemin fonctionnel ;
- réserver le ralentissement aux tests que Mickaël observe réellement et ne pas ralentir les contrôles headless, typecheck, build ou architecture.

### Garantie d’efficacité des tests

La simplification d’une session ne doit jamais diminuer la couverture automatisée applicable ni transférer vers Mickaël la responsabilité de détecter les régressions que Playwright peut raisonnablement vérifier.

Lorsqu’une modification nécessite une validation d’interface :

- exécuter en arrière-plan la **suite automatisée applicable complète**, y compris les tests de régression déjà pertinents pour la zone modifiée ;
- si Mickaël choisit le mode VISIBLE, la démonstration visible peut être limitée aux scénarios utiles à observer, mais elle vient **en complément** de la suite complète et ne la remplace jamais ;
- ne pas supprimer, ignorer, contourner ou réduire un test uniquement pour accélérer la session ;
- un test existant qui échoue doit être traité comme un signal à comprendre, pas comme une étape à sauter ;
- lorsque de nouvelles fonctions ou de nouveaux risques deviennent automatisables de manière proportionnée, étendre la suite afin de conserver l’objectif que Mickaël n’ait normalement pas à repasser manuellement derrière les contrôles automatiques ;
- la vérification manuelle de Mickaël reste disponible pour son confort ou pour les propriétés réellement humaines/physiques, mais elle ne doit pas devenir le mécanisme par défaut pour compenser une automatisation insuffisante.

Autrement dit, **on réduit le temps perdu autour des tests, jamais la qualité des tests eux-mêmes**.

La Preview HTTPS est un accès manuel complémentaire. Sa vérification ou sa création ne doit pas retarder inutilement le lancement Playwright lorsque le test lui-même est local et indépendant de Vercel. Une Preview existante correspondant exactement au SHA testé doit être réutilisée lorsqu’elle est encore accessible. Un nouveau déploiement n’est créé que si aucune Preview vérifiable du bon état n’existe et qu’un lien manuel est réellement nécessaire pour la session.

Ce principe de simplicité n’autorise jamais à sauter un contrôle technique requis ; il interdit seulement de refaire des préparations ou des preuves sans valeur supplémentaire.

Ce garde-fou organise le choix d’exécution et l’accès manuel à la Preview ; il ne crée pas à lui seul une exigence de validation humaine pour chaque test et ne remplace aucune preuve technique requise.

## Conditions de transition

Le Batch 6 satisfaisait les conditions nécessaires au Batch suivant : clôture réelle, revue indépendante passée, validation humaine acquise, `next_batch_allowed: true`, PR #64 fusionnée et intégration vérifiée depuis GitHub.

Le Batch 7 est maintenant **ouvert**. `workflow/state.json` porte donc `current_batch: 7`, `batch_status: open`, `risk: sensitive`, `independent_review: pending`, `owner_approval: not_required` et `next_batch_allowed: false`.

Aucun Batch 8 ne peut être préparé ou démarré tant que le Batch 7 n’est pas réellement clôturé selon les règles de `DEVELOPMENT.md` et que son intégration n’a pas été vérifiée.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Les fichiers `BATCH<n>.md` sont des dossiers de Batch et ne remplacent pas les documents canoniques.

## Règles opérationnelles

- GitHub est la source de vérité pour l’état réel, les branches, commits, PR, checks et Issues.
- Ne pas transformer une déclaration d’agent en preuve.
- Avant une PR de validation ou d’intégration, effectuer le préflight en lecture seule des contrôles applicables.
- Pour toute session locale/manuelle de tests d’interface, appliquer le garde-fou permanent ci-dessus : demander le mode VISIBLE ou ARRIÈRE-PLAN avant exécution, réutiliser le chemin Playwright déjà fonctionnel sans préparation superflue, exécuter la suite automatisée applicable sans réduction de couverture et fournir une Preview HTTPS vérifiée lorsqu’elle est disponible.
- Pour les missions Codex locales sous Windows, utiliser en priorité le dépôt Filora local déjà disponible lorsque cela respecte l’indépendance de la mission.
- Réserver Codex Security aux propriétés qui justifient réellement une revue de sécurité renforcée.
- Éviter les boucles de revue sans réduction de risque réelle.
- Ne pas ajouter de dépendance, abstraction ou processus sans besoin concret.
- Ne pas traiter opportunément un finding reporté simplement parce qu’il est facile à corriger pendant le Batch.
