# DEVELOPMENT.md — Filora

**Version : V0.1**
**Statut : validé — Phase F**
**Portée : gouvernance du développement, des agents IA, des validations et des preuves**
**Références complémentaires : `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md`**

---

# 1. Objet du document

Ce document définit les règles canoniques selon lesquelles Filora peut être développé, modifié, vérifié et clôturé.

Il définit notamment :

- le fonctionnement par Batches ;
- l’autorité accordée aux agents IA ;
- la classification des changements ;
- la propriété des décisions ;
- les validations nécessaires ;
- l’indépendance des contrôles ;
- les preuves attendues ;
- le comportement lorsqu’un contrôle est indisponible ;
- les conditions de clôture d’un Batch ;
- les principes applicables aux contre-revues indépendantes.

Ce document ne remplace pas :

- `PRODUCT.md`, qui définit ce que Filora cherche à accomplir ;
- `DATA.md`, qui définit les contrats et invariants de données ;
- `ARCHITECTURE.md`, qui définit les frontières et règles structurelles.

Une règle de développement ne peut pas être utilisée pour contourner un contrat défini dans ces documents.

---

# 2. Principe de preuve

Une déclaration n’est pas une preuve.

Le fait qu’un agent affirme :

- qu’un changement est correct ;
- qu’un test est passé ;
- qu’une règle est respectée ;
- qu’un fichier n’a pas été modifié ;
- qu’un Batch est clôturable ;

ne suffit pas à établir cette propriété.

Une preuve doit être adaptée à la propriété qu’elle cherche à démontrer.

Selon le cas, elle peut notamment prendre la forme de :

- tests ;
- résultat CI ;
- compilation ;
- contrôle statique ;
- diff ;
- état Git identifié ;
- vérification sur Preview ;
- scénario reproductible ;
- comparaison de données ;
- revue indépendante ;
- validation humaine sur une propriété réellement observable par Mickaël.

Une preuve n’établit jamais davantage que ce qu’elle permet réellement de vérifier.

Un test vert ne prouve donc pas automatiquement que l’architecture est correcte.

Une Preview fonctionnelle ne prouve pas automatiquement que les données sont sûres.

L’accord de Mickaël ne constitue pas une certification technique.

L’accord de plusieurs IA ne transforme pas une affirmation non vérifiée en preuve.

---

# 3. État technique de référence

Toute validation portant sur du code doit identifier suffisamment précisément l’état réellement examiné.

Lorsque Git est disponible, un état destiné à une validation ou à une clôture doit être rattachable à un état Git identifiable, notamment par son commit lorsque cela est applicable.

Une preuve produite pour un état A ne prouve pas automatiquement un état B modifié ultérieurement.

Une contre-revue doit donc pouvoir déterminer quel état elle examine.

Une déclaration de correspondance entre un artefact et un état Git n’est pas suffisante lorsqu’aucun élément disponible ne permet au reviewer de vérifier cette correspondance.

Dans ce cas, cette propriété reste explicitement invérifiable par ce reviewer.

## 3.1 Reprise du projet dans un nouveau contexte

Le dépôt maintient `PROJECT_STATE.md` comme point d’entrée opérationnel court pour reprendre Filora sans dépendre de la mémoire d’une conversation ou d’un agent.

Avant de reprendre ou poursuivre Filora dans un nouveau contexte, l’agent doit reconstruire l’état courant à partir de ce point d’entrée et des sources GitHub qu’il référence, plutôt que supposer que son contexte conversationnel est exact.

Ce point d’entrée doit permettre d’identifier au minimum :

- la phase ou le Batch courant ;
- son état ;
- la prochaine action connue ;
- l’état Git pertinent lorsque nécessaire ;
- les Issues/findings ouverts pertinents ;
- les réserves ou blocages connus ;
- les documents canoniques à consulter pour la mission.

`PROJECT_STATE.md` est un index de reprise, pas une seconde source de vérité. Les faits GitHub et les documents canoniques auxquels il renvoie restent autoritatifs pour leurs propriétés respectives.

Il doit être mis à jour aux transitions pertinentes afin qu’un état ancien ne soit pas présenté silencieusement comme l’état courant.

---

# 4. Fonctionnement par Batch

Chaque Batch possède :

- une intention principale claire ;
- un périmètre borné ;
- des propriétés attendues ;
- des preuves adaptées à ces propriétés ;
- une condition de clôture identifiable.

Les preuves importantes doivent être déterminées avant l’implémentation lorsque leur nécessité peut raisonnablement être connue.

Un Batch n’autorise pas implicitement toute modification qui pourrait faciliter sa réalisation.

Avant la préparation ou le démarrage d’un nouveau Batch, les Issues/findings GitHub ouverts pertinents doivent être consultés.

Chaque finding pertinent doit recevoir une décision explicite :

- traiter ou intégrer dans le travail ;
- reporter ;
- accepter ;
- rejeter.

La simple existence d’un finding ne l’autorise pas automatiquement à entrer dans le périmètre du Batch.

Lorsqu’un problème hors périmètre est découvert :

- il est signalé ;
- il devient un finding ;
- il n’est pas corrigé opportunément simplement parce que l’agent sait le faire.

Il peut être :

- intégré explicitement au travail après décision appropriée ;
- reporté ;
- accepté ;
- rejeté.

Une découverte réalisée pendant un Batch ne constitue pas à elle seule une autorisation.

---

# 5. Règles permanentes des Batches

Les règles suivantes s’appliquent à tous les Batches.

1. Un Batch possède une intention principale claire et un périmètre borné.

