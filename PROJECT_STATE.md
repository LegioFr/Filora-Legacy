# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — miroir documentaire Google Drive
- status: en préparation ; option A autorisée par Mickaël, périmètre précisé avec miroir de validation `test-preview` séparé du miroir officiel `main`, implémentation technique non encore prouvée
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: finaliser les Environments GitHub dédiés aux deux branches, obtenir une synchronisation réelle depuis `test-preview`, faire vérifier ce miroir candidat, puis seulement envisager la promotion vers `main` et la preuve du miroir officiel

## État courant

- **Étape :** Batch 2 technique dédié aux miroirs documentaires Google Drive.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main` après preuves techniques, contre-vérification indépendante, accord Critique et validation humaine applicative.
- **Batch 2 :** en préparation ; intention et preuves définies dans `BATCH2.md`.
- **Décision Issue #21 :** option A explicitement autorisée par Mickaël le 2026-08-28. Le besoin a ensuite été précisé : `test-preview` alimente un miroir de validation `Filora-Claude-Preview`, tandis que `main` alimente séparément le miroir officiel `Filora-Claude-Mirror`. GitHub reste la source de vérité.
- **Classification Batch 2 :** Sensible sous réserve que les credentials Drive soient réellement confinés dans des GitHub Actions Environments dédiés et restreints à leur branche source ; tout écart réactive le finding Critique d’exposition du secret.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application n’est modifié dans ce périmètre.
- **Socle applicatif disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : accès documentaire Claude via deux miroirs Drive séparés, l’un pour la validation `test-preview`, l’autre pour l’état officiel `main`. L’Issue reste ouverte jusqu’aux preuves techniques et à la clôture du périmètre.
- Finding sécurité Batch 2 — **à prouver corrigé** : un secret de dépôt accessible à un workflow PR pouvait être exfiltré depuis une branche interne. La correction retenue supprime l’accès Drive des workflows PR et déplace les credentials dans des Environments dédiés, restreints à `test-preview` ou `main`.
- Finding de processus Batch 1 — **traité** : la validation humaine avait initialement été omise avant la première déclaration de clôture ; la clôture a été rouverte, la validation humaine a été réalisée, puis un garde-fou mécanique de cohérence de clôture a été intégré.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Google Drive n’est pas une source de vérité ; les deux miroirs restent des copies de lecture clairement identifiées par leur branche source.
- Les credentials OAuth/rclone ne doivent jamais être versionnés ni recopiés dans une Issue, une PR, un document de preuve ou `PROJECT_STATE.md`.
- La réussite théorique du workflow n’est pas suffisante : une synchronisation réelle et la vérification du contenu distant restent requises avant clôture.

## Prochaine action

1. Configurer `drive-mirror-preview` avec secret d’Environment et restriction à `test-preview`.
2. Configurer `drive-mirror-production` avec secret d’Environment et restriction à `main`.
3. S’assurer qu’aucun `FILORA_RCLONE_CONFIG` ne subsiste au niveau des Repository Secrets.
4. Intégrer le Batch candidat dans `test-preview`, obtenir la synchronisation réelle vers `Filora-Claude-Preview` et vérifier son contenu contre `SYNC_INFO.md`.
5. Faire réaliser la contre-vérification indépendante utile sur l’état candidat, traiter tout finding, puis seulement envisager la promotion vers `main`.
6. Après promotion, prouver `main → Filora-Claude-Mirror`, puis seulement envisager la clôture de Batch 2 et de l’Issue #21.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.
