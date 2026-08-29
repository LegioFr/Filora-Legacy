# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-29**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 2 — paquet documentaire de contre-vérification Claude et garde-fous permanents de revue IA
- status: clôturé
- git: lire les HEAD, PR, workflows, artefacts et Issues courants directement depuis GitHub ; ne pas mémoriser ici les SHA ou PR volatiles
- next_action: avant toute promotion vers `main` ou tout nouveau Batch pertinent, réévaluer les Issues/findings ouverts, en particulier l’Issue #46, puis décider explicitement lesquels traiter, reporter, accepter ou rejeter

## État courant

- **Étape :** Batch 2 clôturé sur la branche de validation après preuves techniques et documentaires.
- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé sur `test-preview` ; aucune promotion vers `main` n’est déduite de cette clôture.
- **Issue #21 :** traitée par Batch 2 ; la solution documentaire a été intégrée, exécutée réellement et contre-vérifiée par Claude sur l’état attendu.
- **Ancienne solution Drive :** abandonnée et retirée du périmètre actif. Aucune synchronisation Drive, OAuth, rclone ou secret externe n’est nécessaire à la solution retenue.
- **Solution retenue :** un workflow sans secret génère depuis le SHA exact de `test-preview` un artefact temporaire contenant `FILORA_CLAUDE_REVIEW_PACKAGE.md` et `CLAUDE_REVIEW_PROMPT.md` avec la même branche et le même SHA.
- **Validation technique indépendante :** la correction Critique des garde-fous a été contre-vérifiée indépendamment sur le candidat exact sans finding bloquant restant avant intégration.
- **Codex Security :** la contre-vérification indépendante retenue a explicitement utilisé le plugin Security, a vérifié le SHA candidat exact et a rendu le verdict `ACCEPTABLE POUR LA SUITE`, sans finding bloquant.
- **Preuve post-intégration :** le workflow réel `Filora Claude review package` a terminé avec succès sur l’état exact de `test-preview` et a généré l’artefact correspondant ; le ZIP contient exactement le paquet et le prompt attendus.
- **Contre-vérification Claude réelle :** Claude a utilisé uniquement le paquet et le prompt générés, a vérifié la branche et le SHA attendus, a conclu `ÉTAT DE RÉFÉRENCE : CONFORME`, `COHÉRENCE DOCUMENTAIRE : CONFORME`, aucun finding bloquant documentaire, verdict `CANDIDAT DOCUMENTAIRE VALIDÉ`.
- **Garde-fou Claude permanent :** `DEVELOPMENT.md` impose qu’une mission Claude utilisée comme preuve déclare ses sources et son état attendu, vérifie la référence avant analyse, impose `ÉTAT OBSOLÈTE` en cas de divergence et distingue l’invérifiable du vérifié.
- **Garde-fou capacité outil permanent :** avant de déclarer une opération autorisée impossible ou de la transférer manuellement à Mickaël, l’agent doit vérifier les moyens raisonnables déjà disponibles ; cette règle n’autorise aucun contournement de permission ou restriction.
- **Garde-fou Codex Security permanent :** toute mission explicitement `Codex Security` doit demander dans son prompt l’utilisation du plugin Security.
- **Classification Batch 2 :** Critique pour la gouvernance ; l’autorisation d’intention et la validation technique indépendante requises ont été obtenues séparément.
- **Validation humaine applicative Batch 2 :** non requise ; aucun comportement observable de l’application Filora n’a été modifié.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **État Git pertinent :** les détails volatils doivent être lus directement depuis GitHub et ne sont pas recopiés ici comme vérité persistante.

## Findings / Issues pertinents

- Issue #21 — **traitée par Batch 2** : solution de paquet documentaire intégrée et contre-vérifiée ; l’Issue doit être fermée une fois la transition de clôture effectivement intégrée et le guard vert.
- Issue #46 — **ouverte, Critique et reportée hors du périmètre Batch 2** : protection GitHub externe de `test-preview` et `main`. Elle doit être réévaluée avant toute promotion vers `main` ou avant tout nouveau Batch pertinent.
- Issue #8 — fermée `not_planned` ; à réévaluer seulement si l’outillage d’édition ciblée évolue ou devient nécessaire.

Toujours revérifier les Issues/findings réels avant toute transition ou nouveau Batch.

## Réserves / limites connues

- Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel ; ce point est suivi par l’Issue #46.
- Filora ne fournit encore aucune persistance, aucune preuve de recovery et aucune implémentation des invariants DATA liés aux mutations de stock.
- Le contrôle architectural actuel ne prétend pas prouver toute l’architecture applicative.
- Le paquet Claude est un artefact dérivé et ponctuel ; GitHub reste autoritatif.
- Une contre-vérification Claude n’établit que ce que le paquet fourni permet réellement de vérifier ; les propriétés GitHub/CI réservées par Claude ont été vérifiées séparément côté GitHub.

## Prochaine action

1. Vérifier que la transition de clôture Batch 2 est intégrée sur `test-preview` avec `Filora guard` vert.
2. Fermer l’Issue #21 une fois cette transition effectivement intégrée.
3. Avant toute promotion vers `main`, réévaluer l’Issue #46 et les autres findings ouverts pertinents.
4. Ne pas démarrer automatiquement un nouveau Batch sur la seule base de la clôture du Batch 2.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

`BATCH1.md` conserve le dossier de clôture du Batch 1. `BATCH2.md` conserve le dossier et les preuves de clôture du Batch 2. Aucun de ces fichiers ne remplace un document canonique.
