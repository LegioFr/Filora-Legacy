# BATCH5.md — Sauvegarde et restauration du stock local

**Statut : clôturé**  
**Date de préparation : 2026-08-30**  
**Date de clôture : 2026-08-30**

## Intention

Permettre à l'utilisateur de sauvegarder l'état métier actuellement persistant de Filora dans un fichier versionné, puis de restaurer ce fichier de manière contrôlée et atomique afin de pouvoir démontrer une récupération réelle du stock local.

Ce Batch répond directement au contrat de `DATA.md` : Filora ne doit pas devenir la source principale de données réelles avant qu'une récupération complète de type `export → effacement volontaire → réimport → comparaison` ait été démontrée.

Le Batch reste volontairement limité aux données effectivement persistées aujourd'hui. Il n'introduit ni consommation, ni historique, ni nouvelle pesée, ni nouveau domaine métier.

## État de départ vérifié

- Batch 4 clôturé, validé et intégré à `test-preview` ;
- `test-preview` vérifié au démarrage du Batch 5 sur le commit `bf2b7ab1de5e100e93ba54898b8a146ea91adef9` ;
- ce commit correspond à la fusion de la PR #61, qui a canonisé la règle Codex locale dans `DEVELOPMENT.md` ;
- `workflow/state.json` indique Batch 4 clôturé et `next_batch_allowed: true` ;
- aucune Issue GitHub ouverte pertinente au contrôle préalable ;
- aucune PR GitHub ouverte au contrôle préalable ;
- ruleset GitHub externe actif sur `main` et `test-preview`, avec PR et check `sentinel` requis ;
- la persistance actuelle utilise IndexedDB direct, base `filora`, version `1`, object store `spoolIdentities` ;
- chaque bobine persistée contient actuellement uniquement : `id`, `grossMeasuredWeightGrams`, `tareWeightGrams`, `tareSource` ;
- le filament disponible reste dérivé de `poids brut - tare` et n'est pas une donnée persistée.

## Findings / réserves examinés avant préparation

### Tests IndexedDB simulés

Les tests automatisés actuels utilisent un faux IndexedDB interne. Cette limite est **acceptée avec preuve complémentaire** pour ce Batch : les tests couvriront la logique et les chemins d'échec, tandis qu'une validation réelle sur navigateur vérifiera le téléchargement, le sélecteur de fichier, la restauration et la persistance après rechargement.

### Encodage implicite du guard sous Windows

Finding préexistant sans lien avec l'intention métier de ce Batch. Il est **reporté hors Batch 5** et ne doit pas justifier une modification opportuniste des garde-fous.

### `PROJECT_STATE.md` partiellement périmé après la PR #61

L'index de reprise contient encore une formulation indiquant que la règle Codex locale reste à intégrer, alors que la PR #61 l'a effectivement intégrée dans `DEVELOPMENT.md`. Ce décalage est **reporté à une synchronisation d'état pertinente** ; il ne fait pas partie de l'implémentation fonctionnelle de sauvegarde/restauration et ne justifie pas une PR séparée à lui seul.

Décisions avant implémentation :

- à traiter dans ce Batch : sauvegarde/restauration complète des données actuellement persistées et ses preuves ;
- à reporter : encodage Windows du guard et synchronisation de `PROJECT_STATE.md` ;
- à accepter avec preuve complémentaire : moteur IndexedDB simulé dans les tests automatisés ;
- à rejeter : ajout d'une limite métier arbitraire de poids sans contrat existant.

## Format de sauvegarde retenu

Le format de référence du Batch 5 est un JSON versionné de la forme :

```json
{
  "format": "filora-backup",
  "version": 1,
  "spools": [
    {
      "id": "bobine-001",
      "grossMeasuredWeightGrams": 800,
      "tareWeightGrams": 200,
      "tareSource": "measured_empty_support"
    }
  ]
}
```

Règles :

1. `format` identifie explicitement une sauvegarde Filora ;
2. `version` versionne le format de sauvegarde indépendamment de l'affichage ;
3. `spools` contient toutes les bobines persistées applicables ;
4. le filament disponible n'est pas exporté car il est dérivé des faits persistés ;
5. aucune donnée d'interface temporaire n'entre dans le format de sauvegarde.

## Comportement utilisateur retenu

### Sauvegarde

L'utilisateur peut demander une sauvegarde de l'état métier persistant actuel. Filora produit un fichier `.json` contenant le format versionné défini ci-dessus.

### Préparation d'une restauration

La sélection d'un fichier ne déclenche aucune mutation.