2. Une modification d’un contrat canonique ou d’un fichier de contrôle doit être explicitement déclarée et justifiée. Elle ne doit jamais apparaître comme effet secondaire silencieux.

3. Une IA ne modifie pas un garde-fou qui la bloque simplement pour terminer sa mission.

4. Les tests ne sont pas affaiblis pour obtenir un résultat vert.

5. Une migration destructive ou difficilement réversible est traitée comme un changement à risque élevé.

6. Une nouvelle dépendance importante doit être justifiée par :
   - le problème qu’elle résout ;
   - ses alternatives raisonnables ;
   - ses risques ;
   - sa réversibilité.

7. Un problème hors périmètre devient un finding plutôt qu’une correction opportuniste.

8. Tout nouveau type de donnée persistante étend les tests de sauvegarde et de restauration applicables.

9. Les preuves requises sont adaptées à la propriété que l’on cherche à démontrer.

10. Une modification ne peut pas être rendue acceptable en supprimant ou en affaiblissant le contrôle qui révèle son problème.

## 5.1 Branches de validation et branche officielle

Filora distingue explicitement :

- `test-preview`, branche/version de développement et de validation utilisée pour intégrer et tester les changements avant promotion ;
- `main`, branche/version officielle, qui ne reçoit que des changements ayant franchi les validations applicables.

Le flux normal de développement va vers `test-preview` avant promotion vers `main`.

Le développement ou le push direct sur `main` ne constitue pas le chemin ordinaire.

Les conditions de promotion de `test-preview` vers `main` réutilisent les règles de preuve, de risque et de clôture définies dans ce document ; elles ne créent pas une gouvernance parallèle.

---

# 6. F4.1 — Autorité et périmètre de l’IA

1. Une IA ne possède que l’autorité nécessaire au travail explicitement autorisé.

Capacité technique et autorisation sont deux choses distinctes.

2. Le périmètre d’un travail est défini positivement.

Ce qui est hors périmètre n’est pas implicitement autorisé.

3. Avant toute création ou modification dans Filora, l’agent présente à Mickaël le périmètre exact de l’action : son objectif, les fichiers à créer ou modifier et les opérations Git prévues. Aucune de ces opérations n’est exécutée avant son accord explicite. Cet accord ne vaut que pour le périmètre présenté ; toute extension découverte pendant le travail nécessite un nouvel accord. La priorité normale est la fonctionnalité produit ; un nouveau mécanisme de gouvernance ou de contrôle n’est ajouté que pour répondre à un problème concret démontré.

4. Dans le périmètre ainsi approuvé, les opérations ordinaires nécessaires à son exécution peuvent être réalisées autonomement tant qu’elles ne changent ni contrat, ni invariant, ni frontière, ni décision structurante.

Lorsqu’un agent dispose des accès, outils et autorisations nécessaires pour effectuer lui-même une opération relevant du périmètre approuvé, il doit l’exécuter directement plutôt que demander à Mickaël de réaliser manuellement cette opération.

L’intervention de Mickaël n’est demandée que lorsqu’elle est réellement nécessaire, notamment pour une décision qui lui appartient, une autorisation explicite requise, une action techniquement inaccessible à l’agent ou une validation humaine pertinente.

5. Une décision sensible peut être analysée et proposée par une IA, mais son identification ne constitue jamais son autorisation.

6. Une IA ne peut pas élargir elle-même significativement son Batch pour résoudre un problème découvert.

7. Une modification sensible touchant à la fois un objet protégé et son mécanisme de contrôle ne peut pas être auto-validée uniquement par l’agent qui réalise ces modifications.

8. La gouvernance doit faire intervenir Mickaël sur les décisions ayant un impact réel, pas sur chaque détail d’implémentation ordinaire.

9. Le niveau de contrôle augmente avec :

- le risque ;
- l’irréversibilité ;
- l’impact sur les données ;
- l’architecture ;
- les permissions ;
- les mécanismes de contrôle.

Les mécanismes précis de validation indépendante et de séparation entre contrôle et objet contrôlé sont définis en F4.5.

## 6.1 Vérification des moyens disponibles avant transfert manuel

Avant de déclarer qu'une opération autorisée est impossible ou de demander à Mickaël de l'effectuer manuellement, l'agent doit vérifier les moyens raisonnables déjà disponibles pour accomplir l'opération.

Cette vérification comprend, lorsque c'est pertinent, les capacités natives déjà accessibles telles que la pagination, la lecture par plages, les appels successifs, la récupération par identifiant ou blob, ou un autre chemin direct fourni par l'outil disponible.

Une réponse tronquée, paginée ou limitée en taille ne constitue pas à elle seule une preuve que la donnée complète est inaccessible.

L'agent ne doit déclarer une opération techniquement inaccessible qu'après avoir vérifié qu'aucun moyen raisonnable disponible dans son environnement ne permet de l'accomplir sans transfert manuel inutile.

Cette règle n'oblige pas à contourner une permission, une restriction de sécurité, un périmètre autorisé ou une limitation réelle de l'outil.

---

# 7. F4.2 — Classification de sensibilité

Un changement est sensible dès qu’au moins un critère objectif de sensibilité est satisfait.

L’agent ne peut pas déclasser le changement sur la seule base de son propre jugement.

## 7.1 Données persistantes

Sont notamment sensibles les changements concernant :

- schéma persistant ;
- migration ;
- import ;
- export de sauvegarde ;
- restauration ;
- suppression ;
- identité persistante ;
- conversion de données ;
- modification de données existantes.

## 7.2 Autorité métier

Sont notamment sensibles les changements concernant :

