# PROJECT_STATE.md — Filora

**Rôle : index opérationnel de reprise**  
**Dernière mise à jour : 2026-08-30**

Ce fichier sert à reprendre Filora sans dépendre de la mémoire conversationnelle. GitHub et les documents canoniques restent la source de vérité.

## Reprise structurée
- stage: Batch 6 — création complète d’une bobine
- status: clôturé
- git: lire le HEAD de `batch6/spool-creation`, sa base `test-preview`, les workflows, Issues, PR et findings directement depuis GitHub avant toute décision d’intégration ou de démarrage du Batch 7
- next_action: vérifier la CI du commit de clôture du Batch 6, puis fusionner séparément la PR #64 vers `test-preview` si elle reste verte et mergeable ; vérifier ensuite que `test-preview` contient réellement la clôture avant toute préparation effective du Batch 7

## État courant

- **Phase F :** clôturée.
- **Batch 0 :** clôturé et intégré à `main`.
- **Batch 1 :** clôturé et intégré à `main`.
- **Batch 2 :** clôturé, validé et promu vers `main`.
- **Batch 3 :** clôturé, validé et intégré à `test-preview`, non encore promu vers `main`.
- **Batch 4 :** clôturé, validé et intégré à `test-preview`.
- **Batch 5 :** clôturé, validé et réellement intégré à `test-preview` par la PR #62.
- **Batch 6 :** clôturé sur sa branche de travail après validation humaine, CI verte et revue indépendante finale `CONFORME AVEC RÉSERVES` sans bloquant ; l’intégration réelle à `test-preview` reste à effectuer et à vérifier explicitement.
- **Issues GitHub ouvertes au contrôle de clôture :** aucune.
- **Commentaires/reviews/threads GitHub en attente sur la PR #64 au contrôle de clôture :** aucun.
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

## Batch 6 — livré et validé

Le Batch 6 livre une création complète de bobine avec une interface propre et structurée, inspirée fonctionnellement de l’ancien écran Filora sans obligation d’en reprendre le design.

Le modèle sépare :

- **référence filament commune** : marque, matière, diamètre, gamme/type fabricant, couleur, représentation de couleur, poids nominal, températures recommandées et paramètres d’impression avancés ;
- **bobine physique** : ID, dates, fournisseur, emplacement, prix, séchage, lien de rachat, support/tare, éventuelle pesée réelle, qualité du stock et notes.

La migration des bobines Batch 5 conserve strictement leurs faits existants et utilise une référence filament inconnue (`null`) plutôt que d’inventer des données produit.

Le stock distingue :

- **nominal / non vérifié** lorsqu’aucune pesée réelle n’existe ;
- **mesuré** uniquement à partir d’un vrai poids brut mesuré et de la tare applicable.

Le filament restant et son pourcentage sont calculés ; ils ne constituent pas une seconde autorité persistante.

La création en série conserve des identités `SP-####` distinctes et vérifie le lot avant écriture.

Une référence partagée peut être corrigée avec avertissement explicite sur toutes les bobines affectées. Changer uniquement le produit d’une bobine est une action distincte de réaffectation. La suppression de références reste hors Batch 6 ; une référence sans bobine peut subsister volontairement.

Les paramètres avancés repris de l’ancien code vérifié sont : température chambre, température première couche, vitesse d’impression, débit %, rapport de flux, facteur K/Pressure Advance, vitesse volumétrique maximale, ventilation, rétraction et vitesse de rétraction.

Toute nouvelle donnée persistante entre dans le backup/recovery, y compris le catalogue personnel, et une sauvegarde Batch 5 v1 reste importable sans invention de données.

La compatibilité historique des IDs Batch 5 sensibles à la casse est préservée : des bobines anciennes `A` et `a` restent distinctes. Les nouvelles créations restent protégées contre les doublons ne différant que par la casse. Toute résolution interne privilégie la correspondance exacte, puis un fallback insensible à la casse seulement s’il est unique ; une ambiguïté historique échoue explicitement.

Voir `BATCH6.md` pour le contrat détaillé, les findings décidés, les limites et les conditions de clôture.

## Findings / décisions de clôture

### Traités dans Batch 6

