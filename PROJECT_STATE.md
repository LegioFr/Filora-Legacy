# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 5 — sauvegarde et restauration du stock local
- status: en validation
- git: lire les HEAD, PR, workflows, artefacts, rulesets et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: obtenir la revue indépendante sur le candidat exact après vérification de sa CI, traiter tout finding éventuel, puis seulement proposer l’intégration du Batch 5 à `test-preview`

## État courant

- **Étape :** Batch 5 en validation ; sauvegarde/restauration implémentée sur la branche de travail, non encore intégrée à `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview` ; il n’est pas encore promu vers `main`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** en validation ; jalon humain validé, preuve complète de recovery acquise, revue indépendante en attente, intégration interdite tant que les preuves restantes ne sont pas acquises.
- **Issues/findings GitHub ouverts pertinents :** aucun au dernier contrôle ; revérifier GitHub avant toute clôture ou intégration.
- **Protection externe GitHub :** un ruleset actif protège `main` et `test-preview`, exige une PR et le check `sentinel`, interdit les suppressions et force-push, et réserve le bypass administrateur au chemin PR explicite.
- **Garde-fous permanents de revue IA :** actifs dans `DEVELOPMENT.md` et leurs contrôles associés.
- **Préflight avant PR :** la règle canonique imposant le regroupement préalable des incohérences prévisibles est intégrée dans `DEVELOPMENT.md` ; la CI reste la preuve finale.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail courante :** `batch5/backup-restore`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Résultat fonctionnel acquis jusqu’au Batch 4

Le domaine `spools` permet de :

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

La persistance repose sur IndexedDB direct : base `filora`, version `1`, object store `spoolIdentities`.

## Batch 5 — implémentation en validation

Le candidat du Batch 5 ajoute, sans migration IndexedDB ni nouvelle dépendance :

- un export JSON versionné `filora-backup` v1 des données métier actuellement persistées ;
- une validation complète du fichier avant toute mutation ;
- une restauration par remplacement complet du stock, jamais par fusion implicite ;
- un remplacement persistant dans une transaction IndexedDB unique ;
- une interface de téléchargement, sélection, validation, confirmation et restauration ;
- des tests automatisés couvrant les principaux chemins nominaux et d’échec, y compris l’atomicité simulée.

Ces éléments sont **implémentés mais pas encore validés comme Batch clôturé**. La CI complète du candidat précédent à la présente synchronisation était verte. Les validations humaines réelles sur tablette, PC et mobile sont acquises, ainsi que la démonstration canonique complète de recovery sur tablette. La présente synchronisation documentaire change le SHA candidat et doit donc repasser la CI avant la revue indépendante. La revue indépendante et l’intégration restent à acquérir.

## Preuves acquises et encore requises pour le Batch 5

Acquis :

1. CI complète verte sur le candidat fonctionnel avant la présente synchronisation documentaire, incluant guard, architecture, tests, typecheck et build ;
2. validation réelle sur tablette, PC et mobile ;
3. démonstration complète sur tablette `export → effacement volontaire des données locales Filora → réimport → comparaison de l’état restauré` ;
4. fichier de sauvegarde versionné réel vérifié avec deux bobines et conservation des valeurs décimales.

Encore requis avant intégration à `test-preview` :

1. CI applicable verte sur le nouveau SHA exact après la présente synchronisation documentaire ;
2. revue indépendante adaptée au niveau Sensible sur ce candidat exact ;
3. absence de finding bloquant non traité au moment de la décision d’intégration.

## Findings / Issues pertinents

- Issue #21 — fermée.
- Issue #46 — fermée.
- Issue #8 — fermée `not_planned`.
- **Tests IndexedDB simulés : accepté avec preuve complémentaire acquise.** Les tests automatisés sont complétés par la validation réelle navigateur/appareil du Batch 5.
- **Encodage implicite du guard sous Windows : reporté hors Batch 5.** Défaut préexistant sans lien avec l’intention métier du Batch.
- **Ancien décalage de `PROJECT_STATE.md` après les règles Codex : traité par la présente synchronisation.** Les règles Codex locale et de préflight sont désormais canoniques dans `DEVELOPMENT.md`.
- **Issues/findings GitHub ouverts pertinents au dernier contrôle : aucun.**

