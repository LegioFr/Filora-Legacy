# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 0
- status: validé sur test-preview — promotion vers main à préparer
- git: PR #14 mergée vers test-preview au commit d9686456cfe9505ca3ff1cba8f803b220d4e1d77 après CI verte et contre-vérification indépendante CONFORME du HEAD 43a084b6cffc824b716756b2906fdad4213308f7
- next_action: finaliser le rapport Batch 0 sur test-preview, vérifier les conditions de résolution des Issues #7/#10 puis préparer la promotion test-preview vers main

## État courant

- **Étape :** Batch 0 validé sur `test-preview`, pas encore promu vers `main`.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** garde-fous minimaux intégrés à `test-preview` via la PR #14.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`, contenant le merge de la PR #14 au commit `d9686456cfe9505ca3ff1cba8f803b220d4e1d77`.
- **État Git pertinent :** PR #11 fermée sans merge ; PR #14 mergée vers `test-preview`. La contre-vérification ciblée finale du HEAD `43a084b6cffc824b716756b2906fdad4213308f7` a conclu `CONFORME` et `MERGE VERS test-preview : ACCEPTABLE`.

## Findings / Issues pertinents

- Issue #7 — traitée techniquement dans Batch 0 par le lint de paquet externe ; reste ouverte jusqu’à vérification explicite de sa condition de résolution complète.
- Issue #8 — report maintenu ; Issue fermée `not_planned`, à réévaluer si l’outillage d’édition ciblée évolue.
- Issue #10 — traitée techniquement dans Batch 0 par la reprise structurée et ses tests adversariaux ; reste ouverte jusqu’à vérification explicite de sa condition de résolution complète.

L’Issue #12 — documents canoniques référencés mais absents du dépôt — est résolue et fermée après restauration de `PRODUCT.md`, `DATA.md` et `ARCHITECTURE.md` via la PR #13.

Les Issues #2, #3, #4 et #5 ont été vérifiées puis fermées comme résolues.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Batch 0 reste **Sensible** jusqu’à sa clôture et sa promotion finale.
- Aucun ruleset/protection de branche n’est actuellement disponible comme preuve de blocage mécanique d’un merge manuel ; le workflow est un contrôle automatique, pas une interdiction technique absolue.
- Les contrôles de données, persistance, recovery, architecture et UI restent reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.
- Les Issues #7 et #10 ne doivent pas être fermées avant démonstration de leurs conditions de résolution complètes.

## Prochaine action

1. Finaliser le rapport de Batch 0 avec les preuves du HEAD exact et de la contre-vérification conforme.
2. Vérifier explicitement les conditions de résolution de #7 et #10.
3. Préparer la promotion de `test-preview` vers `main` uniquement si la clôture est démontrée.
4. Mettre à jour ce point de reprise sur l’état final promu.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
