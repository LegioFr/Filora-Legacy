1. Objet

Ce document définit les principes durables concernant les données métier de Filora.

Il décrit notamment :

- les principaux objets métier ;
- leur identité et leurs relations ;
- les règles de gestion du stock ;
- les invariants de données ;
- les principes de suppression et d'historique ;
- la sauvegarde et la restauration ;
- les migrations ;
- la persistance locale ;
- les contraintes connues liées à l'utilisation multi-appareil.

Ce document définit des contrats de données. Il ne constitue pas un schéma technique de base de données.

---

2. Principes généraux

La priorité principale est de préserver les données métier de Filora.

Une évolution de l'application ne doit pas silencieusement :

- perdre des données ;
- corrompre des données ;
- rendre des données irrécupérables ;
- casser des relations existantes ;
- transformer une estimation en mesure certaine ;
- réécrire un fait historique pour masquer une incohérence.

Les données doivent rester suffisamment explicables pour comprendre comment Filora a obtenu l'état courant d'un stock.

---

3. Objets métier principaux

3.1 Référence filament

Une référence filament décrit un produit commun pouvant correspondre à plusieurs exemplaires physiques.

Elle peut notamment porter des informations telles que :

- fabricant / marque ;
- matière ;
- gamme ou désignation fabricant ;
- couleur fabricant ;
- représentation de la couleur ;
- diamètre ;
- poids nominal ;
- référence commerciale ;
- recommandations fabricant ;
- autres caractéristiques communes pertinentes.

La liste définitive des champs sera précisée au moment où leur introduction devient nécessaire.

Une référence filament ne représente pas une bobine physique particulière.

---

3.2 Bobine de stock

Une bobine de stock représente un exemplaire physique de filament possédé par l'utilisateur.

Chaque bobine possède une identité interne unique et stable, même lorsque plusieurs bobines correspondent exactement à la même référence filament.

Une bobine peut notamment posséder des informations propres concernant :

- son achat ;
- son ouverture ;
- son fournisseur ;
- son prix ;
- son emplacement actuel ;
- son support ;
- ses pesées ;
- son stock ;
- ses consommations ;
- ses corrections ;
- son état ;
- ses paramètres personnels ;
- ses notes.

Plusieurs bobines peuvent être liées à une même référence filament.

---

3.3 Support

Le filament actif de Filora est associé à un support physique.

Un support peut être :

- le support d'origine d'une bobine commerciale ;
- un support réutilisable utilisé pour un refill.

Les supports réutilisables peuvent posséder leur propre identité stable.

Ils peuvent notamment conserver :

- leur tare ;
- la provenance de cette tare ;
- les informations nécessaires à leur identification.

Un support réutilisable peut servir successivement à plusieurs refills.

Il ne peut pas être associé simultanément à plusieurs exemplaires actifs.

Dans le périmètre initial de Filora, aucun filament actif sans support n'est modélisé.

---

3.4 Emplacement

Un emplacement est une donnée structurée représentant l'endroit où se trouve actuellement une bobine.

Un emplacement possède au minimum une identité stable et un nom.

Un emplacement peut contenir plusieurs bobines.

Une bobine possède au maximum un emplacement courant.

Filora ne conserve pas initialement l'historique des déplacements entre emplacements.

Cette fonctionnalité pourra être introduite ultérieurement si un besoin réel est démontré.

---

4. Informations communes et informations individuelles

Les informations décrivant réellement un produit sont portées par sa référence filament et peuvent être partagées par les bobines liées.

Les informations propres à un exemplaire restent attachées à la bobine correspondante.

Filora doit permettre à certaines informations individuelles de surcharger explicitement une information commune lorsque l'usage le nécessite.

Exemple :

- température recommandée fabricant : information commune ;
- température déterminée par un test sur une bobine particulière : information individuelle.

Une surcharge individuelle ne modifie pas les autres bobines.

Elle doit être explicite et réversible.

La suppression d'une surcharge permet de retrouver la valeur commune sans avoir à maintenir une copie indépendante de celle-ci.