## Réserves / limites connues

- La preuve complète de recovery est acquise pour le périmètre persistant actuellement couvert par le Batch 5 ; elle ne vaut pas automatiquement pour de futurs types de données persistantes.
- Les consommations, corrections, pesées successives, recalages et historiques ne sont pas encore implémentés.
- La validation Preview du Batch 5 est acquise sur tablette, PC et mobile ; la revue indépendante reste en attente.
- Les Batch 3 et 4 ne sont pas encore promus vers `main` ; aucune promotion n’est implicite.
- Le Batch 5 ne prévoit ni migration de schéma, ni cloud, ni synchronisation, ni historique de sauvegardes.

## Direction prévue après le Batch 5 — futur Batch 6

Le Batch 6 n’est **pas démarré** et aucun `BATCH6.md` n’est encore créé. Son périmètre final devra être confirmé uniquement après la clôture réelle du Batch 5, la reconstruction de l’état GitHub courant et l’examen des Issues/findings alors ouverts.

L’intention produit déjà validée pour préparer ce futur Batch est de se concentrer sur **la création complète d’une bobine**, avec une équivalence fonctionnelle de l’ancien écran de création montré par Mickaël, sans obligation d’en reprendre le design visuel.

Les fonctions à retrouver dans le flux de création comprennent au minimum :

- ID de la bobine ;
- marque ;
- matière ;
- diamètre ;
- gamme ou type de filament fabricant ;
- couleur fabricant et aperçu de couleur ;
- date d’achat ;
- date d’ouverture ;
- fournisseur / boutique ;
- emplacement de stockage ;
- prix de la bobine ;
- dernier séchage ;
- lien de rachat exact ;
- type de bobine ;
- poids neuf initial / poids nominal ;
- bobine vide ou support / tare de référence ;
- tare de la bobine vide ;
- poids brut mesuré ;
- filament restant calculé, avec indication utile du pourcentage ou de l’état lorsque pertinent ;
- températures buse et plateau ;
- paramètres d’impression avancés utiles ;
- création en série de plusieurs bobines identiques avec identités physiques distinctes ;
- notes optionnelles ;
- résumé compréhensible avant enregistrement ;
- enregistrement final avec validations et erreurs explicites.

L’implémentation devra respecter le contrat de données existant : les informations décrivant un produit commun, comme marque, matière, gamme, couleur ou diamètre, doivent être structurées proprement comme données de référence filament lorsque cela est applicable, tandis que les informations propres à l’exemplaire physique restent attachées à la bobine. L’objectif est de conserver les mêmes fonctions utilisateur sans créer deux autorités concurrentes ni dupliquer inutilement les données communes.

Toute nouvelle donnée persistante introduite par ce Batch devra également être intégrée aux garanties de sauvegarde/restauration applicables afin qu’une sauvegarde puisse continuer à reconstruire l’état métier persistant correspondant. Le Batch 6 ne devra donc pas introduire de données persistées que le mécanisme de recovery laisserait silencieusement de côté.

Les consommations, l’historique des mouvements, les recalages successifs, l’inventaire, la gestion des imprimantes et un redesign global de l’application ne sont pas implicitement inclus dans cette intention. Ils ne devront entrer dans le Batch 6 que si une décision ultérieure les ajoute explicitement à son périmètre.

## Prochaine action

1. laisser le nouveau SHA documentaire du Batch 5 repasser les contrôles CI ;
2. une fois la CI verte, obtenir la revue indépendante du candidat exact ;
3. traiter explicitement tout finding éventuel sans élargir le périmètre inutilement ;
4. revérifier les Issues/findings ouverts ;
5. ne proposer l’intégration à `test-preview` qu’après revue conforme sans bloquant non traité.

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

`BATCH1.md`, `BATCH2.md`, `BATCH3.md`, `BATCH4.md` et `BATCH5.md` conservent les dossiers propres à leurs Batches et ne remplacent pas les documents canoniques.
