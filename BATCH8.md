# BATCH8.md — Installation PWA Test et Officielle

**Statut : en cours**  
**Date de démarrage : 2026-08-31**

## Intention

Permettre d’installer Filora comme une véritable application web installable depuis Chrome, avec deux applications clairement séparées :

- **Filora Test**, alimentée par `test-preview`, pour recevoir et valider les évolutions avant promotion ;
- **Filora**, alimentée par `main`, pour l’usage officiel et stable.

Le Batch reste volontairement limité à l’installation, l’identité des deux applications, l’isolation de leurs données locales et un mécanisme de mise à jour contrôlé. Il n’introduit pas de nouvelle fonctionnalité métier de stock.

## État de départ vérifié

- Batch 7 clôturé ;
- PR #65 réellement fusionnée dans `test-preview` ;
- HEAD de `test-preview` vérifié avant démarrage : `810b4e3cbbac81ce1565a9cb303634d0888ccf69` ;
- `workflow/state.json` du Batch 7 : `closed / critical / independent_review: passed / owner_approval: obtained / next_batch_allowed: true` ;
- aucune Issue GitHub ouverte et aucune PR GitHub ouverte au préflight ;
- Playwright `1.62.1` est intégré avec Chromium uniquement ;
- la suite E2E existante comprend 33 tests et la CI exécute `npm run test:e2e` sans raccourcir la suite ;
- Graphify `0.9.53` a été essayé puis retiré au Batch 7, verdict **RETIRER**.

## Résultat utilisateur attendu

À la fin du Batch 8, l’utilisateur doit pouvoir installer et conserver côte à côte :

1. **Filora Test** ;
2. **Filora**.

Chaque application doit :

- disposer de son identité PWA propre ;
- être installable depuis Chrome lorsqu’elle est ouverte sur son URL HTTPS stable ;
- se lancer en mode application autonome plutôt que dans une fenêtre Chrome classique ;
- conserver ses propres données locales sans mélange avec l’autre application ;
- signaler lorsqu’une nouvelle version est disponible ;
- appliquer cette nouvelle version uniquement après une action explicite **Mettre à jour**, puis recharger proprement l’application.

## Séparation Test / Officielle

### Filora Test

- source fonctionnelle : `test-preview` ;
- reçoit les changements destinés aux validations du projet ;
- sert aux tests humains des nouveaux Batches ;
- doit être visuellement identifiable comme version **TEST** afin de réduire le risque de saisie dans la mauvaise application.

### Filora officielle

- source fonctionnelle : `main` ;
- reste stable pendant le développement d’un Batch ;
- ne reçoit une évolution qu’après validation et promotion vers `main` selon le flux normal Filora.

## Origines stables et isolation des données

Deux noms ou deux manifestes ne suffisent pas à garantir l’isolation des données navigateur.

Le Batch doit vérifier et utiliser **deux origines HTTPS stables réellement distinctes** pour Test et Officielle. Une simple différence de chemin sur une même origine ne doit pas être présentée comme une preuve d’isolation.

Les URLs exactes ne sont pas inventées dans ce document : elles devront être déterminées et vérifiées sur la configuration de déploiement réellement disponible.

La preuve d’isolation doit démontrer qu’une donnée créée dans Filora Test n’apparaît pas dans Filora officielle et réciproquement.

## Mise à jour contrôlée

Le mécanisme de mise à jour doit rester simple et compréhensible :

1. une nouvelle version applicative devient disponible ;
2. l’application déjà ouverte détecte cette nouvelle version sans remplacer brutalement la session en cours ;
3. l’interface affiche une information explicite de type **Mise à jour disponible** ;
4. l’utilisateur choisit **Mettre à jour** ;
5. la nouvelle version prend la main et l’application se recharge proprement.

Une version installée ne doit pas pouvoir rester silencieusement bloquée indéfiniment sur un ancien code sans information lorsqu’une mise à jour contrôlable est disponible.

## Frontière offline / cache

Le Batch 8 n’introduit pas une stratégie offline métier complexe.

En particulier :

- aucune copie secondaire du stock n’est créée pour le service worker ;
- IndexedDB reste l’autorité technique locale actuelle des données métier persistantes ;
- aucun cache de données métier, d’API ou de synchronisation distante n’est introduit ;
- aucun compte, cloud ou synchronisation n’est ajouté ;
- les mécanismes nécessaires au shell/installabilité et à la mise à jour doivent rester minimaux et proportionnés.

## Playwright et non-régression

La suite Playwright existante reste une base obligatoire du Batch :

- les **33 tests existants restent présents** ;
- la CI doit continuer à exécuter la suite complète via `npm run test:e2e` ;
- aucun test ne doit être ignoré, raccourci, sélectionné ou affaibli pour accélérer le Batch ;
- les nouveaux comportements PWA automatisables doivent recevoir des tests proportionnés lorsqu’ils peuvent être vérifiés fiablement dans l’environnement disponible ;
- l’installation réelle et le comportement de lancement sur les appareils utilisés restent soumis à validation humaine lorsqu’ils ne peuvent pas être prouvés par Playwright seul.

## Findings / décisions avant implémentation

### À traiter dans Batch 8

