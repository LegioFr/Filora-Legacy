# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — miroir documentaire Google Drive
- status: en préparation ; option A autorisée par Mickaël, implémentation technique non encore prouvée
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: implémenter le miroir dans le périmètre de l’Issue #21, configurer les credentials hors dépôt, puis obtenir les preuves de synchronisation et la contre-vérification indépendante avant clôture

## État courant

- **Étape :** Batch 2 technique dédié au miroir documentaire Google Drive.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main` après preuves techniques, contre-vérification indépendante, accord Critique et validation humaine applicative.
- **Batch 2 :** en préparation ; intention et preuves définies dans `BATCH2.md`.
- **Décision Issue #21 :** option A explicitement autorisée par Mickaël le 2026-08-28 : miroir automatique `main → Google Drive` via GitHub Actions + rclone + OAuth Google utilisateur, GitHub restant la source de vérité.
- **Classification Batch 2 :** Sensible à ce stade, car le périmètre touche CI, credentials/secrets, synchronisation, réseau/cloud et compte distant. À réévaluer si l’implémentation introduit un critère Critique.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application n’est modifié dans ce périmètre.
- **Socle applicatif disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : miroir documentaire Google Drive destiné à Claude, synchronisé depuis `main`. La décision externe requise est obtenue ; l’Issue reste ouverte jusqu’aux preuves techniques et à la clôture du périmètre.
- Finding de processus Batch 1 — **traité** : la validation humaine avait initialement été omise avant la première déclaration de clôture ; la clôture a été rouverte, la validation humaine a été réalisée, puis un garde-fou mécanique de cohérence de clôture a été intégré.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Google Drive n’est pas une source de vérité ; Batch 2 doit préserver GitHub comme autorité et limiter Drive à un miroir de lecture.
- Les credentials OAuth/rclone ne doivent jamais être versionnés ni recopiés dans une Issue, une PR, un document de preuve ou `PROJECT_STATE.md`.
- La réussite théorique du workflow n’est pas suffisante : une synchronisation réelle et la vérification du contenu distant restent requises avant clôture.

## Prochaine action

1. Implémenter le mécanisme de préparation/synchronisation du miroir dans le périmètre de `BATCH2.md`.
2. Vérifier mécaniquement que seule la source `main` et les cinq documents officiels alimentent le miroir.
3. Configurer OAuth/rclone et GitHub Actions Secrets hors dépôt lorsque l’intervention sur le compte est nécessaire.
4. Exécuter une synchronisation réelle et vérifier le contenu Drive contre le SHA annoncé dans `SYNC_INFO.md`.
5. Faire réaliser la contre-vérification indépendante requise, traiter tout finding bloquant, puis seulement envisager la clôture de Batch 2 et de l’Issue #21.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.
