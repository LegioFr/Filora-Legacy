# BATCH3.md — Fondation de persistance locale et premier flux de bobine pesée

**Statut : clôturé**  
**Date de préparation : 2026-08-29**

## Intention

Poser le premier socle de persistance locale fiable pour le domaine `spools`, de manière conforme à `DATA.md` et `ARCHITECTURE.md`, sans construire toute la gestion de stock ni utiliser Filora comme source principale de données réelles.

Le Batch 3 couvre désormais aussi un premier flux métier volontairement borné : créer une bobine pesée à partir d'un identifiant, d'un poids brut mesuré, d'une tare et de l'origine de cette tare, puis calculer et relire la quantité physique de filament disponible.

Ce flux reste un premier jalon. Il ne constitue pas encore la gestion complète du stock, des pesées successives, des consommations, des corrections ou de l'historique.

## État de départ vérifié

- Batch 2 clôturé et promu vers `main`.
- `workflow/state.json` autorisait le Batch suivant.
- aucune Issue ouverte pertinente au contrôle préalable ;
- aucune PR ouverte au contrôle préalable ;
- ruleset GitHub externe actif sur `main` et `test-preview` ;
- application de départ limitée à une fondation React/Vite et un domaine `spools` sans persistance métier ;
- `DATA.md` désigne IndexedDB + Dexie comme stratégie candidate, soumise à vérification technique avant utilisation de données réelles.

## Findings / Issues examinés avant préparation

Aucun finding ou Issue GitHub ouvert pertinent n'a été identifié au contrôle préalable du 2026-08-29.

Décisions initiales :

- à traiter dans ce Batch : aucun finding préexistant ;
- à reporter : aucun ;
- à accepter : aucun ;
- à rejeter : aucun.

## Évolution bornée du périmètre

Après la mise en place de la fondation de persistance, le Batch a été étendu à un comportement métier observable afin de produire un premier stock réellement mesuré plutôt qu'une nouvelle couche de gouvernance abstraite.

L'extension retenue est limitée à :

- créer une bobine avec une identité stable ;
- enregistrer son poids brut mesuré en grammes ;
- enregistrer la tare applicable en grammes ;
- conserver l'origine de la tare : support vide pesé ou valeur fabricant ;
- calculer le filament disponible par `poids brut mesuré - tare` ;
- relire la bobine depuis le stockage local ;
- refuser une tare supérieure au poids brut ;
- refuser la création d'une seconde bobine avec le même identifiant afin d'éviter un écrasement silencieux.

Cette évolution a rendu une validation humaine applicative pertinente et nécessaire.

## Dans le périmètre

1. définir un adaptateur de persistance local appartenant au domaine `spools` ou à son infrastructure dédiée, sans donner l'autorité métier à la couche de stockage ;
2. vérifier la stratégie candidate IndexedDB + Dexie et ne conserver une dépendance supplémentaire que si elle est réellement justifiée ;
3. définir une première base locale explicitement versionnée ;
4. introduire uniquement les structures persistantes nécessaires à la fondation et au premier flux de bobine pesée ;
5. démontrer des opérations d'écriture, lecture et suppression contrôlée sur des données de test ;
6. vérifier qu'une erreur de persistance n'est pas transformée silencieusement en réussite ;
7. préserver le chemin `UI → opération métier → persistance` ;
8. créer une bobine mesurée avec poids brut, tare et origine de tare ;
9. calculer la quantité physique disponible à partir de ces faits ;
10. refuser les données physiquement incohérentes lorsque la tare dépasse le poids brut ;
11. empêcher l'écrasement silencieux d'une bobine existante lors d'une création avec le même identifiant ;
12. ajouter les tests nécessaires à ces propriétés ;
13. maintenir les contrôles d'architecture existants ;
14. produire une Preview du comportement observable et obtenir la validation humaine correspondante.

## Hors périmètre

- gestion complète des références filament ;
- gestion complète du cycle de vie des bobines physiques ;
- pesées successives et recalages historiques ;
- consommations et corrections métier ;
- inventaire ;
- historique complet des mouvements ;
- sauvegarde/restauration complète de production ;
- migration de données réelles existantes ;
- synchronisation multi-appareil ;
- cloud ;
- authentification ;
- nouvelle architecture globale ou nouveau domaine métier ;
- modification des contrats canoniques sauf contradiction réellement découverte et traitée séparément selon la gouvernance.

