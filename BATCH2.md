# BATCH2.md — Paquet documentaire de contre-vérification Claude

**Statut : en validation sur `test-preview` — correction du paquet Claude en cours**  
**Date de préparation : 2026-08-28**

## Intention

Permettre une contre-vérification documentaire indépendante de l’état candidat `test-preview` avant promotion vers `main`, sans créer de seconde source de vérité et sans dépendre d’un forfait Claude supérieur.

GitHub reste autoritatif.

## Décision structurante et correction

L’option initiale de l’Issue #21 utilisait GitHub Actions + rclone + OAuth Google avec deux miroirs Drive. Les validations réelles ont établi que cette architecture ne satisfait pas simplement le besoin Claude : les `.md` Drive ne sont pas ajoutables comme connaissances synchronisées dans la configuration utilisée, la tentative Google Docs ajoute une conversion non exacte, et le connecteur GitHub Claude disponible charge `main` sans accès exploitable à `test-preview`. L’accès GitHub plus avancé nécessiterait un forfait Claude supérieur que Mickaël a refusé pour raison de coût.

Cette architecture Drive est donc **abandonnée**, sans présenter ses synchronisations techniques réussies comme une preuve de satisfaction du besoin utilisateur.

La solution de remplacement est volontairement plus simple :

- GitHub reste l’unique source de vérité ;
- une Action sur `test-preview` génère un artefact éphémère contenant un seul `FILORA_CLAUDE_REVIEW_PACKAGE.md` ;
- ce paquet contient les cinq documents de référence et les métadonnées `source_branch` + `source_sha` du commit exact ;
- le même artefact contient `CLAUDE_REVIEW_PROMPT.md`, rendu depuis un template versionné avec la branche et le SHA exacts ;
- le paquet est importé ponctuellement dans Claude pour la contre-vérification avant `main` ;
- aucune synchronisation Drive, OAuth, rclone ou secret externe n’est nécessaire.

Pendant cette correction, Mickaël a demandé explicitement de rendre permanents trois garde-fous :

1. une mission Claude utilisée comme preuve doit identifier ses sources et son état attendu, vérifier la référence avant analyse et refuser un état obsolète ;
2. avant de déclarer une opération autorisée techniquement impossible ou de la transférer manuellement à Mickaël, l’agent doit vérifier les moyens raisonnables déjà disponibles, notamment pagination, lecture par plages ou appels successifs ;
3. toute mission explicitement `Codex Security` doit demander dans son prompt l’utilisation du plugin Security.

Ces trois règles sont inscrites dans `DEVELOPMENT.md` et protégées mécaniquement dans la CI.

## Findings / Issues examinés

- Issue #21 — **traitée dans ce Batch** : besoin d’accès documentaire Claude avant `main`; solution technique révisée après validation réelle.
- Finding secret PR de l’ancienne architecture — **résolu puis rendu sans objet par suppression de la mécanique Drive**.
- Finding intégration Claude `.md` Drive — **traité par abandon de Drive**.
- Finding conversion Google Docs — **traité par abandon de la conversion** : le contrôle d’identité documentaire ne doit pas être affaibli pour accepter une représentation lossy.
- Limitation connecteur GitHub Claude — **acceptée** : `main` est lisible, mais `test-preview` n’est pas exploitable avec le forfait actuel ; aucun abonnement supérieur n’est requis par Filora.
- Finding prompt Claude — **traité mécaniquement et pérennisé**.
- Finding transfert manuel prématuré après réponse tronquée — **traité par règle canonique et garde de présence**.
- Finding Codex Security depuis tablette — **traité par template versionné imposant explicitement le plugin Security et contrôle mécanique associé**.

## Dans le périmètre

- génération déterministe d’un paquet unique depuis `test-preview` contenant `PROJECT_STATE.md`, `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md` ;
- inclusion de la branche source et du SHA complet dans le paquet ;
- template de prompt Claude versionné dans `claude/REVIEW_PROMPT.md` ;
- garde-fou mécanique du prompt Claude ;
- template `codex/SECURITY_REVIEW_PROMPT.md` imposant explicitement le plugin Security ;
- garde-fou mécanique du prompt Codex Security ;
- règles permanentes correspondantes dans `DEVELOPMENT.md` ;
- garde canonique empêchant la suppression silencieuse de ces clauses ;
- rendu automatique du prompt Claude avec le SHA exact du paquet ;
- Action GitHub sans secret générant les deux fichiers Claude comme artefact temporaire ;
- tests du générateur et des garde-fous.

## Hors périmètre

