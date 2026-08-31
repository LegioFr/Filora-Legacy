# BATCH8.md — Installation PWA Test et Officielle

**Statut : clôturé**  
**Date de démarrage : 2026-08-31**  
**Date de clôture : 2026-08-31**

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

Ces propriétés ont été acquises et vérifiées avant la clôture.

## Séparation Test / Officielle

### Filora Test

- source fonctionnelle : `test-preview` ;
- origine stable vérifiée : `https://filora-test-stable.vercel.app` ;
- reçoit les changements destinés aux validations du projet ;
- sert aux tests humains des nouveaux Batches ;
- est visuellement identifiable par le badge **TEST**.

### Filora officielle

- source fonctionnelle : `main` ;
- origine stable vérifiée : `https://filora-app-nine.vercel.app` ;
- reste stable pendant le développement d’un Batch ;
- ne reçoit une évolution qu’après validation et promotion vers `main` selon le flux normal Filora.

## Origines stables et isolation des données

Deux noms ou deux manifestes ne suffisent pas à garantir l’isolation des données navigateur.

Le Batch utilise deux origines HTTPS stables réellement distinctes :

- Test : `https://filora-test-stable.vercel.app` ;
- Officielle : `https://filora-app-nine.vercel.app`.

L’isolation a été démontrée sur la tablette réelle dans les deux sens :

- Filora Test contenait la bobine `SP-0001` tandis que Filora Official affichait `0 bobine` ;
- une donnée a ensuite été créée dans Filora Official et Mickaël a confirmé qu’elle n’apparaissait pas dans Filora Test.

Cette preuve humaine complète la séparation technique par origine ; aucune simple différence de chemin sur une origine commune n’est utilisée comme preuve.

## Mise à jour contrôlée

Le mécanisme de mise à jour suit le comportement attendu :

1. une nouvelle version applicative devient disponible ;
2. l’application déjà ouverte détecte cette nouvelle version sans remplacer brutalement la session en cours ;
3. l’interface affiche **Mise à jour disponible** ;
4. l’utilisateur choisit **Mettre à jour** ;
5. le worker en attente est activé puis l’application se recharge proprement.

Ce scénario a été observé réellement sur Filora Test. Un second bandeau de mise à jour a également été observé lors de la validation finale ; le domaine stable Test a été contrôlé côté Vercel et restait bien rattaché au déploiement Production de `test-preview`, sans dérive vers `main`.

## Frontière offline / cache

Le Batch 8 n’introduit pas une stratégie offline métier complexe.

En particulier :

- aucune copie secondaire du stock n’est créée pour le service worker ;
- IndexedDB reste l’autorité technique locale actuelle des données métier persistantes ;
- aucun cache de données métier, d’API ou de synchronisation distante n’est introduit ;
- aucun compte, cloud ou synchronisation n’est ajouté ;
- le service worker ne gère que le shell/versionnement nécessaire à l’installation et à la mise à jour contrôlée.

## Playwright et non-régression

La suite Playwright existante a été conservée et étendue sans affaiblissement :

- les **33 tests existants restent présents** ;
- 6 tests PWA ont été ajoutés ;
- la suite courante comprend donc **39 tests Playwright** ;
- la CI continue d’exécuter la suite complète via `npm run test:e2e` ;
- aucun test n’a été ignoré, raccourci, sélectionné ou affaibli pour accélérer le Batch ;
- le candidat exact de la PR #74 a obtenu le check E2E complet en **SUCCESS**.

Les validations matérielles impossibles à prouver uniquement par Playwright ont été réalisées sur la tablette réelle.

## Findings / décisions Batch 8

### Traités

- rendre Filora Test installable depuis une origine HTTPS stable liée à `test-preview` ;
- rendre Filora officielle installable séparément depuis une origine HTTPS stable liée à `main` ;
- garantir des identités PWA distinctes ;
- démontrer l’isolation réelle des données locales entre les deux origines ;
- fournir une différenciation visuelle claire de Filora Test ;
- fournir un mécanisme de mise à jour contrôlé avec action utilisateur explicite ;
- vérifier le flux d’installation et de mise à jour sur les appareils réellement utilisés ;
- conserver la suite Playwright complète sans affaiblissement ;
- synchroniser `PROJECT_STATE.md` avec l’état réel du projet ;
- findings Codex PWA successifs sur la PR #66 : corrigés avant intégration à `test-preview` ;
- finding P2 Codex sur `BATCH8.md` lors de la revue de la PR #74 : l’ancienne justification Critique décrivait encore le diff cumulatif antérieur au rattrapage de `main` ; corrigé dans cette synchronisation de clôture ;
- finding P2 Codex sur `PROJECT_STATE.md` lors de la revue de la PR #74 : l’action de reprise demandait encore d’ouvrir la PR de promotion alors que #74 existait déjà ; corrigé dans cette synchronisation de clôture.

