# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-29**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 3 — persistance locale et premier flux métier de bobine pesée
- status: en cours
- git: lire les HEAD, PR, workflows, artefacts, rulesets et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: obtenir la revue indépendante du candidat exact, confirmer le choix IndexedDB direct / Dexie, puis réévaluer toutes les conditions de clôture avant toute intégration vers `test-preview`

## État courant

- **Étape :** Batch 3 en cours sur une branche dédiée ; fondation de persistance locale implémentée et premier flux métier de bobine pesée validé humainement.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** ouvert ; la fondation de persistance et un premier flux borné de création de bobine mesurée sont implémentés, mais la revue indépendante et la confirmation du choix technique de persistance restent nécessaires avant clôture.
- **Issue #21 :** traitée et fermée après intégration des preuves de Batch 2.
- **Issue #46 :** traitée et fermée après activation d’un ruleset GitHub externe et contre-vérification opérationnelle.
- **Issues/findings ouverts pertinents avant Batch 3 :** aucun au contrôle GitHub préalable du 2026-08-29.
- **Protection externe GitHub :** un ruleset actif protège `main` et `test-preview`, exige une PR et le check `sentinel`, interdit les suppressions et force-push, et réserve le bypass administrateur au chemin PR explicite.
- **Ancienne solution Drive :** abandonnée et retirée du périmètre actif.
- **Solution Claude retenue :** workflow sans secret générant depuis le SHA exact de `test-preview` un artefact temporaire de contre-vérification documentaire.
- **Garde-fous permanents de revue IA :** actifs dans `DEVELOPMENT.md` et leurs contrôles associés.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail Batch 3 :** `batch3/persistence-foundation`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Batch 3 — périmètre réel actuel

L’intention reste de poser un socle de persistance locale fiable pour le domaine `spools` sans construire toute la gestion de stock et sans utiliser Filora comme source principale de données réelles avant les garanties de récupération prévues dans `DATA.md`.

Le Batch comprend désormais un premier comportement métier observable :

- créer une bobine à partir d’un identifiant ;
- enregistrer un poids brut mesuré en grammes ;
- enregistrer une tare et son origine ;
- calculer le filament disponible à partir de `poids brut - tare` ;
- relire la bobine depuis le stockage local ;
- refuser une tare supérieure au poids brut ;
- refuser une création avec un identifiant existant sans écraser les données déjà stockées.

Restent hors périmètre : gestion complète des références filament, cycle de vie complet des bobines, pesées successives, recalages, consommations, corrections, inventaire, historique complet, recovery complet de production, synchronisation multi-appareil, cloud et authentification.

## Persistance Batch 3

L’implémentation courante utilise IndexedDB directement :

- base locale `filora` ;
- version explicite `1` ;
- object store `spoolIdentities` ;
- création non-écrasante ;
- lecture par identifiant ;
- suppression contrôlée pour les tests.

`DATA.md` présente IndexedDB + Dexie comme stratégie candidate. Dexie n’est pas introduit dans l’implémentation courante. Le choix de conserver IndexedDB direct ou d’introduire Dexie doit encore être explicitement confirmé avant clôture ; aucune conclusion définitive ne doit être déduite de l’absence actuelle de dépendance.

## Classification Batch 3

- **F4.2 / F4.3 : Sensible** : persistance locale, données métier de stock, modèle persistant versionné et mesures physiques.
- **F4.4 :** la stratégie de persistance reste un choix technique à confirmer avant clôture ; `DATA.md` n’avait enregistré IndexedDB + Dexie que comme candidat.
- **Revue indépendante requise :** Codex normal par défaut. Codex Security n’est pas requis sans propriété de sécurité spécifique justifiant ce niveau.
- **État de la revue indépendante :** encore requise avant clôture.

## Validation humaine applicative

**Réussie le 2026-08-29** sur le premier flux métier observable.

Mickaël a validé sur Preview :

1. création d’une bobine avec 800 g de poids brut et 200 g de tare, donnant 600 g disponibles ;
2. refus d’une tare de 200 g pour un poids brut de 150 g, puis confirmation que cette bobine n’avait pas été créée ;
3. refus d’une nouvelle création utilisant un identifiant déjà existant ;
4. relecture de la bobine après la tentative de doublon, confirmant que les valeurs initiales 800 g / 200 g / 600 g n’avaient pas été écrasées.

Cette validation couvre uniquement ce comportement actuellement implémenté.

## Findings / Issues pertinents

- Issue #21 — fermée.
- Issue #46 — fermée.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- **Avant Batch 3 : aucun finding ou Issue GitHub ouvert pertinent identifié.**
- **Finding Batch 3 — tare supérieure au poids brut : traité.** La création refuse désormais l’incohérence avant persistance ; comportement et absence d’enregistrement validés.
- **Finding Batch 3 — identifiant dupliqué pouvant écraser une bobine : traité.** La création est désormais non-écrasante ; refus et conservation des valeurs existantes validés.
- Toute nouvelle découverte doit être explicitement traitée, reportée, acceptée ou rejetée avant clôture.

## Réserves / limites connues

- Filora ne possède pas encore de preuve complète de recovery ; la persistance locale ne constitue donc pas une sauvegarde suffisante pour en faire la source principale de données réelles.
- Seul un sous-ensemble des invariants de stock nécessaire au premier flux de bobine pesée est actuellement implémenté.
- Les consommations, corrections, pesées successives, recalages et historiques ne sont pas encore implémentés.
- Le choix IndexedDB direct / Dexie n’est pas encore définitivement confirmé.
- La revue indépendante du candidat exact n’est pas encore acquise.
- Aucune promotion vers `test-preview` ou `main` ne doit être déduite de la seule validation humaine du flux métier.

## Prochaine action

1. Vérifier l’état Git et les Issues/findings ouverts avant la clôture.
2. Obtenir la revue indépendante requise sur le candidat exact du Batch 3.
3. Traiter tout finding issu de cette revue avant poursuite.
4. Confirmer explicitement le choix technique entre IndexedDB direct et l’introduction de Dexie.
5. Vérifier à nouveau les preuves techniques et les conditions de clôture de `BATCH3.md`.
6. Ne mettre à jour `workflow/state.json` et les états de clôture que lors d’une transition explicitement approuvée.
7. Ne promouvoir vers `test-preview`, puis éventuellement vers `main`, qu’après validation de toutes les conditions applicables.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md`, `BATCH2.md` et `BATCH3.md` conservent les dossiers propres à leurs Batches et ne remplacent pas les documents canoniques.
