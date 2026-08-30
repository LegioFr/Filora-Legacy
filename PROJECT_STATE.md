# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 6 — création complète d’une bobine
- status: ouvert
- git: lire le HEAD de `batch6/spool-creation`, sa base `test-preview`, les workflows, Issues, PR et findings directement depuis GitHub avant toute décision de clôture ou d’intégration
- next_action: implémenter d’abord le contrat de données et la migration non destructive Batch 5 → Batch 6, puis seulement brancher l’interface de création complète sur ce modèle

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`, non encore promu vers `main`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé, validé et réellement intégré à `test-preview` par la PR #62.
- **Batch 6 :** démarré sur une branche dédiée depuis le HEAD vérifié de `test-preview` après intégration du Batch 5.
- **Issues GitHub ouvertes au contrôle de démarrage :** aucune.
- **PR GitHub ouverte au contrôle de démarrage :** aucune.
- **Branche officielle :** `main`.
- **Branche de validation :** `test-preview`.
- **Branche de travail courante :** `batch6/spool-creation`.
- **Protection externe GitHub :** ruleset actif sur `main` et `test-preview`, PR et check `sentinel` requis, suppressions et force-push interdits.

## Base fonctionnelle acquise avant Batch 6

Le domaine `spools` sait déjà :

- créer une bobine avec identité stable ;
- persister un poids brut réellement mesuré ;
- persister une tare et son origine ;
- calculer le filament disponible par `poids brut - tare` ;
- refuser une tare supérieure au poids brut ;
- refuser un ID dupliqué ;
- relire et afficher l’ensemble du stock local ;
- sauvegarder le stock minimal dans `filora-backup` v1 ;
- valider entièrement une sauvegarde avant mutation ;
- restaurer par remplacement complet atomique ;
- démontrer réellement le recovery sur navigateur/appareil.

La persistance de départ est IndexedDB direct : base `filora`, version `1`, store `spoolIdentities`.

## Batch 6 — cible validée

Le Batch 6 doit livrer une création complète de bobine avec une interface propre et structurée, inspirée fonctionnellement de l’ancien écran Filora sans obligation d’en reprendre le design.

Le modèle sépare :

- **référence filament commune** : marque, matière, diamètre, gamme/type fabricant, couleur, représentation de couleur, poids nominal, températures recommandées et paramètres d’impression avancés ;
- **bobine physique** : ID, dates, fournisseur, emplacement, prix, séchage, lien de rachat, support/tare, éventuelle pesée réelle, qualité du stock et notes.

La migration des bobines Batch 5 conserve strictement leurs faits existants et utilise une référence filament inconnue (`null`) plutôt que d’inventer des données produit.

Le stock distingue :

- **nominal / non vérifié** lorsqu’aucune pesée réelle n’existe ;
- **mesuré** uniquement à partir d’un vrai poids brut mesuré et de la tare applicable.

Le filament restant et son pourcentage sont calculés ; ils ne constituent pas une seconde autorité persistante.

La création en série conserve des identités `SP-####` distinctes et doit vérifier tout le lot avant écriture.

Une référence partagée peut être corrigée avec avertissement explicite sur toutes les bobines affectées. Changer uniquement le produit d’une bobine est une action distincte de réaffectation. La suppression de références reste hors Batch 6 ; une référence sans bobine peut subsister volontairement.

Les paramètres avancés repris de l’ancien code vérifié sont : température chambre, température première couche, vitesse d’impression, débit %, rapport de flux, facteur K/Pressure Advance, vitesse volumétrique maximale, ventilation, rétraction et vitesse de rétraction.

Toute nouvelle donnée persistante doit entrer dans le backup/recovery et une sauvegarde Batch 5 v1 doit rester importable sans invention de données.

Voir `BATCH6.md` pour le contrat détaillé, les findings décidés, les limites et les conditions de clôture.

## Findings / décisions en cours

### À traiter dans Batch 6

- migration non destructive des bobines Batch 5 ;
- modèle référence filament ↔ bobine ;
- support/tare nécessaire au stock ;
- emplacement structuré minimal ;
- création complète et création en série ;
- édition explicite d’une référence partagée et réaffectation individuelle ;
- backup/recovery du nouveau modèle ;
- qualité visuelle réelle de l’écran de création.

### Reportés

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur du téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages, inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- **Batch 7 : intégrer une suite Playwright responsive minimale** couvrant quelques résolutions représentatives (mobile, tablette, PC classique, grand écran/ultra-wide), avec vérifications robustes des débordements horizontaux, de l’accessibilité de la modale et de ses actions, des menus et de la grille de stock, plus captures automatiques utiles. Cette automatisation complète la validation humaine mais ne la remplace pas ; **évaluer également l’installation et l’usage de Graphify comme aide locale à la compréhension du code et à l’analyse d’impact pour les IA, sans en faire une source de vérité ni un mécanisme de preuve, et ne le conserver que si le gain pratique est réel.**

### Acceptés

- IndexedDB direct sans Dexie tant qu’aucun besoin concret ne justifie cette dépendance ;
- références filament inutilisées autorisées ;
- référence filament `null` pour les bobines héritées dont le produit est réellement inconnu.

## Conditions de transition

Le Batch 6 est classé **Sensible**. La clôture exigera donc une revue indépendante sur le candidat exact ainsi qu’une validation humaine réelle du fonctionnement et du rendu. `next_batch_allowed` doit rester `false` tant que le Batch est ouvert.

Aucun Batch 7 ne doit être préparé simplement parce que le développement semble terminé : vérifier d’abord les conditions complètes de clôture de `BATCH6.md`, la CI, la validation humaine, la revue indépendante, les Issues/findings et l’intégration réelle à `test-preview`.

## Documents canoniques

- `PRODUCT.md`
- `DATA.md`
- `ARCHITECTURE.md`
- `DEVELOPMENT.md`

Les fichiers `BATCH<n>.md` sont des dossiers de Batch et ne remplacent pas les documents canoniques.

## Règles opérationnelles

- GitHub est la source de vérité pour l’état réel, les branches, commits, PR, checks et Issues.
- Ne pas transformer une déclaration d’agent en preuve.
- Pour les missions Codex locales sous Windows, utiliser en priorité le dépôt Filora local déjà disponible lorsque cela respecte l’indépendance de la mission.
- Réserver Codex Security aux propriétés qui justifient réellement une revue de sécurité renforcée.
- Éviter les boucles de revue sans réduction de risque réelle.
- Ne pas ajouter de dépendance, abstraction ou processus sans besoin concret.