### Reportés

- consommations et mouvements de filament : **Batch 9 prévu** ;
- pesées successives, corrections/recalages et inventaire ;
- nettoyage/suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- duplication des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine ;
- encodage implicite du guard sous Windows ;
- `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur de téléchargement basé sur l’état UI.

La réserve historique `gitDirty` n’appelle pas de développement dédié dans ce Batch. Les preuves finales utilisées ici sont rattachées aux états GitHub et déploiements effectivement vérifiés.

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

**Sensible pour l’implémentation PWA, conservé à Critique pour la promotion vers `main`.**

Le travail PWA est sensible par nature : il touche l’installation, le mécanisme de mise à jour, les origines de déploiement et le build, sans migration destructive ni changement de l’autorité métier centrale.

Avant la PR #74, `main` a été rattrapée séquentiellement jusqu’au Batch 7 par les PR #69 à #73. La promotion finale ne constituait donc plus une promotion cumulative depuis le Batch 2 :

- base #74 : `main` au SHA `795d68068fbaad47dda278e05345ff93eec6bc5c` ;
- head #74 : `test-preview` au SHA `0ed6227d46c4de5be7b2d0dfac900d4569792782` ;
- diff fonctionnel : transition Batch 7 → Batch 8 uniquement.

La mention précédente de `DEVELOPMENT.md` et du workflow Playwright comme surfaces présentes dans le diff de #74 était donc devenue obsolète et est retirée. Le niveau **Critique** a néanmoins été conservé comme surclassement volontaire déjà approuvé pour cette promotion officielle d’un mécanisme PWA durable d’installation/mise à jour et de deux canaux distincts. Ce niveau n’est pas présenté comme imposé par un chemin Critique encore présent dans le diff final.

Mickaël avait explicitement approuvé cette classification Critique et la promotion correspondante le 2026-08-31.

## F4.4 — décision propriétaire

**Décision propriétaire : obtenue.**

Mickaël a explicitement approuvé le comportement produit et le découpage : deux applications installables séparées, Test sur `test-preview`, Officielle sur `main`, données isolées et mise à jour contrôlée avec action utilisateur.

Son accord couvre aussi le niveau Critique retenu pour la promotion. Cette approbation définit l’intention et autorise la transition ; elle ne remplace pas les preuves techniques, la CI ni la revue indépendante.

### Jalon humain requis — ACQUIS

Les propriétés réellement observables ont été validées sur la tablette :

- **Filora Test** installée ;
- **Filora** officielle installée séparément sans désinstaller l’ancienne Filora historique ;
- présence simultanée des applications ;
- badge **TEST** visible uniquement sur la version Test ;
- Filora Official lancée en mode application autonome, sans barre Chrome ;
- Filora Official sans badge TEST ;
- isolation Test → Official démontrée avec `SP-0001` présente dans Test et absente d’Official ;
- isolation Official → Test démontrée après création d’une donnée dans Official et confirmation de son absence dans Test ;
- scénario réel **Mise à jour disponible → Mettre à jour** observé sur Filora Test.

## Revue indépendante Batch 8

La promotion Critique a reçu une revue Codex sur le candidat exact de la PR #74, commit revu `0ed6227d46c4de5be7b2d0dfac900d4569792782`, avec la base réelle `795d68068fbaad47dda278e05345ff93eec6bc5c`.

Codex n’a remonté aucun finding produit/PWA bloquant sur ce candidat. Deux findings P2 documentaires ont été remontés :

1. justification Critique encore fondée sur l’ancien diff cumulatif ;
2. `PROJECT_STATE.md` demandant encore d’ouvrir la PR de promotion.

Ces deux findings ont été explicitement décidés non bloquants pour la promotion parce qu’ils ne remettaient pas en cause une propriété produit, PWA ou de données, puis corrigés dans la synchronisation documentaire de clôture. Aucune boucle de revue supplémentaire n’est ajoutée pour ces corrections purement documentaires sans changement du code produit ni des mécanismes de contrôle.

**État de revue indépendante : `passed`.**

## Preuves acquises avant clôture

1. **Candidat exact :** PR #74, base `795d68068fbaad47dda278e05345ff93eec6bc5c`, head `0ed6227d46c4de5be7b2d0dfac900d4569792782`.
2. **Promotion :** PR #74 fusionnée dans `main`, merge `2a1b9221f28113de119d9aa7071c412d023564a1`.
3. **Origines stables :** `filora-test-stable.vercel.app` pour Test et `filora-app-nine.vercel.app` pour Official, distinctes et vérifiées.
4. **Identités PWA :** manifeste Test = `Filora Test`, manifeste Official = `Filora`, affichage `standalone`, icônes distinctes.
5. **Déploiement Official :** déploiement Production Vercel du merge `2a1b9221...` en `READY`; le domaine stable Official sert le manifeste officiel et un service worker versionné sur ce SHA.
6. **Déploiement Test :** le domaine stable Test reste rattaché au déploiement Production `test-preview` `0ed6227d...` et sert le manifeste `Filora Test`.
7. **Isolation :** démonstration matérielle dans les deux sens acquise sur la tablette.
8. **Mise à jour contrôlée :** démonstration réelle acquise, en plus du test Playwright correspondant.
9. **Frontière offline :** aucun cache métier, compte, cloud ou synchronisation distante ajouté ; le cache reste limité au shell/version applicative.
10. **Contrôles PR #74 :** `guard` SUCCESS, `sentinel` SUCCESS, Playwright E2E complet SUCCESS, Vercel `filora-app`, `filora-test-app` et `filora-test-stable` SUCCESS.
11. **Revue indépendante :** Codex a revu le commit exact `0ed6227d46...`; deux P2 documentaires décidés et corrigés, aucun finding bloquant produit/PWA.
12. **Issues/PR :** aucune Issue ouverte et aucune PR ouverte au préflight final de clôture.
13. **Documents canoniques :** aucun des quatre documents canoniques n’est modifié par cette clôture.
14. **Validations indisponibles :** aucune propriété obligatoire du Batch 8 ne reste non démontrée.

## Rapport de clôture

- **Intention / périmètre :** installation PWA Test et Officielle, identités séparées, origines distinctes, isolation locale et mise à jour contrôlée ; aucune fonctionnalité métier Stock ajoutée.
- **État technique produit :** Batch 8 promu dans `main` par #74 au merge `2a1b9221f28113de119d9aa7071c412d023564a1` ; candidat produit revu `0ed6227d46c4de5be7b2d0dfac900d4569792782`.
- **Changements réalisés :** runtime PWA, manifestes/icônes Test/Official, service worker versionné et contrôlé, tests PWA, validation stricte des icônes, configuration de canal de build.
- **Changements sensibles :** installation/mise à jour PWA, comportement de déploiement et origines ; classification finale Critique conservée pour la promotion.
- **F4.2/F4.3 :** **Critique**.
- **F4.4 :** **décision propriétaire, accord obtenu**.
- **Tests / contrôles :** applicables et verts sur le candidat de promotion exact.
- **Preuves supplémentaires :** validation réelle sur tablette et vérification directe des domaines/déploiements.
- **Review indépendante :** **passed**.
- **Findings :** deux P2 documentaires de #74 traités dans la clôture ; findings reportés listés plus haut inchangés.
- **Documents canoniques :** non modifiés.
- **Réserves bloquantes / validations manquantes :** aucune.

## Condition de clôture

**SATISFAITE.**

Filora Test et Filora officielle sont installables comme deux applications distinctes, leurs données ont été démontrées isolées dans les deux sens, le mécanisme de mise à jour contrôlé fonctionne sans stratégie offline métier disproportionnée, les contrôles automatiques applicables sont verts, la revue indépendante requise est acquise, la validation humaine est acquise et aucun finding bloquant ne reste non décidé.

Le Batch 8 est donc **clôturé**. Cette clôture autorise uniquement la transition machine `next_batch_allowed: true` ; elle ne démarre pas le Batch 9.
