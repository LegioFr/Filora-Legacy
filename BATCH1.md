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

- **F4.2 : Sensible** — introduction d’un framework/build tool, création d’une première frontière architecturale implémentée et modification du workflow CI.
- **F4.3 : Critique** — le Batch introduit simultanément du code soumis à une nouvelle règle architecturale automatisée et modifie le mécanisme de contrôle chargé de vérifier cette règle. Conformément à DEVELOPMENT §8.3 et §10.6, le succès du contrôle modifié ne suffit pas à valider ce changement.
- **F4.4 : décision Mickaël pour le choix de stack**, obtenue avant intégration ; les détails internes du scaffold restent techniques dans le périmètre approuvé.
- **Accord Critique de Mickaël obtenu le 2026-08-28** : poursuite de Batch 1 autorisée dans ces conditions Critiques. Cet accord ne remplace pas la protection supplémentaire indépendante ni les preuves techniques requises avant promotion.

## Propriétés attendues / preuves

Avant promotion vers `test-preview` :

1. GitHub Actions travaille sur le HEAD exact de la PR ;
2. les contrôles Batch 0 restent verts ;
3. les tests du contrôle architectural passent et ses cas négatifs sont démontrés, y compris pour les imports dynamiques littéraux ;
4. l’application passe le typecheck ;
5. le build Vite de production réussit ;
6. les dépendances npm sont reproductibles via un `package-lock.json` versionné et `npm ci` en CI ;
7. une revue indépendante examine les dépendances, la CI, la règle architecturale, ses angles morts et les classifications F4.3/F4.4 ;
8. l’accord explicite de Mickaël requis par le plancher Critique est obtenu avant merge.

La présence d’un contrôle ne prouve que la propriété qu’il teste. Le contrôle architectural actuel vérifie uniquement les dépendances internes exprimées par imports/exports relatifs statiques ou imports dynamiques littéraux dans les fichiers `.ts`/`.tsx`, selon les couches `app`, `domains` et `shared`. Il ne prétend pas actuellement couvrir des alias TypeScript non configurés, des imports dynamiques calculés ou des cycles entre plusieurs domaines inexistants dans ce Batch. Si un de ces objets apparaît, le contrôle doit être réévalué avant de revendiquer leur couverture.

Aucun de ces contrôles ne vaut preuve de persistance, recovery ou invariants DATA, car ces objets n’existent pas encore dans ce Batch.

## Revue indépendante

Une première revue indépendante a conclu `À CORRIGER` et a identifié notamment :

- un paquet de preuve insuffisant pour établir que les garde-fous Batch 0 restaient intacts ;
- une non-détection des `import(...)` dynamiques par le contrôle architectural ;
- une preuve insuffisante, dans le paquet transmis, de l’exécution réelle des tests architecturaux en CI ;
- une classification F4.3 initialement trop basse (`Sensible` au lieu de `Critique`).

Une contre-revue ultérieure a confirmé ces corrections mais a maintenu un finding bloquant de reproductibilité npm : absence de `package-lock.json`. Ce finding est maintenant traité par un lockfile généré par npm, versionné, et l’usage de `npm ci` dans le workflow final. Les ruptures de traçabilité du paquet précédent doivent être redémontrées sur le HEAD final, sans réutiliser des extraits périmés.

Ces findings ne sont pas effacés : ils doivent être vérifiés sur le HEAD final avant promotion.

## Condition de clôture

Batch 1 n’est pas clôturé par la seule présence du scaffold. Il doit avoir passé les preuves ci-dessus, les findings éventuels doivent être traités ou explicitement classés, puis être promu selon le flux `branche dédiée → test-preview → main`.
