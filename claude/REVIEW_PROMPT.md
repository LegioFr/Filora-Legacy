# Filora — prompt de contre-vérification Claude

Utilise uniquement le fichier `FILORA_CLAUDE_REVIEW_PACKAGE.md` joint à cette mission. N'utilise pas les connaissances du projet Claude, Google Drive, le web, `main`, un accès GitHub supposé, une ancienne mission Filora ou une autre source comme substitut.

État de référence attendu :
- branche : `{{EXPECTED_BRANCH}}`
- SHA : `{{EXPECTED_SHA}}`

Commence par lire les métadonnées `source_branch` et `source_sha` du paquet joint.

Si `source_branch` n'est pas exactement `{{EXPECTED_BRANCH}}` ou si `source_sha` n'est pas exactement `{{EXPECTED_SHA}}`, arrête la revue et réponds `ÉTAT OBSOLÈTE` en indiquant les valeurs trouvées. Ne poursuis pas l'analyse documentaire.

Si les métadonnées correspondent, vérifie les cinq documents inclus dans le paquet : `PROJECT_STATE.md`, `PRODUCT.md`, `DATA.md`, `ARCHITECTURE.md` et `DEVELOPMENT.md`.

Une déclaration d'une IA n'est pas une preuve. Ne présente comme vérifié que ce que le paquet permet réellement d'établir. Distingue explicitement les constats prouvés depuis le paquet des points invérifiables avec cette source. Ne certifie pas l'état GitHub distant, la CI, les secrets, les permissions, les branches ou les PR si le paquet ne contient pas la preuve correspondante.

Réponds avec exactement ces rubriques :

BRANCHE PAQUET : <valeur>
SHA PAQUET : <valeur>
ÉTAT DE RÉFÉRENCE : CONFORME / ÉTAT OBSOLÈTE
COHÉRENCE DOCUMENTAIRE : CONFORME / NON CONFORME
FINDINGS BLOQUANTS : <aucun ou liste concise>
RÉSERVES / INVÉRIFIABLE : <aucune ou liste concise>
VERDICT : CANDIDAT DOCUMENTAIRE VALIDÉ / CORRECTION REQUISE / ÉTAT OBSOLÈTE
