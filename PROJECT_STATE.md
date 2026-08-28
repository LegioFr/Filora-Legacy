# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — paquet documentaire de contre-vérification Claude et garde-fous permanents de revue IA
- status: correction en cours sur branche dédiée avant nouvelle validation sur `test-preview` ; l’architecture Drive/rclone/Google Docs est abandonnée et trois règles permanentes ont été ajoutées au candidat dans `DEVELOPMENT.md`
- git: lire les HEAD, PR et branches courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: faire passer la PR vers `test-preview`, vérifier les nouveaux garde-fous et obtenir la validation indépendante exigée par la modification canonique Critique avant toute intégration comme état validé

## État courant

- **Étape :** Batch 2 en correction avant nouvelle validation sur `test-preview`.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** non clôturé et non promu vers `main`.
- **Issue #21 :** ouverte ; le besoin reste de permettre une contre-vérification Claude de l’état candidat avant `main`, avec GitHub comme source de vérité.
- **Ancienne solution Drive :** abandonnée. Les synchronisations techniques ont fonctionné pour le payload Markdown, mais l’intégration Claude n’a pas satisfait le besoin avec le forfait actuel ; la tentative Google Docs introduisait une conversion non exacte.
- **Solution de remplacement :** un workflow sans secret génère depuis le SHA exact de `test-preview` un artefact temporaire contenant un paquet documentaire et un prompt Claude rendu avec la même branche et le même SHA.
- **Garde-fou Claude permanent :** `DEVELOPMENT.md` impose désormais qu’une mission Claude utilisée comme preuve déclare ses sources et son état attendu, vérifie la référence avant analyse, impose `ÉTAT OBSOLÈTE` en cas de divergence et distingue l’invérifiable du vérifié. Le template est contrôlé mécaniquement.
- **Garde-fou capacité outil permanent :** avant de déclarer une opération autorisée impossible ou de la transférer manuellement à Mickaël, l’agent doit vérifier les moyens raisonnables déjà disponibles ; une réponse tronquée, paginée ou limitée ne suffit pas à prouver l’inaccessibilité.
- **Garde-fou Codex Security permanent :** toute mission explicitement `Codex Security` doit demander dans son prompt l’utilisation du plugin Security. Le template versionné `codex/SECURITY_REVIEW_PROMPT.md` et son contrôle mécanique matérialisent cette règle.
- **Classification Batch 2 :** la correction reste au minimum Sensible par modification de CI et mécanismes de preuve ; l’ensemble des nouvelles règles de gouvernance est traité comme **Critique** car il modifie les mécanismes déterminant ce qu’une IA est autorisée ou obligée à faire et modifie simultanément ces règles et leurs contrôles.
- **Accord humain :** Mickaël a explicitement demandé et autorisé ces trois garde-fous le 2026-08-28 ; cet accord n’est pas une certification technique.
- **Validation indépendante :** obligatoire avant intégration comme état validé ; le succès des contrôles modifiés ne suffit pas à auto-valider le changement canonique.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application Filora n’est modifié.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : solution technique révisée après échec fonctionnel de l’architecture Drive pour Claude.
- Finding sécurité secret PR Batch 2 — **résolu puis rendu sans objet** par suppression de la mécanique Drive et de ses credentials du candidat.
- Finding intégration Claude Drive — **traité par abandon de Drive**.
- Finding conversion Google Docs — **traité par abandon de la conversion** ; le contrôle d’identité documentaire ne doit pas être affaibli pour accepter une représentation lossy.
- Finding prompt Claude — **traité et pérennisé avec garde-fou mécanique**.
- Finding transfert manuel prématuré après réponse tronquée — **traité et pérennisé dans `DEVELOPMENT.md`**.
- Finding Codex Security depuis tablette — **traité par règle canonique, template versionné et garde-fou mécanique**.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; GitHub Actions reste un contrôle automatique, pas une barrière technique totale.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel ne prétend pas prouver toute l’architecture applicative.
- Le paquet Claude est un artefact dérivé et ponctuel ; GitHub reste autoritatif.
- Une contre-vérification Claude ne peut établir que ce que le paquet fourni permet réellement de vérifier.
- La CI peut prouver la présence des clauses obligatoires d’un prompt, pas que Claude ou Codex a réellement respecté ces instructions ni que Codex a effectivement exécuté le plugin Security ; cette propriété doit être établie par la preuve de mission appropriée.
- Les nouveaux garde-fous modifient `DEVELOPMENT.md` et leurs propres contrôles : ils ne peuvent pas être auto-validés uniquement par leur succès en CI.

## Prochaine action

1. Vérifier le diff complet de la PR de correction Batch 2 et les Issues/findings ouverts pertinents.
2. Faire passer `Filora guard`, y compris les garde-fous Claude, Codex Security et contrats permanents, sur le SHA candidat exact.
3. Obtenir la validation indépendante requise sur le changement canonique Critique et ses mécanismes de contrôle.
4. Si aucun finding bloquant ne reste, intégrer à `test-preview`.
5. Vérifier une exécution réelle du workflow de paquet sur le SHA exact de `test-preview` et récupérer l’artefact.
6. Utiliser ce paquet et son prompt rendu pour une contre-vérification Claude réelle.
7. Seulement après les preuves exigées, réévaluer la clôture de Batch 2 et de l’Issue #21 avant toute promotion vers `main`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.
