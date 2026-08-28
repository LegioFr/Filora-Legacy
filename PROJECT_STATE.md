# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 1
- status: premier socle exécutable en implémentation et validation
- git: travail Batch 1 sur branche dédiée ; lire les HEAD, PR et branches courants directement depuis GitHub
- next_action: terminer les preuves du Batch 1 sur la PR vers test-preview avant toute promotion ; ne pas démarrer un autre Batch automatiquement

## État courant

- **Étape :** Batch 1 — premier socle exécutable de Filora.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** React + TypeScript + Vite approuvé explicitement ; implémentation/validation en cours.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — ouverte et reportée hors Batch 1 : miroir documentaire Google Drive à traiter dans un périmètre dédié après décision explicite ; aucune implémentation cloud/sync/secrets dans Batch 1.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- Issues #2, #3, #4, #5, #7, #10 et #12 — fermées/résolues selon leur état GitHub.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Batch 1 ne fournit aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural du Batch 1 vérifie seulement des directions d’import objectives actuellement matérialisées ; il ne prétend pas prouver toute l’architecture.

## Prochaine action

1. Valider le scaffold Batch 1 sur une PR vers `test-preview`.
2. Vérifier typecheck, build, contrôles Batch 0 et contrôle des frontières architecturales sur le HEAD exact.
3. Obtenir la revue indépendante proportionnée requise par le caractère sensible des dépendances et de la CI.
4. Traiter/classer tout finding nouveau avant promotion.
5. Ne promouvoir vers `main` qu’après validation sur `test-preview`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` décrit le périmètre courant mais ne remplace aucun document canonique.
