# ARCHITECTURE.md — Filora

**Version : V0.1**  
**Statut : candidat à validation — Phase F3**  
**Portée : architecture logique et règles structurelles de Filora**  
**Référence complémentaire : `DATA.md`**

---

# 1. Objet du document

Ce document définit les règles architecturales canoniques de Filora.

Son objectif n'est pas de prédire l'architecture finale de l'application ni d'imposer dès maintenant des abstractions destinées à des besoins futurs.

Il fixe uniquement les frontières, responsabilités et garanties nécessaires pour que Filora puisse évoluer sans :

- multiplier les autorités métier ;
- dupliquer les règles ;
- laisser l'interface devenir propriétaire des données ;
- laisser la persistance définir le métier ;
- introduire des dépendances circulaires ;
- créer des abstractions spéculatives ;
- permettre à une nouvelle interface de réimplémenter les règles existantes ;
- transformer un échec technique en réussite apparente ;
- compromettre silencieusement l'intégrité du stock.

Les règles de données et invariants métier restent définis dans `DATA.md`.

`ARCHITECTURE.md` définit comment l'application doit s'organiser pour les respecter.

---

# 2. Principes directeurs

L'architecture de Filora suit les principes suivants :

1. partir simple ;
2. séparer les responsabilités réellement distinctes ;
3. ne pas anticiper les domaines qui n'existent pas encore ;
4. disposer d'une autorité unique pour une même règle métier ;
5. conserver un sens de dépendance clair ;
6. empêcher les interfaces de contourner les règles métier ;
7. séparer métier, présentation et persistance ;
8. préférer une structure proportionnée à une architecture théoriquement parfaite ;
9. n'introduire une abstraction que lorsqu'un besoin réel ou un risque concret la justifie ;
10. permettre à l'architecture d'évoluer sans autoriser sa modification silencieuse.

L'architecture doit servir le produit.

Le produit ne doit pas être complexifié pour satisfaire l'architecture.

---

# 3. Domaine initial

## 3.1 Domaine `spools`

Au démarrage de Filora, le domaine métier principal est le domaine conceptuel :

`spools`

Il couvre le problème métier actuellement réel :

> gérer de manière fiable le stock physique de filament.

Il constitue initialement l'autorité métier concernant notamment :

- références de filament ;
- bobines physiques ;
- supports réutilisables ;
- emplacements ;
- mesures ;
- consommations ;
- corrections ;
- état du stock ;
- règles nécessaires au calcul et à l'interprétation de ce stock.

Les concepts « filament », « bobine », « support » et « emplacement » restent distincts dans le modèle de données.

Leur regroupement dans un même domaine architectural ne signifie pas qu'ils doivent être mélangés dans une même structure ou dans les mêmes fichiers.

Un domaine peut posséder plusieurs autorités internes clairement identifiées.

Le regroupement architectural de plusieurs concepts dans un même domaine ne doit jamais conduire à fusionner leurs identités persistantes.

Les entités distinctes définies dans `DATA.md` conservent leurs identités et relations propres.

---

# 4. Création de nouveaux domaines

Un nouveau domaine n'est pas créé simplement parce qu'un ensemble de fichiers pourrait être rangé séparément.

Il doit correspondre à une responsabilité métier distincte réellement apparue.

La création d'un nouveau domaine est justifiée lorsque :

1. un problème métier distinct existe réellement ;
2. ce problème possède des responsabilités ou règles propres qui ne sont plus naturellement absorbées par un domaine existant ;
3. la séparation clarifie réellement l'autorité ou réduit un couplage devenu problématique.

Les domaines futurs ne sont pas prédéterminés.

En particulier, l'existence future possible :

- d'imprimantes ;
- de travaux d'impression ;
- de synchronisation ;
- de services distants ;
- d'autres fonctions ;

ne justifie pas leur création architecturale avant que le besoin correspondant existe réellement.

---

# 5. Rôle de `app`

`app` compose l'application.

Il peut notamment :

- assembler les domaines ;
- construire la navigation ;
- établir les points d'entrée ;
- coordonner les éléments nécessaires à la composition de l'application ;
- connecter les éléments d'interface nécessaires à l'expérience utilisateur.

`app` n'est pas propriétaire des règles métier.

Une règle appartenant au domaine `spools` ne doit pas être réimplémentée dans `app`.

