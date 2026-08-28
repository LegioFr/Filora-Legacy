# BATCH2.md — Miroir documentaire Google Drive

**Statut : en préparation**  
**Date de préparation : 2026-08-28**

## Intention

Permettre à Claude de consulter un miroir documentaire à jour de l’état officiel de Filora sans créer une seconde source de vérité.

GitHub `main` reste autoritatif. Google Drive est uniquement un miroir de lecture.

## Décision structurante

Le 2026-08-28, Mickaël a explicitement validé l’option A définie dans l’Issue #21 : synchronisation automatique des documents officiels depuis `main` vers un dossier Google Drive dédié via GitHub Actions + rclone + OAuth Google utilisateur, avec credentials conservés uniquement dans GitHub Actions Secrets.

Cette décision autorise l’implémentation de ce périmètre. Elle ne constitue pas une preuve technique de son bon fonctionnement.

## Findings / Issues examinés avant démarrage

- Issue #21 — **traitée dans ce Batch** : miroir documentaire Google Drive synchronisé depuis `main`.
- Aucun autre Issue/finding ouvert pertinent identifié lors de la préparation du Batch 2.

## Dans le périmètre

- synchronisation de `PROJECT_STATE.md`, `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md` depuis `main` ;
- génération d’un `SYNC_INFO.md` contenant au minimum le SHA synchronisé, la branche `main` et l’horodatage de synchronisation ;
- GitHub Actions limité au périmètre documentaire retenu pour la synchronisation officielle ;
- rclone avec OAuth Google utilisateur ;
- credentials lus depuis GitHub Actions Secrets et jamais versionnés ;
- preuves de transfert et de correspondance entre le miroir Drive et le SHA annoncé.

## Hors périmètre

- synchronisation de `test-preview` vers le miroir officiel ;
- modification sémantique de `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` ou `DEVELOPMENT.md` ;
- changement fonctionnel de l’application ;
- persistance métier, mutations de stock, migrations ou recovery ;
- adoption d’un autre cloud ou d’une seconde source de vérité ;
- synchronisation bidirectionnelle Drive → GitHub.

## Classification

- **F4.2 : Sensible** — le changement touche CI, secrets/credentials, synchronisation, réseau/cloud et compte distant.
- **F4.3 : Sensible** à ce stade : aucun affaiblissement de garde-fou ni modification des règles déterminant l’autorité des agents n’est prévu. Cette classification doit être réévaluée si l’implémentation touche simultanément un objet protégé et son mécanisme de contrôle ou introduit un autre critère Critique.
- **F4.4 : décision Mickaël requise pour l’adoption du compte/service externe et de la synchronisation durable — OBTENUE le 2026-08-28.**

## Preuves requises avant clôture

1. le workflow officiel de synchronisation ne s’exécute que depuis `main` et seulement lorsque l’un des cinq documents suivis change ;
2. `test-preview` n’est jamais utilisé comme source du miroir officiel ;
3. aucun secret, token OAuth ou configuration rclone sensible n’est versionné ;
4. `SYNC_INFO.md` est généré à partir de l’état réellement synchronisé et contient le SHA, `main` et un horodatage ;
5. une exécution réelle réussit avec les credentials configurés dans GitHub Actions Secrets ;
6. le contenu du dossier Drive obtenu est vérifié et correspond aux cinq documents du SHA annoncé ainsi qu’au `SYNC_INFO.md` ;
7. les contrôles Filora existants restent verts ;
8. une contre-vérification indépendante proportionnée au caractère Sensible du changement examine le diff, la classification et les preuves.

## Dépendance humaine nécessaire

La création/autorisation OAuth Google et l’enregistrement du credential résultant dans GitHub Actions Secrets nécessitent une intervention sur le compte Google/GitHub lorsque ces opérations ne sont pas accessibles à l’agent.

Aucun secret ne doit être communiqué dans un document, une Issue, une PR ou un message destiné à être conservé comme preuve.

### Jalon humain requis — NON REQUIS

Ce Batch ne modifie pas le comportement observable de l’application Filora. Il nécessite une décision de Mickaël sur l’adoption du service externe — déjà obtenue — mais pas une validation humaine applicative de type Preview.

## Condition de clôture

Le Batch 2 ne peut être déclaré clôturé que lorsque la synchronisation réelle `main → Google Drive` a été prouvée, que le contenu distant a été vérifié contre le SHA annoncé, que les contrôles applicables sont verts et que la contre-vérification indépendante requise ne laisse aucun finding bloquant non résolu.
