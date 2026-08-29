# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-29**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 3 — fondation de persistance locale du domaine spools
- status: en cours
- git: lire les HEAD, PR, workflows, artefacts, rulesets et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: poursuivre le périmètre borné défini dans `BATCH3.md` sur la branche Batch 3, puis intégrer vers `test-preview` uniquement après les validations applicables

## État courant

- **Étape :** Batch 3 en cours sur une branche dédiée ; première fondation technique de persistance locale en cours de validation.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** ouvert avec un périmètre limité à la fondation de persistance locale du domaine `spools` ; voir `BATCH3.md`.
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

## Batch 3 — intention et limites

L’intention est de poser le premier socle de persistance locale fiable pour le domaine `spools` sans construire encore toute la gestion de stock et sans confier à Filora des données réelles comme source principale.

Le Batch 3 doit notamment vérifier la stratégie candidate IndexedDB + Dexie prévue dans `DATA.md`, conserver la persistance comme infrastructure et préserver le chemin d’autorité `UI → opération métier → persistance` défini dans `ARCHITECTURE.md`.

Il reste hors périmètre de ce Batch : stock métier complet, pesées, consommations, corrections, inventaire, historique complet, recovery complet de production, synchronisation multi-appareil, cloud et authentification.

## Classification Batch 3

- **F4.2 / F4.3 : Sensible** : persistance locale, dépendance potentielle Dexie, modèle persistant versionné et accès aux données.
- **F4.4 :** la stratégie IndexedDB + Dexie est déjà enregistrée dans `DATA.md` comme candidate à vérifier, pas comme choix définitivement acquis. Le Batch peut la tester techniquement. Une modification durable du contrat ou une nouvelle contrainte importante nécessitera l’arbitrage approprié.
- **Revue indépendante prévue :** Codex normal par défaut. Codex Security n’est pas requis sans propriété de sécurité spécifique justifiant ce niveau.
- **Validation humaine applicative :** non requise tant qu’aucun comportement applicatif observable pertinent n’est ajouté ; à réévaluer si le périmètre change.

## Findings / Issues pertinents

- Issue #21 — fermée.
- Issue #46 — fermée.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- **Avant Batch 3 : aucun finding ou Issue GitHub ouvert pertinent identifié.**
- Toute découverte hors périmètre pendant Batch 3 doit devenir un finding explicite et recevoir une décision avant clôture.

## Réserves / limites connues

- La persistance métier de Filora est en cours de fondation et n’est pas encore validée pour des données réelles.
- Filora ne possède pas encore de preuve complète de recovery.
- Les invariants DATA liés aux mutations réelles de stock ne sont pas encore implémentés.
- La stratégie IndexedDB + Dexie reste candidate tant que le Batch 3 n’a pas apporté les preuves techniques prévues.
- Aucune donnée réelle ne doit être confiée à la nouvelle fondation au-delà de ce que les contrats canoniques et les preuves permettent.

## Prochaine action

1. Poursuivre uniquement la fondation définie dans `BATCH3.md`.
2. Vérifier Dexie/IndexedDB techniquement avant de considérer le choix comme retenu.
3. Ajouter et valider les tests de persistance et d’échec prévus.
4. Maintenir la frontière architecturale et ne pas créer de voie directe `UI → persistance`.
5. Faire la revue indépendante requise sur le candidat exact avant clôture.
6. Ne promouvoir vers `test-preview` puis `main` qu’après les validations applicables.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md`, `BATCH2.md` et `BATCH3.md` conservent les dossiers propres à leurs Batches et ne remplacent pas les documents canoniques.
