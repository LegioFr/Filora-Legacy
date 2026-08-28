#!/usr/bin/env python3
"""Mechanical contract check for the versioned Claude review prompt."""

from __future__ import annotations

import argparse
from pathlib import Path

REQUIRED_SNIPPETS = (
    "FILORA_CLAUDE_REVIEW_PACKAGE.md",
    "{{EXPECTED_BRANCH}}",
    "{{EXPECTED_SHA}}",
    "source_branch",
    "source_sha",
    "ÉTAT OBSOLÈTE",
    "N'utilise pas les connaissances du projet Claude",
    "Google Drive",
    "un accès GitHub supposé",
    "Ne présente comme vérifié que ce que le paquet permet réellement d'établir",
    "RÉSERVES / INVÉRIFIABLE",
)


def check_prompt(path: Path) -> list[str]:
    text = path.read_text(encoding="utf-8")
    errors = [f"missing required prompt contract: {snippet}" for snippet in REQUIRED_SNIPPETS if snippet not in text]
    if text.count("{{EXPECTED_BRANCH}}") < 3:
        errors.append("expected branch placeholder must guard declaration and mismatch check")
    if text.count("{{EXPECTED_SHA}}") < 3:
        errors.append("expected SHA placeholder must guard declaration and mismatch check")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, default=Path("claude/REVIEW_PROMPT.md"))
    args = parser.parse_args()
    errors = check_prompt(args.file)
    if errors:
        raise SystemExit("\n".join(errors))


if __name__ == "__main__":
    main()
