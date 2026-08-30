# BATCH6.md — Création complète d’une bobine

**Statut : ouvert**  
**Date de démarrage : 2026-08-30**

## Intention

Livrer un véritable flux de création de bobine utilisable comme fonctionnalité métier de Filora, avec les fonctions utiles de l’ancien écran de création mais sur un modèle de données propre et une interface nouvelle, claire et soignée.

Le Batch doit se terminer avec une création de bobine complète et réellement fonctionnelle, une persistance sûre, un backup/recovery couvrant toutes les nouvelles données persistantes et une validation humaine du rendu et du comportement sur les appareils utilisés.

## État de départ vérifié

- Batch 5 réellement clôturé et fusionné dans `test-preview` ;
- `test-preview` vérifié au démarrage sur `b0ee32006e1408dcaa150bdd60daf3caf8ca5b03`, merge de la PR #62 ;
- `workflow/state.json` indiquait Batch 5 `closed`, risque `sensitive`, revue indépendante `passed` et `next_batch_allowed: true` ;
- aucune Issue GitHub ouverte au contrôle préalable ;
- aucune PR GitHub ouverte au contrôle préalable ;
- les contrôles applicables du candidat Batch 5 étaient verts avant intégration ;
- la persistance existante utilise IndexedDB direct, base `filora`, version `1`, store `spoolIdentities` ;
- les bobines Batch 5 persistées portent actuellement `id`, `grossMeasuredWeightGrams`, `tareWeightGrams` et `tareSource` ;
- le backup Batch 5 est `filora-backup` version 1 et ne couvre que ce modèle minimal.

## Findings / décisions avant implémentation

### À traiter dans Batch 6

- modèle séparant **référence filament commune** et **bobine physique** ;
- migration non destructive des bobines Batch 5 ;
- création complète, y compris création en série ;
- persistance des nouvelles données et relations ;
- extension versionnée du backup/recovery ;
- interface de création propre, structurée, adaptée au desktop et à la tablette et restant utilisable sur mobile ;
- correction explicite d’une référence partagée et réaffectation explicite d’une seule bobine vers un autre produit.

### Reportés

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite, sauf si le code concerné doit être modifié pour une raison fonctionnelle du Batch ;
- compteur de téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages et inventaire ;
- suppression/nettoyage des références filament inutilisées.

### Acceptés explicitement

- une référence filament peut subsister avec zéro bobine associée ; ce n’est pas une relation orpheline puisqu’aucune bobine ne la référence ; aucun nettoyage automatique n’est ajouté dans ce Batch ;
- IndexedDB direct reste utilisé : Dexie n’est pas introduit sans nécessité démontrée ;
- les anciennes bobines peuvent avoir `filamentReferenceId: null` après migration tant qu’aucune donnée produit n’est inventée et que l’interface les identifie comme référence à compléter.

## Contrat de données retenu

### Référence filament

Une référence filament décrit un produit commun et peut être partagée par plusieurs bobines physiques.

Elle porte au minimum, lorsque renseignés :

- identifiant interne stable ;
- marque / fabricant ;
- matière ;
- diamètre canonique en mm ;
- gamme ou type fabricant ;
- couleur fabricant ;
- représentation de couleur ;
- poids nominal de filament en grammes ;
- températures buse et plateau recommandées ;
- paramètres d’impression avancés communs.

Les paramètres avancés sont ceux vérifiés dans l’ancien code Filora :

- température chambre ;
- température première couche ;
- vitesse d’impression ;
- débit en pourcentage ;
- rapport de flux ;
- facteur K / Pressure Advance ;
- vitesse volumétrique maximale ;
- ventilation ;
- distance de rétraction ;
- vitesse de rétraction.

Une référence peut être corrigée. Si elle est utilisée par plusieurs bobines, l’interface doit annoncer clairement que la correction s’appliquera à toutes les bobines liées.

### Bobine physique

Chaque bobine reste un exemplaire métier distinct avec un ID stable de forme utilisateur `SP-####` pour les créations automatiques.

Elle peut porter :

- `filamentReferenceId`, nullable uniquement lorsque la référence produit est réellement inconnue, notamment après migration Batch 5 ;
- date d’achat ;
- date d’ouverture ;
- fournisseur / boutique ;
- emplacement courant ;
- prix d’achat ;
- date du dernier séchage ;
- lien de rachat exact ;
- type de support/bobine ;
- tare applicable et son origine ;
- poids brut réellement mesuré lorsqu’une vraie pesée existe ;
- qualité/origine du stock courant : nominal non vérifié ou mesuré ;
- notes optionnelles.

Les valeurs calculées comme filament restant, pourcentage restant et état de présentation ne deviennent pas une deuxième autorité persistante.

### Support

Toute nouvelle bobine active doit disposer des informations de support nécessaires au calcul du stock : type de support lorsque connu, tare et origine de tare applicables.

Le cycle de vie complet des supports réutilisables et leur réemploi successif restent hors Batch 6. Le Batch ne doit toutefois pas inventer un type de support pour les données héritées lorsque cette information n’existe pas.

### Emplacement

L’emplacement courant doit respecter `DATA.md` : il est représenté comme une donnée structurée identifiable, pas comme une deuxième autorité de stock. Le flux de création doit permettre de choisir un emplacement existant ou d’en créer un simplement sans introduire un module complet de gestion des emplacements.

## Migration Batch 5 → Batch 6

La migration doit être additive et non destructive.

Pour chaque bobine héritée :

- conserver exactement son `id` ;
- conserver exactement `grossMeasuredWeightGrams` ;
- conserver exactement `tareWeightGrams` ;
- conserver exactement `tareSource` ;
- conserver la qualité **mesurée** résultant de ces faits ;
- ajouter `filamentReferenceId: null` ou son équivalent explicite sans fabriquer de marque, matière, couleur ou référence générique ;
- ne pas inventer un type de support absent des données existantes ;
- rendre la bobine lisible et utilisable après migration avec une indication claire « référence filament à compléter ».

