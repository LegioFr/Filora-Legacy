#!/usr/bin/env python3
"""Fail-closed entrypoint for Filora guard.

The historical implementation lives in filora_guard_impl.py. This wrapper
enforces transition/base-ref invariants that must hold before delegating.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import filora_guard_impl as impl

BATCH_STATUS_RE = re.compile(r"^\*\*Statut\s*:\s*(.+?)\*\*\s*$", re.MULTILINE)
HUMAN_VALIDATION_RE = re.compile(
    r"^###\s+Jalon humain requis\s+—\s+(EN ATTENTE|VALIDÉ|NON REQUIS)\s*$",
    re.MULTILINE,
)
OPEN_PREFIXES = (
    "ouvert", "open", "en cours", "en validation", "en attente",
    "validation humaine en attente",
    "intégré techniquement à main — clôture rouverte",
    "non clôturé", "pas encore",
)
CLOSED_PREFIXES = ("clôturé", "clôturée", "closed")


def _arg_value(name: str, default: str | None = None) -> str | None:
    try:
        index = sys.argv.index(name)
    except ValueError:
        return default
    if index + 1 >= len(sys.argv):
        return default
    return sys.argv[index + 1]


def _git_root(root: Path) -> bool:
    result = subprocess.run(
        ["git", "rev-parse", "--is-inside-work-tree"],
        cwd=root, text=True, capture_output=True, check=False,
    )
    return result.returncode == 0 and result.stdout.strip() == "true"


def _show(root: Path, ref: str, path: str) -> str | None:
    result = subprocess.run(
        ["git", "show", f"{ref}:{path}"],
        cwd=root, text=True, capture_output=True, check=False,
    )
    return result.stdout if result.returncode == 0 else None


def _load_json_text(text: str | None, label: str) -> dict | None:
    if text is None:
        return None
    try:
        value = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ValueError(f"{label} is invalid JSON: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be a JSON object")
    return value


def _status_kind(value: str) -> str:
    normalized = " ".join(value.strip().lower().split())
    if normalized.startswith(OPEN_PREFIXES):
        return "open"
    if normalized.startswith(CLOSED_PREFIXES):
        return "closed"
    raise ValueError(f"ambiguous lifecycle status: {value!r}")


def _batch_status_and_human_text(text: str, label: str) -> tuple[str, str]:
    statuses = BATCH_STATUS_RE.findall(text)
    markers = HUMAN_VALIDATION_RE.findall(text)
    if len(statuses) != 1 or len(markers) != 1:
        raise ValueError(f"{label} is not machine-readable")
    return statuses[0].strip(), markers[0]


def _candidate_batch(root: Path, number: int) -> tuple[str, str]:
    path = root / f"BATCH{number}.md"
    return _batch_status_and_human_text(path.read_text(encoding="utf-8"), path.name)


def _project_status(root: Path) -> str:
    values = impl.parse_project_state(root / "PROJECT_STATE.md")
    return values["status"]


def _precheck_workflow() -> int:
    root = Path(_arg_value("--root", ".") or ".").resolve()
    base_ref = _arg_value("--base-ref")

    # Real repository execution must never infer or omit the comparison base.
    # Non-git temp fixtures remain supported for legacy unit tests.
    if _git_root(root) and not base_ref:
        return impl.fail("STOP: workflow-state requires explicit --base-ref in a real Git repository")
    if not base_ref:
        return 0

    state_path = Path(_arg_value("--state", "workflow/state.json") or "workflow/state.json")
    if not state_path.is_absolute():
        state_path = root / state_path
    try:
        candidate = json.loads(state_path.read_text(encoding="utf-8"))
        if not isinstance(candidate, dict):
            raise ValueError("candidate workflow state must be an object")
        current_batch = candidate["current_batch"]
        candidate_kind, candidate_human = _candidate_batch(root, current_batch)
        if candidate.get("batch_status") != _status_kind(candidate_kind):
            raise ValueError("candidate workflow batch_status contradicts the anchored Batch status")
        if _status_kind(_project_status(root)) != _status_kind(candidate_kind):
            raise ValueError("PROJECT_STATE status contradicts the anchored Batch status")
        if _status_kind(candidate_kind) == "closed" and candidate_human == "EN ATTENTE":
            raise ValueError("closed candidate Batch still has pending human validation")

        if current_batch > 0:
            predecessor_status, _ = _candidate_batch(root, current_batch - 1)
            if _status_kind(predecessor_status) != "closed":
                raise ValueError(f"candidate predecessor BATCH{current_batch - 1}.md is not closed")

        base = _load_json_text(_show(root, base_ref, "workflow/state.json"), "base workflow/state.json")
        if base is not None:
            base_batch = base.get("current_batch")
            if not isinstance(base_batch, int):
                raise ValueError("base current_batch is invalid")
            if current_batch < base_batch:
                raise ValueError("current_batch cannot decrease relative to base")
            if current_batch > base_batch + 1:
                raise ValueError("current_batch can advance by only one Batch")
            if current_batch == base_batch + 1:
                if base.get("batch_status") != "closed":
                    raise ValueError("atomic Batch transition rejected: base Batch is not closed")
                if base.get("next_batch_allowed") is not True:
                    raise ValueError("atomic Batch transition rejected: base next_batch_allowed is not true")
                risk = base.get("risk")
                if risk in {"sensitive", "critical"} and base.get("independent_review") != "passed":
                    raise ValueError("atomic Batch transition rejected: base independent review is not passed")
                if risk == "critical" and base.get("owner_approval") != "obtained":
                    raise ValueError("atomic Batch transition rejected: base owner approval is not obtained")
                base_batch_text = _show(root, base_ref, f"BATCH{base_batch}.md")
                if base_batch_text is None:
                    raise ValueError("atomic Batch transition rejected: base Batch document is missing")
                base_status, base_human = _batch_status_and_human_text(
                    base_batch_text, f"base BATCH{base_batch}.md"
                )
                if _status_kind(base_status) != "closed":
                    raise ValueError("atomic Batch transition rejected: base Batch document is not closed")
                if base_human == "EN ATTENTE":
                    raise ValueError("atomic Batch transition rejected: base human validation is pending")
    except (OSError, KeyError, ValueError, json.JSONDecodeError) as exc:
        return impl.fail(str(exc))
    return 0


def main() -> int:
    if len(sys.argv) > 1 and sys.argv[1] == "workflow-state":
        precheck = _precheck_workflow()
        if precheck:
            return precheck
    return impl.main()


if __name__ == "__main__":
    raise SystemExit(main())
