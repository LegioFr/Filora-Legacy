# BATCH5.md — Sauvegarde et restauration du stock local

**Statut : préparé — non implémenté**  
**Date de préparation : 2026-08-30**

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

## Validation humaine réelle attendue

### Jalon humain requis — EN ATTENTE

La validation humaine doit porter sur les appareils réellement utilisés pour Filora :

- tablette ;
- PC ;
- mobile.

Sur chacun, vérifier réellement dans le navigateur ciblé :

1. création ou présence d'un petit stock de test identifiable ;
2. téléchargement du fichier `.json` ;
3. accès au fichier téléchargé depuis le sélecteur de fichier du navigateur/système ;
4. lecture et validation de la sauvegarde ;
5. affichage du nombre de bobines avant confirmation ;
6. confirmation explicite du remplacement ;
7. restauration réussie ;
8. rechargement complet de l'application ;
9. présence des mêmes identités et valeurs persistées.

Au moins une démonstration complète de récupération doit respecter explicitement le contrat canonique :

`export → effacement volontaire des données locales Filora → réimport → comparaison de l'état restauré`.

L'effacement utilisé pour cette preuve peut être réalisé par les contrôles du navigateur/appareil ; il n'est pas nécessaire d'ajouter un bouton destructif permanent à l'application uniquement pour le test.

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

Tout changement réel qui ferait apparaître un critère Critique devra être signalé et reclassé avant poursuite.

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

La clôture de ce Batch démontrera la récupération du périmètre persistant réellement couvert à ce stade. Elle ne constituera pas une preuve automatique pour de futurs types de données persistantes : toute extension persistante devra étendre les garanties de sauvegarde/restauration applicables.