- mutations métier ;
- stock ;
- pesées ;
- consommations ;
- inventaire ;
- invariants définis dans `DATA.md` ;
- chemin permettant de contourner une autorité métier définie.

## 7.3 Frontières architecturales

Sont notamment sensibles :

- création ou suppression d’un domaine ;
- déplacement durable d’une responsabilité ;
- modification du sens d’une dépendance ;
- introduction d’un état global métier ;
- modification d’une frontière UI / métier / persistance ;
- création d’une nouvelle autorité de mutation ;
- déplacement conceptuel d’une responsabilité vers `shared`.

## 7.4 Sécurité et permissions

Sont notamment sensibles :

- authentification ;
- autorisations ;
- secrets ;
- credentials ;
- permissions ;
- contrôle d’accès ;
- politiques de sécurité ;
- isolation entre utilisateurs lorsqu’elle existe.

## 7.5 Garde-fous et mécanismes de contrôle

Sont notamment sensibles :

- CI ;
- tests obligatoires ;
- règles de branches ;
- scripts de validation ;
- règles architecturales automatisées ;
- fichiers de gouvernance ;
- mécanismes de preuve ;
- conditions de clôture d’un Batch.

## 7.6 Documents canoniques

Les modifications sémantiques de :

- `PRODUCT.md` ;
- `DATA.md` ;
- `ARCHITECTURE.md` ;
- `DEVELOPMENT.md` ;

sont sensibles.

Toute modification d’un document canonique doit au minimum être signalée et examinée tant qu’il n’existe pas de mécanisme suffisamment fiable permettant de distinguer automatiquement une modification sémantique d’une modification non sémantique.

Une correction démontrablement limitée à :

- typographie ;
- formatage ;
- lien ;
- présentation sans changement de sens ;

peut recevoir un traitement proportionné.

L’auteur de la modification ne peut cependant pas déclasser seul une modification ambiguë.

## 7.7 Dépendances

Une dépendance nouvelle ou remplacée devient sensible lorsqu’elle touche notamment :

- accès aux données ;
- structure ;
- framework ;
- persistance ;
- authentification ;
- synchronisation ;
- réseau ;
- état global ;
- sécurité ;
- build ;
- mécanismes de contrôle.

## 7.8 Effets externes

Sont notamment sensibles les changements introduisant ou modifiant des effets vers :

- réseau ;
- cloud ;
- synchronisation ;
- imprimante ;
- API ;
- système de fichiers ;
- compte distant ;
- autre système externe.

## 7.9 Destruction et irréversibilité

Un changement est sensible lorsqu’il peut :

- supprimer ;
- écraser ;
- rendre incompatible ;
- perdre ;
- corrompre ;
- ou rendre difficilement récupérable une donnée ou un état important.

La taille du diff ne détermine pas cette sensibilité.

## 7.10 Règles de classification

1. La classification repose autant que possible sur des faits observables.

2. La présence d’un critère objectif impose au minimum la classification correspondante.

3. Un agent peut augmenter le niveau de risque lorsqu’un contexte le justifie.

4. Il ne peut pas ignorer un critère objectif simplement parce qu’il juge le changement sûr.

5. La taille du changement ne détermine pas son niveau de risque.

6. Les propriétés simples et fiables doivent être détectées mécaniquement lorsque cela est proportionné.

7. Les propriétés sémantiques qui ne peuvent pas être correctement automatisées restent soumises à examen plutôt qu’à une fausse automatisation.

8. Le fractionnement artificiel d’un changement ne diminue jamais sa sensibilité.

Un changement ne peut donc pas être artificiellement réparti entre plusieurs :

- commits ;
- fichiers ;
- sous-tâches ;
- Batches ;

lorsque ces éléments participent à une même décision sensible, dans le but ou avec l’effet de faire disparaître la classification qui s’appliquerait au changement considéré dans son ensemble.

---

# 8. F4.3 — Niveaux de risque

## 8.1 Ordinaire

Un changement est ordinaire lorsqu’il est :

- local ;
- raisonnablement réversible ;
- dans le périmètre autorisé ;
- sans critère de sensibilité imposant un niveau supérieur.

Il peut être exécuté avec les preuves normales adaptées au Batch.

Aucune cérémonie supplémentaire n’est exigée simplement parce qu’une IA réalise le travail.

## 8.2 Sensible

Un changement est sensible lorsqu’un critère de F4.2 s’applique sans atteindre le niveau Critique.

Il peut être implémenté par l’agent lorsque le Batch l’autorise explicitement.

Il ne peut cependant pas être considéré comme clôturé sur la seule affirmation que les tests passent.

Des preuves renforcées et les mécanismes applicables de F4.5 sont nécessaires.

## 8.3 Critique

Un changement est notamment Critique lorsqu’il implique :

- destruction irréversible ou migration particulièrement dangereuse de données ;
- affaiblissement ou suppression d’un garde-fou ;
- contournement de permissions ;
- modification simultanée d’un objet protégé et de son mécanisme de contrôle ;
- compromis portant simultanément sur plusieurs invariants fondamentaux ;
- changement de l’autorité métier centrale ;
- changement structurel majeur non prévu par le Batch ;
- modification des mécanismes déterminant eux-mêmes ce qu’une IA est autorisée à faire.

Une IA ne doit pas pouvoir décider, implémenter et valider seule une telle modification.

Tout changement classé Critique exige, indépendamment de sa classification au sens de F4.4, une présentation compréhensible à Mickaël et son accord explicite sur l’intention, les conséquences et les compromis, avant d’être considéré comme autorisé ou clôturé.

