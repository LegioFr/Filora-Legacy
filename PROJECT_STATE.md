# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-29**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 4 — liste du stock mesuré
- status: en cours
- git: lire les HEAD, PR, workflows, artefacts, rulesets et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: implémenter uniquement le listing des bobines persistées approuvé pour le Batch 4, puis obtenir les preuves automatisées, la validation humaine sur Preview et la revue indépendante prévues avant toute clôture

## État courant

- **Étape :** Batch 4 démarré depuis l’état intégré et vérifié du Batch 3 sur `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview` ; il n’est pas encore promu vers `main`.
- **Batch 4 :** en cours ; intention bornée à l’affichage de toutes les bobines mesurées déjà persistées, avec leurs valeurs utiles et la quantité disponible calculée.
- **Issues/findings ouverts pertinents au contrôle préalable du Batch 4 :** aucun.
- **Protection externe GitHub :** un ruleset actif protège `main` et `test-preview`, exige une PR et le check `sentinel`, interdit les suppressions et force-push, et réserve le bypass administrateur au chemin PR explicite.
- **Garde-fous permanents de revue IA :** actifs dans `DEVELOPMENT.md` et leurs contrôles associés.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail Batch 4 :** `batch4/stock-list`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Résultat fonctionnel acquis avant Batch 4

Le Batch 3 a établi le premier flux métier persistant du domaine `spools` :

- créer une bobine avec un identifiant stable ;
- enregistrer un poids brut mesuré ;
- enregistrer une tare et son origine ;
- calculer le filament disponible par `poids brut - tare` ;
- relire une bobine par son identifiant ;
- refuser une tare supérieure au poids brut ;
- refuser un identifiant dupliqué sans écraser les données existantes.

La persistance repose actuellement sur IndexedDB direct : base `filora`, version `1`, object store `spoolIdentities`.

## Batch 4 — intention approuvée

Permettre d’ouvrir Filora et de voir les bobines mesurées déjà enregistrées, avec la quantité de filament disponible pour chacune.

Le périmètre approuvé est limité à :

- ajouter une lecture de l’ensemble des bobines au contrat de persistance existant ;
- implémenter cette lecture dans l’adaptateur IndexedDB sans modifier le schéma ni la version ;
- exposer cette lecture par une opération métier du domaine `spools` ;
- afficher un bloc Stock listant chaque bobine avec ID, poids brut, tare, origine de tare et filament disponible ;
- charger le stock au démarrage et le rafraîchir après un enregistrement réussi ;
- distinguer clairement un stock vide d’un échec de lecture ;
- ajouter uniquement les tests nécessaires ;
- valider le comportement sur Preview après rechargement réel du navigateur.

Restent hors périmètre : suppression ou modification utilisateur, consommations, corrections, pesées successives, recalages, inventaire, historique, références filament complètes, migrations, sauvegarde/restauration complète, cloud, synchronisation, authentification, nouvelles dépendances, nouveaux domaines et modifications de garde-fous ou de documents canoniques.

## Classification Batch 4

- **F4.2 / F4.3 : Sensible** : lecture et présentation de données persistantes de stock.
- Aucune migration, destruction, nouvelle dépendance ou nouvelle autorité de mutation n’est prévue.
- Une revue indépendante Codex normal est requise avant clôture.
- Une validation humaine sur Preview est requise pour le listing réel après rechargement.

## Findings / Issues pertinents

- Issue #21 — fermée.
- Issue #46 — fermée.
- Issue #8 — fermée `not_planned` ; sans impact sur le Batch 4.
- **Tests IndexedDB simulés : accepté avec preuve complémentaire.** Les tests automatisés restent utiles, mais le listing et la persistance après rechargement doivent aussi être vérifiés sur Preview réelle.
- **Encodage implicite du guard sous Windows : reporté hors Batch 4.** Défaut préexistant sans lien avec l’intention métier du Batch.
- **Issues/findings GitHub ouverts pertinents au démarrage du Batch 4 : aucun.**

## Réserves / limites connues

- Filora ne possède pas encore de preuve complète de recovery ; la persistance locale ne constitue donc pas une sauvegarde suffisante pour en faire la source principale de données réelles.
- Les consommations, corrections, pesées successives, recalages et historiques ne sont pas encore implémentés.
- La validation Preview ne prouvera pas une compatibilité universelle de tous les navigateurs.
- Le Batch 4 ne doit pas élargir le modèle persistant ou introduire de migration sans nouvelle décision explicite.
- Le fait que le Batch 3 ne soit pas encore promu vers `main` est connu et accepté pour ce Batch ; aucune promotion vers `main` n’est incluse dans le périmètre actuel.

## Prochaine action

1. Implémenter la lecture de toutes les bobines persistées dans le contrat et l’adaptateur existants sans changer le schéma IndexedDB.
2. Ajouter l’opération métier de listing du stock.
3. Afficher le stock dans l’interface et le rafraîchir après création.
4. Ajouter les tests nécessaires et vérifier la CI.
5. Faire valider le listing sur Preview réelle après rechargement.
6. Obtenir la revue indépendante Codex normal sur le candidat exact avant toute proposition de clôture.
7. Ne modifier `PROJECT_STATE.md`, `workflow/state.json` ou `BATCH4.md` à nouveau qu’à une transition pertinente de ce Batch, notamment sa clôture ou un changement de périmètre explicitement approuvé.

## Règles opérationnelles Codex sous Windows

Pour les missions Filora exécutées avec Codex normal sous Windows :

- utiliser en priorité le dépôt Filora local déjà disponible et trusted ;
- vérifier d’abord son chemin, son état Git et la présence locale du SHA exact à examiner ;
- ne pas créer automatiquement de nouveau clone Git ni de clone dans `%TEMP%` ;
- si le SHA manque, utiliser le dépôt existant et effectuer uniquement le fetch minimal nécessaire ;
- ne créer un clone neuf que si une propriété particulière l’exige réellement, avec justification préalable ;
- pour une mission en lecture seule, ne produire aucun commit, push ou changement GitHub.

Pour Codex Security :

- préserver en priorité son isolation et son indépendance ;
- ne pas forcer la réutilisation du dépôt local si cela affaiblit cette isolation ;
- éviter seulement les clones supplémentaires qui ne sont réellement pas nécessaires ;
- ne pas désactiver ses protections pour supprimer une demande d’autorisation.

Règles communes :

- ne pas modifier `config.toml`, désactiver le sandbox ou affaiblir les protections sans besoin précis et autorisation explicite de Mickaël ;
- utiliser Codex normal lorsque son niveau de contrôle suffit ;
- réserver Codex Security aux propriétés ou risques qui justifient réellement une revue de sécurité renforcée ;
- éviter les boucles de revues IA sans gain de preuve réel ;
- lorsqu’une opération autorisée peut être effectuée directement par l’agent, ne pas demander inutilement à Mickaël de l’exécuter manuellement.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md`, `BATCH2.md`, `BATCH3.md` et `BATCH4.md` conservent les dossiers propres à leurs Batches et ne remplacent pas les documents canoniques.
