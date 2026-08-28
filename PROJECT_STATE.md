# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-28**

Ce fichier sert à reprendre Filora dans un nouveau contexte sans dépendre de la mémoire d’une conversation ou d’un agent.

Il ne remplace pas les documents canoniques ni l’état réel de GitHub. En cas d’écart, vérifier les sources GitHub et les documents canoniques concernés avant d’agir.

## Reprise structurée
- stage: Batch 0
- status: validé sur test-preview — reprise finale #10 à revalider avant promotion vers main
- git: test-preview pointe sur 044411a9d9ad6e3b0bd59b715c08b135ce804665 après merges des PR #14 et #15 ; Issue #7 démontrée conforme ; Issue #10 reste ouverte après échec du premier test de reprise finale
- next_action: intégrer cette synchronisation de reprise dans test-preview puis lancer un nouveau test indépendant sans contexte préalable pour Issue #10 ; promouvoir vers main uniquement si ce test retrouve directement l’état courant sans réparation

## État courant

- **Étape :** Batch 0 validé sur `test-preview`, pas encore promu vers `main`.
- **Phase F :** formellement clôturée ; PR #9 mergée et `DEVELOPMENT.md` porte le statut `validé — Phase F`.
- **Batch 0 :** garde-fous minimaux intégrés à `test-preview` via la PR #14 ; état de clôture intégré via la PR #15.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`, HEAD `044411a9d9ad6e3b0bd59b715c08b135ce804665` après merge de la PR #15.
- **État Git pertinent :** PR #11 fermée sans merge ; PR #14 mergée vers `test-preview` après contre-vérification finale `CONFORME` ; PR #15 mergée vers `test-preview` après CI verte. Le premier test de reprise finale sur `test-preview` a confirmé le SHA mais a conclu Issue #10 `NON CONFORME` parce que ce fichier décrivait encore l’état antérieur à la PR #15.

## Findings / Issues pertinents

- Issue #7 — condition de résolution démontrée par un paquet réel prévalidé : lint `PASS`, SHA vérifié, contexte ciblé et exécutable confirmé par contre-vérification indépendante. Peut être fermée comme résolue.
- Issue #8 — report maintenu ; Issue fermée `not_planned`, à réévaluer si l’outillage d’édition ciblée évolue.
- Issue #10 — reste ouverte : le mécanisme et les tests sont en place, mais la preuve finale exige qu’un nouveau contexte retrouve directement l’état post-clôture sans devoir réparer une transition périmée.

L’Issue #12 — documents canoniques référencés mais absents du dépôt — est résolue et fermée après restauration de `PRODUCT.md`, `DATA.md` et `ARCHITECTURE.md` via la PR #13.

Les Issues #2, #3, #4 et #5 ont été vérifiées puis fermées comme résolues.

Toujours vérifier l’état réel des Issues dans GitHub. Ne pas considérer une Issue comme résolue sur la seule base de ce fichier.

## Réserves / blocages connus

- Batch 0 reste **Sensible** jusqu’à sa clôture et sa promotion finale.
- Issue #10 bloque encore la promotion vers `main` jusqu’à réussite d’un test de reprise indépendant sur l’état synchronisé.
- Aucun ruleset/protection de branche n’est actuellement disponible comme preuve de blocage mécanique d’un merge manuel ; le workflow est un contrôle automatique, pas une interdiction technique absolue.
- Les contrôles de données, persistance, recovery, architecture et UI restent reportés jusqu’à apparition de leur objet ; ils ne doivent pas être implémentés dans le vide.

## Prochaine action

1. Merger la synchronisation finale de ce point de reprise vers `test-preview` après CI verte.
2. Ouvrir un nouveau contexte indépendant et reconstruire l’état uniquement depuis GitHub et ce point de reprise.
3. Fermer Issue #10 uniquement si l’état courant est retrouvé sans réparation.
4. Préparer ensuite la promotion de `test-preview` vers `main`.
5. Mettre à jour ce point de reprise sur l’état final promu.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Consulter uniquement les documents nécessaires à la mission courante, mais toujours vérifier leur version GitHub actuelle lorsque leur contenu est déterminant.
