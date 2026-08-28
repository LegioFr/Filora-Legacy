# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 1 — clôture après validation humaine
- status: validation humaine applicative obtenue ; clôture en cours de validation CI et promotion
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: faire passer cette clôture sur test-preview puis main ; seulement ensuite considérer Batch 1 réellement clôturé et reprendre l’Issue #21

## État courant

- **Étape :** Batch 1 — clôture après validation humaine.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** implémentation, preuves techniques, contre-vérification indépendante, promotion technique à `main` et validation humaine applicative réalisées ; mise à jour de clôture en cours de validation.
- **Validation humaine Batch 1 :** **VALIDÉE** le 2026-08-28 sur une Preview temporaire ouverte par Mickaël sur tablette. Filora s’est affichée, l’écran `Stock de filament` et l’état vide `spools` ont été observés et aucun défaut bloquant n’a été demandé à corriger pour le périmètre Batch 1.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Socle disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Classification technique historique Batch 1 :** Critique selon F4.3 ; accord explicite Mickaël obtenu et protection supplémentaire §10.6 exercée par contre-vérification indépendante finale.
- **Reproductibilité npm :** `package-lock.json` versionné ; workflow basé sur `npm ci`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Finding de processus Batch 1 : la validation humaine avait initialement été omise avant la première déclaration de clôture. Ce finding a été traité : la clôture a été rouverte, la validation humaine a ensuite été réalisée, et un garde-fou mécanique de cohérence de clôture est actif.
- Issue #21 — ouverte : miroir documentaire Google Drive destiné à Claude, synchronisé depuis `main`. Elle reste reportée jusqu’à la clôture réelle de Batch 1 sur `main`.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.
- Revue indépendante Batch 1 — findings techniques initiaux corrigés ou explicitement classés ; contre-vérification finale `ACCEPTABLE` pour la promotion technique.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel vérifie les dépendances internes relatives matérialisées en TypeScript/TSX ; il ne prétend pas prouver toute l’architecture ni des objets encore absents tels que plusieurs domaines ou des alias TypeScript.
- Le garde-fou de validation humaine vérifie un état explicite de Batch et la cohérence de clôture ; il ne peut pas décider à lui seul quels jalons humains intermédiaires sont sémantiquement nécessaires. Pour un comportement observable dont dépendent des travaux ultérieurs, la validation doit être demandée au jalon utile avant de construire davantage dessus lorsque son appréciation humaine est nécessaire.
- Google Drive n’est pas une source de vérité : l’Issue #21 doit préserver GitHub comme autorité et limiter Drive à un miroir de lecture.

## Prochaine action

1. Valider cette clôture sur `test-preview` avec la CI et le garde-fou humain.
2. Promouvoir ensuite le même état vers `main` si aucun finding bloquant n’apparaît.
3. Reconstruire l’état Git réel et seulement alors déclarer Batch 1 clôturé.
4. Après cette clôture réelle, reprendre l’Issue #21 dans son périmètre dédié.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier du Batch 1 mais ne remplace aucun document canonique.
