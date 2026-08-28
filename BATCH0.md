# Batch 0 — Garde-fous opérationnels minimaux

## Statut

Batch 0 est **validé sur `test-preview`** après correction des bloqueurs et contre-vérification indépendante conforme du HEAD final de la PR #14. La promotion vers `main` n’est pas encore effectuée. L’Issue #7 a désormais sa condition de résolution démontrée ; l’Issue #10 reste le seul bloqueur de clôture après qu’un premier test de reprise indépendante a détecté un `PROJECT_STATE.md` encore périmé par rapport au merge de la PR #15.

## Intention

Rendre mécaniques uniquement les contrôles déjà justifiés par des incidents réels ou par une propriété objective simple, sans créer une seconde gouvernance parallèle.

## Périmètre immédiat

Inclus :

- maintenir `test-preview` alignée sur la base canonique pertinente avant promotion vers `main` ;
- vérifier la présence des quatre documents canoniques sur la base et le HEAD proposés ;
- traiter l’Issue #7 avec un lint de paquet de revue externe qui contrôle uniquement des propriétés de forme et de borne objectivement vérifiables ;
- traiter l’Issue #10 avec une section de reprise structurée à clés uniques dans `PROJECT_STATE.md`, sans recherche globale de sous-chaînes ;
- ajouter des scénarios adversariaux couvrant les faux positifs démontrés par les contre-analyses ;
- exécuter les contrôles et tests sur les PR vers `test-preview` et `main` via un runner unique GitHub Actions ;
- conserver une déclaration de clôture unique dans ce document plutôt que multiplier templates et registres.

Reporté jusqu’à apparition de leur objet :

- contrôles d’architecture par imports/cycles ;
- invariants métier DATA ;
- persistance, migrations, atomicité et concurrence ;
- récupération end-to-end ;
- contrôles UI, réseau, cloud, synchronisation et authentification.

Lorsqu’un futur Batch introduit un objet couvert par une règle objectivement testable, il doit soit ajouter le contrôle applicable dans ce travail, soit déclarer explicitement le report, son risque résiduel et son point de réévaluation. Les jalons canoniques non reportables restent obligatoires à leur frontière, notamment la récupération avant que Filora devienne la source principale de données réelles.

## Décisions sur les findings pertinents

### Issue #7 — résolue techniquement et démontrée

Le mécanisme est volontairement qualifié de **lint de forme**, pas de preuve de minimalité ou de suffisance sémantique.

Il vérifie notamment :

- mission et question non vides ;
- SHA Git au format exact et attestation que l’état cible a été vérifié ;
- vérification locale optionnelle que le SHA résout vers un commit lorsqu’un checkout Git est disponible ;
- au moins une entrée avec type et finalité ;
- contenu embarqué ou URL dont l’accès a été explicitement établi ;
- rejet des placeholders manifestes et contenus dupliqués ;
- budget déclaré positif mais plafonné par le mécanisme ;
- comptage du paquet sérialisé complet, pas uniquement de `inputs[].content`.

Ce contrôle **ne prouve pas** que le paquet est sémantiquement suffisant, réellement minimal, authentique ou correctement interprété. Ces propriétés restent à reviewer.

Un test réel de délégation sur `test-preview` au SHA `044411a9d9ad6e3b0bd59b715c08b135ce804665` a produit `LINT ISSUE #7 : PASS` et la contre-vérification indépendante a conclu `PAQUET CIBLÉ ET EXÉCUTABLE : oui`. La condition de résolution de #7 est donc considérée démontrée.

### Issue #8 — report maintenu

Le finding reste reporté/fermé `not_planned` : l’outillage disponible ne fournit pas encore d’édition ciblée sûre et la création d’une abstraction dédiée serait disproportionnée. Réévaluer si l’outillage change ou avant une modification ciblée importante d’un document volumineux.

### Issue #10 — mécanisme présent, preuve finale à refaire

`PROJECT_STATE.md` contient une section `## Reprise structurée` avec exactement quatre clés d’autorité opérationnelle :

- `stage` ;
- `status` ;
- `git` ;
- `next_action`.

Le lint exige une section unique, des clés uniques, rejette les représentations ambiguës (dont blocs de code et citations) et permet de comparer exactement les valeurs attendues. Les anciens textes ailleurs dans le fichier ne peuvent donc plus satisfaire le contrôle à la place du champ d’autorité.

