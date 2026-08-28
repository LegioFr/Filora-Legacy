#!/usr/bin/env python3
"""Guard the permanent reviewer/tool-use clauses introduced by Batch 2."""

from __future__ import annotations

import argparse
from pathlib import Path

REQUIRED_DEVELOPMENT_CONTRACTS = (
    "Avant de déclarer qu'une opération autorisée est impossible ou de demander à Mickaël de l'effectuer manuellement, l'agent doit vérifier les moyens raisonnables déjà disponibles pour accomplir l'opération.",
    "Une réponse tronquée, paginée ou limitée en taille ne constitue pas à elle seule une preuve que la donnée complète est inaccessible.",
    "L'agent ne doit déclarer une opération techniquement inaccessible qu'après avoir vérifié qu'aucun moyen raisonnable disponible dans son environnement ne permet de l'accomplir sans transfert manuel inutile.",
    "Cette règle n'oblige pas à contourner une permission, une restriction de sécurité, un périmètre autorisé ou une limitation réelle de l'outil.",
    "Toute mission Claude utilisée comme preuve Filora doit déclarer explicitement ses sources autorisées et l'état de référence attendu.",
    "Elle doit demander à Claude de vérifier cet état avant l'analyse, imposer `ÉTAT OBSOLÈTE` en cas de divergence et interdire de remplacer silencieusement les sources autorisées par une mémoire de mission précédente, des connaissances de projet potentiellement périmées ou un accès supposé à une autre source.",
    "Claude ne doit présenter comme vérifié que ce que les sources autorisées permettent réellement d'établir ; les éléments nécessaires mais non démontrables doivent rester explicitement `INVÉRIFIABLE`.",
    "Lorsqu'une mission est explicitement une contre-vérification Codex Security, le prompt doit demander explicitement à Codex d'utiliser le plugin Security.",
    "Une revue Codex ne peut pas être comptée comme preuve `Codex Security` si l'utilisation du plugin Security n'est pas explicitement demandée dans le prompt de mission.",
    "Avant de préparer une mission Codex, l'agent doit choisir le niveau de revue proportionné à la propriété à vérifier et au risque réel.",
    "Le plugin Security ne doit être demandé que lorsqu'une contre-vérification Codex Security est réellement nécessaire pour couvrir une propriété de sécurité ou un risque que Codex normal ne couvre pas suffisamment.",
    "Lorsqu'une revue Codex normale suffit, le prompt ne doit pas demander l'utilisation du plugin Security.",
    "Le surclassement vers Codex Security par défaut, par simple précaution générale ou sans gain de preuve identifié est interdit.",
    "Lorsque des templates de prompts versionnés matérialisent ces contrats, leurs clauses obligatoires doivent être protégées par un contrôle mécanique proportionné. Une CI verte ne prouve cependant que la présence des clauses contrôlées ; elle ne prouve pas qu'un reviewer externe a effectivement exécuté le plugin ou respecté toutes les instructions.",
)


def check_development(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    return [
        f"missing permanent governance contract: {contract}"
        for contract in REQUIRED_DEVELOPMENT_CONTRACTS
        if contract not in text
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=Path("DEVELOPMENT.md"))
    args = parser.parse_args()
    errors = check_development(args.file)
    if errors:
        raise SystemExit("\n".join(errors))


if __name__ == "__main__":
    main()