Aucun niveau intermédiaire de type lot ou série de fabrication n'est introduit initialement.

---

5. Modèle du stock

5.1 Principe

Le stock courant n'est pas une valeur indépendante modifiée arbitrairement.

Il représente un état dérivé de faits connus concernant la bobine.

Filora distingue notamment :

- les quantités nominales non vérifiées ;
- les mesures physiques ;
- les quantités calculées ;
- les consommations ;
- les corrections.

---

5.2 Poids nominal

Le poids nominal représente la quantité annoncée pour le produit, par exemple 1 000 g.

Il décrit le produit vendu et ne constitue pas automatiquement une mesure de la quantité physique réellement présente.

Une bobine neuve non encore pesée peut utiliser cette quantité comme estimation.

Dans ce cas, Filora doit conserver explicitement le fait que la quantité est nominale et non vérifiée physiquement.

---

5.3 Pesée physique

La pesée constitue le principal point d'ancrage de Filora dans la réalité physique.

Une pesée peut fournir un poids brut comprenant le filament et son support.

Lorsque la tare applicable est connue :

quantité physique de filament = poids brut mesuré - tare applicable

Une mesure physique fiable prévaut sur le poids nominal pour déterminer le stock.

Lorsqu'une bobine neuve est ouverte et pesée, sa quantité initiale réelle peut donc différer du poids nominal annoncé par le fabricant.

---

5.4 Tare

Une tare possède une valeur et une provenance.

Les origines initialement reconnues comprennent au minimum :

- mesure physique d'un support vide ;
- information fournie par le fabricant.

Ces origines ne doivent pas être confondues.

Lorsqu'une tare mesurée fiable existe pour le support effectivement utilisé, elle est prioritaire pour déterminer la quantité de filament.

Un support réutilisable peut conserver sa tare afin qu'elle puisse être réutilisée lors de ses usages successifs.

---

5.5 Évolution entre deux pesées

Une nouvelle pesée physique n'est pas nécessaire après chaque utilisation.

Après une mesure fiable, Filora peut faire évoluer le stock à partir des mouvements connus intervenus depuis cette mesure.

Une consommation enregistrée diminue le stock courant calculé.

Une nouvelle pesée permet ensuite de confronter ce stock calculé à la réalité physique.

---

5.6 Recalage

Lorsqu'une nouvelle pesée diffère du stock prévu par Filora, l'écart ne doit pas être masqué.

Filora doit pouvoir enregistrer une correction permettant d'expliquer le passage de l'état calculé à l'état nouvellement mesuré.

Les mouvements historiques précédents ne sont pas supprimés ou réécrits pour faire correspondre artificiellement les valeurs.

---

5.7 Dépassement du stock prévu

Une consommation réellement enregistrée ne doit pas être falsifiée pour empêcher artificiellement une quantité négative.

Si une consommation dépasse le stock calculé disponible :

- la consommation est conservée ;
- le stock disponible présenté ne devient pas négatif ;
- le disponible est borné à zéro ;
- l'écart devient une anomalie ou correction à résoudre explicitement.

L'incohérence ne doit pas être masquée.

---

6. Qualité et origine d'une quantité

Une quantité affichée ne suffit pas à décrire l'état du stock.

Filora doit pouvoir distinguer au minimum :

Nominal / non vérifié

Quantité provenant d'une information produit sans confirmation physique.

Mesuré

Quantité déterminée à partir d'une mesure physique et des informations de tare applicables.

Calculé

Quantité obtenue à partir du dernier point d'ancrage fiable et des mouvements enregistrés depuis.

Cette distinction doit rester disponible dans les données et ne pas dépendre uniquement de la présentation visuelle de l'interface.

---

7. Inventaire

L'inventaire est un processus de vérification du stock existant.

Il ne constitue pas un second stock.

Les écrans ou fonctionnalités Stock et Inventaire utilisent la même autorité métier concernant les quantités.

Un inventaire peut être partiel.

L'utilisateur n'est pas obligé de peser toutes ses bobines pour terminer un inventaire.

Une bobine non contrôlée :

