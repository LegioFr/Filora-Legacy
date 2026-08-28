# BATCH2.md — Miroir documentaire Google Drive

**Statut : en validation sur `test-preview`**  
**Date de préparation : 2026-08-28**

## Intention

Permettre à Claude de consulter un miroir documentaire à jour de Filora pendant la validation sur `test-preview` puis, séparément, de l’état officiel après promotion sur `main`, sans créer de seconde source de vérité.

GitHub reste autoritatif. Google Drive est uniquement un miroir de lecture.

## Décision structurante

Le 2026-08-28, Mickaël a explicitement validé l’option A définie dans l’Issue #21 : synchronisation automatique des documents Filora vers Google Drive via GitHub Actions + rclone + OAuth Google utilisateur, avec credentials conservés uniquement dans des GitHub Actions Environment Secrets.

Le périmètre a été précisé pour rendre Claude utile avant promotion :

- `test-preview` alimente un miroir de validation séparé `Filora-Claude-Preview` ;
- `main` alimente le miroir officiel `Filora-Claude-Mirror` ;
- les deux miroirs ne doivent jamais être confondus.

Une première synchronisation réelle a ensuite montré une incompatibilité fonctionnelle : les fichiers Markdown ordinaires créés par rclone dans Drive sont lisibles dans Drive mais ne peuvent pas être ajoutés comme connaissances synchronisées d’un projet Claude. La documentation Anthropic établit que les Google Docs ajoutés à un projet restent synchronisés depuis Drive.

La correction retenue conserve donc le miroir Markdown existant pour la preuve technique et ajoute, dans chaque miroir, un sous-dossier `ClaudeProject` contenant six **Google Docs natifs** importés depuis des copies texte exactes des cinq documents canoniques et de `SYNC_INFO.md`. GitHub reste la seule source de vérité ; les Google Docs ne sont qu’une représentation de transport destinée à Claude.

Cette correction reste dans le périmètre externe déjà autorisé : même compte Google, même OAuth, mêmes Environments et mêmes branches sources. Elle ne change ni le contrat produit ni les documents canoniques.

## Findings / Issues examinés avant démarrage et correction

- Issue #21 — **traitée dans ce Batch** : miroir documentaire Google Drive destiné à Claude.
- Findings de revue sur l’exposition du secret aux workflows PR — **traités dans ce Batch** : aucun workflow déclenché par `pull_request` ne doit recevoir le credential Drive ; les jobs de synchronisation doivent utiliser des Environments dédiés et restreints à leur branche source.
- Finding d’intégration Claude découvert en validation — **traité dans ce Batch** : un fichier `.md` Drive ordinaire n’est pas une connaissance de projet Claude synchronisée. La correction publie une représentation Google Docs native dans `ClaudeProject`.
- Aucun autre Issue/finding ouvert pertinent identifié lors de la reprise du Batch 2.

## Dans le périmètre

- synchronisation de `PROJECT_STATE.md`, `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md` depuis `test-preview` vers `Filora-Claude-Preview` ;
- synchronisation des mêmes cinq documents depuis `main` vers `Filora-Claude-Mirror` ;
- génération d’un `SYNC_INFO.md` contenant au minimum le SHA synchronisé, la branche source et l’horodatage de synchronisation ;
- conservation du payload Markdown exact pour la preuve distante ;
- génération de copies texte exactes puis import rclone en Google Docs natifs dans `ClaudeProject` ;
- vérification que les six objets `ClaudeProject` sont des Google Docs natifs et que leur texte exporté est identique au payload source ;
- GitHub Actions limité au périmètre documentaire retenu ;
- rclone avec OAuth Google utilisateur ;
- credentials lus depuis des GitHub Actions Environment Secrets et jamais versionnés ;
- séparation mécanique des credentials par Environments `drive-mirror-preview` et `drive-mirror-production`, chacun limité à sa branche source ;
- preuves de transfert et de correspondance entre chaque miroir Drive et le SHA annoncé.

## Hors périmètre