- compatibilité des IDs Batch 5 distincts uniquement par la casse lors de la migration IndexedDB et de l’import backup v1 ;
- rollback compensatoire si la restauration de l’inventaire réussit mais que l’écriture du catalogue personnel échoue ;
- sauvegarde/restauration du catalogue personnel ;
- validation humaine sur tablette, PC classique, ultra-wide et mobile ;
- revue indépendante finale sur le candidat exact, verdict `CONFORME AVEC RÉSERVES`, sans bloquant.

### Reportés

- encodage implicite du guard sous Windows ;
- ordre d’export `localeCompare()` sans locale explicite sauf nécessité fonctionnelle ;
- compteur du téléchargement basé sur l’état UI ;
- consommations, mouvements, nouvelles pesées successives, corrections/recalages, inventaire ;
- nettoyage et suppression de références filament ;
- cycle de vie complet des supports réutilisables ;
- preuve navigateur du rollback inter-stockages avec vraie instance IndexedDB et panne injectée : la logique compensatoire est couverte par test mémoire ; un test navigateur pourra être ajouté si Playwright apporte une preuve utile ;
- **Batch 7 : intégrer Playwright comme automatisation réelle des tests d’interface et de navigation.** Commencer par un petit test de faisabilité technique dans l’environnement Windows actuel : Codex doit essayer de lancer Filora et de piloter Playwright sur un scénario simple (ouvrir l’application, cliquer sur une action, vérifier le résultat). Si le pilotage interactif Codex → Playwright n’est pas fiable ou disponible, ne pas bloquer le Batch : utiliser des tests Playwright classiques exécutables localement et/ou dans GitHub Actions. Automatiser ensuite les parcours répétitifs rentables : boutons, menus déroulants, modales, formulaires, validations, messages d’erreur, navigation, rechargement/persistance visible, débordements horizontaux, accessibilité des actions et grille de stock, avec captures et traces utiles en cas d’échec. Les profils mobile, tablette, PC et grand écran/ultra-wide sont principalement des **tailles de viewport simulées**, pas une preuve de comportement sur les appareils physiques ; conserver donc quelques contrôles humains rapides sur de vrais appareils. Les scénarios plus complexes nécessitant une injection de panne, par exemple une erreur IndexedDB, peuvent être ajoutés ensuite s’ils apportent une preuve utile et ne doivent pas bloquer l’adoption initiale de Playwright. Mickaël conserve la validation humaine du rendu, de la compréhension et du confort réel d’utilisation. **Évaluer également l’installation et l’usage de Graphify comme aide locale à la compréhension du code et à l’analyse d’impact pour les IA, sans en faire une source de vérité ni un mécanisme de preuve, et ne le conserver que si le gain pratique est réel.**

### Acceptés

- IndexedDB direct sans Dexie tant qu’aucun besoin concret ne justifie cette dépendance ;
- références filament inutilisées autorisées ;
- référence filament `null` pour les bobines héritées dont le produit est réellement inconnu ;
- compatibilité historique des IDs Batch 5 sensible à la casse : des bobines anciennes `A` et `a` restent distinctes et ne sont ni renommées ni fusionnées. Pour toute nouvelle bobine, l’unicité reste insensible à la casse. Une résolution interne d’ID utilise d’abord la correspondance exacte, puis un fallback insensible à la casse seulement s’il est unique ; une ambiguïté historique échoue explicitement. Aucun écran de désambiguïsation n’est ajouté tant qu’aucune recherche libre ou fonction de scan QR/code-barres par ID n’existe ; ce comportement devra être redécidé si une telle fonctionnalité est ajoutée plus tard ;
- duplication actuelle des préfixes `localStorage` du catalogue personnel entre UI et adaptateur de domaine : dette technique non bloquante acceptée à la clôture. Ne pas refactoriser sans besoin concret ; supprimer ce couplage lors d’une future évolution de cette persistance.

## Conditions de transition

Le Batch 6 est classé **Sensible** et est clôturé après revue indépendante et validation humaine réelles. `workflow/state.json` peut donc porter `batch_status: closed`, `independent_review: passed` et `next_batch_allowed: true`, conformément au guard.

Cette autorisation machine ne vaut pas preuve d’intégration. **Aucun Batch 7 ne doit être préparé ou démarré tant que la PR #64 n’a pas été réellement fusionnée dans `test-preview` et que cet état n’a pas été vérifié depuis GitHub.**

Après fusion, reconstruire l’état depuis `test-preview`, vérifier la CI/les Issues/findings et seulement ensuite préparer le périmètre du Batch 7.

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
