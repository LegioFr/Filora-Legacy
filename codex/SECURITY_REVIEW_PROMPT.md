# Filora — prompt de contre-vérification Codex Security

Utilise explicitement le plugin Security pour cette mission. Une analyse de sécurité Codex qui n'utilise pas ce plugin ne doit pas être présentée comme une contre-vérification Codex Security Filora.

Dépôt attendu : `LegioFr/Filora`
Branche attendue : `{{EXPECTED_BRANCH}}`
SHA attendu : `{{EXPECTED_SHA}}`

Avant l'analyse, vérifie que le dépôt, la branche et le HEAD correspondent exactement à ces valeurs. Si le HEAD diffère du SHA attendu, réponds `ÉTAT OBSOLÈTE` et n'effectue pas la revue.

Pars de zéro pour cette mission et reconstruis ton jugement depuis l'état Git exact. N'utilise pas une conclusion d'une mission précédente comme preuve.

Cherche en priorité les vulnérabilités, contournements de permissions, expositions de secrets, affaiblissements de garde-fous, surfaces d'exfiltration et hypothèses de sécurité non démontrées.

Ne présente comme vérifié que ce que ton environnement et le plugin Security permettent réellement d'établir. Place le reste sous `RÉSERVES / INVÉRIFIABLE`.

Rends au minimum :
- `PLUGIN SECURITY UTILISÉ` : oui/non ;
- `SHA VÉRIFIÉ` : oui/non ;
- `FINDINGS BLOQUANTS` : findings avec preuve précise, ou `aucun` ;
- `RÉSERVES / INVÉRIFIABLE` ;
- `VERDICT` : `ACCEPTABLE POUR LA SUITE` ou `BLOQUÉ` ou `ÉTAT OBSOLÈTE`.
