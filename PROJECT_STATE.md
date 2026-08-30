# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 7 — automatisation des tests d’interface avec Playwright
- status: ouvert
- git: lire le HEAD de `batch7/playwright-automation`, sa base `test-preview`, les workflows, Issues, PR et findings directement depuis GitHub avant toute décision de validation ou d’intégration
- next_action: réaliser d’abord le smoke test local de faisabilité Codex → Playwright avec Chromium sur un scénario simple ; ne préparer l’intégration CI qu’après obtention d’une petite suite E2E locale réellement stable

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`, non encore promu vers `main`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé, validé et réellement intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé, validé et réellement intégré à `test-preview` par la PR #64 ; le HEAD de `test-preview` a été vérifié après fusion avant l’ouverture du Batch 7.
- **Batch 7 :** ouvert sur `batch7/playwright-automation` pour introduire progressivement Playwright, commencer par une preuve de faisabilité locale Codex → Playwright, puis construire une petite suite E2E stable avant toute intégration CI.
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
- Pour les missions Codex locales sous Windows, utiliser en priorité le dépôt Filora local déjà disponible lorsque cela respecte l’indépendance de la mission.
- Réserver Codex Security aux propriétés qui justifient réellement une revue de sécurité renforcée.
- Éviter les boucles de revue sans réduction de risque réelle.
- Ne pas ajouter de dépendance, abstraction ou processus sans besoin concret.
- Ne pas traiter opportunément un finding reporté simplement parce qu’il est facile à corriger pendant le Batch.