Cet accord ne constitue jamais une certification de la correction technique, laquelle reste entièrement régie par les mécanismes de F4.5.

## 8.4 Anti-contournement

L’échec d’un contrôle renforcé ne peut jamais être résolu en :

- abaissant le niveau de classification du changement ;
- supprimant la preuve demandée ;
- modifiant le contrôle ;

sans que cette modification soit elle-même reclassifiée.

---

# 9. F4.4 — Propriété des décisions

La classification du risque technique et la propriété d’une décision sont deux axes distincts.

Une décision appartient à Mickaël lorsqu’elle modifie notamment :

- ce que Filora doit faire ;
- ce que Filora doit garantir ;
- les données que Filora peut perdre ou transformer ;
- un compromis produit accepté ;
- l’expérience utilisateur ;
- le périmètre fonctionnel ;
- une décision structurelle précédemment approuvée par lui.

L’IA peut choisir le **comment technique** d’une décision déjà approuvée lorsqu’elle reste dans les contraintes existantes.

## 9.1 Décisions à présenter à Mickaël

Sont notamment concernées :

- modification visible du comportement métier ;
- ajout ou retrait significatif d’une fonctionnalité ;
- modification d’un invariant approuvé ;
- risque significatif ou irréversible pour les données ;
- changement du sens d’une donnée ;
- choix UX important ;
- compromis entre plusieurs comportements légitimes ;
- élargissement substantiel du périmètre d’un Batch ;
- changement structurel remettant en cause une décision déjà approuvée ;
- adoption d’une dépendance ou d’un service imposant une contrainte durable telle que :
  - cloud obligatoire ;
  - coût ;
  - compte externe ;
  - dépendance réseau ;
  - verrouillage significatif.

Le plancher Critique de F4.3 s’applique indépendamment de cette liste.

## 9.2 Décisions normalement techniques

Ne nécessitent normalement pas un arbitrage de Mickaël :

- nom interne d’une fonction ;
- organisation locale de fichiers ;
- structures TypeScript techniquement équivalentes ;
- petit refactoring autorisé ;
- détail d’implémentation d’un test ;
- optimisation interne sans effet observable ;
- choix technique réversible et non structurel.

## 9.3 Doute

Lorsqu’un doute raisonnable existe sur la propriété d’une décision, l’agent ne peut pas la déclarer seul purement technique afin d’éviter l’arbitrage.

La situation doit être signalée et présentée de manière compréhensible.

## 9.4 Présentation d’une décision

Une décision présentée à Mickaël doit exposer au minimum :

1. la situation ;
2. pourquoi une décision est nécessaire ;
3. les options réalistes ;
4. leurs conséquences ;
5. leurs risques ;
6. leur réversibilité ;
7. la recommandation technique ;
8. la décision demandée.

Le jargon technique inutile doit être évité.

## 9.5 Frontière temporelle

Une décision appartenant à Mickaël doit être obtenue avant que l’option soit :

- intégrée ;
- utilisée comme fondation d’un travail dépendant ;
- ou clôturée.

Un travail exploratoire clairement réversible peut préparer l’arbitrage, à condition de rester identifié comme :

- non autorisé ;
- non intégré ;
- non utilisable comme fondation saine.

Avant la décision peuvent donc exister :

- exploration ;
- prototype ;
- comparaison ;
- préparation technique réversible.

Ne peuvent pas être considérés comme autorisés avant la décision :

- intégration ;
- clôture ;
- utilisation comme fondation saine d’un travail dépendant.

Une décision déjà réellement prise et enregistrée avant le Batch n’a pas à être redemandée simplement parce qu’un Batch l’implémente.

## 9.6 Jonction risque / décision

F4.2 et F4.3 déterminent le risque technique.

F4.4 détermine ce que Mickaël décide.

Ces exigences sont indépendantes et cumulatives.

Un changement techniquement Ordinaire peut encore contenir une décision appartenant à Mickaël.

L’accord de Mickaël ne réduit jamais les contrôles techniques imposés par le niveau de risque.

F4.4 ne peut jamais supprimer le plancher imposé par le niveau Critique.

---

# 10. F4.5 — Validation et preuves

## 10.1 Principe

Une preuve ou une validation n’est recevable que si le mécanisme utilisé peut réellement évaluer la propriété revendiquée.

## 10.2 Agent d’implémentation

L’agent qui réalise le changement peut :

- produire le changement ;
- produire des tests ;
- produire des preuves ;
- produire un rapport ;
- signaler une incertitude.

Sa propre affirmation ne constitue cependant jamais, à elle seule, une validation indépendante.

## 10.3 Contrôles mécaniques

Les contrôles mécaniques et la CI sont privilégiés lorsqu’une propriété est objectivement vérifiable et que l’automatisation reste proportionnée.

Ils peuvent notamment vérifier :

- compilation ;
- tests déterministes ;
- dépendances interdites ;
- cycles ;
- fichiers protégés ;
- présence d’une migration ;
- certaines règles architecturales ;
- lint ;
- typecheck ;
- syntaxe ;
- structure.

Une CI verte prouve uniquement les propriétés effectivement contrôlées.

## 10.4 Revue indépendante

Une revue indépendante peut examiner notamment :

- architecture ;
- contrats ;
- contradictions ;
- angles morts ;
- pertinence des tests ;
- adéquation des preuves ;
- classification du changement ;
- propriété des décisions.

Le reviewer doit reconstruire son propre jugement à partir des éléments nécessaires.

Il ne doit pas simplement accepter :

- le résumé ;
- le raisonnement ;
- ou le verdict

