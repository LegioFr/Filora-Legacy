# BATCH2.md — Paquet documentaire de contre-vérification Claude

**Statut : correction en cours avant nouvelle validation sur `test-preview`**  
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

## Findings / Issues examinés

- Issue #21 — **traitée dans ce Batch** : besoin d’accès documentaire Claude avant `main`; solution technique révisée après validation réelle.
- Finding secret PR de l’ancienne architecture — **résolu puis rendu sans objet par suppression de la mécanique Drive**.
- Finding intégration Claude `.md` Drive — **traité par abandon de Drive**.
- Finding conversion Google Docs — **traité par abandon de la conversion** : le contrôle d’identité documentaire ne doit pas être affaibli pour accepter une représentation lossy.
- Limitation connecteur GitHub Claude — **acceptée** : `main` est lisible, mais `test-preview` n’est pas exploitable avec le forfait actuel ; aucun abonnement supérieur n’est requis par Filora.
- Finding prompt Claude — **traité mécaniquement** : toute mission documentaire Claude versionnée doit déclarer sa source autorisée et son état attendu, et refuser un paquet obsolète.

## Dans le périmètre

- génération déterministe d’un paquet unique depuis `test-preview` contenant `PROJECT_STATE.md`, `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md` ;
- inclusion de la branche source et du SHA complet dans le paquet ;
- template de prompt Claude versionné dans `claude/REVIEW_PROMPT.md` ;
- garde-fou mécanique vérifiant les clauses minimales du prompt : source autorisée, branche/SHA attendus, contrôle préalable, `ÉTAT OBSOLÈTE`, interdiction de substituer connaissances Claude/Drive/GitHub supposé et distinction des éléments invérifiables ;
- rendu automatique du prompt avec le SHA exact du paquet ;
- Action GitHub sans secret générant les deux fichiers comme artefact temporaire ;
- tests du générateur et du garde-fou.

## Hors périmètre

- synchronisation automatique vers Google Drive ;
- OAuth Google, rclone, Environment Secrets et miroirs distants ;
- accès payant Claude Team/Enterprise ;
- faire de Claude ou du paquet une source de vérité ;
- modification sémantique des quatre documents canoniques ;
- changement fonctionnel de l’application ;
- persistance métier, mutations de stock, migrations ou recovery.

## Règle de preuve Claude

Une mission Claude utilisée comme preuve Filora doit déclarer explicitement ses sources autorisées et l’état de référence attendu. Elle doit demander à Claude de vérifier cet état avant l’analyse et imposer `ÉTAT OBSOLÈTE` en cas de divergence. Claude ne doit présenter comme vérifié que ce que les sources autorisées permettent réellement d’établir.

Le template versionné est soumis à `tools/check_claude_review_prompt.py` dans `Filora guard`. Une modification qui retire une clause minimale requise fait échouer la CI.

Cette règle est introduite dans le périmètre Batch 2 avec garde-fou mécanique. Sa pérennisation canonique éventuelle dans `DEVELOPMENT.md` sera décidée après validation indépendante de ce mécanisme, afin de ne pas modifier prématurément un document canonique en même temps que le contrôle qui l’applique.

## Classification

- **F4.2 : Sensible** — le Batch modifie CI et un mécanisme de preuve/revue.
- L’ancienne surface secrets/cloud/réseau est supprimée, ce qui réduit le risque.
- La modification du garde-fou de prompt reste Sensitive et ne peut être clôturée sur ses seuls tests ; une contre-vérification indépendante est requise.
- Aucun nouveau service externe durable, coût ou lock-in n’est introduit.

## Preuves requises avant clôture

1. `Filora guard` est vert sur le SHA candidat exact ;
2. les tests prouvent que le générateur refuse une branche autre que `test-preview`, exige les cinq documents et inscrit le SHA complet ;
3. le garde-fou rejette un prompt privé des clauses obligatoires ;
4. le workflow de paquet ne possède aucun secret et vérifie le commit exact avant génération ;
5. après intégration sur `test-preview`, une exécution réelle génère l’artefact pour le SHA exact ;
6. le paquet généré et son prompt rendu portent le même SHA `test-preview` ;
7. une contre-vérification Claude réelle utilise uniquement ce paquet et le prompt généré ;
8. une contre-vérification technique indépendante examine le diff, le garde-fou et les preuves sans finding bloquant non résolu ;
9. l’ancienne mécanique Drive versionnée est absente du candidat final.

## Dépendance humaine nécessaire

L’import du paquet dans l’interface Claude et l’envoi du prompt généré nécessitent une action humaine lorsque Claude n’est pas accessible à l’agent. Aucun secret ne doit être transmis.

### Jalon humain requis — NON REQUIS

Ce Batch ne modifie pas le comportement observable de l’application Filora. La contre-vérification Claude est une preuve documentaire, pas une validation applicative humaine de Preview.

## Condition de clôture

Le Batch 2 ne peut être déclaré clôturé que lorsque la solution Drive abandonnée a été retirée du périmètre actif, que le paquet et le garde-fou de prompt ont passé leurs contrôles sur `test-preview`, qu’une contre-vérification Claude réelle a utilisé le paquet du SHA attendu, qu’une contre-vérification technique indépendante n’a plus de finding bloquant et que l’état réel du Batch est reflété dans `PROJECT_STATE.md` et l’Issue #21.