Les findings et réserves pertinents restent une responsabilité de revue ; le parseur ne prétend pas les déduire automatiquement.

Le premier test indépendant de reprise finale a correctement détecté que `PROJECT_STATE.md` décrivait encore l’état antérieur au merge de la PR #15. Il a conclu `REPRISE ISSUE #10 : NON CONFORME` et `ÉTAT RETROUVÉ SANS RÉPARATION : non`. Cette détection confirme l’utilité du garde-fou, mais la condition de résolution #10 exige encore une nouvelle preuve réussie après synchronisation du point de reprise.

## Traçabilité légère

Les contrôles mécaniques durables doivent référencer la règle ou le finding qu’ils protègent de manière lisible, sans registre central exhaustif. Les canoniques restent normatifs : un test ou un script vérifie un contrat, il ne le redéfinit pas. Toute contradiction contrôle/canonique ou canonique/canonique doit être rendue explicite et résolue, jamais corrigée automatiquement pour faire passer le contrôle.

## Preuves obtenues

- `test-preview` a été réalignée sur le `main` canonique `b634903da4197937f3200396a13a4a0612f472fe` avant reprise du Batch 0.
- La PR #14 a remplacé la PR #11 historique et a été construite sur cette base réalignée.
- Le HEAD final vérifié de la PR #14 est `43a084b6cffc824b716756b2906fdad4213308f7`.
- GitHub Actions run `33174923364` a terminé `success` sur ce HEAD ; les étapes `Checkout exact PR HEAD`, `Assert exact PR HEAD`, présence des canoniques, état structuré et tests ont toutes réussi.
- La contre-vérification indépendante ciblée du HEAD final a conclu `CONFORME`, `BLOQUEURS PRÉCÉDENTS : RÉSOLUS`, `NOUVEAU BLOQUEUR INTRODUIT : non` et `MERGE VERS test-preview : ACCEPTABLE`.
- La PR #14 a été mergée vers `test-preview` au commit `d9686456cfe9505ca3ff1cba8f803b220d4e1d77`.
- La PR #15 de mise à jour de l’état de clôture a passé la CI puis a été mergée vers `test-preview` au commit `044411a9d9ad6e3b0bd59b715c08b135ce804665`.
- Le test réel Issue #7 a passé le lint avec SHA vérifié et a été jugé ciblé/exécutable par revue indépendante.
- Le premier test final Issue #10 a échoué pour une raison réelle et explicite : point de reprise encore antérieur au merge de #15. La synchronisation correspondante est maintenant préparée pour nouveau test.
- L’absence de ruleset/protection bloquante reste explicitement une limite : le workflow contrôle automatiquement les PR concernées mais ne constitue pas une impossibilité technique absolue de merge manuel.

## Propriétés à démontrer avant clôture définitive

1. `test-preview` et le HEAD du Batch contiennent `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md` — **démontré**.
2. Le lint #7 rejette les faux positifs ciblés et un paquet réel passe après prévalidation — **démontré**.
3. Le lint #10 rejette doublons, sections concurrentes, historique non autoritaire, blocs de code et citations — **démontré par tests et contre-vérification**.
4. Les contrôles n’affirment pas démontrer davantage que ce qu’ils vérifient objectivement — **contre-vérifié conforme**.
5. Le runner automatique est rattaché au HEAD exact de PR et l’assertion de SHA a réussi — **démontré**.
6. **F4.2/F4.3 : Sensible** et **F4.4 : décision technique dans le périmètre approuvé du Batch 0** — **contre-vérifié acceptable**.
7. Issue #7 — **condition de résolution démontrée**.
8. Issue #10 — **nouveau test de reprise sans contexte préalable encore requis après synchronisation**.

## Classification finale proposée

- **F4.2/F4.3 : Sensible**.
- **F4.4 : décision technique dans le périmètre approuvé du Batch 0**, sans modification des contrats produit, données ou architecture.

## Condition de clôture

Batch 0 n’est clôturable définitivement que lorsque le nouveau test indépendant de reprise confirme que l’état post-clôture est retrouvé directement sans réparation, que le point de reprise final est cohérent avec GitHub, et que la promotion applicable respecte le flux `test-preview` → `main`. Une propriété obligatoire non démontrée reste non validée.