- synchronisation automatique vers Google Drive ;
- OAuth Google, rclone, Environment Secrets et miroirs distants ;
- accès payant Claude Team/Enterprise ;
- faire de Claude, Codex ou du paquet une source de vérité ;
- modification sémantique de `PRODUCT.md`, `DATA.md` ou `ARCHITECTURE.md` ;
- changement fonctionnel de l’application ;
- persistance métier, mutations de stock, migrations ou recovery.

## Règles de preuve IA

Une mission Claude utilisée comme preuve Filora doit déclarer explicitement ses sources autorisées et l’état de référence attendu. Elle doit demander à Claude de vérifier cet état avant l’analyse et imposer `ÉTAT OBSOLÈTE` en cas de divergence. Claude ne doit présenter comme vérifié que ce que les sources autorisées permettent réellement d’établir.

Une mission explicitement `Codex Security` doit demander explicitement l’utilisation du plugin Security. Une revue Codex ordinaire ne peut pas être présentée comme preuve `Codex Security` si cette instruction manque.

Avant de déclarer une opération autorisée inaccessible et de demander une action manuelle, l’agent doit avoir vérifié les moyens raisonnables disponibles dans son environnement. Une réponse tronquée ou paginée ne suffit pas à établir l’impossibilité.

Les clauses canoniques sont vérifiées par `tools/check_review_governance.py`. Les templates Claude et Codex Security possèdent en plus leurs contrôles spécifiques dans `Filora guard`.

## Classification

- **F4.2 : Sensible** par modification de CI, mécanismes de preuve et document canonique.
- **F4.3 : Critique** pour l’ensemble de la correction de gouvernance, car elle modifie des mécanismes déterminant ce qu’une IA est autorisée ou obligée à faire et modifie simultanément ces règles et leurs contrôles.
- Mickaël a explicitement demandé et autorisé ces trois règles le 2026-08-28.
- Cet accord autorise l’intention mais ne constitue pas une certification technique.
- Une validation indépendante du diff canonique et des garde-fous est obligatoire avant intégration comme état validé.
- Aucun nouveau service externe durable, coût ou lock-in n’est introduit.

## Preuves requises avant clôture

1. `Filora guard` est vert sur le SHA candidat exact ;
2. les tests prouvent que le générateur refuse une branche autre que `test-preview`, exige les cinq documents et inscrit le SHA complet ;
3. le garde-fou Claude rejette un prompt privé des clauses obligatoires ;
4. le garde-fou Codex Security rejette un prompt qui ne demande plus explicitement le plugin Security ;
5. le garde canonique rejette la suppression des nouvelles règles permanentes de `DEVELOPMENT.md` ;
6. le diff de `DEVELOPMENT.md` ne contient que les ajouts explicitement autorisés ;
7. le workflow de paquet ne possède aucun secret et vérifie le commit exact avant génération ;
8. après intégration sur `test-preview`, une exécution réelle génère l’artefact Claude pour le SHA exact ;
9. le paquet généré et son prompt rendu portent le même SHA `test-preview` ;
10. une contre-vérification Claude réelle utilise uniquement ce paquet et le prompt généré ;
11. une contre-vérification technique indépendante examine le diff, les changements canoniques et les garde-fous sans finding bloquant non résolu ;
12. si Codex Security est utilisé comme preuve, son prompt est dérivé du template versionné et demande explicitement le plugin Security ;
13. l’ancienne mécanique Drive versionnée est absente du candidat final.

## Dépendance humaine nécessaire

L’import du paquet dans l’interface Claude et l’envoi du prompt généré nécessitent une action humaine lorsque Claude n’est pas accessible à l’agent. Aucun secret ne doit être transmis.

Lorsqu’une mission Codex Security doit être lancée depuis une interface où Mickaël ne peut pas sélectionner lui-même le plugin Security, le prompt versionné porte explicitement cette instruction.

### Jalon humain requis — NON REQUIS

Ce Batch ne modifie pas le comportement observable de l’application Filora. Les contre-vérifications IA prévues sont des preuves techniques/documentaires, pas une validation applicative humaine de Preview.

## Condition de clôture

Le Batch 2 ne peut être déclaré clôturé que lorsque la solution Drive abandonnée a été retirée du périmètre actif, que le paquet et les garde-fous de prompts ont passé leurs contrôles sur `test-preview`, que les changements canoniques Critiques ont reçu la validation indépendante exigée, qu’une contre-vérification Claude réelle a utilisé le paquet du SHA attendu, qu’aucun finding bloquant ne reste non résolu et que l’état réel du Batch est reflété dans `PROJECT_STATE.md` et l’Issue #21.