Filora doit d'abord :

1. lire entièrement le fichier ;
2. analyser le JSON ;
3. vérifier `format` et `version` ;
4. valider l'ensemble des bobines et l'absence de doublon d'identité dans la sauvegarde ;
5. n'effectuer aucune écriture tant que cette validation complète n'a pas réussi ;
6. afficher un résumé compréhensible, par exemple `Sauvegarde valide — X bobines`.

### Confirmation

Une sauvegarde valide n'est pas restaurée automatiquement.

L'utilisateur doit confirmer explicitement une action indiquant clairement que la restauration **remplacera entièrement le stock local actuel**.

L'annulation à cette étape laisse le stock existant strictement inchangé.

Aucun auto-export automatique n'est imposé avant la restauration : la protection retenue pour ce Batch repose sur la validation préalable, l'information explicite, la confirmation utilisateur et l'atomicité de la mutation.

### Restauration

La restauration signifie **remplacer entièrement** le stock local actuel par le contenu de la sauvegarde. Elle ne fusionne pas les deux stocks.

Le remplacement persistant doit être réalisé dans une seule transaction IndexedDB adaptée au store concerné, afin qu'une défaillance ne puisse pas laisser silencieusement une moitié d'ancien stock et une moitié de stock restauré.

Après réussite, l'interface recharge le stock depuis la persistance et présente l'état restauré.

## Validation des données avant restauration

Une sauvegarde est refusée avant toute mutation si au moins une propriété applicable est invalide, notamment :

- fichier illisible ou lecture interrompue ;
- contenu non JSON ;
- structure racine invalide ;
- `format` absent ou différent de `filora-backup` ;
- `version` absente, invalide ou inconnue ;
- `spools` absent ou de type incorrect ;
- entrée de bobine de type incorrect ;
- ID absent, non textuel ou vide après normalisation ;
- deux entrées portant le même ID normalisé ;
- poids brut non numérique, non fini ou inférieur ou égal à zéro ;
- tare non numérique, non finie ou négative ;
- tare supérieure au poids brut ;
- origine de tare différente de `measured_empty_support` ou `manufacturer`.

Aucune limite maximale arbitraire de poids n'est introduite dans ce Batch, car aucun contrat canonique actuel ne la définit.

Un refus doit fournir un message exploitable permettant d'identifier la cause et, lorsque possible, la bobine ou le champ concerné.

## Propriétés attendues

1. l'export contient toutes les données métier actuellement persistées nécessaires pour reconstruire le stock du Batch 4 ;
2. le format de sauvegarde est explicitement versionné ;
3. aucune valeur dérivée ne devient une seconde autorité persistante ou exportée ;
4. une sauvegarde invalide ne modifie jamais le stock existant ;
5. une annulation avant confirmation ne modifie jamais le stock existant ;
6. une restauration valide remplace entièrement le stock, sans fusion implicite ;
7. le remplacement persistant est atomique à l'échelle des données concernées ;
8. une défaillance pendant la transaction ne laisse pas une restauration partielle présentée comme réussie ;
9. après restauration réussie puis rechargement de l'application, les données restaurées restent présentes ;
10. l'état restauré est comparable à l'état exporté sur les identités et attributs persistants applicables ;
11. les erreurs de lecture, validation et écriture restent explicites ;
12. aucune migration du schéma IndexedDB ni changement de version de la base n'est requis pour ce périmètre ;
13. aucune nouvelle dépendance n'est introduite sans nécessité concrète.

## Scénarios automatisés minimaux

Les tests doivent couvrir au minimum :

1. export d'un stock vide ;
2. export de plusieurs bobines avec conservation exacte des valeurs persistées ;
3. validation puis restauration d'une sauvegarde valide ;
4. remplacement complet d'un stock existant par un autre stock ;
5. comparaison après restauration des identités et attributs persistants ;
6. rejet d'un JSON invalide sans mutation ;
7. rejet d'un format inconnu sans mutation ;
8. rejet d'une version inconnue sans mutation ;
9. rejet d'un ID vide sans mutation ;
10. rejet d'IDs dupliqués sans mutation ;
11. rejet d'un poids brut invalide sans mutation ;
12. rejet d'une tare négative sans mutation ;
13. rejet de `tare > poids brut` sans mutation ;
14. rejet d'une origine de tare inconnue sans mutation ;
15. échec volontaire pendant la transaction de restauration, avec preuve qu'aucun état partiellement restauré n'est accepté comme succès ;
16. non-régression du calcul du filament disponible à partir des faits restaurés.