de l’agent d’implémentation.

Une revue indépendante reste un contrôle et non une preuve absolue.

## 10.5 Validation de Mickaël

Mickaël valide :

- les décisions produit qui lui appartiennent ;
- les compromis qui lui appartiennent ;
- les décisions identifiées par F4.4 ;
- l’accord exigé par le plancher Critique.

Il n’est pas chargé de certifier une propriété technique qu’il ne peut raisonnablement pas évaluer.

Son accord ne remplace jamais les contrôles techniques nécessaires.

## 10.6 Contrôle et objet contrôlé

Lorsqu’une modification touche simultanément :

- un objet protégé ;
- et le mécanisme destiné à contrôler cet objet ;

le succès du contrôle modifié ne suffit pas à valider le changement.

Une protection supplémentaire est obligatoire.

Le déclenchement de cette protection ne doit pas dépendre uniquement de la reconnaissance volontaire du risque par l’agent d’implémentation.

Lorsque cela est raisonnablement détectable, des faits objectifs doivent être utilisés, notamment :

- fichiers protégés ;
- catégories de fichiers ;
- modification simultanée de code et de son contrôle ;
- migrations ;
- règles architecturales ;
- configuration CI ;
- éléments explicitement sensibles.

Lorsqu’une détection suffisamment fiable n’est pas automatisable, l’obligation de déclaration demeure et une revue indépendante peut constituer la protection supplémentaire.

La protection supplémentaire doit être indépendante du contrôle modifié et ne peut pas reposer uniquement sur l’affirmation ou sur un mécanisme ad hoc de l’agent d’implémentation.

Son adéquation doit être établie par :

1. une règle déjà en vigueur ;
2. un contrôle non modifié capable d’évaluer la propriété ;
3. ou une revue indépendante ayant examiné les éléments nécessaires.

## 10.7 Proportionnalité

Il n’existe pas de chaîne universelle imposant systématiquement :

CI + agent A + agent B + Mickaël.

Le niveau de validation dépend :

- du risque ;
- de la propriété à démontrer ;
- de la capacité d’un contrôle mécanique à l’évaluer ;
- de la propriété de la décision.

Une automatisation fiable et proportionnée doit être privilégiée lorsqu’elle existe.

Un mécanisme lourd ne doit pas être créé uniquement pour donner l’apparence d’une validation plus rigoureuse.

## 10.8 Déclaration de clôture

Le rapport de clôture d’un Batch doit déclarer explicitement :

- sa classification selon F4.2/F4.3 ;
- sa classification selon F4.4 ;
- la justification de chacune.

Ces deux classifications sont indépendantes.

Une classification Ordinaire n’exempte pas de vérifier F4.4.

Pour un changement Sensible ou Critique soumis à revue indépendante, le reviewer vérifie également la classification F4.4.

Pour un changement Ordinaire, la déclaration reste obligatoire mais n’entraîne pas automatiquement une revue indépendante supplémentaire.

Lorsqu’une décision appartient à Mickaël, les exigences correspondantes s’appliquent indépendamment du niveau de risque technique.

## 10.9 Intégrité des preuves

Une preuve, un résultat de test, un log, un rapport de validation ou un rapport de clôture ne peut pas être falsifié, réécrit ou modifié a posteriori de manière à faire apparaître comme conforme un état qui ne l’était pas au moment où cette preuve a été produite.

Toute correction légitime d’un artefact de preuve doit rester identifiable comme telle et ne doit jamais altérer rétroactivement la réalité de l’état initialement observé.

---

# 11. F4.6 — Indisponibilité des validations

## 11.1 Principe

Absence de validation ne signifie jamais réussite.

Lorsqu’une validation obligatoire est impossible à exécuter, l’étape concernée reste non validée.

L’indisponibilité d’un mécanisme externe ne bloque que les travaux qui en dépendent réellement.

## 11.2 Poursuite d’un travail indépendant

Avant de commencer ou poursuivre un nouveau travail alors qu’une validation obligatoire précédente reste en attente, l’agent doit déclarer explicitement pourquoi ce travail est indépendant.

L’indépendance signifie qu’aucune dépendance connue pertinente n’existe concernant notamment :

- code ;
- données ;
- autorité ;
- comportement ;
- contrat ;
- dépendance fonctionnelle pertinente.

Le simple fait que deux travaux ne touchent pas les mêmes fichiers ne démontre pas leur indépendance.

L’indépendance doit être déclarée et justifiée.

Elle ne doit pas être supposée.

## 11.3 Travail dépendant

Lorsqu’une dépendance existe, ou lorsqu’un doute raisonnable subsiste, le travail suivant hérite de l’état non validé de sa dépendance.

Il ne peut pas être clôturé comme validé avant que la dépendance nécessaire soit elle-même validée.

Cet héritage ne signifie pas nécessairement que tout travail doit s’arrêter.

Un travail dépendant peut éventuellement progresser, mais il ne peut pas franchir sa frontière de validation en supposant que sa fondation est saine.

## 11.4 Substitution

Une validation obligatoire indisponible ne peut pas être remplacée silencieusement.

Un mécanisme alternatif n’est recevable que si les règles applicables permettent d’établir qu’il démontre suffisamment la propriété concernée.

## 11.5 Échec et indisponibilité

Une validation :

- impossible à exécuter ;
- et exécutée mais échouée ;

sont deux situations différentes.

Une indisponibilité externe ne permet jamais de diminuer silencieusement le niveau de preuve exigé.

## 11.6 Reprise

Lorsque le mécanisme redevient disponible, la validation doit porter sur l’état exact concerné.

