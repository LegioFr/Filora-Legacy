# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — miroir documentaire Google Drive
- status: en validation sur `test-preview` ; miroirs Preview et Production configurés avec Environments séparés, finding Critique de secret contre-vérifié comme résolu, première synchronisation réelle `test-preview` → `Filora-Claude-Preview` réussie et vérifiée par le workflow
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: contre-vérifier le contenu candidat via le miroir `Filora-Claude-Preview`, traiter tout finding, résoudre la réserve de durabilité OAuth si nécessaire, puis seulement envisager la promotion vers `main`

## État courant

- **Étape :** Batch 2 en validation sur `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main` après preuves techniques, contre-vérification indépendante, accord Critique et validation humaine applicative.
- **Batch 2 :** intégré à `test-preview` pour validation ; pas encore promu sur `main` ni clôturé.
- **Décision Issue #21 :** option A explicitement autorisée par Mickaël le 2026-08-28. Le besoin a ensuite été précisé : `test-preview` alimente un miroir de validation `Filora-Claude-Preview`, tandis que `main` alimente séparément le miroir officiel `Filora-Claude-Mirror`. GitHub reste la source de vérité.
- **Classification Batch 2 :** Sensible. Le finding Critique découvert pendant l'implémentation concernait l'exposition potentielle d'un secret de dépôt à une PR interne ; l'architecture finale confine les credentials dans des GitHub Actions Environments séparés et restreints à `test-preview` ou `main`, sans Repository Secret équivalent. Cette correction a reçu une contre-vérification indépendante sans finding bloquant avant intégration à `test-preview`.
- **Preuve Preview Batch 2 :** après intégration à `test-preview`, le workflow `Filora documentation mirror` a exécuté `sync-preview` avec succès, incluant la copie vers `Filora-Claude-Preview` et la vérification distante du payload contre la source ; `sync-main` a été ignoré sur cet événement.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application n’est modifié dans ce périmètre.
- **Socle applicatif disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : accès documentaire Claude via deux miroirs Drive séparés, l’un pour la validation `test-preview`, l’autre pour l’état officiel `main`. L’Issue reste ouverte jusqu’aux preuves techniques et à la clôture du périmètre.
- Finding sécurité Batch 2 — **corrigé et contre-vérifié avant intégration Preview** : un secret de dépôt accessible à un workflow PR pouvait être exfiltré depuis une branche interne. La correction supprime le Repository Secret, n'accorde aucun credential Drive au workflow PR et place les credentials dans deux Environments dédiés restreints à leur branche source.
- Finding de processus Batch 1 — **traité** : la validation humaine avait initialement été omise avant la première déclaration de clôture ; la clôture a été rouverte, la validation humaine a été réalisée, puis un garde-fou mécanique de cohérence de clôture a été intégré.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Google Drive n’est pas une source de vérité ; les deux miroirs restent des copies de lecture clairement identifiées par leur branche source.
- Les credentials OAuth/rclone ne doivent jamais être versionnés ni recopiés dans une Issue, une PR, un document de preuve ou `PROJECT_STATE.md`.
- La première synchronisation Preview a réussi, mais la durabilité de l'authentification OAuth pour les exécutions non assistées doit encore être établie avant de considérer le mécanisme durable et avant la clôture.
- Le contrôle distant actuel prouve que le payload attendu est présent et identique ; il ne prétend pas démontrer l'absence de fichiers supplémentaires dans le dossier distant.

## Prochaine action

1. Laisser la mise à jour du présent état déclencher une nouvelle synchronisation `test-preview` → `Filora-Claude-Preview` et vérifier son succès.
2. Faire réaliser une contre-vérification indépendante du contenu candidat depuis `Filora-Claude-Preview` et traiter tout finding pertinent.
3. Établir la durabilité OAuth nécessaire aux exécutions non assistées ; reconnecter/mettre à jour le secret uniquement si les preuves officielles l'exigent.
4. Seulement après ces preuves, envisager la promotion de `test-preview` vers `main`.
5. Après promotion, prouver `main` → `Filora-Claude-Mirror`, puis seulement envisager la clôture de Batch 2 et de l’Issue #21.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.