- conserve son stock courant ;
- conserve sa dernière mesure physique connue ;
- ne doit pas être considérée comme nouvellement vérifiée.

Une nouvelle pesée réalisée pendant un inventaire suit les mêmes règles de mesure et de correction que toute autre pesée.

La périodicité d'un inventaire n'est pas un invariant métier. Un usage mensuel peut être adopté sans rendre cette fréquence obligatoire.

---

8. Cycle de vie d'une bobine

Une bobine terminée n'est pas une bobine supprimée.

Lorsqu'une bobine arrive en fin d'utilisation :

- elle peut quitter le stock actif ;
- son identité est conservée ;
- son historique est conservé ;
- les données qui lui sont liées restent cohérentes.

Dans le cas d'un refill utilisant un support réutilisable, la fin du filament ne supprime pas le support.

Le support peut ensuite être utilisé avec un nouvel exemplaire de filament.

---

9. Suppression et intégrité

Une suppression utilisateur ordinaire ne doit pas provoquer silencieusement la perte irréversible d'une donnée métier importante.

Une suppression récupérable doit être privilégiée pour les objets métier importants lorsque la fonctionnalité correspondante sera introduite.

Une suppression ne doit jamais créer silencieusement :

- de relations orphelines ;
- d'historiques incohérents ;
- de mouvements sans objet métier identifiable ;
- de perte indirecte de données liées.

Une bobine terminée ne doit pas être assimilée à une donnée supprimée.

---

10. Invariants principaux

Les invariants initiaux de Filora sont les suivants :

1. Chaque bobine possède une identité unique et stable.

2. Deux bobines correspondant au même produit restent deux exemplaires métier distincts.

3. Le stock disponible présenté ne devient pas négatif.

4. Une consommation réelle connue n'est pas falsifiée pour protéger artificiellement le stock.

5. L'origine d'une quantité doit rester identifiable.

6. Une nouvelle pesée ne réécrit pas silencieusement l'historique antérieur.

7. Les mouvements historiques ne disparaissent pas simplement parce qu'une nouvelle mesure existe.

8. Une bobine terminée reste distincte d'une bobine supprimée.

9. Les relations persistantes ne doivent pas devenir orphelines.

10. Dans le périmètre initial, un exemplaire actif de filament possède un support.

11. Un support réutilisable ne peut être affecté qu'à un exemplaire actif à la fois.

12. Les différentes interfaces de Filora ne maintiennent pas des versions indépendantes du même stock.

13. Une donnée héritée d'une référence et une surcharge individuelle ne doivent pas devenir deux autorités concurrentes.

14. Une information estimée ne doit pas être présentée dans les données comme une mesure physique.

15. Une migration ne doit pas poursuivre silencieusement lorsqu'elle ne peut pas préserver suffisamment sûrement les données existantes.

---

11. Unités et précision

11.1 Masse

L'unité canonique de masse de Filora est le gramme.

L'interface peut présenter une autre unité lorsque cela améliore la lisibilité, par exemple 1,25 kg au lieu de 1 250 g, sans modifier la représentation métier de référence.

Les mesures doivent pouvoir conserver des valeurs décimales.

Filora ne doit pas effectuer d'arrondi destructif involontaire.

La précision conservée ne doit pas être artificiellement limitée à la précision d'un appareil particulier, ni prétendre à une précision supérieure à celle réellement disponible.

---

11.2 Diamètre

L'unité canonique du diamètre du filament est le millimètre.

Les conversions éventuelles d'affichage ne modifient pas la valeur métier canonique.

---

12. Sauvegarde et restauration

Filora doit disposer d'un format de sauvegarde complet destiné à reconstruire son état métier.

Ce format doit être :

- versionné ;
- suffisamment complet pour restaurer les données métier persistantes ;
- indépendant d'une simple représentation visuelle de l'application ;
- testable.

Un export réussi ne constitue pas à lui seul une preuve de sauvegarde fiable.

La récupération doit être démontrée par une procédure réelle comprenant au minimum :

export → effacement volontaire → réimport → comparaison de l'état métier restauré