Une preuve obtenue ultérieurement sur un état différent ne valide pas rétroactivement l’état précédent.

---

# 12. Contre-revues indépendantes

Une contre-revue indépendante doit chercher à réfuter ou confirmer les propriétés importantes du changement.

Son objectif n’est pas de produire un second avis complaisant.

Le reviewer doit disposer du contexte minimal suffisant pour reconstruire son jugement.

Ce contexte dépend de la mission et peut notamment comprendre :

- état Git ou SHA concerné ;
- diff ;
- fichiers modifiés ;
- contrats canoniques pertinents ;
- résultats de tests ;
- résultats CI ;
- preuves spécifiques ;
- rapport de clôture ;
- réserves connues.

Le contexte doit être suffisant, mais il ne doit pas être gonflé sans nécessité.

Un reviewer ne doit pas prétendre avoir vérifié une propriété à laquelle son environnement ne lui donne pas réellement accès.

---

# 13. Reviewer avec accès direct et reviewer sur preuves

Deux situations doivent être distinguées.

## 13.1 Reviewer avec accès direct à la source

Lorsqu’un reviewer dispose réellement :

- du dépôt ;
- de l’état Git concerné ;
- des fichiers ;
- du diff ;
- et des contrôles nécessaires ;

il peut examiner directement les propriétés accessibles dans cet environnement.

Son rapport doit identifier l’état réellement examiné.

## 13.2 Reviewer sur paquet de preuves

Lorsqu’un reviewer ne dispose pas directement du dépôt, il peut effectuer une revue indépendante à partir d’un paquet de preuves.

Le paquet doit être rattaché aussi précisément que raisonnablement possible à l’état examiné.

Il peut notamment contenir :

- SHA déclaré ;
- diff ;
- fichiers pertinents ;
- résultats de tests ;
- résultats CI ;
- preuves particulières ;
- documents canoniques nécessaires.

Le reviewer ne peut conclure que sur les propriétés que ce paquet lui permet réellement d’évaluer.

Lorsqu’une propriété importante ne peut pas être vérifiée depuis les éléments disponibles, elle doit être indiquée comme :

`INVÉRIFIABLE`

plutôt que supposée correcte.

Un paquet de preuves ne devient pas équivalent à un accès direct au dépôt simplement parce qu’il contient un SHA déclaré.

---

# 14. Indépendance du reviewer

Une contre-revue indépendante doit reconstruire son jugement.

Elle ne doit pas recevoir comme fondation obligatoire la conclusion que l’agent d’implémentation souhaite lui faire confirmer.

Un prompt de revue peut fournir :

- la mission ;
- le périmètre ;
- les contrats applicables ;
- les éléments factuels nécessaires.

Il doit éviter autant que possible de préorienter le verdict.

Le reviewer peut conclure :

- conforme ;
- conforme avec réserves ;
- non conforme ;
- invérifiable sur certaines propriétés.

Deux reviewers indépendants qui produisent la même conclusion augmentent la confiance dans leur analyse.

Leur accord ne constitue cependant pas, à lui seul, une preuve mécanique des propriétés qu’aucun des deux n’a réellement vérifiées.

## 14.1 Contrat des prompts de revue utilisés comme preuve

Lorsqu'un prompt de revue participe à une preuve Filora, il doit identifier suffisamment les sources et l'état que le reviewer est autorisé à utiliser afin que son verdict puisse être relié à la propriété réellement examinée.

Toute mission Claude utilisée comme preuve Filora doit déclarer explicitement ses sources autorisées et l'état de référence attendu.

Elle doit demander à Claude de vérifier cet état avant l'analyse, imposer `ÉTAT OBSOLÈTE` en cas de divergence et interdire de remplacer silencieusement les sources autorisées par une mémoire de mission précédente, des connaissances de projet potentiellement périmées ou un accès supposé à une autre source.

Claude ne doit présenter comme vérifié que ce que les sources autorisées permettent réellement d'établir ; les éléments nécessaires mais non démontrables doivent rester explicitement `INVÉRIFIABLE`.

Lorsqu'une mission est explicitement une contre-vérification Codex Security, le prompt doit demander explicitement à Codex d'utiliser le plugin Security.

Une revue Codex ne peut pas être comptée comme preuve `Codex Security` si l'utilisation du plugin Security n'est pas explicitement demandée dans le prompt de mission.

Avant de préparer une mission Codex, l'agent doit choisir le niveau de revue proportionné à la propriété à vérifier et au risque réel.

Le plugin Security ne doit être demandé que lorsqu'une contre-vérification Codex Security est réellement nécessaire pour couvrir une propriété de sécurité ou un risque que Codex normal ne couvre pas suffisamment.

Lorsqu'une revue Codex normale suffit, le prompt ne doit pas demander l'utilisation du plugin Security.

Le surclassement vers Codex Security par défaut, par simple précaution générale ou sans gain de preuve identifié est interdit.

Lorsque des templates de prompts versionnés matérialisent ces contrats, leurs clauses obligatoires doivent être protégées par un contrôle mécanique proportionné. Une CI verte ne prouve cependant que la présence des clauses contrôlées ; elle ne prouve pas qu'un reviewer externe a effectivement exécuté le plugin ou respecté toutes les instructions.

---

# 15. Usage de reviewers différents

Le choix du mécanisme de revue doit être proportionné au risque.

Une seconde IA n’est pas exigée pour chaque modification.

Pour les changements où une revue indépendante est nécessaire, le reviewer doit être suffisamment indépendant de l’implémentation pour reconstruire son jugement.

