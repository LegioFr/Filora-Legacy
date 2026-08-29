# BATCH4.md — Liste du stock mesuré

**Statut : en cours**  
**Date de préparation : 2026-08-29**

## Intention

Permettre d’ouvrir Filora et de voir les bobines mesurées déjà enregistrées, avec la quantité de filament disponible pour chacune.

Ce Batch prolonge directement le premier flux métier du Batch 3. Il ne transforme pas encore Filora en source principale de données réelles et n’introduit pas la gestion complète du cycle de vie du stock.

## État de départ vérifié

- Batch 3 clôturé et intégré à `test-preview` ;
- `test-preview` vérifié avant création de la branche Batch 4 ;
- `main` reste à l’état promu du Batch 2 ; la promotion du Batch 3 vers `main` n’est pas une condition préalable à ce Batch ;
- aucune Issue GitHub ouverte pertinente au contrôle préalable ;
- aucune PR ouverte au contrôle préalable ;
- ruleset GitHub externe actif sur `main` et `test-preview`, avec PR et check `sentinel` requis ;
- `workflow/state.json` indique Batch 3 clôturé et Batch suivant techniquement autorisé ;
- le domaine `spools` sait déjà créer une bobine mesurée, la relire par identifiant et calculer son filament disponible ;
- le stockage ne sait pas encore retourner l’ensemble des bobines enregistrées.

## Findings / Issues examinés avant préparation

Aucune Issue ou finding GitHub ouvert pertinent n’a été identifié au contrôle préalable du 2026-08-29.

Les réserves connues du Batch 3 ont été examinées :

1. **Tests IndexedDB simulés** — accepté pour les tests automatisés du Batch 4, à compléter à nouveau par une validation sur Preview dans un navigateur réel pour le comportement observable de listing et de rechargement.
2. **Encodage implicite du guard sous Windows** — reporté hors Batch 4. Ce défaut préexistant ne concerne pas la fonctionnalité métier du listing et ne justifie pas de toucher opportunément aux garde-fous.

Décisions avant démarrage :

- à traiter dans ce Batch : aucun finding préexistant ;
- à reporter : encodage implicite du guard sous Windows ;
- à accepter avec preuve complémentaire : usage du moteur IndexedDB simulé dans les tests automatisés, complété par Preview réelle ;
- à rejeter : aucun.

## Dans le périmètre

1. ajouter au contrat de persistance du domaine `spools` une opération de lecture de l’ensemble des bobines persistées ;
2. implémenter cette lecture dans l’adaptateur IndexedDB existant sans modifier le schéma ni la version de base ;
3. ajouter une opération métier de lecture du stock qui reste l’intermédiaire entre UI et persistance ;
4. afficher dans l’application une liste des bobines enregistrées ;
5. afficher pour chaque bobine :
   - identifiant ;
   - poids brut mesuré ;
   - tare ;
   - origine de la tare ;
   - filament disponible calculé ;
6. charger la liste au démarrage de l’application ;
7. rafraîchir la liste après l’enregistrement réussi d’une bobine ;
8. prévoir un état vide explicite lorsque le stockage ne contient aucune bobine ;
9. faire remonter explicitement les erreurs de lecture du stockage ;
10. ajouter uniquement les tests nécessaires à ces propriétés ;
11. vérifier le comportement réel sur Preview après rechargement du navigateur.

## Hors périmètre

- suppression de bobine depuis l’interface ;
- modification d’une bobine existante ;
- pesées successives ;
- consommations ;
- corrections ;
- recalages ;
- historique des mouvements ;
- inventaire ;
- références filament complètes ;
- supports réutilisables complets ;
- emplacements ;
- sauvegarde/restauration complète ;
- migration de données ;
- changement du schéma IndexedDB ou de sa version ;
- nouvelle dépendance ;
- nouveau domaine métier ;
- modification des documents canoniques ;
- modification des workflows ou garde-fous ;
- promotion vers `main` ;
- utilisation de Filora comme source principale de données réelles.

## Propriétés attendues

1. toutes les bobines persistées sont retournées sans dépendre de la connaissance préalable de leur identifiant ;
2. le listing ne crée ni ne modifie de donnée persistante ;
3. le filament disponible affiché reste dérivé de `poids brut - tare` et ne devient pas une seconde autorité persistante ;
4. l’origine de la tare reste identifiable ;
5. l’UI ne lit pas IndexedDB directement : le sens `UI → opération métier → persistance` reste respecté ;
6. l’ajout d’une bobine réussie est reflété dans la liste sans rechargement manuel ;
7. après rechargement réel du navigateur, les bobines déjà persistées sont à nouveau listées ;
8. l’état vide est distinct d’un échec de lecture ;
9. un échec de persistance ne doit pas être présenté comme un stock vide ;
10. aucune migration, nouvelle dépendance ou nouvelle autorité de stock n’est introduite.

## Classification initiale

### F4.2 / F4.3

**Sensible.**

Justification : le Batch touche la lecture de données persistantes de stock et leur présentation comme état métier. Il n’introduit toutefois ni migration, ni destruction, ni nouvelle autorité de mutation, ni changement de garde-fou.

## Preuves attendues avant clôture

1. état Git exact du candidat identifié ;
2. CI verte : installation reproductible, typecheck, build, contrôles applicables ;
3. tests automatisés couvrant le listing vide, le listing de plusieurs bobines, le calcul affiché à partir des faits et les erreurs de lecture applicables ;
4. vérification qu’aucune modification de schéma ou de version IndexedDB n’a été introduite ;
5. vérification du chemin `UI → opération métier → persistance` ;
6. validation humaine sur Preview : créer au moins deux bobines de test, vérifier leur présence dans Stock, recharger la page et confirmer qu’elles restent listées avec les mêmes valeurs ;
7. revue indépendante Codex normal en lecture seule sur le candidat exact ;
8. absence de finding bloquant non décidé ;
9. synchronisation de clôture uniquement lorsque ces propriétés sont acquises.

## Condition de clôture

Le Batch 4 pourra être déclaré clôturé uniquement lorsque :

- le listing du stock respecte le périmètre ci-dessus ;
- les contrôles automatisés applicables sont verts ;
- la validation humaine réelle sur Preview est acquise ;
- la revue indépendante requise pour le niveau Sensible est conforme sans bloquant non traité ;
- les findings éventuels découverts pendant le Batch ont reçu une décision explicite ;
- l’état de clôture est ensuite synchronisé sans élargir le périmètre.

La clôture du Batch 4 ne constituera pas une preuve de sauvegarde/restauration complète et n’autorisera donc pas à considérer Filora comme source principale des données réelles.