## Propriétés démontrées

1. la persistance reste une infrastructure et ne devient pas l'autorité métier ;
2. le sens conceptuel `UI → opération métier → persistance` reste respecté ;
3. la base possède une version explicite ;
4. une bobine créée peut être relue sans perte silencieuse dans le scénario validé ;
5. les échecs de stockage couverts remontent explicitement ;
6. aucune seconde autorité de stock n'est introduite ;
7. le poids brut et la tare conservent les valeurs décimales utiles ;
8. l'origine de la tare reste identifiable ;
9. une tare supérieure au poids brut est refusée avant persistance ;
10. une création avec un identifiant déjà présent échoue sans écraser les données existantes ;
11. la quantité disponible du premier flux est dérivée des faits persistés et n'est pas une seconde valeur d'autorité ;
12. aucune donnée réelle n'est nécessaire pour clôturer ce Batch ;
13. IndexedDB direct est retenu pour ce périmètre sans ajouter Dexie, faute de problème concret justifiant cette dépendance supplémentaire.

## État technique final de la persistance

L'implémentation retenue pour le Batch 3 utilise IndexedDB directement avec :

- une base locale nommée `filora` ;
- une version explicite `1` ;
- un object store `spoolIdentities` ;
- une création non-écrasante reposant sur l'opération IndexedDB `add` ;
- une lecture par identifiant ;
- une suppression contrôlée utilisée par les tests.

Dexie n'est pas introduit dans ce Batch. `DATA.md` le présente comme couche candidate et non comme obligation. Pour le périmètre actuel, IndexedDB direct couvre le besoin sans dépendance ni abstraction supplémentaire. Dexie pourra être réévalué ultérieurement si les migrations, transactions ou évolutions de schéma deviennent suffisamment complexes pour qu'il résolve un problème concret.

## Findings découverts et traités pendant le Batch

### Tare supérieure au poids brut

**Constat :** une version intermédiaire acceptait une tare supérieure au poids brut et bornait simplement le disponible à zéro. Cette situation pouvait masquer une donnée incohérente au moment de la création.

**Traitement :** la création refuse désormais explicitement `tare > poids brut` avant toute persistance. Des tests dédiés vérifient que la donnée incohérente n'est pas enregistrée.

**État :** traité dans le Batch et validé sur Preview.

### Écrasement silencieux d'un identifiant existant

**Constat :** une version intermédiaire utilisait une écriture pouvant remplacer silencieusement une bobine portant déjà le même identifiant.

**Traitement :** la création utilise désormais une opération non-écrasante. Une tentative de doublon échoue explicitement et les valeurs déjà stockées restent inchangées.

**État :** traité dans le Batch et validé sur Preview.

## Findings non bloquants de la revue indépendante

### Tests IndexedDB simulés

**Constat :** les tests automatisés de persistance utilisent un faux IndexedDB interne et ne constituent pas, seuls, une preuve du comportement d'un moteur de navigateur réel après rechargement.

**Décision : accepté pour le Batch 3.** Les propriétés métier et d'erreur sont couvertes automatiquement, et la validation humaine sur Preview a vérifié le flux observable dans un navigateur réel, y compris la relecture après persistance et la conservation des données après tentative d'écrasement. Cette décision ne vaut pas preuve de compatibilité avec tous les navigateurs ni de recovery complet.

### Encodage implicite du guard sous Windows

**Constat :** la revue indépendante a signalé un défaut de portabilité préexistant lié à un décodage implicite du guard sur l'hôte Windows de revue. La CI Linux et l'exécution UTF-8 utilisée par la revue réussissent.

**Décision : reporté hors du Batch 3.** Ce point ne remet pas en cause les propriétés métier ou de persistance que le Batch 3 devait démontrer et ne justifie pas une modification opportuniste du garde-fou dans ce Batch.

## Classification finale

### F4.2 / F4.3

**Sensible.**

Justification : le Batch touche la persistance et des données métier de stock, introduit un modèle persistant versionné et manipule des mesures physiques. Ces éléments relèvent du niveau Sensible défini par `DEVELOPMENT.md`.