Pour un changement Critique ou une étape structurelle majeure, plusieurs mécanismes indépendants peuvent être utilisés lorsqu’ils couvrent des propriétés différentes ou réduisent réellement un risque.

L’utilisation de plusieurs reviewers ne doit pas devenir une boucle de validation infinie.

Un même désaccord non résolu entre reviewers ne peut donner lieu qu'à un seul cycle de correction et de contre-vérification avant escalade selon la hiérarchie ci-dessus. La découverte ultérieure d'un défaut distinct, factuel et nouvellement établi n'est pas considérée comme la répétition du même cycle.

Lorsqu’un désaccord persiste :

1. les arguments sont comparés aux contrats canoniques et aux preuves ;
2. une propriété objectivement vérifiable est tranchée par la preuve appropriée lorsqu’elle existe ;
3. une décision appartenant à Mickaël lui est présentée ;
4. une incertitude technique non résolue reste explicitement une réserve.

La répétition de reviews ne doit pas servir à chercher indéfiniment un reviewer qui donne la réponse souhaitée.

---

# 16. Contexte permanent et contexte de mission

Les documents canoniques constituent le contexte durable du projet.

Lorsqu'un environnement de reviewer permet de conserver ou de mettre en cache un contexte permanent, ces mécanismes peuvent être utilisés afin d'éviter de retransmettre inutilement l'intégralité des contrats à chaque revue.

Le contexte permanent ne remplace cependant pas les éléments propres à l'état examiné.

Chaque mission de revue doit encore recevoir les informations variables nécessaires, par exemple :

- SHA ;
- diff ;
- fichiers concernés ;
- résultats de tests ;
- preuves spécifiques.

Les procédures opérationnelles peuvent être adaptées aux outils disponibles sans modifier cette règle canonique.

---

# 17. Procédure opérationnelle actuelle des contre-revues

Cette section décrit une procédure pratique et peut évoluer lorsque les outils disponibles changent.

Elle ne modifie pas les règles normatives précédentes.

## 17.1 Claude

Claude est utilisé principalement comme contradicteur indépendant et second avis.

Un projet Claude dédié à Filora peut conserver les instructions permanentes de rôle du reviewer. Ses `Connaissances du projet` ne doivent pas servir de copies statiques des documents canoniques susceptibles de devenir obsolètes.

Le flux normal de contre-revue Claude ne dépend pas d’un accès direct à GitHub.

Le coordinateur vérifie d’abord l’état réel dans GitHub puis prépare un paquet de mission minimal rattaché à cet état.

Même si un accès direct à GitHub devient techniquement possible pour Claude, il n’est utilisé que lorsqu’il apporte un gain de preuve réel et proportionné à son coût ou à sa consommation de contexte.

Claude n'a pas besoin de conserver l'historique d'une conversation unique entre plusieurs revues. Une nouvelle conversation peut être ouverte pour chaque contre-revue ou avis indépendant.

Chaque conversation reçoit uniquement le contexte spécifique nécessaire à la mission courante, par exemple :

- SHA ou état concerné ;
- diff ou passages canoniques strictement nécessaires ;
- fichiers pertinents ;
- résultats de tests ou CI ;
- preuves nécessaires ;
- question précise à examiner.

L'objectif est que Claude reconstruise un avis indépendant à partir des éléments effectivement fournis pour la mission, sans dépendre de l'historique d'une conversation précédente ni d’une copie potentiellement périmée du dépôt.

Lorsqu'il ne dispose pas d'un élément nécessaire pour vérifier une propriété, Claude doit distinguer ce qu'il peut réellement vérifier de ce qui reste INVÉRIFIABLE.

## 17.2 Codex

Lorsqu'un environnement Codex dispose d'un accès direct au dépôt et à l'état Git concerné, il est privilégié pour les propriétés nécessitant l'examen direct :

- du HEAD ;
- du diff réel ;
- des fichiers ;
- de l'historique pertinent ;
- ou des tests disponibles dans cet environnement.

Il doit lui aussi identifier précisément l'état examiné et ne pas revendiquer des propriétés que son environnement ne permet pas de démontrer.

Pour une mission explicitement `Codex Security`, le prompt versionné de mission doit demander l'utilisation du plugin Security conformément à la Section 14.1.

## 17.3 Orchestration

L'outil ou l'agent qui coordonne les reviews ne devient pas une autorité supérieure simplement parce qu'il compare leurs conclusions.

Son rôle consiste à :

- préparer la mission ;
- fournir le contexte nécessaire ;
- vérifier que les reviewers ont examiné le bon état ;
- comparer leurs conclusions aux contrats canoniques et aux preuves ;
- identifier les contradictions ;
- présenter à Mickaël les décisions qui lui appartiennent.

Une contradiction entre reviewers ne se résout pas par vote.

---

# 18. Prévention du fractionnement entre Batches

Lors de la clôture d'un Batch sensible ou lorsqu'un doute existe sur un fractionnement, le rapport doit rendre visibles les travaux récents pertinents qui participent potentiellement à la même décision.

L'objectif n'est pas d'imposer une surveillance globale permanente de tout l'historique.

L'objectif est de permettre au reviewer de détecter qu'une modification sensible aurait été artificiellement divisée entre plusieurs Batches, commits ou sous-tâches.

Lorsqu'un ensemble de changements participe à une même décision sensible, sa classification doit être évaluée sur cet ensemble pertinent plutôt que sur chaque fragment isolé.

---

# 19. Findings et réserves

Un finding est un problème ou une observation qui mérite d'être conservé sans être nécessairement corrigé dans le Batch courant.