## Validation humaine réelle acquise

### Jalon humain requis — VALIDÉ

Validation humaine effectuée le 2026-08-30 sur les trois appareils réellement utilisés pour Filora :

- **tablette : validée** ;
- **PC : validé** ;
- **mobile : validé**.

La validation couvre le téléchargement réel du fichier `.json`, son accès depuis le sélecteur de fichier du navigateur/système, sa lecture et sa validation, la confirmation explicite du remplacement, la restauration et la vérification de l'état restauré dans le scénario applicable.

La tablette a également servi à la démonstration canonique complète de récupération. La sauvegarde de référence contenait deux bobines identifiables :

- `batch5-recovery-001` : poids brut `842,6 g`, tare `210,1 g`, origine `measured_empty_support`, disponible recalculé `632,5 g` ;
- `batch5-recovery-002` : poids brut `850,96 g`, tare `150,47 g`, origine `measured_empty_support`, disponible recalculé `700,49 g`.

La séquence démontrée a été :

`export → effacement volontaire des données locales Filora → constat d'un stock à 0 bobine → sélection et validation du fichier sans mutation → confirmation explicite → réimport → comparaison de l'état restauré`.

Après sélection du bon fichier, Filora a annoncé une sauvegarde valide de 2 bobines alors que le stock restait vide avant confirmation. Après confirmation, les deux identités et leurs valeurs persistées ont été restaurées et les quantités disponibles recalculées correspondaient aux valeurs attendues.

Cette preuve couvre le périmètre persistant du Batch 5. Elle ne vaut pas automatiquement pour de futurs types de données persistantes, qui devront à leur tour être intégrés aux garanties de sauvegarde/restauration.

## Hors périmètre

- fusion automatique entre sauvegarde et stock existant ;
- historique de sauvegardes ;
- sauvegarde automatique ;
- cloud ou synchronisation distante ;
- compte utilisateur ;
- chiffrement ou mot de passe de sauvegarde ;
- format CSV comme sauvegarde de référence ;
- consommations ;
- corrections ;
- recalages ;
- pesées successives ;
- historique des mouvements ;
- références filament complètes ;
- supports réutilisables complets ;
- emplacements ;
- migration du schéma IndexedDB ;
- changement de version de la base ;
- introduction de Dexie ;
- nouvelle dépendance sans besoin démontré ;
- modification des documents canoniques ;
- modification des workflows ou garde-fous ;
- promotion vers `main` ;
- déclaration immédiate de Filora comme source principale de données réelles avant acquisition des preuves de recovery.

## Classification

### F4.2 / F4.3

**Sensible.**

Justification : le Batch introduit un export de sauvegarde, une restauration et un remplacement de données persistantes. Ces catégories sont explicitement sensibles dans `DEVELOPMENT.md`.

Le Batch n'est pas classé Critique dans son périmètre prévu : aucune migration destructive, aucun affaiblissement de garde-fou, aucun changement de l'autorité métier centrale et aucune modification simultanée d'un objet protégé et de son mécanisme de contrôle ne sont prévus.

Aucun critère Critique n'est apparu dans le diff final du Batch.

### F4.4

**Aucune approbation propriétaire supplémentaire requise à la clôture.**

Justification : le comportement produit du Batch — sauvegarder l'état persistant, valider avant mutation, confirmer puis remplacer entièrement le stock lors d'une restauration — faisait partie du périmètre préparé et validé avant la clôture, puis a été exercé lors de la validation humaine. La clôture n'introduit aucun nouveau compromis produit, invariant, comportement visible ou choix structurel à arbitrer. L'état machine reste donc `owner_approval: not_required`.

## Preuves requises avant clôture

1. candidat exact identifié ;
2. diff final conforme au périmètre ;
3. CI applicable verte ;
4. typecheck et build verts ;
5. contrôles d'architecture applicables verts ;
6. tests automatisés des scénarios nominaux et d'échec définis ci-dessus ;
7. preuve qu'un fichier invalide ne modifie pas le stock existant ;
8. preuve qu'un échec pendant la restauration ne produit pas de restauration partielle acceptée comme succès ;
9. preuve du remplacement complet sans fusion ;
10. validation humaine réelle du téléchargement et du sélecteur de fichier sur tablette, PC et mobile ;
11. démonstration réelle `export → effacement → réimport → comparaison` ;
12. revue indépendante adaptée au niveau Sensible sur le candidat exact ;
13. aucune Issue/finding bloquant non décidé ;
14. intégration vers `test-preview` uniquement après acquisition des preuves applicables.

