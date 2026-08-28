# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — miroir documentaire Google Drive
- status: en validation sur `test-preview` ; première synchronisation Preview prouvée, mais un finding d’intégration Claude a montré que les fichiers Markdown Drive ordinaires ne sont pas ajoutables comme connaissances de projet synchronisées ; correction en cours vers des Google Docs natifs dans `ClaudeProject`
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: valider la correction Google Docs sur `test-preview`, prouver qu’un document déjà ajouté au projet Claude voit une synchronisation ultérieure sans réajout, puis traiter la durabilité OAuth avant toute promotion vers `main`

## État courant

- **Étape :** Batch 2 en validation sur `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main` après preuves techniques, contre-vérification indépendante, accord Critique et validation humaine applicative.
- **Batch 2 :** intégré à `test-preview` pour validation ; pas encore promu sur `main` ni clôturé.
- **Décision Issue #21 :** option A explicitement autorisée par Mickaël le 2026-08-28. `test-preview` alimente `Filora-Claude-Preview`, tandis que `main` alimente séparément `Filora-Claude-Mirror`. GitHub reste la source de vérité.
- **Classification Batch 2 :** Sensible. Le finding Critique de secret PR a été corrigé et contre-vérifié avant intégration à `test-preview`. La correction actuelle ne change pas la frontière de credentials : elle modifie uniquement la représentation Drive destinée à Claude.
- **Preuve Preview acquise :** le workflow `Filora documentation mirror` a déjà synchronisé avec succès le payload Markdown `test-preview` vers `Filora-Claude-Preview` et l’a vérifié contre la source.
- **Finding d’intégration Claude :** les fichiers `.md` ordinaires visibles dans Drive ne peuvent pas être ajoutés comme connaissances de projet Claude synchronisées via le connecteur Drive. La documentation Anthropic indique que les Google Docs ajoutés aux projets restent synchronisés depuis Drive.
- **Correction en cours :** conserver le payload Markdown de preuve et ajouter `ClaudeProject` avec six Google Docs natifs importés depuis des copies texte exactes de `PROJECT_STATE`, `PRODUCT`, `DATA`, `ARCHITECTURE`, `DEVELOPMENT` et `SYNC_INFO`.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application n’est modifié dans ce périmètre.
- **Socle applicatif disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : accès documentaire Claude via deux miroirs Drive séparés. Elle reste ouverte jusqu’aux preuves end-to-end et à la clôture du périmètre.
- Finding sécurité Batch 2 — **corrigé et contre-vérifié** : aucun credential Drive au workflow PR ; Environment Secrets séparés et restreints à leur branche source.
- Finding intégration Claude Batch 2 — **correction en cours** : le miroir brut Drive fonctionne, mais les `.md` ordinaires ne satisfont pas le besoin de connaissances Claude automatiquement fraîches. La correction utilise des Google Docs natifs tout en conservant GitHub comme source de vérité.
- Finding de processus Batch 1 — **traité** : le garde-fou mécanique de cohérence de clôture est intégré.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel ne prétend pas prouver toute l’architecture applicative.
- Google Drive n’est pas une source de vérité ; les miroirs et Google Docs restent des copies de lecture dérivées de GitHub.
- Les credentials OAuth/rclone ne doivent jamais être versionnés ni recopiés dans une Issue, une PR, un document de preuve ou `PROJECT_STATE.md`.
- La durabilité de l'authentification OAuth pour les exécutions non assistées doit encore être établie avant clôture.
- Le payload Markdown distant est vérifié avec `rclone check --one-way`, ce qui ne démontre pas l’absence de fichiers supplémentaires au niveau racine.
- L’intégration Google Docs n’est pas considérée prouvée tant qu’un document ajouté une seule fois au projet Claude n’a pas vu une synchronisation ultérieure sans réajout manuel.

## Prochaine action

1. Faire passer la correction Google Docs par les contrôles PR sans exposer de credential Drive.
2. Intégrer la correction à `test-preview`, exécuter la vraie synchronisation Preview et vérifier les six Google Docs `ClaudeProject` contre la source.
3. Ajouter ces Google Docs une seule fois au projet Claude, puis provoquer une synchronisation ultérieure et vérifier dans Claude le nouveau `source_sha` sans réajouter les documents.
4. Établir la durabilité OAuth nécessaire aux exécutions non assistées.
5. Seulement après ces preuves, envisager la promotion vers `main`, puis prouver le miroir officiel avant clôture de Batch 2 et de l’Issue #21.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.
