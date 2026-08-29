#!/usr/bin/env python3
"""Operational guardrails for Filora.

This guard blocks objective repository inconsistencies and exposes deterministic
routing decisions when their inputs are objective enough to automate.

It does not claim to intercept ChatGPT reasoning or tool calls in real time.
External review provenance remains an external proof responsibility.
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
NEGATED_CLOSED_RE = re.compile(r"\b(?:non|pas(?:\s+encore)?)\s*[- ]?\s*clôturé(?:e|s|es)?\b", re.IGNORECASE)
HUMAN_VALIDATION_RE = re.compile(
    r"^###\s+Jalon humain requis\s+—\s+(EN ATTENTE|VALIDÉ|NON REQUIS)\s*$",
    re.MULTILINE,
)
PLACEHOLDER_RE = re.compile(
    r"^\s*(?:placeholder(?:\b.*)?|todo(?:\b.*)?|tbd(?:\b.*)?|à compléter(?:\b.*)?|a completer(?:\b.*)?|<[^>]+>|\.\.\.)\s*$",
    re.IGNORECASE,
)
STAGE_BATCH_RE = re.compile(r"^Batch\s+(\d+)(?:\b|\s|—|-)", re.IGNORECASE)

WORKFLOW_STATE_KEYS = {
    "schema_version",
    "current_batch",
    "batch_status",
    "risk",
    "independent_review",
    "owner_approval",
    "next_batch_allowed",
}
VALIDATION_STATES = {"pending", "passed", "failed", "not_required"}
OWNER_APPROVAL_STATES = {"pending", "obtained", "not_required"}
RISK_LEVELS = {"ordinary", "sensitive", "critical"}
RISK_RANK = {"ordinary": 0, "sensitive": 1, "critical": 2}
REQUIRED_CRITICAL_PATHS = {
    "DEVELOPMENT.md",
    "workflow/contract.json",
    "tools/filora_guard.py",
    "tools/check_architecture.py",
    ".github/workflows/filora-guard.yml",
    "tests/test_filora_guard.py",
    "tests/test_human_validation_guard.py",
    "tests/test_workflow_guard.py",
}


def fail(message: str) -> int:
    print(f"FAIL: {message}", file=sys.stderr)
    return 1


def _usable_text(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip()) and PLACEHOLDER_RE.fullmatch(value) is None


def _declares_closed(value: str) -> bool:
    return NEGATED_CLOSED_RE.search(value) is None and CLOSED_STATUS_RE.search(value) is not None


def check_canonical_presence(root: Path) -> int:
    missing = [name for name in CANONICAL_FILES if not (root / name).is_file()]
    if missing:
        return fail("missing canonical file(s): " + ", ".join(missing))
    print("PASS: all four canonical files are present")
    return 0


def _git_sha_exists(sha: str, repo_root: Path) -> bool:
    try:
        result = subprocess.run(
            ["git", "cat-file", "-e", f"{sha}^{{commit}}"], cwd=repo_root,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False,
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
        content, url = item.get("content"), item.get("url")
        has_content, has_url = _usable_text(content), _usable_text(url)
        if isinstance(content, str) and content.strip() and not has_content:
            return fail(f"input #{index} content is a placeholder")
        if not has_content and not has_url:
            return fail(f"input #{index} requires embedded content or a verified-access URL")
        if has_url and item.get("access_verified") is not True:
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
        f"for {sha}; {serialized_size}/{budget} chars. Semantic sufficiency and minimality still require review."
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
    expectations = {"stage": expected_stage, "status": expected_status, "git": expected_git, "next_action": expected_next}
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


def _legacy_batch0_is_closed(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    return (
        "## Statut" in text
        and re.search(r"^Batch 0 est \*\*clôturé et intégré à `main`\*\*\.$", text, re.MULTILINE) is not None
    )


def check_batch_human_validation(root: Path) -> int:
    try:
        path = _latest_batch_file(root)
        status, human = _batch_status_and_human(path)
    except (OSError, ValueError) as exc:
        return fail(str(exc))
    if _declares_closed(status) and human == "EN ATTENTE":
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
    if contract.get("schema_version") != 2:
        raise ValueError("workflow contract schema_version must be 2")
    if set(contract.get("validation_states", [])) != VALIDATION_STATES:
        raise ValueError("workflow contract validation_states do not match the supported states")
    if set(contract.get("risk_levels", [])) != RISK_LEVELS:
        raise ValueError("workflow contract risk_levels do not match the supported levels")
    closure = contract.get("closure")
    if not isinstance(closure, dict):
        raise ValueError("workflow contract closure must be an object")
    if set(closure.get("independent_review_required_for", [])) != {"sensitive", "critical"}:
        raise ValueError("sensitive and critical work must require independent review")
    if set(closure.get("owner_approval_required_for", [])) != {"critical"}:
        raise ValueError("critical work must require owner approval")
    if closure.get("human_validation_must_not_be_pending") is not True:
        raise ValueError("workflow contract must forbid closure with pending human validation")
    next_batch = contract.get("next_batch")
    if not isinstance(next_batch, dict):
        raise ValueError("workflow contract next_batch must be an object")
    if next_batch.get("requires_current_batch_closed") is not True or next_batch.get("requires_next_batch_allowed") is not True:
        raise ValueError("workflow contract must require closed Batch and positive next-batch authorization")
    if next_batch.get("requires_contiguous_batch_numbers") is not True:
        raise ValueError("workflow contract must require contiguous Batch numbers")
    routing = contract.get("review_routing")
    if not isinstance(routing, dict):
        raise ValueError("workflow contract review_routing must be an object")
    if routing.get("default") != "codex_normal" or routing.get("unknown_means_stop") is not True:
        raise ValueError("workflow contract must default to Codex normal and fail closed on unknown")
    if routing.get("normal_insufficient_without_security_means_stop") is not True:
        raise ValueError("workflow contract must stop when Codex normal is insufficient without a security property")
    transfer = contract.get("human_transfer")
    if not isinstance(transfer, dict):
        raise ValueError("workflow contract human_transfer must be an object")
    required_transfer = {
        "first_tool_failure_allows_transfer": False,
        "unknown_equals_impossible": False,
        "requires_reasonable_means_exhausted": True,
        "failure_prefix": "BLOQUÉ:",
    }
    for key, expected in required_transfer.items():
        if transfer.get(key) != expected:
            raise ValueError(f"workflow contract human_transfer.{key} must be {expected!r}")
    critical = contract.get("critical_control_paths")
    sensitive = contract.get("sensitive_paths")
    if not isinstance(critical, list) or not all(isinstance(item, str) and item for item in critical):
        raise ValueError("workflow contract critical_control_paths must be a path list")
    if not isinstance(sensitive, list) or not all(isinstance(item, str) and item for item in sensitive):
        raise ValueError("workflow contract sensitive_paths must be a path list")
    missing = sorted(REQUIRED_CRITICAL_PATHS - set(critical))
    if missing:
        raise ValueError("workflow contract is missing critical control path(s): " + ", ".join(missing))


def _changed_paths(root: Path, base_ref: str) -> list[str]:
    result = subprocess.run(
        ["git", "diff", "--name-only", f"{base_ref}...HEAD"], cwd=root,
        text=True, capture_output=True, check=False,
    )
    if result.returncode != 0:
        raise ValueError(f"cannot compute changed paths against {base_ref}: {result.stderr.strip()}")
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def _is_structural_control_path(path: str) -> bool:
    name = Path(path).name
    return (
        path in REQUIRED_CRITICAL_PATHS
        or path.startswith(".github/workflows/")
        or path.startswith("tools/check_") and path.endswith(".py")
        or path.startswith("tests/") and "guard" in name.lower() and name.endswith(".py")
    )


def _path_matches(path: str, rule: str) -> bool:
    return path == rule or (rule.endswith("/") and path.startswith(rule))


def required_risk_for_paths(paths: list[str], contract: dict) -> str:
    if any(_is_structural_control_path(path) for path in paths):
        return "critical"
    critical = contract["critical_control_paths"]
    sensitive = contract["sensitive_paths"]
    if any(any(_path_matches(path, rule) for rule in critical) for path in paths):
        return "critical"
    if any(any(_path_matches(path, rule) for rule in sensitive) for path in paths):
        return "sensitive"
    return "ordinary"


def _validate_state_shape(state: dict) -> str | None:
    if set(state) != WORKFLOW_STATE_KEYS:
        missing = sorted(WORKFLOW_STATE_KEYS - set(state))
        extra = sorted(set(state) - WORKFLOW_STATE_KEYS)
        details = []
        if missing:
            details.append("missing=" + ",".join(missing))
        if extra:
            details.append("extra=" + ",".join(extra))
        return "workflow state keys are not exact: " + " ".join(details)
    if state.get("schema_version") != 2:
        return "workflow state schema_version must be 2"
    current_batch = state.get("current_batch")
    if not isinstance(current_batch, int) or isinstance(current_batch, bool) or current_batch < 0:
        return "workflow state current_batch must be a non-negative integer"
    if state.get("batch_status") not in {"open", "closed"}:
        return "workflow state batch_status must be open or closed"
    if state.get("risk") not in RISK_LEVELS:
        return "workflow state risk is invalid"
    if state.get("independent_review") not in VALIDATION_STATES:
        return "workflow state independent_review is invalid"
    if state.get("owner_approval") not in OWNER_APPROVAL_STATES:
        return "workflow state owner_approval is invalid"
    if not isinstance(state.get("next_batch_allowed"), bool):
        return "workflow state next_batch_allowed must be boolean"
    return None


def _base_state(root: Path, base_ref: str) -> dict | None:
    result = subprocess.run(
        ["git", "show", f"{base_ref}:workflow/state.json"], cwd=root,
        text=True, capture_output=True, check=False,
    )
    if result.returncode != 0:
        return None
    try:
        value = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        raise ValueError(f"base workflow/state.json is invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError("base workflow/state.json must be an object")
    error = _validate_state_shape(value)
    if error:
        raise ValueError("base workflow/state.json invalid: " + error)
    return value


def _project_stage_batch(stage: str) -> int:
    match = STAGE_BATCH_RE.match(stage.strip())
    if not match:
        raise ValueError(f"PROJECT_STATE stage must start with an exact 'Batch <n>' identifier: {stage!r}")
    return int(match.group(1))


def check_workflow_state(root: Path, state_path: Path, contract_path: Path, project_state_path: Path, base_ref: str | None) -> int:
    try:
        state = _read_json_object(state_path, "workflow state")
        contract = _read_json_object(contract_path, "workflow contract")
        _validate_contract(contract)
    except ValueError as exc:
        return fail(str(exc))
    state_error = _validate_state_shape(state)
    if state_error:
        return fail(state_error)
    current_batch = state["current_batch"]
    try:
        batches = _batch_files(root)
        if not batches:
            raise ValueError("no BATCH<n>.md file found")
        numbers = [number for number, _ in batches]
        expected_numbers = list(range(0, current_batch + 1))
        if numbers != expected_numbers:
            raise ValueError(
                f"Batch files must be contiguous from BATCH0.md through BATCH{current_batch}.md; found {numbers}"
            )
        latest_number, latest_path = batches[-1]
        latest_status, latest_marker = _batch_status_and_human(latest_path)
        project_state = parse_project_state(project_state_path)
        project_batch = _project_stage_batch(project_state["stage"])
    except (OSError, ValueError) as exc:
        return fail(str(exc))
    if latest_number != current_batch:
        return fail(f"workflow current_batch is {current_batch}, but latest batch file is BATCH{latest_number}.md")
    if project_batch != current_batch:
        return fail(f"PROJECT_STATE stage identifies Batch {project_batch}, expected Batch {current_batch}")
    latest_closed = _declares_closed(latest_status)
    expected_status = "closed" if latest_closed else "open"
    if state["batch_status"] != expected_status:
        return fail(f"workflow batch_status is {state['batch_status']}, but {latest_path.name} is {expected_status}")
    if latest_closed and latest_marker == "EN ATTENTE":
        return fail(f"{latest_path.name} is declared closed while human app validation is still EN ATTENTE")
    if current_batch > 0:
        predecessor = root / f"BATCH{current_batch - 1}.md"
        if current_batch - 1 == 0:
            predecessor_closed = _legacy_batch0_is_closed(predecessor)
        else:
            try:
                predecessor_status, _ = _batch_status_and_human(predecessor)
            except (OSError, ValueError) as exc:
                return fail(f"invalid predecessor {predecessor.name}: {exc}")
            predecessor_closed = _declares_closed(predecessor_status)
        if not predecessor_closed:
            return fail(f"BATCH{current_batch}.md exists while predecessor {predecessor.name} is not declared closed")
    if _declares_closed(project_state["status"]) != latest_closed:
        return fail("PROJECT_STATE structured status contradicts the latest Batch closure state")
    if base_ref:
        try:
            paths = _changed_paths(root, base_ref)
            required_risk = required_risk_for_paths(paths, contract)
            base_state = _base_state(root, base_ref)
        except ValueError as exc:
            return fail(str(exc))
        if RISK_RANK[state["risk"]] < RISK_RANK[required_risk]:
            return fail(
                f"workflow risk={state['risk']} under-classifies objective diff; changed paths require at least {required_risk}"
            )
        if base_state and base_state["current_batch"] == current_batch:
            if RISK_RANK[state["risk"]] < RISK_RANK[base_state["risk"]]:
                return fail(
                    f"workflow risk cannot decrease within Batch {current_batch}: "
                    f"base={base_state['risk']} candidate={state['risk']}"
                )
    if state["batch_status"] == "open" and state["next_batch_allowed"]:
        return fail("next_batch_allowed cannot be true while the current Batch is open")
    if state["batch_status"] == "closed":
        if state["risk"] in set(contract["closure"]["independent_review_required_for"]) and state["independent_review"] != "passed":
            return fail(f"{state['risk']} closed Batch requires independent_review=passed")
        if state["risk"] in set(contract["closure"]["owner_approval_required_for"]) and state["owner_approval"] != "obtained":
            return fail(f"{state['risk']} closed Batch requires owner_approval=obtained")
        if latest_marker == "EN ATTENTE":
            return fail("closed Batch cannot have pending human validation")
        if state["next_batch_allowed"] is not True:
            return fail("closed Batch requires positive next_batch_allowed=true")
    print(
        "PASS: workflow state, contract, Batch chain and PROJECT_STATE are coherent; "
        f"Batch {current_batch} is {state['batch_status']}, risk={state['risk']}, next_batch_allowed={state['next_batch_allowed']}"
    )
    return 0


def decide_review_route(security_property: str, normal_sufficient: str) -> int:
    if security_property == "unknown" or normal_sufficient == "unknown":
        return fail("STOP: review routing is uncertain; classify the property before choosing a reviewer")
    if security_property == "yes" and normal_sufficient == "no":
        print("CODEX_SECURITY")
        return 0
    if normal_sufficient == "yes":
        print("CODEX_NORMAL")
        return 0
    return fail(
        "STOP: Codex normal is insufficient but no security property justifies Codex Security; select another proof mechanism"
    )


def decide_human_transfer(operation_authorized: str, reasonable_means_exhausted: str, hard_limit: str, attempt_count: int, alternative_count: int) -> int:
    if operation_authorized != "yes":
        return fail("BLOQUÉ: the operation is not established as authorized")
    if hard_limit == "unknown" or reasonable_means_exhausted == "unknown":
        return fail("BLOQUÉ: technical impossibility is uncertain; do not transfer the action")
    if hard_limit == "yes":
        print("HUMAN_TRANSFER_ALLOWED")
        return 0
    if attempt_count < 1:
        return fail("BLOQUÉ: no failed execution attempt is recorded")
    if alternative_count < 1:
        return fail("BLOQUÉ: first tool/method failure is insufficient; no reasonable alternative was checked")
    if reasonable_means_exhausted != "yes":
        return fail("BLOQUÉ: reasonable available means are not proven exhausted; do not transfer the action to Mickaël")
    print("HUMAN_TRANSFER_ALLOWED")
    return 0


def check_change_risk(paths: list[str], contract_path: Path) -> int:
    try:
        contract = _read_json_object(contract_path, "workflow contract")
        _validate_contract(contract)
    except ValueError as exc:
        return fail(str(exc))
    print(required_risk_for_paths(paths, contract).upper())
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
    workflow.add_argument("--base-ref")
    route = commands.add_parser("review-route")
    route.add_argument("--security-property", choices=("yes", "no", "unknown"), required=True)
    route.add_argument("--normal-sufficient", choices=("yes", "no", "unknown"), required=True)
    transfer = commands.add_parser("human-transfer")
    transfer.add_argument("--operation-authorized", choices=("yes", "no", "unknown"), required=True)
    transfer.add_argument("--reasonable-means-exhausted", choices=("yes", "no", "unknown"), required=True)
    transfer.add_argument("--hard-limit", choices=("yes", "no", "unknown"), required=True)
    transfer.add_argument("--attempt-count", type=int, required=True)
    transfer.add_argument("--alternative-count", type=int, required=True)
    change = commands.add_parser("change-risk")
    change.add_argument("--path", action="append", default=[])
    change.add_argument("--contract", type=Path, default=Path("workflow/contract.json"))
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
        return check_workflow_state(args.root, args.state, args.contract, args.project_state, args.base_ref)
    if args.command == "review-route":
        return decide_review_route(args.security_property, args.normal_sufficient)
    if args.command == "human-transfer":
        return decide_human_transfer(
            args.operation_authorized, args.reasonable_means_exhausted, args.hard_limit,
            args.attempt_count, args.alternative_count,
        )
    if args.command == "change-risk":
        return check_change_risk(args.path, args.contract)
    return fail("unknown command")


if __name__ == "__main__":
    raise SystemExit(main())
