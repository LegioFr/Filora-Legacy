#!/usr/bin/env python3
"""Build the self-contained Filora documentary review artifact for Claude."""

from __future__ import annotations

import argparse
from pathlib import Path

DOCUMENTS = (
    "PROJECT_STATE.md",
    "PRODUCT.md",
    "DATA.md",
    "ARCHITECTURE.md",
    "DEVELOPMENT.md",
)
ALLOWED_BRANCH = "test-preview"


def validate_reference(branch: str, sha: str) -> None:
    if branch != ALLOWED_BRANCH:
        raise ValueError(f"Claude review package must come from {ALLOWED_BRANCH}, got {branch}")
    if len(sha) != 40 or any(c not in "0123456789abcdef" for c in sha.lower()):
        raise ValueError("sha must be a full 40-character hexadecimal commit SHA")


def build_package(root: Path, branch: str, sha: str) -> str:
    validate_reference(branch, sha)
    sections = [
        "# FILORA_CLAUDE_REVIEW_PACKAGE",
        "",
        "This file is a derived review artifact. GitHub remains authoritative.",
        f"source_branch: {branch}",
        f"source_sha: {sha}",
        "document_count: 5",
        "",
        "Claude must verify source_branch and source_sha before using the documents below.",
    ]
    for name in DOCUMENTS:
        path = root / name
        if not path.is_file():
            raise FileNotFoundError(f"missing required document: {name}")
        text = path.read_text(encoding="utf-8")
        sections.extend(("", f"<!-- BEGIN {name} -->", text.rstrip(), f"<!-- END {name} -->"))
    return "\n".join(sections) + "\n"


def render_prompt(template: str, branch: str, sha: str) -> str:
    validate_reference(branch, sha)
    rendered = template.replace("{{EXPECTED_BRANCH}}", branch).replace("{{EXPECTED_SHA}}", sha)
    if "{{EXPECTED_" in rendered:
        raise ValueError("unresolved expected-state placeholder in Claude prompt")
    return rendered


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--prompt-template", type=Path)
    parser.add_argument("--prompt-output", type=Path)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--sha", required=True)
    args = parser.parse_args()

    payload = build_package(args.root, args.branch, args.sha)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(payload, encoding="utf-8")

    if bool(args.prompt_template) != bool(args.prompt_output):
        raise SystemExit("--prompt-template and --prompt-output must be provided together")
    if args.prompt_template and args.prompt_output:
        prompt = render_prompt(args.prompt_template.read_text(encoding="utf-8"), args.branch, args.sha)
        args.prompt_output.parent.mkdir(parents=True, exist_ok=True)
        args.prompt_output.write_text(prompt, encoding="utf-8")


if __name__ == "__main__":
    main()