Le domaine métier ne dépend pas de `app`.

Sens autorisé :

`app → domains`

Sens interdit :

`domains → app`

---

# 6. Rôle de `shared`

`shared` contient uniquement des éléments réellement génériques et partagés entre responsabilités distinctes.

`shared` ne doit pas devenir :

- un domaine métier générique ;
- un emplacement de délestage pour du code difficile à classer ;
- un moyen de contourner les frontières de dépendance ;
- une autorité alternative pour une règle métier.

`shared` ne dépend d'aucun domaine métier particulier.

Un domaine peut utiliser `shared`.

Sens autorisé :

`domain → shared`

Sens interdit :

`shared → domain`

Une règle métier propre au stock ne doit donc pas être déplacée dans `shared` uniquement parce que plusieurs interfaces l'utilisent.

Le partage d'une règle métier entre plusieurs interfaces signifie qu'elles doivent réutiliser son autorité métier, pas déplacer cette autorité vers `shared`.

---

# 7. Sens général des dépendances

Le sens conceptuel initial des dépendances est :

`app → domains → shared`

Jamais l'inverse.

Les cycles de dépendance entre domaines sont interdits.

La création d'un cycle ne doit pas être résolue en déplaçant arbitrairement le code concerné vers `shared`.

Lorsqu'un cycle apparaît, sa cause architecturale doit être examinée.

La solution doit préserver les propriétaires métier réels.

---

# 8. Séparation métier, UI et persistance

Métier, interface et persistance ont des responsabilités distinctes.

Cette séparation doit rester proportionnée à la complexité réelle.

Elle ne justifie pas la création automatique de multiples couches, dossiers ou abstractions.

L'objectif est de maintenir des frontières d'autorité compréhensibles, pas de reproduire un modèle architectural théorique.

---

# 9. Autorité des règles métier

Une règle métier possède une implémentation d'autorité unique.

Toutes les interfaces concernées doivent réutiliser cette autorité.

Une règle ne doit pas être réimplémentée indépendamment :

- dans l'interface mobile ;
- dans l'interface tablette ;
- dans l'interface desktop ;
- dans un formulaire ;
- dans un store global ;
- dans la couche de persistance ;
- dans une future interface.

Par exemple, si une règle détermine la quantité de filament restante, toutes les interfaces doivent utiliser la même règle métier.

L'ajout d'une nouvelle interface ne justifie jamais la création d'une seconde implémentation d'une mutation métier existante.

---

# 10. Autorité des mutations

Toute mutation métier passe par un chemin d'autorité défini.

Une interface exprime une intention.

Elle ne modifie pas directement les données persistantes afin de contourner une opération métier existante.

Conceptuellement :

`UI → opération métier → persistance`

et non :

`UI → persistance`

lorsqu'une règle métier est impliquée.

Les conséquences métier obligatoires d'une opération doivent être orchestrées par ce chemin d'autorité plutôt que déclenchées indépendamment par l'interface.

---

# 11. Mutations cohérentes et atomicité

Lorsqu'une mutation nécessite plusieurs écritures persistantes pour maintenir les invariants, ces écritures doivent être atomiques lorsque la technologie le permet.

Si l'atomicité complète n'est pas possible, le mécanisme retenu doit rendre l'échec :

- explicite ;
- détectable ;
- récupérable selon les garanties définies dans ce document.

Une opération métier cohérente ne doit pas être transformée sans nécessité en série d'écritures indépendantes dont certaines pourraient réussir et d'autres échouer.

---

# 12. Couverture des invariants

Les invariants définis dans `DATA.md` s'appliquent à toutes les voies capables de modifier les données.

Une nouvelle interface, une nouvelle fonctionnalité ou une nouvelle voie d'accès ne constitue pas une exception.

Les invariants ne doivent pas dépendre du fait qu'une interface particulière ait correctement effectué ses propres vérifications.

---

# 13. Import, restauration et migrations

Les opérations exceptionnelles de mutation en masse, notamment :

- import ;
- restauration ;
- migration ;

peuvent utiliser un chemin dédié.

Elles n'ont pas l'obligation de rejouer artificiellement chaque opération métier historique.

Cependant, elles ne constituent jamais une exception aux invariants de données.

Avant toute restauration définitive, Filora doit conceptuellement :