Si la migration ne peut pas préserver sûrement les données existantes, elle doit échouer explicitement plutôt que poursuivre avec un état partiel.

## Règle de stock

### Bobine réellement pesée

`filament disponible = poids brut réellement mesuré - tare applicable`

Le statut de qualité peut être **mesuré** uniquement si le poids brut provient réellement d’une pesée.

### Bobine non pesée

Le poids nominal de la référence peut servir d’estimation initiale. La qualité doit rester **nominale / non vérifiée**.

Un poids brut mesuré ne doit jamais être fabriqué à partir d’un filament restant saisi manuellement.

### Filament restant

Le filament restant est calculé à partir des faits applicables. Le Batch 6 n’introduit pas une seconde saisie libre persistante du restant.

Toute correction manuelle arbitraire ou recalage sans nouvelle pesée reste hors périmètre et sera traité ultérieurement comme correction/recalage explicite.

## Création en série et identités

- une création en série crée plusieurs bobines physiques distinctes reliées à la même référence filament lorsque le produit est identique ;
- les IDs automatiques utilisent `SP-####` ;
- tous les IDs du lot sont déterminés et vérifiés avant la première écriture ;
- aucun ID existant ne peut être écrasé ;
- l’opération doit réussir comme un ensemble cohérent ou échouer sans présenter une création partielle comme un succès.

## Correction d’une référence et changement de produit

L’interface doit distinguer deux actions :

1. **Modifier la référence filament** : corrige la référence partagée et prévient explicitement si plusieurs bobines seront affectées ;
2. **Changer le filament de cette bobine** : réaffecte uniquement cette bobine vers une référence existante ou une nouvelle référence, sans modifier les autres bobines.

Une référence filament n’est pas supprimable dans Batch 6.

## Interface attendue

Le design n’a pas à recopier l’ancien écran, mais le résultat ne doit pas être un formulaire technique brut.

Le flux doit être visuellement propre, cohérent avec une vraie application et structuré au minimum en blocs :

1. identification du filament ;
2. couleur et aperçu ;
3. achat et rangement ;
4. poids et support ;
5. paramètres d’impression ;
6. paramètres avancés repliables ;
7. création en série ;
8. notes optionnelles ;
9. résumé dynamique avant enregistrement ;
10. action d’enregistrement claire avec erreurs exploitables.

Les fonctions de l’ancien écran servent de référence fonctionnelle et qualitative, sans obligation de reproduction visuelle pixel-perfect.

## Backup / recovery

Toute nouvelle donnée persistante du Batch 6 doit être incluse dans le format de sauvegarde de référence.

Le Batch doit :

- introduire une nouvelle version du backup capable de reconstruire références filament, bobines, emplacements et relations persistantes applicables ;
- conserver la capacité de lire un backup Batch 5 version 1 et de le migrer sans invention de données ;
- valider entièrement un fichier avant mutation ;
- restaurer l’ensemble des nouvelles données de manière cohérente et atomique ;
- démontrer à nouveau `export → effacement → réimport → comparaison` sur une bobine riche et ses relations.

## Hors périmètre

- consommations ;
- historique des mouvements ;
- corrections et recalages ;
- pesées successives ;
- inventaire ;
- imprimantes et impressions ;
- cloud et synchronisation ;
- comptes utilisateurs ;
- suppression de références filament ;
- nettoyage automatique des références inutilisées ;
- cycle de vie complet des supports réutilisables ;
- redesign global des autres écrans ;
- promotion vers `main`.

## Classification

**Sensible.**

Justification : le Batch modifie le modèle de stock, la persistance locale, la migration de données, les relations métier et le format de sauvegarde/restauration.

Aucun critère Critique n’est prévu : la migration est conçue comme additive et non destructive, les garde-fous ne sont pas modifiés et aucune autorité métier protégée n’est affaiblie.

Une revue indépendante adaptée au niveau Sensible sera requise avant clôture.

### Jalon humain requis — EN ATTENTE

La clôture exige une validation humaine réelle du flux complet de création et du rendu visuel. Elle devra au minimum vérifier :

- création d’une bobine complète ;
- création en série ;
- calcul du stock nominal et mesuré ;
- affichage clair de la qualité du stock ;
- correction d’une référence partagée ;
- changement de produit pour une seule bobine ;
- persistance après rechargement ;
- migration/lecture des bobines Batch 5 ;
- sauvegarde et restauration du nouveau modèle ;
- interface visuellement propre et exploitable sur tablette et PC, avec comportement mobile acceptable.

## Conditions de clôture

Le Batch 6 ne pourra être déclaré clôturé que lorsque :

1. toutes les fonctions listées dans le périmètre sont réellement implémentées ;
2. les anciennes données Batch 5 restent récupérables sans invention ni perte silencieuse ;
3. aucune valeur nominale n’est présentée comme mesure physique ;
4. aucune valeur dérivée ne devient une seconde autorité concurrente ;
5. les relations persistantes actives sont cohérentes ;
6. la création en série ne peut pas produire de succès partiel silencieux ;
7. le backup/recovery couvre toutes les nouvelles données persistantes ;
8. les tests automatisés applicables, typecheck, build, architecture et garde-fous sont verts ;
9. une revue indépendante du candidat exact est acquise sans finding bloquant non décidé ;
10. la validation humaine ci-dessus est **VALIDÉE** ;
11. le rendu final de l’écran de création est jugé propre et utilisable par Mickaël ;
12. les Issues/findings apparus pendant le Batch sont traités, reportés, acceptés ou rejetés explicitement avant clôture.
