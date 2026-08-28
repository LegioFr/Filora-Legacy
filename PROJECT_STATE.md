# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: post-Batch 1
- status: Batch 1 clôturé et intégré à main après validation humaine applicative
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: reconstruire l’état GitHub et examiner l’Issue #21 dans son périmètre dédié avant toute nouvelle implémentation

## État courant

- **Étape :** post-Batch 1.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main` après preuves techniques, contre-vérification indépendante, accord Critique et validation humaine applicative.
- **Validation humaine Batch 1 :** **VALIDÉE** le 2026-08-28 sur une Preview temporaire ouverte par Mickaël sur tablette. Filora s’est affichée, l’écran `Stock de filament` et l’état vide `spools` ont été observés et aucun défaut bloquant n’a été demandé à corriger pour le périmètre Batch 1.
- **Garde-fou de clôture humaine :** actif dans `filora_guard.py` et la CI ; le `BATCH<n>.md` le plus récent doit déclarer exactement un jalon humain `EN ATTENTE`, `VALIDÉ` ou `NON REQUIS`, et un Batch déclaré clôturé ne peut pas rester `EN ATTENTE`.
- **Socle disponible :** React + TypeScript + Vite, premier écran exécutable, structure `app` / `domains/spools`, contrôle mécanique minimal de direction d’import, typecheck et build en CI.
- **Classification technique historique Batch 1 :** Critique selon F4.3 ; accord explicite Mickaël obtenu et protection supplémentaire §10.6 exercée par contre-vérification indépendante finale.
- **Reproductibilité npm :** `package-lock.json` versionné ; workflow basé sur `npm ci`.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils (HEAD, PR courante, commit de merge) doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Finding de processus Batch 1 — **traité** : la validation humaine avait initialement été omise avant la première déclaration de clôture ; la clôture a été rouverte, la validation humaine a été réalisée, puis un garde-fou mécanique de cohérence de clôture a été intégré.
- Issue #21 — **ouverte et désormais prioritaire après Batch 1** : miroir documentaire Google Drive destiné à Claude, synchronisé depuis `main`. Elle reste un périmètre dédié et ne constitue pas à elle seule une autorisation d’implémentation.
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

1. Reconstruire l’état réel de `main`, `test-preview` et des Issues avant le prochain périmètre.
2. Examiner l’Issue #21, ses conditions d’autorisation, ses risques, les secrets/credentials nécessaires et les preuves attendues.
3. Obtenir la décision explicite de Mickaël requise avant toute intégration cloud/synchronisation durable.
4. Garder ce travail séparé d’un futur Batch fonctionnel de gestion du stock.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1 mais ne remplace aucun document canonique.