1. identifier la version des données ;
2. valider le format correspondant ;
3. appliquer les migrations nécessaires lorsqu'elles existent et sont sûres ;
4. valider l'état cible et ses invariants ;
5. effectuer la restauration avec les garanties d'atomicité appropriées.

Une restauration invalide, incompatible ou insuffisamment vérifiable doit échouer explicitement plutôt que produire silencieusement un état dégradé.

Une restauration ne doit pas laisser Filora dans un état partiellement restauré lorsque l'opération exige une cohérence globale.

Une défaillance de restauration détectée avant toute écriture définitive est traitée comme une opération refusée au sens du §23 : l'état existant reste inchangé et fiable.

Si, malgré les précautions et garanties d'atomicité prévues, une défaillance survient pendant l'écriture et que Filora peut garantir que l'état antérieur a été intégralement préservé ou restauré, elle est traitée comme un échec récupérable au sens du §24.

Si Filora ne peut pas déterminer avec suffisamment de certitude ce qui a effectivement été écrit ou restauré, la situation relève d'un état d'intégrité incertaine au sens du §25. Les mutations dépendant de cet état restent alors protégées jusqu'à vérification, récupération ou restauration appropriée.

---

# 14. Persistance et autorité métier

La persistance conserve les faits et états nécessaires au domaine.

La présence physique d'une valeur dans la base ne lui confère pas automatiquement le statut d'autorité métier.

L'autorité résulte :

- des contrats définis dans `DATA.md` ;
- des règles canoniques du domaine ;
- de l'interprétation correcte des faits persistants.

Une valeur dérivée ou mise en cache ne devient pas une seconde source de vérité simplement parce qu'elle est persistée.

Si une valeur peut être reconstruite à partir de faits d'autorité et des règles canoniques, sa matérialisation éventuelle reste une optimisation ou une représentation dérivée.

La structure physique du stockage ne définit donc pas à elle seule le sens métier des données.

---

# 15. État global

L'état métier persistant n'a pas pour autorité un store UI global.

L'état global est réservé aux préoccupations réellement transversales.

Il peut notamment concerner, lorsque nécessaire :

- préférences d'interface ;
- état de navigation ;
- informations techniques réellement globales.

Il ne doit pas devenir :

- une seconde base de données ;
- une copie métier indépendante ;
- une seconde autorité ;
- un moyen de contourner les opérations du domaine.

---

# 16. État temporaire d'interface

Une interface peut conserver un état temporaire nécessaire à son fonctionnement.

Exemples :

- formulaire non encore validé ;
- filtre ;
- recherche ;
- onglet sélectionné ;
- étape courante d'un workflow ;
- saisie utilisateur en cours.

Cet état ne devient pas une vérité métier persistante avant validation par le chemin d'autorité approprié.

---

# 17. Copies métier concurrentes

Une même donnée métier ne doit pas être maintenue indépendamment dans plusieurs stores ou plusieurs interfaces comme plusieurs vérités concurrentes.

Une représentation temporaire peut exister pour l'affichage ou l'édition.

Elle doit rester identifiable comme représentation non autoritaire.

La structure du state management React ne définit pas les frontières du domaine.

Le fait que plusieurs écrans utilisent la même information ne justifie pas la création d'une autorité globale React.

---

# 18. Caches

Un cache peut être introduit lorsqu'un besoin réel le justifie.

Il doit rester reconstructible depuis son autorité.

La suppression d'un cache ne doit pas entraîner la perte de la seule copie d'une information métier indispensable.

Une valeur calculée éventuellement matérialisée pour des raisons de performance reste une valeur dérivée lorsqu'elle peut être reconstruite à partir des faits d'autorité.

Un cache ne devient donc pas une autorité du seul fait qu'il est stocké.

---

# 19. Mises à jour optimistes

Une interface peut utiliser une mise à jour optimiste lorsque cela est justifié.

Cette mise à jour ne devient jamais une nouvelle autorité métier.

Si la mutation d'autorité échoue :

- l'état optimiste doit être annulé ou réconcilié avec l'état d'autorité ;
- l'échec doit être rendu visible à l'utilisateur lorsqu'il affecte son action.

Une confirmation de réussite ne doit pas être présentée comme définitive avant que la mutation requise soit effectivement confirmée.

Pour une opération sensible, l'interface ne doit jamais faire croire qu'une modification a été enregistrée lorsque Filora ne peut pas confirmer qu'elle l'a été.

