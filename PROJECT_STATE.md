# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-29**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — paquet documentaire de contre-vérification Claude et garde-fous permanents de revue IA
- status: intégré sur `test-preview` ; exécution réelle du paquet réussie ; contre-vérification Claude réelle encore requise avant réévaluation de clôture
- git: lire les HEAD, PR, workflows, artefacts et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: utiliser uniquement le paquet Claude et le prompt générés depuis le même SHA `test-preview`, puis confronter le verdict Claude à GitHub avant toute clôture ou promotion vers `main`

## État courant

- **Étape :** Batch 2 intégré sur `test-preview`, en attente de la contre-vérification Claude documentaire finale.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** non clôturé et non promu vers `main`.
- **Issue #21 :** ouverte ; le besoin de contre-vérification Claude avant `main` est techniquement matérialisé mais la revue Claude réelle reste à obtenir.
- **Ancienne solution Drive :** abandonnée et retirée du candidat actif. Aucune synchronisation Drive, OAuth, rclone ou secret externe n’est nécessaire à la solution retenue.
- **Solution retenue :** un workflow sans secret génère depuis le SHA exact de `test-preview` un artefact temporaire contenant `FILORA_CLAUDE_REVIEW_PACKAGE.md` et `CLAUDE_REVIEW_PROMPT.md` avec la même branche et le même SHA.
- **Validation technique indépendante :** la correction Critique des garde-fous a été contre-vérifiée indépendamment sur le candidat exact, sans finding bloquant restant avant intégration à `test-preview`.
- **Codex Security :** la contre-vérification indépendante retenue pour l’intégration a explicitement utilisé le plugin Security, a vérifié le SHA candidat exact et a rendu le verdict `ACCEPTABLE POUR LA SUITE`, sans finding bloquant. Une tentative antérieure sans plugin Security ne constituait pas une preuve Codex Security et reste distincte de cette preuve valide.
- **Preuve post-intégration :** après intégration sur `test-preview`, le workflow réel `Filora Claude review package` a terminé avec succès sur le SHA exact de la branche et a généré un artefact portant ce même SHA ; le ZIP contient exactement le paquet et le prompt attendus.
- **Cohérence paquet/prompt :** le paquet porte `source_branch: test-preview`, le SHA complet de la source et `document_count: 5` ; le prompt rendu attend la même branche et le même SHA.
- **Garde-fou Claude permanent :** `DEVELOPMENT.md` impose qu’une mission Claude utilisée comme preuve déclare ses sources et son état attendu, vérifie la référence avant analyse, impose `ÉTAT OBSOLÈTE` en cas de divergence et distingue l’invérifiable du vérifié.
- **Garde-fou capacité outil permanent :** avant de déclarer une opération autorisée impossible ou de la transférer manuellement à Mickaël, l’agent doit vérifier les moyens raisonnables déjà disponibles ; cette règle n’autorise aucun contournement de permission ou restriction.
- **Garde-fou Codex Security permanent :** toute mission explicitement `Codex Security` doit demander dans son prompt l’utilisation du plugin Security.
- **Classification Batch 2 :** la correction reste au minimum Sensible par modification de CI et mécanismes de preuve ; l’ensemble des nouvelles règles de gouvernance est traité comme **Critique**.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application Filora n’est modifié.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **ouverte et traitée dans Batch 2** : solution technique révisée après abandon de Drive ; la preuve Claude réelle reste nécessaire avant clôture.
- Finding sécurité secret PR Batch 2 — **résolu puis rendu sans objet** par suppression de la mécanique Drive et de ses credentials du candidat.
- Finding intégration Claude Drive — **traité par abandon de Drive**.
- Finding conversion Google Docs — **traité par abandon de la conversion**.
- Finding prompt Claude — **traité et pérennisé avec garde-fou mécanique**.
- Finding transfert manuel prématuré après réponse tronquée — **traité et pérennisé dans `DEVELOPMENT.md`**.
- Finding Codex Security depuis tablette — **traité par règle canonique, template versionné, garde-fou mécanique et contre-vérification réelle avec plugin Security**.
- Finding garde canonique incomplet — **résolu et contre-vérifié indépendamment** avant intégration à `test-preview` ; aucun finding bloquant n’est resté ouvert sur le candidat intégré.
- Issue #46 — **reportée hors du périmètre Batch 2** : protection GitHub externe de `test-preview` et `main`; elle reste un finding Critique séparé et ne doit pas être confondue avec la validation du paquet Claude.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; ce point est suivi séparément par l’Issue #46.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel ne prétend pas prouver toute l’architecture applicative.
- Le paquet Claude est un artefact dérivé et ponctuel ; GitHub reste autoritatif.
- Une contre-vérification Claude ne peut établir que ce que le paquet fourni permet réellement de vérifier.
- La CI prouve la génération et certaines propriétés mécaniques du paquet, pas le fait qu’un reviewer externe l’a correctement utilisé ; la mission Claude réelle reste donc nécessaire.

## Prochaine action

1. Générer un nouvel artefact Claude depuis cet état documentaire aligné sur `test-preview`.
2. Vérifier que le paquet et le prompt portent exactement le même SHA `test-preview`.
3. Utiliser uniquement ces deux fichiers pour une contre-vérification Claude réelle.
4. Confronter le résultat Claude à l’état GitHub réel et refuser toute preuve portant sur un SHA différent.
5. Si aucun finding bloquant ne reste, mettre à jour l’Issue #21 et réévaluer la clôture du Batch 2 avant toute promotion vers `main`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` définit le périmètre technique courant. Aucun de ces fichiers ne remplace un document canonique.