## Condition de clôture

Le Batch 5 ne pourra être déclaré clôturé que lorsque :

- le format versionné permet de reconstruire toutes les données métier actuellement persistées ;
- les restaurations invalides ou échouées préservent l'état existant conformément aux propriétés prévues ;
- une restauration valide remplace atomiquement le stock et reste correcte après rechargement ;
- la récupération réelle prévue par `DATA.md` est démontrée ;
- les validations multi-appareil prévues sont acquises ;
- la revue indépendante requise est conforme sans bloquant non traité ;
- les findings éventuels découverts pendant le Batch ont reçu une décision explicite.

La clôture de ce Batch démontre la récupération du périmètre persistant réellement couvert à ce stade. Elle ne constitue pas une preuve automatique pour de futurs types de données persistantes : toute extension persistante devra étendre les garanties de sauvegarde/restauration applicables.

## Preuves acquises à la clôture

- candidat fonctionnel exact revu : `4c647d227cd866b2cb3b1d809a5ddd01bbd324c4` ;
- diff du dernier correctif limité à `tests/persistence_check.ts`, avec ajout des scénarios automatisés manquants signalés lors de la première revue ;
- CI GitHub du candidat exact verte : guard et sentinel réussis ; le job guard a également validé les contrôles de gouvernance, architecture, tests, installation, typecheck et build ;
- les seize scénarios automatisés minimaux définis par ce Batch sont couverts, notamment l'export vide, les rejets sur le chemin restauration et le recalcul du disponible après restauration ;
- validation humaine réelle acquise sur tablette, PC et mobile ;
- démonstration réelle de récupération complète acquise sur tablette : `export → effacement volontaire → réimport → comparaison` ;
- revue indépendante Codex normal, en lecture seule et sur le SHA fonctionnel exact : **CONFORME AVEC RÉSERVES**, aucun bloquant, tous les anciens bloquants corrigés, candidat jugé techniquement prêt sous réserve des preuves GitHub ;
- les propriétés GitHub réservées par la revue locale ont été vérifiées séparément par le coordinateur sur le même SHA : PR #62 ouverte et mergeable, base `test-preview`, guard et sentinel verts, aucune Issue ouverte et aucun commentaire/review de PR présent au contrôle ;
- les tests IndexedDB simulés restent acceptés avec la validation réelle navigateur/appareil comme preuve complémentaire ;
- aucun critère Critique n'a été identifié et aucune approbation propriétaire supplémentaire n'est requise pour cette transition de clôture.

La présente transition de clôture ne modifie pas le code fonctionnel revu. Elle synchronise uniquement `BATCH5.md`, `PROJECT_STATE.md` et `workflow/state.json`. Son propre SHA doit repasser les contrôles mécaniques applicables avant toute intégration dans `test-preview`.

## Décisions sur les findings de revue

- `localeCompare()` sans locale explicite pour l'ordre d'export : **reporté hors Batch 5**, finding non bloquant ne compromettant ni la complétude ni la restauration ;
- compteur du message de téléchargement basé sur l'état UI : **reporté hors Batch 5**, finding non bloquant n'affectant pas le contenu réellement exporté ;
- formulation périmée de `PROJECT_STATE.md` indiquant encore la revue indépendante comme future : **traitée par la présente synchronisation de clôture** ;
- preuves humaines non rejouables directement par le reviewer local : **réserve acceptée**, car elles sont consignées comme validation humaine et ne sont pas présentées comme une preuve technique rejouée par Codex ;
- comportement IndexedDB navigateur non exercé par le simulateur automatisé : **réserve acceptée avec preuve complémentaire réelle**, conformément à la décision prise au démarrage du Batch ;
- encodage implicite du guard sous Windows : **reporté hors Batch 5**, finding préexistant sans lien avec la sauvegarde/restauration.

Aucun finding bloquant non décidé ne subsiste à la clôture.

## Clôture

Le Batch 5 est clôturé sur sa branche candidate : le périmètre persistant actuel peut être sauvegardé et restauré avec validation préalable, remplacement complet, atomicité attendue et recalcul des valeurs dérivées ; la récupération réelle a été démontrée ; les validations humaines sont acquises ; la revue indépendante est conforme avec réserves mais sans bloquant ; et les findings ont reçu une décision explicite.

Cette clôture n'intègre pas encore la PR #62 dans `test-preview` et ne démarre pas le Batch 6. L'intégration reste conditionnée aux contrôles mécaniques verts sur le SHA de clôture et à une dernière vérification de l'état GitHub au moment de la décision d'intégration.
