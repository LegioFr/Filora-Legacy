# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 1
- status: premier socle exécutable validé sur test-preview, en attente de promotion finale vers main
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: vérifier l’état réel de test-preview, ouvrir ou contrôler la promotion vers main, puis considérer Batch 1 clôturé seulement si main contient l’état validé sans nouveau finding bloquant

## État courant

- **Étape :** Batch 1 — premier socle exécutable de Filora.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** React + TypeScript + Vite approuvé explicitement ; état technique validé sur `test-preview` après corrections et contre-vérification indépendante finale.
- **Classification courante :** Critique selon F4.3, car le Batch a modifié simultanément du code soumis à une nouvelle règle architecturale et le mécanisme de contrôle de cette règle.
- **Accord Critique Mickaël :** obtenu le 2026-08-28 et confirmé directement lors de la contre-vérification indépendante.
- **Protection supplémentaire §10.6 :** contre-vérification indépendante finale jugée adéquate et exercée.
- **Reproductibilité npm :** `package-lock.json` versionné ; workflow final basé sur `npm ci`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — ouverte et reportée hors Batch 1 : miroir documentaire Google Drive à traiter dans un périmètre dédié après décision explicite ; aucune implémentation cloud/sync/secrets dans Batch 1.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- Revue indépendante Batch 1 — verdict initial `À CORRIGER` : défaut de détection des imports dynamiques, paquet de preuve incomplet sur la CI et classification F4.3 initialement trop basse. Ces points ont été corrigés ou explicitement classés.
- Contre-revue Batch 1 — finding bloquant de reproductibilité npm traité par le lockfile versionné et `npm ci`.
- Contre-vérification finale Batch 1 — verdict `ACCEPTABLE` pour la promotion vers `test-preview`, aucun finding bloquant restant ; protection supplémentaire §10.6 jugée adéquate et exercée.
- Issues #2, #3, #4, #5, #7, #10 et #12 — fermées/résolues selon leur état GitHub.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Batch 1 ne fournit aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural du Batch 1 vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Issue #21 reste hors Batch 1 et ne doit pas être mélangée à la promotion finale de ce Batch.

## Prochaine action

1. Vérifier que l’état de `test-preview` correspond bien au socle validé et que les contrôles restent verts sur la promotion destinée à `main`.
2. Promouvoir vers `main` seulement si aucun nouveau finding bloquant n’apparaît.
3. Une fois l’état validé présent sur `main`, considérer Batch 1 clôturé après reconstruction de l’état Git réel.
4. Avant tout nouveau Batch, réexaminer les Issues/findings ouverts ; Issue #21 reste le travail dédié prévu ensuite.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` décrit le périmètre courant mais ne remplace aucun document canonique.