---

# 20. Bibliothèques de gestion d'état

Aucune bibliothèque globale de state management n'est introduite simplement par anticipation.

Son adoption future devra répondre à un problème réel.

Le choix éventuel d'une technologie de state management ne modifiera pas les règles d'autorité définies dans ce document.

Une bibliothèque ne devient pas propriétaire du métier parce qu'elle facilite le partage d'état.

---

# 21. Concurrence locale et instances multiples

Plusieurs instances de Filora utilisant le même stockage local ne constituent pas plusieurs autorités indépendantes.

Une mutation ne doit pas supposer silencieusement que l'état précédemment lu est toujours l'état courant au moment de son écriture.

Lorsqu'une mutation concurrente est détectée comme reposant sur un état devenu obsolète, elle ne doit pas écraser silencieusement l'état plus récent.

Cette situation est traitée comme un échec récupérable lorsque Filora peut garantir l'état résultant.

Dans ce cas :

- la mutation fondée sur l'état obsolète n'est pas validée sur cette base ;
- l'état d'autorité est réconcilié ou rechargé selon le mécanisme approprié ;
- l'utilisateur est informé lorsque l'échec concerne son action.

Une opération peut éventuellement être réévaluée automatiquement sur l'état courant uniquement si cette réévaluation est démontrée sûre pour l'opération concernée.

Par défaut :

`état obsolète + mutation sensible → pas d'écrasement automatique`

Si Filora détecte une situation concurrente sans pouvoir déterminer suffisamment sûrement l'état résultant, elle relève alors du traitement des états d'intégrité incertaine.

---

# 22. Défaillances — principe général

Une défaillance technique ne doit jamais être transformée silencieusement en réussite métier.

Filora distingue conceptuellement :

1. opération refusée ;
2. échec récupérable ;
3. état d'intégrité incertaine ;
4. dégradation temporaire.

Ces catégories décrivent la conséquence de la défaillance.

Elles ne nécessitent pas nécessairement quatre implémentations techniques distinctes.

---

# 23. Opération refusée

Une opération refusée avant mutation laisse l'état existant inchangé et fiable.

Le refus doit être explicite.

Il ne constitue pas une corruption.

L'utilisateur doit recevoir une information exploitable lorsque le refus concerne son action.

---

# 24. Échec récupérable

Un échec récupérable doit laisser ou restaurer un état dont Filora peut garantir la cohérence.

Cette garantie prolonge directement les règles d'atomicité des mutations.

Une mutation concurrente correctement refusée parce qu'elle repose sur un état obsolète appartient à cette catégorie lorsque l'état persistant reste connu et cohérent.

---

# 25. Intégrité incertaine

Lorsque Filora détecte qu'elle ne peut plus garantir suffisamment l'intégrité d'un état, les mutations dépendant de cet état doivent être bloquées jusqu'à :

- récupération ;
- vérification ;
- restauration ;
- ou autre résolution appropriée.

Ce mode protecteur ne constitue pas une garantie d'infaillibilité.

Il ne peut agir que sur les situations que Filora parvient à détecter.

Un défaut inconnu peut échapper aux mécanismes de détection.

La protection principale reste donc en amont :

- invariants ;
- autorité unique ;
- validation ;
- atomicité ;
- contrôles ;
- tests.

Le mode protecteur constitue un filet de sécurité lorsqu'une incertitude est effectivement détectée.

---

# 26. Dégradation temporaire

Une défaillance isolée ne doit bloquer que les capacités qui en dépendent lorsque le reste de l'état demeure fiable.

Une fonctionnalité secondaire indisponible ne doit pas empêcher la consultation ou l'utilisation d'un stock local dont l'intégrité reste garantie.

La portée du blocage doit rester proportionnée à la défaillance.

---

# 27. Nouvelles tentatives

Une opération ne peut être retentée automatiquement que lorsque :

- sa répétition est démontrée sûre ;

ou

- Filora sait avec suffisamment de certitude que la tentative précédente n'a produit aucune mutation.

Une nouvelle tentative aveugle ne doit pas pouvoir provoquer :

- une double consommation ;
- une double correction ;
- un doublon ;
- ou toute autre mutation répétée involontaire.

Ce principe ne nécessite pas à ce stade l'introduction d'un mécanisme général d'idempotence.

