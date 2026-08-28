# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 1
- status: premier socle exécutable en correction et validation critique
- git: travail Batch 1 sur branche dédiée ; lire les HEAD, PR et branches courants directement depuis GitHub
- next_action: obtenir les preuves corrigées, la contre-vérification indépendante et l’accord Critique explicite avant toute promotion vers test-preview

## État courant

- **Étape :** Batch 1 — premier socle exécutable de Filora.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** React + TypeScript + Vite approuvé explicitement ; implémentation en correction/validation après revue indépendante.
- **Classification courante :** Critique selon F4.3, car le Batch modifie simultanément du code soumis à une nouvelle règle architecturale et le mécanisme de contrôle de cette règle.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — ouverte et reportée hors Batch 1 : miroir documentaire Google Drive à traiter dans un périmètre dédié après décision explicite ; aucune implémentation cloud/sync/secrets dans Batch 1.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- Revue indépendante Batch 1 — verdict initial `À CORRIGER` : défaut de détection des imports dynamiques dans le contrôle architectural, paquet de preuve incomplet sur la CI, et classification F4.3 initialement trop basse. Corrections et contre-vérification en cours.
- Issues #2, #3, #4, #5, #7, #10 et #12 — fermées/résolues selon leur état GitHub.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Batch 1 ne fournit aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural du Batch 1 vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Le plancher Critique impose une protection supplémentaire indépendante et un accord explicite de Mickaël avant promotion/clôture.

## Prochaine action

1. Vérifier le nouvel état CI sur le HEAD exact après corrections.
2. Fournir à la contre-vérification indépendante le workflow complet, les tests réels, le contrôle corrigé et les preuves CI disponibles.
3. Traiter/classer tout finding restant.
4. Obtenir l’accord explicite de Mickaël requis par le plancher Critique sur l’intention, les conséquences et les compromis.
5. Ne promouvoir vers `test-preview` qu’après satisfaction de ces conditions, puis ne promouvoir vers `main` qu’après validation sur `test-preview`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` décrit le périmètre courant mais ne remplace aucun document canonique.
