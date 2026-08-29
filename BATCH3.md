# BATCH3.md — Fondation de persistance locale et premier flux de bobine pesée

**Statut : en cours**  
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

## Propriétés à démontrer

1. la persistance reste une infrastructure et ne devient pas l'autorité métier ;
2. le sens conceptuel `UI → opération métier → persistance` reste respecté ;
3. la base possède une version explicite ;
4. une bobine créée peut être relue sans perte silencieuse ;
5. les échecs de stockage sont explicites ;
6. aucune seconde autorité de stock n'est introduite ;
7. le poids brut et la tare conservent les valeurs décimales utiles ;
8. l'origine de la tare reste identifiable ;
9. une tare supérieure au poids brut est refusée avant persistance ;
10. une création avec un identifiant déjà présent échoue sans écraser les données existantes ;
11. la quantité disponible du premier flux est dérivée des faits persistés et n'est pas une seconde valeur d'autorité ;
12. aucune donnée réelle n'est nécessaire pour clôturer ce Batch ;
13. le choix entre IndexedDB direct et l'ajout de Dexie reste proportionné au besoin réel et doit être explicitement confirmé avant clôture.

## État technique actuel de la persistance

L'implémentation courante utilise IndexedDB directement avec :

- une base locale nommée `filora` ;
- une version explicite `1` ;
- un object store `spoolIdentities` ;
- une création non-écrasante reposant sur l'opération IndexedDB `add` ;
- une lecture par identifiant ;
- une suppression contrôlée utilisée par les tests.

Dexie n'est pas introduit dans l'implémentation courante. Le fait que `DATA.md` le mentionne comme couche candidate ne vaut pas décision définitive : ce choix technique doit encore être explicitement confirmé ou écarté avant la clôture du Batch.

## Findings découverts et traités pendant le Batch

### Tare supérieure au poids brut

**Constat :** une version intermédiaire acceptait une tare supérieure au poids brut et bornait simplement le disponible à zéro. Cette situation pouvait masquer une donnée incohérente au moment de la création.

**Traitement :** la création refuse désormais explicitement `tare > poids brut` avant toute persistance. Des tests dédiés vérifient que la donnée incohérente n'est pas enregistrée.

**État :** traité dans le Batch et validé sur Preview.

### Écrasement silencieux d'un identifiant existant

**Constat :** une version intermédiaire utilisait une écriture pouvant remplacer silencieusement une bobine portant déjà le même identifiant.

**Traitement :** la création utilise désormais une opération non-écrasante. Une tentative de doublon échoue explicitement et les valeurs déjà stockées restent inchangées.

**État :** traité dans le Batch et validé sur Preview.

## Classification prévisionnelle

### F4.2 / F4.3

**Sensible.**

Justification : le Batch touche la persistance et des données métier de stock, introduit un modèle persistant versionné et manipule des mesures physiques. Ces éléments relèvent du niveau Sensible défini par `DEVELOPMENT.md`.

Le Batch n'est pas classé Critique à ce stade : aucune migration destructive, aucun affaiblissement de garde-fou et aucune modification simultanée d'un objet protégé et de son contrôle ne font partie du périmètre courant.

Toute découverte faisant apparaître un critère Critique impose une reclassification avant poursuite du travail concerné.

### F4.4

**Décision produit encadrée, choix technique encore à confirmer.**

`DATA.md` enregistre IndexedDB + Dexie comme stratégie initiale candidate. Le Batch démontre actuellement la persistance avec IndexedDB direct. Avant clôture, il faut confirmer explicitement si cette solution directe reste suffisante ou si Dexie apporte une valeur concrète justifiant son introduction.

## Revue indépendante prévue

Le niveau Sensible impose une revue indépendante avant clôture.

Par défaut, la revue prévue est **Codex normal**. Codex Security n'est pas requis en l'absence de propriété de sécurité spécifique justifiant ce niveau.

**État actuel : revue indépendante encore requise avant clôture.**

Une revue effectuée par l'agent qui a réalisé ou coordonné les modifications ne constitue pas cette preuve indépendante.

## Validation humaine applicative

### Jalon humain requis — VALIDÉ

Le périmètre ayant évolué vers un comportement observable, une validation humaine a été effectuée par Mickaël le 2026-08-29 sur la Preview du candidat fonctionnel.

Scénarios validés :

1. création de `bobine-test-2` avec 800 g brut et 200 g de tare : enregistrement réussi et 600 g de filament disponible affichés ;
2. création de `bobine-impossible` avec 150 g brut et 200 g de tare : opération refusée avec un message explicite, puis relecture confirmant qu'aucune bobine n'avait été créée ;
3. nouvelle création de `bobine-test-2` avec des valeurs différentes : opération refusée car l'identifiant existe déjà ;
4. relecture après cette tentative : les valeurs initiales 800 g / 200 g / 600 g sont restées inchangées.

Cette validation couvre le comportement observable introduit dans ce Batch. Elle ne vaut pas validation de fonctionnalités encore hors périmètre.

## Preuves requises avant clôture

1. état Git exact du candidat identifié ;
2. installation reproductible à partir du lockfile ;
3. typecheck vert ;
4. build vert ;
5. contrôle d'architecture vert ;
6. tests de persistance verts sur les propriétés définies dans ce Batch ;
7. preuve que la base possède une version explicite ;
8. preuve qu'une bobine de test peut être créée puis relue correctement ;
9. preuve qu'un échec de persistance remonte comme échec et non comme réussite ;
10. preuve que `tare > poids brut` est refusé sans persistance ;
11. preuve qu'un identifiant dupliqué est refusé sans écrasement ;
12. diff examiné pour confirmer qu'aucune voie `UI → persistance` contournant le domaine n'est introduite ;
13. validation humaine du comportement observable : acquise ;
14. revue indépendante du candidat exact sans finding bloquant non résolu : encore requise ;
15. choix technique IndexedDB direct / Dexie explicitement confirmé ;
16. classification F4.2/F4.3 et F4.4 confirmée à la clôture ;
17. findings découverts pendant le Batch explicitement traités, reportés, acceptés ou rejetés ;
18. `PROJECT_STATE.md` et `workflow/state.json` reflètent l'état réel à la transition de clôture.

## Condition de clôture

Le Batch 3 ne pourra être déclaré clôturé que lorsque la fondation de persistance et le premier flux de bobine pesée auront été vérifiés sur un candidat Git exact, que les preuves techniques applicables seront vertes, que le choix IndexedDB direct / Dexie aura été explicitement résolu, que la revue indépendante requise pour le niveau Sensible aura été obtenue sans finding bloquant restant et que les états de projet auront été synchronisés pour la transition de clôture.

La validation humaine du premier flux métier est acquise, mais elle ne suffit pas à elle seule à clôturer le Batch.
