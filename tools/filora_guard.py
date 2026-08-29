#!/usr/bin/env python3
"""Operational guardrails for Filora.

Objective repository properties are enforced mechanically where possible.
Conversation-time tool failures cannot be intercepted by GitHub; the routing
commands below therefore expose fail-closed decisions without claiming to be a
platform-level wrapper.
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
CLOSED_STATUS_RE = re.compile(r"\bclôturé(?:e|s|es)?\b", re.IGNORECASE)
HUMAN_VALIDATION_RE = re.compile(
    r"^###\s+Jalon humain requis\s+—\s+(EN ATTENTE|VALIDÉ|NON REQUIS)\s*$",
    re.MULTILINE,
)
PLACEHOLDER_RE = re.compile(
    r"^\s*(?:placeholder(?:\b.*)?|todo(?:\b.*)?|tbd(?:\b.*)?|à compléter(?:\b.*)?|a completer(?:\b.*)?|<[^>]+>|\.\.\.)\s*$",
    re.IGNORECASE,
)

WORKFLOW_STATE_KEYS = {
    "schema_version",
    "current_batch",
    "batch_status",
    "risk",
    "mechanical_validation",
    "independent_review",
    "owner_approval",
    "human_validation",
    "next_batch_allowed",
}
VALIDATION_STATES = {"pending", "passed", "failed", "not_required"}
OWNER_APPROVAL_STATES = {"pending", "obtained", "not_required"}
RISK_LEVELS = {"ordinary", "sensitive", "critical"}
HUMAN_MARKER_TO_STATE = {
    "EN ATTENTE": "pending",
    "VALIDÉ": "passed",
    "NON REQUIS": "not_required",
}
MINIMUM_PROTECTED_PATHS = {
    "DEVELOPMENT.md",
    "workflow/state.json",
    "workflow/contract.json",
    "tools/filora_guard.py",
    ".github/workflows/filora-guard.yml",
    "tests/test_workflow_guard.py",
}


def fail(message: str) -> int:
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def _usable_text(value: object) -> bool:
    return (
        isinstance(value, str)
        and bool(value.strip())
        and PLACEHOLDER_RE.fullmatch(value) is None
    )


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


def check_review_packet(path: Path, verify_git_sha: bool, repo_root: Path) -> int:
    try:
        packet = json.loads(path.read_text(encoding="utf-8"))
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
        return fail("state_verified must be true: the coordinator must attest that the target state was checked")
    if verify_git_sha and not _git_sha_exists(sha, repo_root):
        return fail(f"state_sha does not resolve to a commit in {repo_root}")
    if not isinstance(budget, int) or isinstance(budget, bool) or budget <= 0:
        return fail("context_budget_chars must be a positive integer")
    if budget > MAX_REVIEW_PAYLOAD_CHARS:
        return fail(f"context_budget_chars exceeds the gate ceiling of {MAX_REVIEW_PAYLOAD_CHARS}")
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
        return fail(f"serialized review packet is {serialized_size} chars, above its declared budget of {budget}")
    if serialized_size > MAX_REVIEW_PAYLOAD_CHARS:
        return fail(f"serialized review packet exceeds the gate ceiling of {MAX_REVIEW_PAYLOAD_CHARS}")
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
    indexes = [i for i, line in enumerate(lines) if line.strip() == STATE_SECTION]
    if len(indexes) != 1:
        raise ValueError(f"{STATE_SECTION!r} must appear exactly once (found {len(indexes)})")

    values: dict[str, str] = {}
    for line in lines[indexes[0] + 1 :]:
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
            raise ValueError("structured resume section must contain only the four direct key lines")
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


def check_project_state(path: Path, expected_stage: str | None, expected_status: str | None, expected_git: str | None, expected_next: str | None) -> int:
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
            return fail(f"PROJECT_STATE structured {key} is {values[key]!r}, expected {expected.strip()!r}")
    print("PASS: PROJECT_STATE.md has one direct, unique structured resume state")
    return 0


def _batch_files(root: Path) -> list[tuple[int, Path]]:
    values: list[tuple[int, Path]] = []
    for path in root.iterdir():
        if path.is_file() and (match := BATCH_FILE_RE.fullmatch(path.name)):
            values.append((int(match.group(1)), path))
    return sorted(values, key=lambda item: item[0])


def _latest_batch_file(root: Path) -> Path:
    batches = _batch_files(root)
    if not batches:
        raise ValueError("no BATCH<n>.md file found")
    return batches[-1][1]


def _batch_status_and_human(path: Path) -> tuple[str, str]:
    text = path.read_text(encoding="utf-8")
    statuses = BATCH_STATUS_RE.findall(text)
    if len(statuses) != 1:
        raise ValueError(f"{path.name} must contain exactly one '**Statut : ...**' line (found {len(statuses)})")
    human = HUMAN_VALIDATION_RE.findall(text)
    if len(human) != 1:
        raise ValueError(
            f"{path.name} must contain exactly one human validation marker: "
            "'### Jalon humain requis — EN ATTENTE|VALIDÉ|NON REQUIS'"
        )
    return statuses[0].strip(), human[0]


def check_batch_human_validation(root: Path) -> int:
    try:
        path = _latest_batch_file(root)
        status, human = _batch_status_and_human(path)
    except (OSError, ValueError) as exc:
        return fail(str(exc))
    if CLOSED_STATUS_RE.search(status) and human == "EN ATTENTE":
        return fail(f"{path.name} is declared closed while human app validation is still EN ATTENTE")
    print(f"PASS: {path.name} human app validation state is {human}; batch status is {status!r}")
    return 0


def _read_json_object(path: Path, label: str) -> dict:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read {label}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be a JSON object")
    return value


def _validate_contract(contract: dict) -> None:
    if contract.get("schema_version") != 1:
        raise ValueError("workflow contract schema_version must be 1")
    if set(contract.get("validation_states", [])) != VALIDATION_STATES:
        raise ValueError("workflow contract validation_states do not match the supported states")
    if set(contract.get("risk_levels", [])) != RISK_LEVELS:
        raise ValueError("workflow contract risk_levels do not match the supported levels")

    closure = contract.get("closure")
    if not isinstance(closure, dict):
        raise ValueError("workflow contract closure must be an object")
    expected_closure = {
        "mechanical_validation_required": True,
        "human_validation_must_not_be_pending": True,
    }
    for key, expected in expected_closure.items():
        if closure.get(key) != expected:
            raise ValueError(f"workflow contract closure.{key} must be {expected!r}")
    if set(closure.get("independent_review_required_for", [])) != {"sensitive", "critical"}:
        raise ValueError("workflow contract must require independent review for sensitive and critical work")
    if set(closure.get("owner_approval_required_for", [])) != {"critical"}:
        raise ValueError("workflow contract must require owner approval for critical work")

    next_batch = contract.get("next_batch")
    if not isinstance(next_batch, dict) or next_batch.get("requires_current_batch_closed") is not True or next_batch.get("requires_next_batch_allowed") is not True:
        raise ValueError("workflow contract must require closed Batch and positive next-batch authorization")

    routing = contract.get("review_routing")
    required_routing = {
        "default": "codex_normal",
        "codex_security_requires_security_property": True,
        "codex_security_requires_normal_insufficient": True,
        "unknown_means_stop": True,
    }
    if not isinstance(routing, dict):
        raise ValueError("workflow contract review_routing must be an object")
    for key, expected in required_routing.items():
        if routing.get(key) != expected:
            raise ValueError(f"workflow contract review_routing.{key} must be {expected!r}")

    transfer = contract.get("human_transfer")
    required_transfer = {
        "first_tool_failure_allows_transfer": False,
        "unknown_equals_impossible": False,
        "requires_reasonable_means_exhausted": True,
        "failure_prefix": "BLOQUÉ:",
    }
    if not isinstance(transfer, dict):
        raise ValueError("workflow contract human_transfer must be an object")
    for key, expected in required_transfer.items():
        if transfer.get(key) != expected:
            raise ValueError(f"workflow contract human_transfer.{key} must be {expected!r}")

    protected = contract.get("protected_paths")
    if not isinstance(protected, list) or not all(isinstance(item, str) for item in protected):
        raise ValueError("workflow contract protected_paths must be a list of paths")
    missing = sorted(MINIMUM_PROTECTED_PATHS - set(protected))
    if missing:
        raise ValueError("workflow contract is missing protected path(s): " + ", ".join(missing))


def check_workflow_state(root: Path, state_path: Path, contract_path: Path, project_state_path: Path) -> int:
    try:
        state = _read_json_object(state_path, "workflow state")
        contract = _read_json_object(contract_path, "workflow contract")
        _validate_contract(contract)
    except ValueError as exc:
        return fail(str(exc))

    if set(state) != WORKFLOW_STATE_KEYS:
        missing = sorted(WORKFLOW_STATE_KEYS - set(state))
        extra = sorted(set(state) - WORKFLOW_STATE_KEYS)
        details = []
        if missing:
            details.append("missing=" + ",".join(missing))
        if extra:
            details.append("extra=" + ",".join(extra))
        return fail("workflow state keys are not exact: " + " ".join(details))
    if state.get("schema_version") != 1:
        return fail("workflow state schema_version must be 1")
    current_batch = state.get("current_batch")
    if not isinstance(current_batch, int) or isinstance(current_batch, bool) or current_batch < 0:
        return fail("workflow state current_batch must be a non-negative integer")
    if state.get("batch_status") not in {"open", "closed"}:
        return fail("workflow state batch_status must be open or closed")
    if state.get("risk") not in RISK_LEVELS:
        return fail("workflow state risk is invalid")
    for key in ("mechanical_validation", "independent_review", "human_validation"):
        if state.get(key) not in VALIDATION_STATES:
            return fail(f"workflow state {key} is invalid")
    if state.get("owner_approval") not in OWNER_APPROVAL_STATES:
        return fail("workflow state owner_approval is invalid")
    if not isinstance(state.get("next_batch_allowed"), bool):
        return fail("workflow state next_batch_allowed must be boolean")

    try:
        batches = _batch_files(root)
        if not batches:
            raise ValueError("no BATCH<n>.md file found")
        latest_number, latest_path = batches[-1]
        latest_status, latest_marker = _batch_status_and_human(latest_path)
        project_state = parse_project_state(project_state_path)
    except (OSError, ValueError) as exc:
        return fail(str(exc))

    if latest_number != current_batch:
        return fail(f"workflow current_batch is {current_batch}, but latest batch file is BATCH{latest_number}.md")

    latest_closed = CLOSED_STATUS_RE.search(latest_status) is not None
    expected_status = "closed" if latest_closed else "open"
    if state["batch_status"] != expected_status:
        return fail(f"workflow batch_status is {state['batch_status']}, but {latest_path.name} is {expected_status}")

    marker_state = HUMAN_MARKER_TO_STATE[latest_marker]
    if state["human_validation"] != marker_state:
        return fail(f"workflow human_validation is {state['human_validation']}, but {latest_path.name} declares {latest_marker}")

    predecessor = next((path for number, path in batches if number == current_batch - 1), None)
    if current_batch > 0 and predecessor is not None:
        try:
            predecessor_status, _ = _batch_status_and_human(predecessor)
        except ValueError:
            # Legacy Batches created before the machine-readable marker existed
            # are not rewritten retroactively. Only the immediate predecessor
            # is enforced once it follows the current Batch format.
            predecessor_status = predecessor.read_text(encoding="utf-8")
        if CLOSED_STATUS_RE.search(predecessor_status) is None:
            return fail(f"BATCH{current_batch}.md exists while earlier {predecessor.name} is not declared closed")

    if f"Batch {current_batch}" not in project_state["stage"]:
        return fail(f"PROJECT_STATE stage does not identify current Batch {current_batch}: {project_state['stage']!r}")
    if (CLOSED_STATUS_RE.search(project_state["status"]) is not None) != latest_closed:
        return fail("PROJECT_STATE structured status contradicts the latest Batch closure state")

    if state["batch_status"] == "open" and state["next_batch_allowed"]:
        return fail("next_batch_allowed cannot be true while the current Batch is open")
    if state["batch_status"] == "closed":
        if state["mechanical_validation"] != "passed":
            return fail("closed Batch requires mechanical_validation=passed")
        if state["risk"] in {"sensitive", "critical"} and state["independent_review"] != "passed":
            return fail("sensitive/critical closed Batch requires independent_review=passed")
        if state["risk"] == "critical" and state["owner_approval"] != "obtained":
            return fail("critical closed Batch requires owner_approval=obtained")
        if state["human_validation"] == "pending":
            return fail("closed Batch cannot have pending human validation")
        if state["next_batch_allowed"] is not True:
            return fail("closed Batch requires positive next_batch_allowed=true")

    print(
        "PASS: workflow state, contract, latest Batch and PROJECT_STATE are coherent; "
        f"Batch {current_batch} is {state['batch_status']}, next_batch_allowed={state['next_batch_allowed']}"
    )
    return 0


def decide_review_route(security_property: str, normal_sufficient: str) -> int:
    if security_property == "unknown" or normal_sufficient == "unknown":
        return fail("STOP: review routing is uncertain; classify the property before choosing a reviewer")
    if security_property == "yes" and normal_sufficient == "no":
        print("CODEX_SECURITY")
    else:
        print("CODEX_NORMAL")
    return 0


def decide_human_transfer(operation_authorized: str, reasonable_means_exhausted: str) -> int:
    if operation_authorized != "yes":
        return fail("BLOQUÉ: the operation is not established as authorized")
    if reasonable_means_exhausted != "yes":
        return fail("BLOQUÉ: reasonable available means are not proven exhausted; do not transfer the action to Mickaël")
    print("HUMAN_TRANSFER_ALLOWED")
    return 0


def parser() -> argparse.ArgumentParser:
    root = argparse.ArgumentParser(description="Filora operational guardrails")
    commands = root.add_subparsers(dest="command", required=True)

    canon = commands.add_parser("canonical-presence")
    canon.add_argument("--root", type=Path, default=Path("."))

    review = commands.add_parser("review-packet")
    review.add_argument("packet", type=Path)
    review.add_argument("--verify-git-sha", action="store_true")
    review.add_argument("--repo-root", type=Path, default=Path("."))

    state = commands.add_parser("project-state")
    state.add_argument("--file", type=Path, default=Path("PROJECT_STATE.md"))
    state.add_argument("--expect-stage")
    state.add_argument("--expect-status")
    state.add_argument("--expect-git")
    state.add_argument("--expect-next")

    human = commands.add_parser("batch-human-validation")
    human.add_argument("--root", type=Path, default=Path("."))

    workflow = commands.add_parser("workflow-state")
    workflow.add_argument("--root", type=Path, default=Path("."))
    workflow.add_argument("--state", type=Path, default=Path("workflow/state.json"))
    workflow.add_argument("--contract", type=Path, default=Path("workflow/contract.json"))
    workflow.add_argument("--project-state", type=Path, default=Path("PROJECT_STATE.md"))

    route = commands.add_parser("review-route")
    route.add_argument("--security-property", choices=("yes", "no", "unknown"), required=True)
    route.add_argument("--normal-sufficient", choices=("yes", "no", "unknown"), required=True)

    transfer = commands.add_parser("human-transfer")
    transfer.add_argument("--operation-authorized", choices=("yes", "no", "unknown"), required=True)
    transfer.add_argument("--reasonable-means-exhausted", choices=("yes", "no", "unknown"), required=True)
    return root


def main() -> int:
    args = parser().parse_args()
    if args.command == "canonical-presence":
        return check_canonical_presence(args.root)
    if args.command == "review-packet":
        return check_review_packet(args.packet, args.verify_git_sha, args.repo_root)
    if args.command == "project-state":
        return check_project_state(args.file, args.expect_stage, args.expect_status, args.expect_git, args.expect_next)
    if args.command == "batch-human-validation":
        return check_batch_human_validation(args.root)
    if args.command == "workflow-state":
        return check_workflow_state(args.root, args.state, args.contract, args.project_state)
    if args.command == "review-route":
        return decide_review_route(args.security_property, args.normal_sufficient)
    if args.command == "human-transfer":
        return decide_human_transfer(args.operation_authorized, args.reasonable_means_exhausted)
    return fail("unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
