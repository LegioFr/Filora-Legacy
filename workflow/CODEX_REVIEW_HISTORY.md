# Historique des contre-vérifications de gouvernance

Ce fichier conserve uniquement les verdicts nécessaires pour suivre les corrections de la PR de renforcement. Il ne remplace pas la preuve externe ni l’état GitHub.

## Revue Codex — SHA 5d0c9c3b795458db23898f2f493448967f4380ff

Verdict : **NON CONFORME**.

Bloqueurs confirmés :

- classification Critique non déduite des modifications objectives ;
- possibilité de sauter un numéro de Batch ;
- fallback legacy pouvant transformer un document invalide en preuve de clôture ;
- détection de `non clôturé` comme état clôturé.

Points importants confirmés :

- états de validation trop déclaratifs ;
- duplication excessive contrat JSON / logique Python ;
- routage incomplet lorsque Codex normal est insuffisant sans propriété Security ;
- transfert humain autorisable sans séquence adversariale suffisamment prouvée ;
- couverture de tests adversariaux insuffisante ;
- absence de protection de branche/ruleset réelle.

La correction suivante ne considère pas cette revue comme une validation positive. Une nouvelle contre-vérification indépendante est exigée sur le nouveau SHA exact.
