# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — paquet documentaire de contre-vérification Claude
- status: correction en cours sur branche dédiée avant nouvelle validation sur `test-preview` ; l’architecture Drive/rclone/Google Docs est abandonnée et retirée du périmètre actif
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: faire passer le nouveau paquet de revue et son garde-fou de prompt par la PR vers `test-preview`, puis produire les preuves réelles et les contre-vérifications requises

## État courant

- **Étape :** Batch 2 en correction avant nouvelle validation sur `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** non clôturé et non promu vers `main`.
- **Issue #21 :** ouverte ; le besoin reste de permettre une contre-vérification Claude de l’état candidat avant `main`, avec GitHub comme source de vérité.
- **Ancienne solution Drive :** abandonnée. Les synchronisations techniques ont fonctionné pour le payload Markdown, mais l’intégration Claude n’a pas satisfait le besoin avec le forfait actuel ; la tentative Google Docs introduisait une conversion non exacte.
- **Limitation Claude/GitHub établie :** le connecteur disponible charge l’état `main`; l’accès exploitable à `test-preview` nécessiterait une capacité liée à un forfait supérieur qui n’est pas retenu.
- **Solution de remplacement :** un workflow sans secret génère depuis le SHA exact de `test-preview` un artefact temporaire contenant un unique paquet documentaire et un prompt Claude rendu avec la même branche et le même SHA.
- **Garde-fou Claude :** le prompt de revue est versionné et contrôlé mécaniquement ; il doit déclarer la source autorisée, vérifier branche/SHA avant analyse, imposer `ÉTAT OBSOLÈTE` en cas de divergence, interdire les sources de substitution non autorisées et distinguer l’invérifiable du vérifié.
- **Pérennisation canonique :** la règle est d’abord validée dans Batch 2 avec son garde-fou ; son intégration éventuelle dans `DEVELOPMENT.md` sera décidée après contre-vérification indépendante, afin de ne pas modifier simultanément un document canonique et le contrôle qui le matérialise.
- **Classification Batch 2 :** Sensible, car le changement touche CI, gouvernance de preuve et garde-fous. L’ancienne surface cloud/secrets/réseau est supprimée.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application Filora n’est modifié.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : solution technique révisée après échec fonctionnel de l’architecture Drive pour Claude.
- Finding sécurité secret PR Batch 2 — **résolu puis rendu sans objet** par suppression de la mécanique Drive et de ses credentials du candidat.
- Finding intégration Claude Drive — **traité par abandon de Drive**.
- Finding conversion Google Docs — **traité par abandon de la conversion** ; le contrôle d’identité documentaire ne doit pas être affaibli pour accepter une représentation lossy.
- Finding prompt Claude — **traité par garde-fou mécanique en cours d’intégration**.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel ne prétend pas prouver toute l’architecture applicative.
- Le paquet Claude est un artefact dérivé et ponctuel ; GitHub reste autoritatif.
- Une contre-vérification Claude ne peut établir que ce que le paquet fourni permet réellement de vérifier.
- La modification du mécanisme de preuve/garde-fou ne peut pas être auto-validée uniquement par son auteur ; une contre-vérification indépendante reste requise avant clôture.

## Prochaine action

1. Ouvrir et faire passer la PR de la correction Batch 2 vers `test-preview`.
2. Vérifier `Filora guard`, les tests du générateur et le garde-fou de prompt sur le SHA candidat exact.
3. Après intégration sur `test-preview`, vérifier une exécution réelle du workflow de paquet et récupérer l’artefact du SHA exact.
4. Utiliser ce paquet et son prompt rendu pour une contre-vérification Claude réelle.
5. Obtenir la contre-vérification technique indépendante requise sur le diff et le garde-fou.
6. Seulement après absence de finding bloquant, réévaluer la pérennisation canonique de la règle Claude, puis la clôture de Batch 2 et de l’Issue #21 avant toute promotion vers `main`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.
