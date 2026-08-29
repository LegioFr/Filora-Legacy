# BATCH3.md — Fondation de persistance locale du domaine spools

**Statut : en cours**  
**Date de préparation : 2026-08-29**

## Intention

Poser le premier socle de persistance locale fiable pour le domaine `spools`, de manière conforme à `DATA.md` et `ARCHITECTURE.md`, sans encore construire toute la gestion de stock ni utiliser Filora comme source principale de données réelles.

Le Batch 3 doit permettre d'établir une frontière propre entre le métier et la persistance et de vérifier techniquement la stratégie candidate IndexedDB + Dexie avant d'y confier des données réelles.

## État de départ vérifié

- Batch 2 clôturé et promu vers `main`.
- `workflow/state.json` autorise le Batch suivant.
- aucune Issue ouverte pertinente au contrôle préalable ;
- aucune PR ouverte au contrôle préalable ;
- ruleset GitHub externe actif sur `main` et `test-preview` ;
- application actuelle limitée à une fondation React/Vite et un domaine `spools` sans persistance métier ;
- `DATA.md` désigne IndexedDB + Dexie comme stratégie candidate, soumise à vérification technique avant utilisation de données réelles.

## Findings / Issues examinés avant préparation

Aucun finding ou Issue GitHub ouvert pertinent n'a été identifié au contrôle préalable du 2026-08-29.

Décisions :

- à traiter dans ce Batch : aucun finding préexistant ;
- à reporter : aucun ;
- à accepter : aucun ;
- à rejeter : aucun.

Toute découverte hors périmètre pendant le Batch devient un finding séparé conformément à `DEVELOPMENT.md`.

## Dans le périmètre

1. définir un adaptateur de persistance local appartenant au domaine `spools` ou à son infrastructure dédiée, sans donner l'autorité métier à la couche de stockage ;
2. vérifier puis, si cette vérification est satisfaisante, introduire Dexie comme couche d'accès à IndexedDB ;
3. définir une première base locale explicitement versionnée ;
4. introduire uniquement les structures persistantes minimales nécessaires pour prouver la fondation technique, sans prétendre couvrir tout le modèle métier futur ;
5. démontrer des opérations techniques minimales d'écriture, lecture et suppression contrôlée sur des données de test ;
6. vérifier qu'une erreur de persistance n'est pas transformée silencieusement en réussite ;
7. vérifier que l'UI ne devient pas une voie de mutation directe de la base ;
8. ajouter les tests nécessaires à ces propriétés ;
9. maintenir les contrôles d'architecture existants ;
10. produire une preuve sur Preview uniquement si le Batch introduit un comportement observable pertinent.

## Hors périmètre

- gestion complète des références filament ;
- gestion complète des bobines physiques ;
- calcul réel du stock ;
- pesées, consommations et corrections métier ;
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
4. les données de test persistées peuvent être relues sans perte silencieuse ;
5. les échecs de stockage sont explicites ;
6. aucune seconde autorité de stock n'est introduite ;
7. aucune donnée réelle utilisateur n'est nécessaire pour valider ce Batch ;
8. l'introduction de Dexie n'est conservée que si elle reste proportionnée au besoin et compatible avec les contraintes canoniques.

## Classification prévisionnelle

### F4.2 / F4.3

**Sensible.**

Justification : le Batch touche la persistance, introduit potentiellement une dépendance liée à l'accès aux données et prépare un stockage persistant versionné. Ces éléments relèvent explicitement des critères sensibles de `DEVELOPMENT.md`.

Le Batch n'est pas classé Critique à ce stade car il ne prévoit ni migration destructive, ni affaiblissement de garde-fou, ni modification simultanée d'un objet protégé et de son contrôle, ni changement de l'autorité métier centrale.

Toute découverte qui ferait apparaître un critère Critique impose une reclassification avant poursuite du travail concerné.

### F4.4

**Décision produit déjà encadrée, choix technique à vérifier.**

`DATA.md` a déjà enregistré IndexedDB + Dexie comme stratégie initiale candidate, et non comme choix définitivement validé. Le Batch peut donc vérifier ce choix techniquement. Une alternative peut être proposée si Dexie s'avère inadéquat, mais une modification durable du contrat de persistance ou l'introduction d'une contrainte nouvelle importante devra être présentée à Mickaël avant intégration.

## Revue indépendante prévue

Le niveau Sensible impose une revue indépendante avant clôture.

Par défaut, la revue prévue est **Codex normal**, conformément au routage de gouvernance. Codex Security n'est pas requis en l'absence de propriété de sécurité spécifique insuffisamment couverte par une revue normale.

## Validation humaine applicative

### Jalon humain requis — NON REQUIS

La préparation du Batch 3 et la fondation technique de persistance prévue ici n'ajoutent pas, à elles seules, de comportement applicatif observable que Mickaël puisse utilement valider. Si le périmètre évolue et qu'un comportement observable pertinent est ajouté, ce jalon devra être réévalué avant clôture.

## Preuves requises avant clôture

1. état Git exact du candidat identifié ;
2. `npm` install reproductible à partir du lockfile ;
3. typecheck vert ;
4. build vert ;
5. contrôle d'architecture vert ;
6. tests de persistance verts sur les propriétés définies dans ce Batch ;
7. preuve que la base possède une version explicite ;
8. preuve que les opérations de test peuvent écrire puis relire correctement les données attendues ;
9. preuve qu'un échec de persistance pertinent remonte comme échec et non comme réussite ;
10. diff examiné pour confirmer qu'aucune voie `UI → persistance` contournant le domaine n'est introduite ;
11. revue indépendante du candidat exact sans finding bloquant non résolu ;
12. classification F4.2/F4.3 et F4.4 confirmée à la clôture ;
13. findings découverts pendant le Batch explicitement traités, reportés, acceptés ou rejetés ;
14. si un comportement observable est ajouté, Preview correspondante vérifiée et validation humaine demandée uniquement sur ce comportement observable ;
15. `PROJECT_STATE.md` et `workflow/state.json` reflètent l'état réel à la transition de clôture.

## Condition de clôture

Le Batch 3 ne pourra être déclaré clôturé que lorsque la fondation de persistance locale aura été implémentée sur un état Git précis, que les propriétés ci-dessus auront été démontrées par les preuves adaptées, qu'une revue indépendante exigée pour le niveau Sensible aura été obtenue sans finding bloquant restant, et qu'aucune donnée réelle ne sera confiée à cette fondation au-delà de ce que les contrats canoniques autorisent.
