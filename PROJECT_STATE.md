# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: post-Batch 1
- status: Batch 1 clôturé et intégré à main
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: avant tout nouveau Batch, vérifier GitHub et les findings ouverts ; traiter en priorité le périmètre dédié de l’Issue #21 si ses conditions d’autorisation sont remplies

## État courant

- **Étape :** post-Batch 1.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main` après validation sur `test-preview`.
- **Socle disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Classification Batch 1 :** Critique selon F4.3 ; accord explicite Mickaël obtenu et protection supplémentaire §10.6 exercée par contre-vérification indépendante finale.
- **Reproductibilité npm :** `package-lock.json` versionné ; workflow basé sur `npm ci`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — ouverte : miroir documentaire Google Drive destiné à Claude, synchronisé depuis `main`. Elle a été explicitement reportée hors Batch 1 et doit maintenant être traitée dans un périmètre dédié avant tout autre travail non prioritaire.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- Revue indépendante Batch 1 — findings initiaux corrigés ou explicitement classés ; contre-vérification finale `ACCEPTABLE`, aucun finding bloquant restant pour la clôture.
- Issues #2, #3, #4, #5, #7, #10 et #12 — fermées/résolues selon leur état GitHub.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Google Drive n’est pas une source de vérité : l’Issue #21 doit préserver GitHub comme autorité et limiter Drive à un miroir de lecture.

## Prochaine action

1. Reconstruire l’état réel depuis `main` et les Issues GitHub au démarrage du prochain périmètre.
2. Examiner l’Issue #21 et confirmer ses conditions d’autorisation, ses risques et ses preuves avant implémentation.
3. Ne pas mélanger ce travail cloud/sync avec un Batch fonctionnel de stock.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1 mais ne remplace aucun document canonique.