---

# 28. Erreurs silencieuses

Une erreur affectant :

- le résultat d'une opération ;
- l'état métier ;
- l'intégrité des données ;

ne doit pas être absorbée silencieusement.

Une erreur peut être :

- traitée ;
- transformée ;
- journalisée ;
- présentée différemment ;
- récupérée ;

mais son effet réel ne doit pas disparaître au point que Filora continue comme si l'opération avait réussi.

---

# 29. Retour utilisateur en cas d'échec

Lorsqu'une erreur concerne une action utilisateur, le retour doit privilégier sa conséquence réelle plutôt que le jargon technique.

Filora doit permettre de comprendre, selon le cas :

- si l'opération a été enregistrée ;
- si elle ne l'a pas été ;
- si les données ont été modifiées ;
- si elles sont restées inchangées ;
- si l'utilisateur peut réessayer ;
- si une action particulière est nécessaire ;
- si certaines modifications sont temporairement protégées.

Les détails techniques nécessaires au diagnostic peuvent exister séparément.

---

# 30. Effets externes futurs

Une future opération pourra éventuellement interagir avec :

- un service distant ;
- une imprimante ;
- une synchronisation ;
- ou un autre système externe.

Il peut alors être impossible de disposer d'une transaction atomique unique couvrant simultanément le stockage local et le système externe.

Cette impossibilité ne doit pas conduire à sacrifier l'intégrité locale.

Un effet externe ne justifie pas de transformer une mutation métier locale cohérente en série d'écritures persistantes indépendantes et partiellement validées.

Le mécanisme précis sera défini uniquement lorsqu'un besoin réel l'exigera.

---

# 31. Évolution architecturale

L'architecture de Filora n'est pas figée.

Elle ne doit cependant évoluer que pour répondre :

- à un problème observé ;
- à une responsabilité métier réellement apparue ;
- ou à un risque concret.

Une évolution architecturale ne doit pas être justifiée uniquement par :

- « ce serait plus propre » ;
- « cela pourrait servir plus tard » ;
- « c'est une bonne pratique générale » ;
- « l'architecture serait plus professionnelle ».

---

# 32. Nouvelles abstractions

Une abstraction doit répondre à plusieurs usages réels ou à un risque concret suffisamment important.

« Plusieurs usages » constitue une heuristique et non un seuil numérique absolu.

Un seul usage peut justifier une abstraction lorsqu'un risque ou une complexité réelle l'exige.

Inversement, plusieurs usages superficiellement similaires ne suffisent pas nécessairement à justifier une abstraction commune.

Les abstractions spéculatives sont évitées.

---

# 33. Évolution de `shared`

Un élément ne doit être déplacé vers `shared` que lorsqu'il est réellement partagé entre responsabilités distinctes et qu'il ne porte pas une autorité métier propre à un domaine.

`shared` ne constitue pas la destination automatique d'un code utilisé à plusieurs endroits.

Le déplacement d'une règle métier vers `shared` pour contourner une dépendance interdite est lui-même interdit.

---

# 34. Refactorisation interne

Une refactorisation interne qui ne modifie pas :

- les responsabilités ;
- les autorités ;
- les frontières ;
- le sens des dépendances ;
- les contrats persistants ;

n'est pas automatiquement une modification de l'architecture canonique.

Un domaine peut réorganiser sa structure interne lorsque sa complexité réelle le justifie.

Cette liberté ne doit pas être utilisée pour effectuer silencieusement une modification structurelle sous l'étiquette « refactorisation ».

---

# 35. Changement structurel

Une modification durable de :

- frontière ;
- autorité ;
- propriétaire métier ;
- sens de dépendance ;
- responsabilité architecturale ;

constitue un changement structurel.

Un changement structurel doit être explicite.

Sa justification doit permettre d'identifier au minimum :

- le problème rencontré ;
- le bénéfice recherché ;
- les risques introduits ;
- l'impact sur les responsabilités et dépendances ;
- la réversibilité raisonnablement possible.

Les mécanismes précis de gouvernance et de validation de ces changements sont définis dans les documents de gouvernance correspondants.

---

# 36. Changement structurel découvert pendant un Batch

Un Batch autorisé ne constitue jamais une autorisation implicite de modifier l'architecture canonique.

Lorsqu'un besoin de changement structurel est découvert pendant un Batch :

