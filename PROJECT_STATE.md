# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 4 — liste du stock mesuré
- status: clôturé
- git: lire les HEAD, PR, workflows, artefacts, rulesets et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: déterminer explicitement la transition suivante depuis l’état intégré de `test-preview` avant toute nouvelle modification ou tout nouveau Batch ; consulter d’abord les Issues/findings ouverts pertinents et les conditions applicables

## État courant

- **Étape :** Batch 4 clôturé, validé et intégré à `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview` ; il n’est pas encore promu vers `main`.
- **Batch 4 :** clôturé après CI verte du candidat exact, validation humaine Preview, revue indépendante Codex normal conforme sans bloquant et intégration via la PR #59 ; le contrôle post-intégration applicable a réussi.
- **Issues/findings GitHub ouverts pertinents au contrôle de clôture :** aucun.
- **Protection externe GitHub :** un ruleset actif protège `main` et `test-preview`, exige une PR et le check `sentinel`, interdit les suppressions et force-push, et réserve le bypass administrateur au chemin PR explicite.
- **Garde-fous permanents de revue IA :** actifs dans `DEVELOPMENT.md` et leurs contrôles associés.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche historique de travail Batch 4 :** `batch4/stock-list`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Résultat fonctionnel acquis jusqu’au Batch 4

Le domaine `spools` permet maintenant de :

- créer une bobine avec un identifiant stable ;
- enregistrer un poids brut mesuré ;
- enregistrer une tare et son origine ;
- calculer le filament disponible par `poids brut - tare` ;
- relire une bobine par son identifiant ;
- refuser une tare supérieure au poids brut ;
- refuser un identifiant dupliqué sans écraser les données existantes ;
- lire l’ensemble des bobines persistées sans connaître leurs identifiants à l’avance ;
- afficher le stock local avec ID, poids brut, tare, origine de tare et filament disponible ;
- charger cette liste au démarrage et la rafraîchir après un enregistrement réussi ;
- distinguer un stock vide d’un échec de lecture.

La persistance repose toujours sur IndexedDB direct : base `filora`, version `1`, object store `spoolIdentities`. Le Batch 4 n’a introduit ni migration, ni changement de schéma, ni nouvelle dépendance.

## Batch 4 — résultat validé

La validation humaine sur Preview du candidat final a confirmé :

- `batch4-001` : 800 g brut, 200 g tare, 600 g disponible ;
- `batch4-002` : 950 g brut, 250 g tare, 700 g disponible ;
- les deux bobines visibles simultanément ;
- les deux toujours présentes avec les mêmes valeurs après rechargement complet de la page.

La revue indépendante Codex normal du candidat exact a conclu : **CONFORME**, aucun bloquant, aucun finding important, périmètre respecté et prêt pour intégration à `test-preview`.

Le finding mineur signalé par Codex concernait uniquement ce fichier, qui décrivait encore l’implémentation et les validations comme des actions futures. La présente synchronisation de clôture traite ce décalage opérationnel.

## Findings / Issues pertinents

- Issue #21 — fermée.
- Issue #46 — fermée.
- Issue #8 — fermée `not_planned` ; sans impact sur le Batch 4.
- **Tests IndexedDB simulés : accepté avec preuve complémentaire.** Les tests automatisés sont complétés par la validation réelle sur Preview après rechargement.
- **Encodage implicite du guard sous Windows : reporté hors Batch 4.** Défaut préexistant sans lien avec l’intention métier du Batch.
- **Preuve externe de la validation navigateur :** consignée dans `BATCH4.md` ; Codex ne pouvait pas l’observer directement et l’a correctement classée comme invérifiable par lui-même.
- **Issues/findings GitHub ouverts pertinents au contrôle de clôture : aucun.**

## Réserves / limites connues

- Filora ne possède pas encore de preuve complète de recovery ; la persistance locale ne constitue donc pas une sauvegarde suffisante pour en faire la source principale de données réelles.
- Les consommations, corrections, pesées successives, recalages et historiques ne sont pas encore implémentés.
- La validation Preview ne prouve pas une compatibilité universelle de tous les navigateurs.
- Le Batch 4 n’a pas élargi le modèle persistant et n’a introduit aucune migration.
- Les Batch 3 et 4 ne sont pas encore promus vers `main` ; aucune promotion n’est implicite du fait de leur clôture dans `test-preview`.

## Prochaine action

Avant toute nouvelle modification, promotion ou nouveau Batch :

1. reconstruire l’état réel depuis GitHub et les documents canoniques ;
2. consulter les Issues/findings ouverts pertinents ;
3. déterminer explicitement la transition suivante et ses conditions ;
4. ne pas considérer la clôture du Batch 4 comme une autorisation implicite d’élargir le périmètre fonctionnel.

La règle opérationnelle Codex « dépôt local d’abord / pas de clone automatique » reste à intégrer séparément dans `DEVELOPMENT.md` pour devenir canonique ; cette modification ne fait pas partie de la clôture du Batch 4 et doit suivre son propre périmètre approuvé.

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
