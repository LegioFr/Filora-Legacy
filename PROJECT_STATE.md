# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-29**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 3 — persistance locale et premier flux métier de bobine pesée
- status: clôturé
- git: lire les HEAD, PR, workflows, artefacts, rulesets et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: vérifier que le commit de clôture est entièrement vert, puis intégrer la branche Batch 3 vers `test-preview` par la PR existante ; ne pas démarrer un Batch suivant avant cette intégration et sa vérification

## État courant

- **Étape :** Batch 3 clôturé sur sa branche de travail ; intégration vers `test-preview` encore à effectuer.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé après CI verte du candidat fonctionnel, validation humaine du premier flux métier, revue indépendante Codex conforme et décision de conserver IndexedDB direct pour ce périmètre. Le commit de clôture doit encore passer ses contrôles mécaniques avant intégration vers `test-preview`.
- **Issue #21 :** traitée et fermée après intégration des preuves de Batch 2.
- **Issue #46 :** traitée et fermée après activation d’un ruleset GitHub externe et contre-vérification opérationnelle.
- **Issues/findings ouverts pertinents au dernier contrôle GitHub :** aucun.
- **Protection externe GitHub :** un ruleset actif protège `main` et `test-preview`, exige une PR et le check `sentinel`, interdit les suppressions et force-push, et réserve le bypass administrateur au chemin PR explicite.
- **Ancienne solution Drive :** abandonnée et retirée du périmètre actif.
- **Solution Claude retenue :** workflow sans secret générant depuis le SHA exact de `test-preview` un artefact temporaire de contre-vérification documentaire.
- **Garde-fous permanents de revue IA :** actifs dans `DEVELOPMENT.md` et leurs contrôles associés.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail Batch 3 :** `batch3/persistence-foundation`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Batch 3 — résultat fonctionnel

Le Batch 3 pose un premier socle de persistance locale fiable pour le domaine `spools` et un premier comportement métier observable :

- créer une bobine à partir d’un identifiant stable ;
- enregistrer un poids brut mesuré en grammes ;
- enregistrer une tare et son origine ;
- calculer le filament disponible à partir de `poids brut - tare` ;
- relire la bobine depuis le stockage local ;
- refuser une tare supérieure au poids brut ;
- refuser une création avec un identifiant existant sans écraser les données déjà stockées.

Restent hors périmètre : gestion complète des références filament, cycle de vie complet des bobines, pesées successives, recalages, consommations, corrections, inventaire, historique complet, recovery complet de production, synchronisation multi-appareil, cloud et authentification.

## Persistance Batch 3

La solution retenue pour ce Batch utilise IndexedDB directement :

- base locale `filora` ;
- version explicite `1` ;
- object store `spoolIdentities` ;
- création non-écrasante ;
- lecture par identifiant ;
- suppression contrôlée pour les tests.

`DATA.md` présente IndexedDB + Dexie comme stratégie candidate. Après vérification du besoin actuel et revue indépendante, **Dexie n’est pas ajouté dans le Batch 3** : IndexedDB direct est jugé suffisamment simple et proportionné au périmètre courant. Dexie pourra être réévalué si les migrations, transactions ou évolutions de schéma deviennent plus complexes.

## Classification Batch 3

- **F4.2 / F4.3 : Sensible** : persistance locale, données métier de stock, modèle persistant versionné et mesures physiques.
- **F4.4 :** choix technique réversible confirmé ; IndexedDB direct est retenu pour le périmètre du Batch 3 sans nouvelle dépendance.
- **Revue indépendante :** acquise sur le candidat fonctionnel exact revu par Codex normal ; verdict CONFORME, aucun bloquant, IndexedDB direct acceptable, prêt pour intégration vers `test-preview`.
- **Validation humaine applicative :** acquise le 2026-08-29 sur le premier flux métier observable.

## Validation humaine applicative

Mickaël a validé sur Preview :

1. création d’une bobine avec 800 g de poids brut et 200 g de tare, donnant 600 g disponibles ;
2. refus d’une tare de 200 g pour un poids brut de 150 g, puis confirmation que cette bobine n’avait pas été créée ;
3. refus d’une nouvelle création utilisant un identifiant déjà existant ;
4. relecture de la bobine après la tentative de doublon, confirmant que les valeurs initiales 800 g / 200 g / 600 g n’avaient pas été écrasées.

Cette validation couvre uniquement le comportement implémenté dans le Batch 3.

## Findings / Issues pertinents

- Issue #21 — fermée.
- Issue #46 — fermée.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- **Finding Batch 3 — tare supérieure au poids brut : traité.** Refus avant persistance et absence d’enregistrement validés.
- **Finding Batch 3 — identifiant dupliqué pouvant écraser une bobine : traité.** Création non-écrasante et conservation des valeurs existantes validées.
- **Revue indépendante — tests IndexedDB simulés : accepté pour le Batch 3.** Les tests automatisés ne constituent pas seuls une preuve d’un moteur navigateur réel, mais ils sont complétés par la validation humaine sur Preview. Ce point ne prouve pas la compatibilité de tous les navigateurs ni le recovery complet.
- **Revue indépendante — encodage implicite du guard sous Windows : reporté hors Batch 3.** Défaut de portabilité préexistant, sans impact démontré sur la CI GitHub ou les propriétés métier du Batch 3.
- **Issues/findings GitHub ouverts pertinents au dernier contrôle : aucun.**

## Réserves / limites connues

- Filora ne possède pas encore de preuve complète de recovery ; la persistance locale ne constitue donc pas une sauvegarde suffisante pour en faire la source principale de données réelles.
- Seul le sous-ensemble d’invariants nécessaire au premier flux de bobine pesée est implémenté.
- Les consommations, corrections, pesées successives, recalages et historiques ne sont pas encore implémentés.
- Les tests automatisés IndexedDB utilisent un moteur simulé ; la validation Preview complète la preuve pour le comportement réellement testé, sans établir une compatibilité universelle.
- Le défaut d’encodage Windows signalé par Codex reste reporté hors Batch 3.
- La clôture sur la branche de travail ne vaut pas encore intégration vers `test-preview` ou promotion vers `main`.

## Prochaine action

1. Vérifier le résultat complet de la CI et du sentinel sur le commit de clôture.
2. Si les contrôles sont verts, proposer puis effectuer séparément l’intégration de la branche Batch 3 vers `test-preview` par la PR existante.
3. Vérifier l’état réel de `test-preview` après intégration avant toute étape suivante.
4. Ne pas démarrer un nouveau Batch simplement parce que le Batch 3 est déclaré clôturé sur sa branche ; l’intégration et les conditions de transition doivent d’abord être confirmées.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md`, `BATCH2.md` et `BATCH3.md` conservent les dossiers propres à leurs Batches et ne remplacent pas les documents canoniques.
