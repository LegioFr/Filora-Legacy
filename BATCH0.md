# Batch 0 — Garde-fous opérationnels minimaux

## Statut

Batch 0 est **clôturé techniquement et autorisé pour promotion vers `main`**.

Les deux findings traités dans ce Batch sont résolus : Issue #7 et Issue #10. La promotion vers `main` est la dernière opération d’intégration ; les détails Git volatils restent lus depuis GitHub et ne sont pas recopiés comme vérité persistante dans `PROJECT_STATE.md`.

## Intention

Rendre mécaniques uniquement les contrôles justifiés par des incidents réels ou par une propriété objective simple, sans créer une seconde gouvernance parallèle.

## Périmètre livré

- présence des quatre documents canoniques sur les états proposés ;
- lint de paquet de revue externe pour Issue #7, limité aux propriétés mécaniques réellement vérifiables ;
- reprise structurée de `PROJECT_STATE.md` pour Issue #10 ;
- tests adversariaux des faux positifs démontrés ;
- runner GitHub Actions unique sur les PR vers `test-preview` et `main` ;
- traçabilité légère règle/finding → contrôle, sans registre parallèle ;
- point de reprise durable qui ne recopie pas comme vérité persistante le SHA ou la PR de sa propre synchronisation.

## Findings pertinents

### Issue #7 — résolue

Le lint vérifie notamment mission/question, SHA au format exact, état déclaré vérifié, entrées typées, accès URL explicitement établi, rejet de placeholders manifestes, contenus dupliqués exacts, plafond de contexte et taille du paquet sérialisé complet.

Il ne prétend pas prouver la suffisance sémantique, la minimalité parfaite ou l’authenticité du contenu. Ces propriétés restent à reviewer.

Un test réel de délégation a produit `LINT ISSUE #7 : PASS`, avec SHA vérifié, et la contre-vérification indépendante a conclu que le paquet était ciblé et exécutable. Issue #7 est fermée.

### Issue #8 — report maintenu

Issue fermée `not_planned`. L’outillage disponible ne fournit pas encore d’édition ciblée sûre pour les gros fichiers et ajouter une abstraction dédiée serait disproportionné. Réévaluer seulement si l’outillage change ou avant une modification ciblée importante concernée.

### Issue #10 — résolue

Le point de reprise possède une section structurée unique avec `stage`, `status`, `git`, `next_action`. Le lint rejette doublons, sections concurrentes et représentations ambiguës comme blocs de code/citations.

Deux tests indépendants ont révélé un défaut supplémentaire : copier dans `PROJECT_STATE.md` le SHA ou la PR de sa propre synchronisation future rendait le fichier périmé immédiatement après merge. La correction finale supprime cette auto-référence volatile et réserve à GitHub les faits volatils.

Le test indépendant final sur l’état corrigé a conclu :

- `SHA VÉRIFIÉ : oui` ;
- `REPRISE SANS RÉPARATION : oui` ;
- `AUTO-RÉFÉRENCE VOLATILE : non` ;
- `CONTRADICTION AVEC GITHUB : non` ;
- `ISSUE #10 : RÉSOLUBLE` ;
- `BLOQUEUR AVANT MAIN : non`.

Issue #10 est fermée.

## Propriétés démontrées

1. Les quatre documents canoniques sont présents sur la base/HEAD validés.
2. Le lint #7 rejette les faux positifs ciblés et un paquet réel conforme passe après prévalidation.
3. Le lint #10 rejette les états structurés ambigus et un contexte neuf retrouve désormais l’état sans réparation.
4. Les contrôles n’affirment pas démontrer plus que ce qu’ils vérifient objectivement.
5. Le workflow checkout et asserte le HEAD exact de PR avant les validations.
6. **F4.2/F4.3 : Sensible**.
7. **F4.4 : décision technique dans le périmètre approuvé du Batch 0**, sans modification des contrats produit, données ou architecture.
8. Les contre-vérifications indépendantes finales n’ont identifié aucun bloqueur restant avant promotion vers `main`.

## Limite connue

Aucun ruleset/protection de branche n’est établi comme preuve d’interdiction mécanique absolue d’un merge manuel. Le workflow est un contrôle automatique, pas une barrière technique totale. Cette limite est connue et n’empêche pas la clôture de Batch 0.

## Contrôles reportés jusqu’à apparition de leur objet

- imports/cycles d’architecture ;
- invariants métier DATA ;
- persistance, migrations, atomicité, concurrence ;
- recovery end-to-end ;
- UI, réseau, cloud, synchronisation, authentification.

Lorsqu’un futur Batch introduit un objet couvert par une règle objectivement testable, il doit ajouter le contrôle applicable ou déclarer explicitement le report, le risque résiduel et le point de réévaluation. Les jalons canoniques non reportables restent obligatoires à leur frontière, notamment recovery avant que Filora devienne source principale de données réelles.

## Condition de clôture

Les conditions de clôture de Batch 0 sont démontrées. La promotion `test-preview` → `main` peut être effectuée après CI conforme sur le HEAD exact proposé à `main`.
