# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 1 — validation humaine
- status: intégré techniquement à main ; clôture rouverte, validation humaine applicative en attente
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: rendre le socle Batch 1 testable par Mickaël, recueillir sa validation humaine du comportement observable, corriger si nécessaire, puis seulement reclôturer Batch 1

## État courant

- **Étape :** Batch 1 — validation humaine applicative.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** implémentation, preuves techniques, contre-vérification indépendante et promotion jusqu’à `main` réalisées ; sa clôture documentaire précédente a été reconnue prématurée car le socle applicatif observable n’avait pas encore été testé par Mickaël.
- **Validation humaine Batch 1 :** **EN ATTENTE** — Mickaël doit pouvoir lancer/ouvrir le socle et vérifier au minimum que l’application s’affiche et que l’écran de base du périmètre Batch 1 se comporte correctement. Un problème observé doit être corrigé avant reclôture.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Socle disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Classification technique historique Batch 1 :** Critique selon F4.3 ; accord explicite Mickaël obtenu et protection supplémentaire §10.6 exercée par contre-vérification indépendante finale.
- **Reproductibilité npm :** `package-lock.json` versionné ; workflow basé sur `npm ci`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Finding de processus constaté après la promotion Batch 1 : la validation humaine de l’application n’avait pas été réalisée avant la déclaration de clôture. Le besoin est désormais couvert par les règles canoniques existantes sur Preview/validation humaine et validation manquante, complétées par le garde-fou mécanique de clôture ; Batch 1 reste non clôturable jusqu’à validation humaine.
- Issue #21 — ouverte : miroir documentaire Google Drive destiné à Claude, synchronisé depuis `main`. Elle reste reportée tant que la validation humaine nécessaire à la reclôture de Batch 1 n’est pas obtenue.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- Revue indépendante Batch 1 — findings techniques initiaux corrigés ou explicitement classés ; contre-vérification finale `ACCEPTABLE` pour la promotion technique.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Le garde-fou de validation humaine vérifie un état explicite de Batch et la cohérence de clôture ; il ne peut pas décider à lui seul quels jalons humains intermédiaires sont sémantiquement nécessaires. Cette décision doit être faite avant les travaux dépendants, conformément aux règles de validation et de dépendance existantes.
- Google Drive n’est pas une source de vérité : l’Issue #21 doit préserver GitHub comme autorité et limiter Drive à un miroir de lecture.

## Prochaine action

1. Rendre le socle Batch 1 accessible/testable par Mickaël et effectuer la validation humaine applicative manquante.
2. Corriger tout défaut observé avant de reclôturer Batch 1.
3. Après reclôture réelle seulement, reprendre l’Issue #21 dans son périmètre dédié.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier du Batch 1 mais doit refléter l’état de validation humaine avant toute nouvelle déclaration de clôture.
