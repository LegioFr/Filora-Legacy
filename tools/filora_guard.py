#!/usr/bin/env python3
"""Minimal operational guardrails for Filora Batch 0.

Standard-library only. The tool intentionally covers only two properties:
- external review packets are executable and bounded before delegation;
- PROJECT_STATE.md contains the expected post-transition facts before closure.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def fail(message: str) -> int:
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def check_review_packet(path: Path) -> int:
    try:
        packet = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        return fail(f"cannot read review packet: {exc}")

    if not isinstance(packet, dict):
        return fail("review packet must be a JSON object")

    mission = packet.get("mission")
    sha = packet.get("state_sha")
    budget = packet.get("context_budget_chars")
    inputs = packet.get("inputs")

    if not isinstance(mission, str) or not mission.strip():
        return fail("mission is required")
    if not isinstance(sha, str) or not SHA_RE.fullmatch(sha):
        return fail("state_sha must be an exact 40-character Git SHA")
    if not isinstance(budget, int) or isinstance(budget, bool) or budget <= 0:
        return fail("context_budget_chars must be a positive integer")
    if not isinstance(inputs, list) or not inputs:
        return fail("at least one concrete input is required")

    seen_contents: set[str] = set()
    total = 0
    for index, item in enumerate(inputs, start=1):
        if not isinstance(item, dict):
            return fail(f"input #{index} must be an object")
        kind = item.get("kind")
        purpose = item.get("purpose")
        content = item.get("content")
        if not isinstance(kind, str) or not kind.strip():
            return fail(f"input #{index} kind is required")
        if not isinstance(purpose, str) or not purpose.strip():
            return fail(f"input #{index} purpose is required")
        if not isinstance(content, str) or not content.strip():
            return fail(
                f"input #{index} must contain usable content; a URL or declaration alone is insufficient"
            )
        if content in seen_contents:
            return fail(f"input #{index} duplicates content already supplied")
        seen_contents.add(content)
        total += len(content)

    if total > budget:
        return fail(
            f"review context is {total} chars, above the declared mission budget of {budget}"
        )

    print(
        f"PASS: review packet executable for {sha}; {len(inputs)} input(s), {total}/{budget} chars"
    )
    return 0


def check_project_state(
    path: Path, expected_stage: str, expected_git: str, expected_next: str
) -> int:
    try:
        content = path.read_text(encoding="utf-8")
    except OSError as exc:
        return fail(f"cannot read project state: {exc}")

    expectations = {
        "stage": expected_stage,
        "git state": expected_git,
        "next action": expected_next,
    }
    for label, value in expectations.items():
        if not value.strip():
            return fail(f"expected {label} cannot be empty")
        if value not in content:
            return fail(f"PROJECT_STATE.md does not contain expected {label}: {value!r}")

    print("PASS: PROJECT_STATE.md contains the expected post-transition facts")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Filora minimal operational guardrails")
    commands = root.add_subparsers(dest="command", required=True)

    review = commands.add_parser("review-packet", help="validate a review packet before delegation")
    review.add_argument("packet", type=Path)

    state = commands.add_parser("project-state", help="validate PROJECT_STATE.md before closure")
    state.add_argument("--file", type=Path, default=Path("PROJECT_STATE.md"))
    state.add_argument("--expect-stage", required=True)
    state.add_argument("--expect-git", required=True)
    state.add_argument("--expect-next", required=True)
    return root


def main() -> int:
    args = parser().parse_args()
    if args.command == "review-packet":
        return check_review_packet(args.packet)
    if args.command == "project-state":
        return check_project_state(
            args.file, args.expect_stage, args.expect_git, args.expect_next
        )
    return fail("unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