La comparaison doit porter sur les éléments persistants applicables, notamment les identités, attributs et relations.

Filora ne doit pas devenir la source principale de données réelles avant que cette capacité de récupération ait été démontrée conformément à la feuille de route.

---

13. Exports secondaires

Des formats destinés à la consultation ou à l'exploitation externe, par exemple CSV ou tableur, pourront être introduits lorsqu'un besoin réel le justifie.

Ils ne constituent pas automatiquement le format de sauvegarde de référence.

Un format pratique à lire par un humain ne doit pas être confondu avec un format capable de reconstruire fidèlement l'état complet de Filora.

---

14. Versionnement et migrations

Le modèle persistant de Filora doit posséder une version explicite.

Lorsqu'une évolution nécessite de transformer des données existantes :

- la migration doit être définie explicitement ;
- elle doit être testable ;
- elle ne doit pas supprimer silencieusement une information existante ;
- son niveau de preuve doit être adapté au risque qu'elle représente.

Une migration destructive ou difficilement réversible est considérée comme sensible.

Si Filora ne peut pas migrer des données de manière suffisamment sûre, la préservation des données prévaut sur la poursuite de l'opération.

L'échec doit être explicite et permettre une récupération appropriée plutôt que laisser un état partiellement ou silencieusement corrompu.

---

15. Persistance locale

La stratégie initiale candidate pour la persistance métier locale est :

IndexedDB avec Dexie comme couche d'accès et de versionnement.

Ce choix reste soumis aux vérifications techniques prévues avant l'utilisation de données réelles.

Le comportement de persistance doit notamment être testé sur les appareils et navigateurs réellement ciblés.

Lorsque la plateforme le permet, le mécanisme de stockage persistant du navigateur pourra être demandé et son comportement réel devra être vérifié.

La base locale d'un navigateur ou d'un appareil ne constitue jamais à elle seule une sauvegarde.

---

16. Multi-appareil

L'utilisateur initial de Filora prévoit un usage quotidien sur :

- smartphone ;
- tablette ;
- PC.

Cette contrainte est connue dès la fondation.

Les identités, relations, versions de données et formats d'échange ne doivent donc pas supposer inutilement qu'un même jeu de données restera définitivement limité à un seul appareil.

Cette contrainte ne constitue toutefois pas, à elle seule, une autorisation d'introduire immédiatement une architecture cloud ou une synchronisation automatique.

La nécessité d'une synchronisation doit être réexaminée lorsque l'usage réel met en évidence notamment :

- un risque concret de perte, d'écrasement ou de divergence des données entre appareils ;
- l'impossibilité pratique de maintenir un état suffisamment fiable avec les mécanismes disponibles ;
- une friction récurrente constatée dans l'usage multi-appareil.

Une difficulté ponctuelle peut justifier une observation ou une analyse sans déclencher automatiquement une refonte.

Le constat d'un besoin de synchronisation autorise son étude, pas son implémentation automatique.

Toute introduction ultérieure d'un mécanisme cloud ou de synchronisation doit faire l'objet d'une décision explicite et des contrôles adaptés à son niveau de risque.

Aucun seuil numérique arbitraire d'incidents ou de durée n'est imposé pour reconnaître un problème d'usage.

---

17. Évolutivité

Le modèle initial doit couvrir les besoins réellement connus sans tenter de modéliser tous les scénarios futurs possibles.

Ne sont notamment pas introduits sans besoin démontré :

- les lots ou séries de fabrication ;
- l'historique des déplacements entre emplacements ;
- le filament actif sans support ;
- une architecture générique de synchronisation ;
- des abstractions destinées uniquement à des fonctionnalités hypothétiques.

Une évolution future peut étendre le modèle lorsque l'usage réel le justifie, à condition de respecter les règles de migration et de récupération définies dans ce document.

---

18. Principe final

L'état courant de Filora doit rester :

identifiable, explicable, cohérent, versionné et récupérable.

Lorsqu'il existe un conflit entre la poursuite d'une opération et la préservation sûre des données, la préservation des données est prioritaire.
