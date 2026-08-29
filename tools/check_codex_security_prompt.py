#!/usr/bin/env python3
"""Mechanical contract check for the versioned Codex Security review prompt."""

from __future__ import annotations

import argparse
from pathlib import Path

REQUIRED_EXACT = (
    "Utilise explicitement le plugin Security pour cette mission.",
    "Une analyse de sécurité Codex qui n'utilise pas ce plugin ne doit pas être présentée comme une contre-vérification Codex Security Filora.",
    "Si le HEAD diffère du SHA attendu, réponds `ÉTAT OBSOLÈTE` et n'effectue pas la revue.",
    "Ne présente comme vérifié que ce que ton environnement et le plugin Security permettent réellement d'établir.",
)

REQUIRED_SNIPPETS = (
    "LegioFr/Filora",
    "{{EXPECTED_BRANCH}}",
    "{{EXPECTED_SHA}}",
    "PLUGIN SECURITY UTILISÉ",
    "RÉSERVES / INVÉRIFIABLE",
)


def check_prompt(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors = [f"missing exact Codex Security contract: {snippet}" for snippet in REQUIRED_EXACT if snippet not in text]
    errors.extend(
        f"missing required Codex Security prompt element: {snippet}"
        for snippet in REQUIRED_SNIPPETS
        if snippet not in text
    )
    if text.count("{{EXPECTED_BRANCH}}") < 1:
        errors.append("expected branch placeholder is required")
    if text.count("{{EXPECTED_SHA}}") < 1:
        errors.append("expected SHA placeholder is required")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=Path("codex/SECURITY_REVIEW_PROMPT.md"))
    args = parser.parse_args()
    errors = check_prompt(args.file)
    if errors:
        raise SystemExit("\n".join(errors))


if __name__ == "__main__":
    main()