- rendre Filora Test installable depuis une origine HTTPS stable liée à `test-preview` ;
- rendre Filora officielle installable séparément depuis une origine HTTPS stable liée à `main` ;
- garantir des identités PWA distinctes ;
- démontrer l’isolation réelle des données locales entre les deux origines ;
- fournir une différenciation visuelle claire de Filora Test ;
- fournir un mécanisme de mise à jour contrôlé avec action utilisateur explicite ;
- vérifier le flux d’installation et de mise à jour sur les appareils réellement utilisés ;
- conserver la suite Playwright complète sans affaiblissement ;
- synchroniser `PROJECT_STATE.md` et la fin de `BATCH7.md` avec la fusion réellement acquise de la PR #65.

### Reportés

- consommations et mouvements de filament : **Batch 9 prévu** ;
- pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine ;
- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI.

La réserve historique `gitDirty` n’appelle pas de développement dédié dans ce Batch. Lorsqu’une Preview contrôlée du bon état sera utilisée, son SHA et sa propreté devront être vérifiés directement plutôt que supposés.

### Rejetés

- Graphify `0.9.53` comme outil Filora permanent dans l’environnement Windows/Codex déjà essayé ;
- mélange des consommations métier dans le Batch 8 ; elles restent volontairement réservées au Batch 9.

## Hors périmètre

- consommations de filament ;
- historique métier de stock ;
- nouvelles pesées et recalages ;
- inventaire ;
- redesign global du menu Stock ;
- cache offline métier ;
- synchronisation distante ;
- comptes utilisateurs ;
- cloud ;
- nouvelle architecture métier ;
- modification des garde-fous ou de la CI Playwright pour réduire les contrôles.

## Classification F4.2 / F4.3

**Sensible au démarrage, relevé à Critique pour la promotion cumulative vers `main`.**

Le travail PWA du Batch 8 est sensible par nature : il touche l’installation, le mécanisme de mise à jour, le comportement de déploiement/origine et le build, sans migration destructive ni changement de l’autorité métier centrale.

Avant la promotion vers `main`, le diff réel `main...test-preview` a toutefois été vérifié. `main` est encore sur l’état promu à l’issue du Batch 2 et la promotion cumulative inclut des changements de Batches ultérieurs, dont `DEVELOPMENT.md` et le workflow Playwright. Ces chemins constituent des surfaces de contrôle Critiques selon les garde-fous Filora. La classification de l’état machine est donc relevée à **Critique** avant l’ouverture de la PR de promotion, sans modifier ni affaiblir les garde-fous.

Cette reclassification Critique et la préparation de la promotion ont été explicitement approuvées par Mickaël le 2026-08-31.

## F4.4 — décision propriétaire

Le comportement produit et le découpage ont été explicitement approuvés par Mickaël avant démarrage : deux applications installables séparées, Test sur `test-preview`, Officielle sur `main`, données isolées et mise à jour contrôlée avec action utilisateur.

L’accord propriétaire couvre également la reclassification Critique nécessaire à la promotion cumulative vers `main`. Cette approbation définit l’intention et autorise la transition ; elle ne remplace pas les preuves techniques, la CI ni la revue indépendante du candidat exact.

### Jalon humain requis — EN ATTENTE

Une validation humaine sera nécessaire avant clôture pour les propriétés réellement observables, notamment :

- installation de **Filora Test** ;
- installation séparée de **Filora** ;
- présence simultanée des deux applications ;
- identification visuelle sans ambiguïté de la version Test ;
- lancement en mode application ;
- isolation observable des données ;
- apparition et utilisation du mécanisme **Mise à jour disponible → Mettre à jour** sur un scénario réel approprié.

À ce stade, l’installation réelle de Filora Test, son lancement standalone, son identification visuelle TEST et un scénario réel de mise à jour contrôlée ont été observés. L’installation de l’Officielle, la coexistence et l’isolation bidirectionnelle restent à acquérir avant clôture.

## Preuves attendues avant clôture

1. candidat exact identifié ;
2. deux origines HTTPS stables vérifiées, sans URL inventée ;
3. manifestes/identités PWA distincts et installabilité vérifiable ;
4. isolation réelle des stockages démontrée ;
5. mise à jour contrôlée démontrée sur une version installée ;
6. aucun cache métier ou mécanisme de synchronisation hors périmètre ;
7. suite Playwright complète conservée et verte, avec les tests nouveaux applicables ;
8. guard, architecture, typecheck et build applicables verts ;
9. validation humaine du comportement installable acquise ;
10. revue indépendante adaptée au niveau **Critique** sur le candidat exact de promotion ;
11. aucun finding bloquant non décidé ;
12. aucune promotion vers `main` présentée comme acquise avant les validations réellement nécessaires.

## Condition de clôture

Le Batch 8 pourra être clôturé lorsque Filora Test et Filora officielle sont réellement installables comme deux applications distinctes, que leurs données sont démontrées isolées, que le mécanisme de mise à jour contrôlé fonctionne sans stratégie offline métier disproportionnée, que les contrôles automatiques applicables sont verts, que la validation humaine est acquise et qu’aucun finding bloquant ne reste non décidé.
