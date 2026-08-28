# BATCH1.md — Premier socle exécutable de Filora

**Statut : implémentation en cours**  
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

- **F4.2 / F4.3 : Sensible** — introduction d’un framework/build tool et modification du workflow CI.
- **F4.4 : décision Mickaël pour le choix de stack**, obtenue avant intégration ; les détails internes du scaffold restent techniques dans le périmètre approuvé.

## Propriétés attendues / preuves

Avant promotion vers `test-preview` :

1. GitHub Actions travaille sur le HEAD exact de la PR ;
2. les contrôles Batch 0 restent verts ;
3. les tests du contrôle architectural passent et ses cas négatifs sont démontrés ;
4. l’application passe le typecheck ;
5. le build Vite de production réussit ;
6. une revue indépendante proportionnée vérifie la modification sensible des dépendances et de la CI avant merge.

La présence d’un contrôle ne prouve que la propriété qu’il teste. Aucun de ces contrôles ne vaut preuve de persistance, recovery ou invariants DATA, car ces objets n’existent pas encore dans ce Batch.

## Condition de clôture

Batch 1 n’est pas clôturé par la seule présence du scaffold. Il doit avoir passé les preuves ci-dessus, les findings éventuels doivent être traités ou explicitement classés, puis être promu selon le flux `branche dédiée → test-preview → main`.