- synchronisation d’une branche de travail ou d’une PR directement vers Drive ;
- utilisation de `test-preview` comme source du miroir officiel `Filora-Claude-Mirror` ;
- utilisation de `main` comme source du miroir de validation `Filora-Claude-Preview` ;
- modification sémantique de `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` ou `DEVELOPMENT.md` ;
- édition manuelle des Google Docs comme source ;
- changement fonctionnel de l’application ;
- persistance métier, mutations de stock, migrations ou recovery ;
- adoption d’un autre cloud ou d’une seconde source de vérité ;
- synchronisation bidirectionnelle Drive → GitHub.

## Classification

- **F4.2 : Sensible** — le changement touche CI, secrets/credentials, synchronisation, réseau/cloud et compte distant.
- **F4.3 : Sensible** après correction des findings d’exposition PR : aucun workflow PR ne doit recevoir le credential Drive ; les synchronisations utilisent des Environments dédiés restreints à `test-preview` ou `main`. Cette classification doit être réévaluée si cette frontière de confiance n’est pas effectivement configurée ou si un autre critère Critique apparaît.
- **F4.4 : décision Mickaël requise pour l’adoption du compte/service externe et de la synchronisation durable — OBTENUE le 2026-08-28.**
- La conversion technique en Google Docs natifs n’ajoute pas de nouveau fournisseur, compte, credential ou destination durable ; elle reste dans cette décision déjà obtenue.

## Preuves requises avant clôture

1. le workflow de validation ne s’exécute que depuis `test-preview` et écrit uniquement dans `Filora-Claude-Preview` ;
2. le workflow officiel ne s’exécute que depuis `main` et écrit uniquement dans `Filora-Claude-Mirror` ;
3. aucune branche de PR ou de travail ne reçoit le credential Drive ;
4. les Environment Secrets `drive-mirror-preview` et `drive-mirror-production` sont chacun restreints à leur branche source ;
5. aucun secret, token OAuth ou configuration rclone sensible n’est versionné ;
6. `SYNC_INFO.md` est généré à partir de l’état réellement synchronisé et contient le SHA, la branche source et un horodatage ;
7. une exécution réelle depuis `test-preview` réussit, le payload Markdown est vérifié contre la source et les six objets `ClaudeProject` sont prouvés comme Google Docs natifs au texte identique ;
8. les six Google Docs Preview sont ajoutés une seule fois au projet Claude, puis une synchronisation ultérieure doit être visible par Claude **sans réajouter les documents** ; cette preuve end-to-end doit confirmer au minimum un nouveau `source_sha` dans `SYNC_INFO` ;
9. après validation et promotion, une exécution réelle depuis `main` réussit avec les mêmes preuves sur `Filora-Claude-Mirror` ;
10. les contrôles Filora existants restent verts ;
11. une contre-vérification indépendante proportionnée au caractère Sensible du changement examine le diff, la classification et les preuves.

## Dépendance humaine nécessaire

La création/autorisation OAuth Google et l’enregistrement du credential résultant dans les GitHub Actions Environment Secrets nécessitent une intervention sur le compte Google/GitHub lorsque ces opérations ne sont pas accessibles à l’agent.

L’ajout initial des six Google Docs `Filora-Claude-Preview/ClaudeProject` dans les connaissances du projet Claude nécessite également une action dans l’interface Claude lorsque cet accès n’est pas disponible à l’agent. Cette action doit être faite une seule fois ; la preuve attendue ensuite est la mise à jour automatique sans nouvel ajout manuel.

Aucun secret ne doit être communiqué dans un document, une Issue, une PR ou un message destiné à être conservé comme preuve.

### Jalon humain requis — NON REQUIS

Ce Batch ne modifie pas le comportement observable de l’application Filora. Il nécessite une décision de Mickaël sur l’adoption du service externe — déjà obtenue — mais pas une validation humaine applicative de type Preview.

## Condition de clôture

Le Batch 2 ne peut être déclaré clôturé que lorsque la synchronisation réelle `test-preview → Filora-Claude-Preview` a été prouvée, que les Google Docs `ClaudeProject` sont utilisables et restent à jour dans Claude sans réajout manuel, puis que la synchronisation réelle `main → Filora-Claude-Mirror` a été prouvée après promotion, avec contenu distant vérifié contre les SHA annoncés, contrôles applicables verts et aucun finding bloquant indépendant non résolu.
