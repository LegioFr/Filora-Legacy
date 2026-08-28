# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## État courant

- **Étape :** Batch 0 — garde-fous opérationnels minimaux.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** préparation définie sur `batch0/operational-guardrails` ; implémentation et preuves non encore clôturées.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`, créée depuis `main` au commit `75409c6b27079748bc94431c65f80de8d569437a`.
- **Branche de travail Batch 0 :** `batch0/operational-guardrails`.
- **État Git pertinent :** définition initiale de Batch 0 enregistrée par le commit `e24adaf346f544b4ffb12314babc2e698ebc02a6` sur la branche de travail.

## Findings / Issues pertinents

- Issue #7 — **traiter dans Batch 0** : rendre vérifiable le contrôle d’exécutabilité et de minimisation avant délégation externe payante/limitée.
- Issue #8 — **reporter** : l’outillage GitHub actuel ne fournit pas d’écriture ciblée de type patch/`old_text -> new_text`; ne pas créer maintenant une abstraction supplémentaire disproportionnée.
- Issue #10 — **traiter dans Batch 0** : rendre vérifiable la synchronisation de `PROJECT_STATE.md` avant clôture d’une Phase ou d’un Batch.

Les décisions, le périmètre, les preuves attendues et la condition de clôture sont enregistrés dans `BATCH0.md` sur la branche de travail.

Les Issues #2, #3, #4 et #5 ont été vérifiées après merge de la PR #6 puis fermées comme résolues. L’Issue #4 a été fermée après un test de reprise équivalent exécuté à partir de ce point d’entrée et des sources GitHub.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Aucun blocage connu sur la clôture de la Phase F.
- Les Issues #7 et #10 restent ouvertes jusqu’à production des preuves prévues dans Batch 0.
- L’Issue #8 est explicitement reportée ; elle ne justifie pas la création d’un nouvel outil dans Batch 0.

## Prochaine action

1. Implémenter les garde-fous simples prévus pour #7 et #10 sans modifier les contrats canoniques.
2. Exécuter les scénarios de preuve reproductibles définis dans `BATCH0.md`.
3. Vérifier l’état exact, le diff, les classifications et les conditions de promotion vers `test-preview`, puis de clôture.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