- l'extension du travail concerné est suspendue ;
- le changement devient une décision explicite ;
- il doit être traité selon les mécanismes de revue renforcée applicables avant d'être éventuellement intégré.

Les parties réellement indépendantes du Batch ne sont pas nécessairement bloquées.

La manière de démontrer suffisamment cette indépendance relève de la gouvernance définie séparément.

Une IA ne peut donc pas considérer qu'une réarchitecture devient automatiquement autorisée parce qu'elle a été découverte pendant un travail déjà approuvé.

---

# 37. Vérifiabilité

Les règles architecturales doivent être rendues vérifiables automatiquement lorsque cela est raisonnablement possible et proportionné.

En particulier, des propriétés syntaxiques telles que :

- sens des dépendances ;
- imports interdits ;
- cycles ;

sont de bons candidats à des contrôles automatiques.

D'autres propriétés nécessitent encore du jugement, notamment :

- appartenance métier réelle ;
- caractère spéculatif d'une abstraction ;
- indépendance sémantique entre deux responsabilités.

L'impossibilité d'automatiser totalement une règle ne justifie pas sa suppression.

Elle doit être contrôlée au niveau approprié.

---

# 38. Proportionnalité

Les règles architecturales ne justifient pas la création automatique de couches ou abstractions supplémentaires.

Il n'est notamment pas imposé à ce stade d'introduire :

- CQRS ;
- event sourcing ;
- bus d'événements ;
- Redux ;
- repository pattern généralisé ;
- architecture hexagonale complète ;
- ou autre mécanisme similaire.

Ces outils pourront être introduits uniquement lorsqu'un problème réel le justifiera.

L'architecture doit rester suffisamment simple pour être comprise, vérifiée et maintenue.

---

# 39. Relation avec DATA.md

`DATA.md` définit notamment :

- les concepts métier ;
- leurs identités ;
- leurs relations ;
- les catégories de données ;
- les invariants ;
- les règles de calcul ;
- les règles historiques ;
- les exigences de préservation.

`ARCHITECTURE.md` ne remplace pas ces règles.

Il définit comment l'organisation du logiciel doit permettre de les respecter.

En cas de doute sur le sens métier d'une donnée, sa simple représentation technique dans le code ou dans la base ne prévaut pas sur le contrat défini dans `DATA.md`.

En cas de contradiction constatée entre `DATA.md` et `ARCHITECTURE.md`, aucun des deux documents ne doit être arbitrairement choisi comme prioritaire. La contradiction constitue une incohérence canonique à résoudre explicitement avant qu'une modification dépendant du point contradictoire puisse être considérée comme correctement autorisée.

---

# 40. Relation avec la gouvernance

Ce document définit ce que l'architecture doit respecter.

Il ne définit pas à lui seul :

- les permissions des agents IA ;
- les protections de branches ;
- les exigences de revue ;
- les déclencheurs précis de revue renforcée ;
- les preuves exigées pour clôturer un Batch ;
- les règles CI ;
- les autorisations humaines.

Ces éléments appartiennent à la gouvernance de Filora.

La gouvernance devra cependant permettre de faire respecter les règles définies ici avec des garde-fous aussi mécaniques que raisonnablement possible.

---

# 41. Règle finale

Une architecture plus complexe n'est pas automatiquement une architecture meilleure.

Filora doit évoluer parce qu'un besoin réel, une responsabilité réelle ou un risque réel le justifie.

Une nouvelle interface ne doit pas créer une nouvelle vérité.

Une nouvelle technologie ne doit pas créer une nouvelle autorité.

Une nouvelle fonctionnalité ne doit pas contourner les invariants existants.

Une nouvelle abstraction ne doit pas exister uniquement parce qu'elle pourrait devenir utile.

Et lorsqu'une modification structurelle devient réellement nécessaire, elle doit être rendue explicite plutôt qu'introduite silencieusement au milieu d'un autre travail.

---

# 42. Statut de validation

Ce document constitue la consolidation de la Phase F3.

Il ne doit être considéré comme canonique qu'après :

1. relecture complète ;
2. contre-vérification de cohérence avec `DATA.md` ;
3. résolution des éventuelles réserves ;
4. validation explicite de F3.

Aucun choix appartenant à F4 ou F5 ne doit être déduit de ce document au-delà des contraintes explicitement formulées.