Un finding doit être suffisamment explicite pour permettre une décision ultérieure.

Il peut être notamment :

- à traiter ou intégrer dans le travail ;
- reporté ;
- accepté ;
- rejeté.

Un finding hors périmètre ne doit pas empêcher automatiquement la clôture d'un Batch lorsqu'il ne remet pas en cause les propriétés que ce Batch devait démontrer.

Une réserve affectant directement une propriété obligatoire de clôture ne peut cependant pas être transformée en simple finding afin de contourner cette propriété.

---

# 20. Preview et validation humaine

Lorsqu'un Batch modifie un comportement observable pertinent, la Preview constitue un moyen de vérification de ce comportement.

Lorsqu’un travail produit un comportement observable nécessitant une validation humaine, l’agent doit spontanément préparer et proposer le moyen de le tester ainsi qu’un protocole concret et les résultats attendus, sans attendre que Mickaël demande s’il doit tester.

La validation humaine doit porter uniquement sur les propriétés que Mickaël peut raisonnablement évaluer.

Elle peut notamment concerner :

- compréhension ;
- comportement observable ;
- ergonomie ;
- choix produit ;
- compromis explicitement présentés.

Elle ne doit pas être utilisée comme preuve de :

- correction d'une migration ;
- absence de corruption ;
- respect d'une frontière architecturale invisible ;
- sécurité technique ;
- propriété interne non observable.

---

# 21. Clôture d'un Batch

Un Batch ne peut être déclaré clôturé que lorsque les exigences applicables à son périmètre sont satisfaites.

Le rapport de clôture doit permettre de vérifier au minimum :

1. l'intention et le périmètre du Batch ;
2. l'état technique exact concerné ;
3. les changements réalisés ;
4. les changements sensibles détectés ;
5. la classification F4.2/F4.3 ;
6. la classification F4.4 ;
7. la justification de ces classifications ;
8. les tests et contrôles applicables ;
9. leur résultat réel ;
10. les preuves supplémentaires exigées par le risque ;
11. la vérification Preview lorsqu'elle est applicable ;
12. les décisions appartenant à Mickaël et leur état ;
13. les reviews indépendantes exigées et leur état ;
14. les findings et réserves ;
15. les modifications éventuelles de documents canoniques ;
16. les validations indisponibles ou invérifiables.

Un Batch ne peut pas être clôturé par simple déclaration de l'agent d'implémentation.

Une propriété obligatoire non démontrée reste :

- non validée ;
- en attente ;
- échouée ;
- ou invérifiable,

selon la situation réelle.

Elle n'est pas transformée en réussite pour permettre la clôture.

---

# 22. Documents canoniques

Les documents canoniques sont :

- `PRODUCT.md` ;
- `DATA.md` ;
- `ARCHITECTURE.md` ;
- `DEVELOPMENT.md`.

Ils ne doivent être modifiés que lorsqu'une modification de leur contrat est réellement nécessaire.

Une modification de code ne doit pas entraîner automatiquement une modification documentaire destinée uniquement à faire correspondre le contrat au code après coup.

Lorsque le code révèle une contradiction avec un contrat canonique, la contradiction doit être traitée explicitement.

Le code n'obtient pas automatiquement raison parce qu'il existe déjà.

Inversement, un document canonique peut évoluer lorsqu'une décision valide justifie réellement son évolution.

---

# 23. Hiérarchie entre décisions, contrats et implémentation

Une décision réellement prise ne devient une règle durable que lorsqu'elle est enregistrée à l'endroit approprié lorsque cette conservation est nécessaire.

Les documents canoniques définissent les contrats durables.

Les Batches appliquent ou font évoluer ces contrats selon les règles de gouvernance.

L'implémentation doit respecter les contrats applicables à l'état concerné.

Lorsqu'une contradiction apparaît entre :

- intention du Batch ;
- document canonique ;
- implémentation ;
- preuve ;

elle doit être rendue explicite plutôt que résolue silencieusement par l'agent.

---

# 24. Proportionnalité de la gouvernance

La gouvernance existe pour réduire les risques réels du développement par IA.

Elle ne doit pas devenir un objectif autonome.

Une opération locale, réversible et ordinaire ne doit pas recevoir la même procédure qu'une migration destructive ou qu'une modification d'un garde-fou.

Les mécanismes doivent rester :

- compréhensibles ;
- vérifiables ;
- proportionnés ;
- réellement applicables.

Une règle qui ajoute de la procédure sans réduire suffisamment un risque doit pouvoir être remise en question selon les mêmes mécanismes de gouvernance.

Filora ne doit pas accumuler des contrôles uniquement parce qu'ils donnent l'apparence d'un processus plus professionnel.

---

# 25. Règle finale

Filora avance lorsque la prochaine étape :

- apporte une valeur réelle ;
- répond à un besoin démontré ;
- ou couvre un risque réel.

Filora n'avance pas parce qu'un processus, un template, une architecture théorique ou une IA réclame davantage de complexité.

La gouvernance doit permettre aux IA de travailler efficacement sans leur permettre :

- d'élargir silencieusement leur autorité ;
- de modifier les règles qui les bloquent pour obtenir le résultat souhaité ;
- de masquer une incertitude ;
- de transformer une absence de preuve en réussite ;
- de faire porter à Mickaël la responsabilité de certifier des propriétés techniques qu'il ne peut raisonnablement pas vérifier.

Le but n'est pas de supprimer tout risque.

Le but est que les risques importants soient détectés, rendus visibles, traités au bon niveau et jamais masqués pour permettre au développement de continuer.