Le Batch n'est pas classé Critique : aucune migration destructive, aucun affaiblissement de garde-fou et aucune modification simultanée d'un objet protégé et de son contrôle ne font partie du périmètre final.

### F4.4

**Choix technique réversible confirmé.**

Le comportement produit du premier flux a été validé par Mickaël. Pour la couche d'accès locale, IndexedDB direct est retenu pour le Batch 3. L'introduction de Dexie n'est pas nécessaire à ce stade car aucun problème concret du périmètre actuel ne justifie cette dépendance supplémentaire. Ce choix reste réévaluable ultérieurement si le besoin technique évolue.

## Revue indépendante

Le niveau Sensible imposait une revue indépendante avant clôture.

Une revue **Codex normal** a été effectuée en lecture seule sur le candidat fonctionnel exact `04dc1291a40ccb6d01d210e28357f2659f5f0a36`, après vérification du SHA, de la PR, du diff, des contrats et de la CI.

Résultat communiqué par la revue :

- SHA vérifié : oui ;
- CI vérifiée : verte ;
- IndexedDB direct vs Dexie : **ACCEPTABLE** ;
- verdict : **CONFORME** ;
- bloquants : **aucun** ;
- prêt pour intégration à `test-preview` : **oui**.

Les deux observations non bloquantes sont consignées ci-dessus avec leur décision. La revue n'a pas rejoué la validation humaine, conformément à sa mission.

Le commit de clôture qui met à jour uniquement `BATCH3.md`, `PROJECT_STATE.md` et `workflow/state.json` ne modifie pas l'implémentation fonctionnelle examinée par Codex ; sa propre cohérence reste soumise aux contrôles mécaniques de la PR avant intégration.

## Validation humaine applicative

### Jalon humain requis — VALIDÉ

Le périmètre ayant évolué vers un comportement observable, une validation humaine a été effectuée par Mickaël le 2026-08-29 sur la Preview du candidat fonctionnel.

Scénarios validés :

1. création de `bobine-test-2` avec 800 g brut et 200 g de tare : enregistrement réussi et 600 g de filament disponible affichés ;
2. création de `bobine-impossible` avec 150 g brut et 200 g de tare : opération refusée avec un message explicite, puis relecture confirmant qu'aucune bobine n'avait été créée ;
3. nouvelle création de `bobine-test-2` avec des valeurs différentes : opération refusée car l'identifiant existe déjà ;
4. relecture après cette tentative : les valeurs initiales 800 g / 200 g / 600 g sont restées inchangées.

Cette validation couvre le comportement observable introduit dans ce Batch. Elle ne vaut pas validation de fonctionnalités encore hors périmètre.

## Preuves de clôture

1. candidat fonctionnel exact identifié et revu ;
2. installation reproductible à partir du lockfile vérifiée en CI ;
3. typecheck vert ;
4. build vert ;
5. contrôle d'architecture vert ;
6. tests de persistance verts sur les propriétés définies dans ce Batch ;
7. base locale explicitement versionnée ;
8. création puis relecture d'une bobine vérifiées ;
9. propagation d'échecs de persistance couverts par les tests ;
10. `tare > poids brut` refusé sans persistance ;
11. identifiant dupliqué refusé sans écrasement ;
12. frontière `UI → opération métier → persistance` examinée ;
13. validation humaine du comportement observable : acquise ;
14. revue indépendante : acquise, verdict CONFORME sans bloquant ;
15. choix IndexedDB direct / Dexie : IndexedDB direct confirmé pour ce périmètre ;
16. classification finale : Sensible, décision technique réversible ;
17. findings de la revue : explicitement acceptés ou reportés ci-dessus ;
18. état de clôture synchronisé dans `PROJECT_STATE.md` et `workflow/state.json` par la transition approuvée.

## Condition de clôture

Les conditions applicables au périmètre du Batch 3 sont satisfaites. Le Batch 3 est déclaré **clôturé** sur sa branche de travail, sous réserve du succès des contrôles mécaniques du commit de clôture avant son intégration vers `test-preview`.

Cette clôture n'autorise pas encore l'utilisation de Filora comme source principale de données réelles : la preuve complète de sauvegarde/restauration prévue par `DATA.md` reste hors du périmètre de ce Batch.
