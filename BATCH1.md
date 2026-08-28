# BATCH1.md — Premier socle exécutable de Filora

**Statut : clôturé et intégré à `main`**  
**Date de préparation : 2026-08-28**

## Intention

Créer le premier socle web réellement exécutable de Filora sans introduire prématurément la persistance ni la logique métier complète du stock.

## Décision structurante

Mickaël a choisi explicitement le 2026-08-28 l’option A : **React + TypeScript + Vite**, après comparaison avec Vue + TypeScript + Vite, Svelte + TypeScript + Vite et TypeScript + Vite sans framework.

Dépendances directes initiales épinglées : React 19.2.8, React DOM 19.2.8, Vite 8.2.2, @vitejs/plugin-react 6.1.0, TypeScript 7.0.2 et types React correspondants.

## Findings / Issues examinés avant démarrage

- Issue #21 — **reportée hors Batch 1** : le miroir documentaire Google Drive touche CI, secrets, réseau/cloud et synchronisation. Son Issue indique elle-même qu’aucune implémentation n’est autorisée dans Batch 1.
- Issue #8 — fermée `not_planned` ; son objet d’édition GitHub ciblée n’est pas nécessaire à ce Batch.
- Aucun autre finding ouvert pertinent identifié au démarrage.

## Dans le périmètre

- scaffold React + TypeScript + Vite minimal ;
- composition `app` et premier domaine `domains/spools` ;
- interface d’attente responsive sans fausse donnée métier ;
- contrôle mécanique minimal de la direction `app → domains → shared` ;
- typecheck et build de production dans GitHub Actions ;
- conservation des contrôles Batch 0 existants.

## Hors périmètre

- IndexedDB, Dexie ou autre persistance ;
- mutations ou stock réel ;
- migrations ;
- backup/restore/recovery ;
- sync, cloud, réseau et authentification ;
- routeur, gestionnaire d’état global ou bibliothèque UI ajoutés par anticipation ;
- nouveaux domaines sans responsabilité réelle.

## Classification

- **F4.2 : Sensible** — introduction d’un framework/build tool, création d’une première frontière architecturale implémentée et modification du workflow CI.
- **F4.3 : Critique** — le Batch a introduit simultanément du code soumis à une nouvelle règle architecturale automatisée et modifié le mécanisme de contrôle chargé de vérifier cette règle. Conformément à DEVELOPMENT §8.3 et §10.6, le succès du contrôle modifié n’a pas été utilisé seul comme preuve.
- **F4.4 : décision Mickaël pour le choix de stack**, obtenue avant intégration ; les détails internes du scaffold sont restés techniques dans le périmètre approuvé.
- **Accord Critique de Mickaël obtenu le 2026-08-28** et confirmé directement lors de la contre-vérification indépendante.

## Preuves de clôture

1. GitHub Actions a travaillé sur les HEAD exacts des PR de validation et de promotion ;
2. les contrôles Batch 0 sont restés verts ;
3. les tests du contrôle architectural ont passé leurs cas positifs et négatifs, y compris pour les imports dynamiques littéraux ;
4. l’application a passé le typecheck ;
5. le build Vite de production a réussi ;
6. les dépendances npm sont reproductibles via un `package-lock.json` versionné et `npm ci` en CI ;
7. la contre-vérification indépendante finale a conclu `ACCEPTABLE` et a jugé la protection supplémentaire §10.6 adéquate et exercée ;
8. l’accord explicite de Mickaël requis par le plancher Critique a été confirmé directement ;
9. l’état validé a été promu sur `test-preview`, puis la promotion `test-preview → main` a passé la CI et a été mergée sans nouveau finding bloquant.

La présence d’un contrôle ne prouve que la propriété qu’il teste. Le contrôle architectural actuel vérifie uniquement les dépendances internes exprimées par imports/exports relatifs statiques ou imports dynamiques littéraux dans les fichiers `.ts`/`.tsx`, selon les couches `app`, `domains` et `shared`. Il ne prétend pas actuellement couvrir des alias TypeScript non configurés, des imports dynamiques calculés ou des cycles entre plusieurs domaines inexistants dans ce Batch. Si un de ces objets apparaît, le contrôle doit être réévalué avant de revendiquer leur couverture.

Aucun de ces contrôles ne vaut preuve de persistance, recovery ou invariants DATA, car ces objets n’existent pas encore dans ce Batch.

## Revue indépendante

Une première revue indépendante a conclu `À CORRIGER` et a identifié notamment :

- un paquet de preuve insuffisant pour établir que les garde-fous Batch 0 restaient intacts ;
- une non-détection des `import(...)` dynamiques par le contrôle architectural ;
- une preuve insuffisante, dans le paquet transmis, de l’exécution réelle des tests architecturaux en CI ;
- une classification F4.3 initialement trop basse (`Sensible` au lieu de `Critique`).

Une contre-revue ultérieure a confirmé ces corrections mais a maintenu un finding bloquant de reproductibilité npm : absence de `package-lock.json`. Ce finding a été traité par un lockfile généré par npm, versionné, et l’usage de `npm ci` dans le workflow final.

La contre-vérification finale, portant sur l’état corrigé et ses preuves cohérentes, a conclu `ACCEPTABLE` pour la promotion vers `test-preview`, sans nouveau finding bloquant.

## Clôture

Batch 1 est clôturé : son état validé a été intégré à `main` après validation sur `test-preview` et CI de promotion réussie. Les SHA, PR et commits de merge restent des informations volatiles à reconstruire depuis GitHub plutôt qu’à mémoriser ici comme vérité persistante.
