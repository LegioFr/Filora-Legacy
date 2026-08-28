#!/usr/bin/env python3
"""Minimal operational guardrails for Filora.

These checks intentionally prove only objective properties:
- canonical files are present on the checked tree;
- an external-review packet is structurally usable and bounded;
- PROJECT_STATE.md exposes one unambiguous structured resume state;
- the latest Batch declares one human-app-validation state and cannot be
  declared closed while that validation is still pending.

Semantic sufficiency, finding relevance, whether a human checkpoint is needed,
and review independence remain review responsibilities.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

SHA_RE = re.compile(r"^[0-9a-f]{40}$")
MAX_REVIEW_PAYLOAD_CHARS = 50_000
CANONICAL_FILES = ("PRODUCT.md", "DATA.md", "ARCHITECTURE.md", "DEVELOPMENT.md")
STATE_SECTION = "## Reprise structurée"
STATE_KEYS = ("stage", "status", "git", "next_action")
BATCH_FILE_RE = re.compile(r"^BATCH(\d+)\.md$")
BATCH_STATUS_RE = re.compile(r"^\*\*Statut\s*:\s*(.+?)\*\*\s*$", re.MULTILINE)
HUMAN_VALIDATION_RE = re.compile(
    r"^###\s+Jalon humain requis\s+—\s+(EN ATTENTE|VALIDÉ|NON REQUIS)\s*$",
    re.MULTILINE,
)
PLACEHOLDER_RE = re.compile(
    r"^\s*(?:placeholder(?:\b.*)?|todo(?:\b.*)?|tbd(?:\b.*)?|à compléter(?:\b.*)?|a completer(?:\b.*)?|<[^>]+>|\.\.\.)\s*$",
    re.IGNORECASE,
)


def fail(message: str) -> int:
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def check_canonical_presence(root: Path) -> int:
    missing = [name for name in CANONICAL_FILES if not (root / name).is_file()]
    if missing:
        return fail("missing canonical file(s): " + ", ".join(missing))
    print("PASS: all four canonical files are present")
    return 0


def _git_sha_exists(sha: str, repo_root: Path) -> bool:
    try:
        result = subprocess.run(
            ["git", "cat-file", "-e", f"{sha}^{{commit}}"],
            cwd=repo_root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except OSError:
        return False
    return result.returncode == 0


def _usable_text(value: object) -> bool:
    return (
        isinstance(value, str)
        and bool(value.strip())
        and PLACEHOLDER_RE.fullmatch(value) is None
    )


def check_review_packet(path: Path, verify_git_sha: bool, repo_root: Path) -> int:
    try:
        raw = path.read_text(encoding="utf-8")
        packet = json.loads(raw)
    except (OSError, json.JSONDecodeError) as exc:
        return fail(f"cannot read review packet: {exc}")

    if not isinstance(packet, dict):
        return fail("review packet must be a JSON object")

    mission = packet.get("mission")
    question = packet.get("question")
    sha = packet.get("state_sha")
    state_verified = packet.get("state_verified")
    budget = packet.get("context_budget_chars")
    inputs = packet.get("inputs")

    if not _usable_text(mission):
        return fail("mission is required and cannot be a placeholder")
    if not _usable_text(question):
        return fail("question is required and cannot be a placeholder")
    if not isinstance(sha, str) or not SHA_RE.fullmatch(sha):
        return fail("state_sha must be an exact 40-character Git SHA")
    if state_verified is not True:
        return fail(
            "state_verified must be true: the coordinator must attest that the target state was checked"
        )
    if verify_git_sha and not _git_sha_exists(sha, repo_root):
        return fail(f"state_sha does not resolve to a commit in {repo_root}")
    if not isinstance(budget, int) or isinstance(budget, bool) or budget <= 0:
        return fail("context_budget_chars must be a positive integer")
    if budget > MAX_REVIEW_PAYLOAD_CHARS:
        return fail(
            f"context_budget_chars exceeds the gate ceiling of {MAX_REVIEW_PAYLOAD_CHARS}"
        )
    if not isinstance(inputs, list) or not inputs:
        return fail("at least one review input is required")

    seen_contents: set[str] = set()
    for index, item in enumerate(inputs, start=1):
        if not isinstance(item, dict):
            return fail(f"input #{index} must be an object")
        if not _usable_text(item.get("kind")):
            return fail(f"input #{index} kind is required")
        if not _usable_text(item.get("purpose")):
            return fail(f"input #{index} purpose is required")

        content = item.get("content")
        url = item.get("url")
        access_verified = item.get("access_verified")

        has_content = _usable_text(content)
        has_url = _usable_text(url)

        if isinstance(content, str) and content.strip() and not has_content:
            return fail(f"input #{index} content is a placeholder")
        if not has_content and not has_url:
            return fail(f"input #{index} requires embedded content or a verified-access URL")
        if has_url and access_verified is not True:
            return fail(f"input #{index} URL is not usable until access_verified is true")

        if has_content:
            normalized = content.strip()
            if normalized in seen_contents:
                return fail(f"input #{index} duplicates content already supplied")
            seen_contents.add(normalized)

    serialized_size = len(json.dumps(packet, ensure_ascii=False, separators=(",", ":")))
    if serialized_size > budget:
        return fail(
            f"serialized review packet is {serialized_size} chars, above its declared budget of {budget}"
        )
    if serialized_size > MAX_REVIEW_PAYLOAD_CHARS:
        return fail(
            f"serialized review packet exceeds the gate ceiling of {MAX_REVIEW_PAYLOAD_CHARS}"
        )

    print(
        "PASS: review packet structure is usable and bounded "
        f"for {sha}; {serialized_size}/{budget} chars. "
        "Semantic sufficiency and minimality still require review."
    )
    return 0


def parse_project_state(path: Path) -> dict[str, str]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise ValueError(f"cannot read project state: {exc}") from exc

    section_indexes = [i for i, line in enumerate(lines) if line.strip() == STATE_SECTION]
    if len(section_indexes) != 1:
        raise ValueError(
            f"{STATE_SECTION!r} must appear exactly once (found {len(section_indexes)})"
        )

    start = section_indexes[0] + 1
    values: dict[str, str] = {}
    for line in lines[start:]:
        stripped = line.strip()
        if line.startswith("## "):
            break
        if not stripped:
            continue
        if stripped.startswith(("```", "~~~")):
            raise ValueError("structured resume section cannot contain a fenced code block")
        if stripped.startswith(">"):
            raise ValueError("structured resume section cannot contain quoted/example state")

        match = re.fullmatch(r"-\s+([a-z_]+):\s*(.+?)\s*", line)
        if not match:
            raise ValueError(
                "structured resume section must contain only the four direct key lines"
            )
        key, value = match.groups()
        if key not in STATE_KEYS:
            raise ValueError(f"unexpected structured state key: {key}")
        if key in values:
            raise ValueError(f"duplicate structured state key: {key}")
        if not value.strip():
            raise ValueError(f"structured state key {key} cannot be empty")
        values[key] = value.strip()

    missing = [key for key in STATE_KEYS if key not in values]
    if missing:
        raise ValueError("missing structured state key(s): " + ", ".join(missing))
    return values


def check_project_state(
    path: Path,
    expected_stage: str | None,
    expected_status: str | None,
    expected_git: str | None,
    expected_next: str | None,
) -> int:
    try:
        values = parse_project_state(path)
    except ValueError as exc:
        return fail(str(exc))

    expectations = {
        "stage": expected_stage,
        "status": expected_status,
        "git": expected_git,
        "next_action": expected_next,
    }
    for key, expected in expectations.items():
        if expected is None:
            continue
        if not expected.strip():
            return fail(f"expected {key} cannot be empty")
        if values[key] != expected.strip():
            return fail(
                f"PROJECT_STATE structured {key} is {values[key]!r}, expected {expected.strip()!r}"
            )

    print("PASS: PROJECT_STATE.md has one direct, unique structured resume state")
    return 0


def _latest_batch_file(root: Path) -> Path:
    candidates: list[tuple[int, Path]] = []
    for path in root.iterdir():
        if not path.is_file():
            continue
        match = BATCH_FILE_RE.fullmatch(path.name)
        if match:
            candidates.append((int(match.group(1)), path))
    if not candidates:
        raise ValueError("no BATCH<n>.md file found")
    return max(candidates, key=lambda item: item[0])[1]


def check_batch_human_validation(root: Path) -> int:
    try:
        batch_path = _latest_batch_file(root)
        text = batch_path.read_text(encoding="utf-8")
    except (OSError, ValueError) as exc:
        return fail(str(exc))

    statuses = BATCH_STATUS_RE.findall(text)
    if len(statuses) != 1:
        return fail(
            f"{batch_path.name} must contain exactly one '**Statut : ...**' line (found {len(statuses)})"
        )

    human_states = HUMAN_VALIDATION_RE.findall(text)
    if len(human_states) != 1:
        return fail(
            f"{batch_path.name} must contain exactly one human validation marker: "
            "'### Jalon humain requis — EN ATTENTE|VALIDÉ|NON REQUIS'"
        )

    batch_status = statuses[0].strip()
    human_state = human_states[0]
    is_closed = "clôtur" in batch_status.casefold()

    if is_closed and human_state == "EN ATTENTE":
        return fail(
            f"{batch_path.name} is declared closed while human app validation is still EN ATTENTE"
        )

    print(
        f"PASS: {batch_path.name} human app validation state is {human_state}; "
        f"batch status is {batch_status!r}"
    )
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Filora minimal operational guardrails")
    commands = root.add_subparsers(dest="command", required=True)

    canon = commands.add_parser(
        "canonical-presence", help="check that all canonical documents exist"
    )
    canon.add_argument("--root", type=Path, default=Path("."))

    review = commands.add_parser(
        "review-packet", help="lint a review packet before external delegation"
    )
    review.add_argument("packet", type=Path)
    review.add_argument(
        "--verify-git-sha",
        action="store_true",
        help="require state_sha to resolve to a local Git commit",
    )
    review.add_argument("--repo-root", type=Path, default=Path("."))

    state = commands.add_parser(
        "project-state", help="validate the structured resume section"
    )
    state.add_argument("--file", type=Path, default=Path("PROJECT_STATE.md"))
    state.add_argument("--expect-stage")
    state.add_argument("--expect-status")
    state.add_argument("--expect-git")
    state.add_argument("--expect-next")

    human = commands.add_parser(
        "batch-human-validation",
        help="validate the latest Batch human-app-validation closure state",
    )
    human.add_argument("--root", type=Path, default=Path("."))
    return root


def main() -> int:
    args = parser().parse_args()
    if args.command == "canonical-presence":
        return check_canonical_presence(args.root)
    if args.command == "review-packet":
        return check_review_packet(args.packet, args.verify_git_sha, args.repo_root)
    if args.command == "project-state":
        return check_project_state(
            args.file,
            args.expect_stage,
            args.expect_status,
            args.expect_git,
            args.expect_next,
        )
    if args.command == "batch-human-validation":
        return check_batch_human_validation(args.root)
    return fail("unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
