import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "tools" / "filora_guard.py"


class WorkflowTransitionWrapperTests(unittest.TestCase):
    def run_guard(self, *args):
        env = os.environ.copy()
        env.pop("GITHUB_EVENT_PATH", None)
        env.pop("GITHUB_ACTIONS", None)
        return subprocess.run(
            [sys.executable, str(GUARD), *args],
            cwd=ROOT, text=True, capture_output=True, check=False, env=env,
        )

    def init_repo(self, root: Path, state: dict, batch2_status="en validation", human="NON REQUIS"):
        (root / "workflow").mkdir()
        (root / "workflow" / "state.json").write_text(json.dumps(state), encoding="utf-8")
        contract = json.loads((ROOT / "workflow" / "contract.json").read_text(encoding="utf-8"))
        (root / "workflow" / "contract.json").write_text(json.dumps(contract), encoding="utf-8")
        for rule in contract["critical_control_paths"]:
            target = root / rule.rstrip("/")
            if rule.endswith("/"):
                target.mkdir(parents=True, exist_ok=True)
            elif not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("fixture\n", encoding="utf-8")
        (root / "BATCH0.md").write_text(
            "# Batch 0\n\n## Statut\n\nBatch 0 est **clôturé et intégré à `main`**.\n",
            encoding="utf-8",
        )
        (root / "BATCH1.md").write_text(
            "# BATCH1\n\n**Statut : clôturé**\n\n### Jalon humain requis — VALIDÉ\n",
            encoding="utf-8",
        )
        (root / "BATCH2.md").write_text(
            f"# BATCH2\n\n**Statut : {batch2_status}**\n\n### Jalon humain requis — {human}\n",
            encoding="utf-8",
        )
        (root / "PROJECT_STATE.md").write_text(
            "# PROJECT_STATE\n\n## Reprise structurée\n"
            "- stage: Batch 2 — validation\n"
            f"- status: {batch2_status}\n"
            "- git: lire GitHub\n"
            "- next_action: continuer\n\n## État courant\n",
            encoding="utf-8",
        )
        subprocess.run(["git", "init", "-q"], cwd=root, check=True)
        subprocess.run(["git", "config", "user.email", "test@example.invalid"], cwd=root, check=True)
        subprocess.run(["git", "config", "user.name", "Filora Test"], cwd=root, check=True)
        subprocess.run(["git", "add", "."], cwd=root, check=True)
        subprocess.run(["git", "commit", "-qm", "base"], cwd=root, check=True)
        subprocess.run(["git", "branch", "base"], cwd=root, check=True)

    def test_real_repo_requires_explicit_base_ref(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.init_repo(root, {
                "schema_version": 2, "current_batch": 2, "batch_status": "open",
                "risk": "critical", "independent_review": "pending",
                "owner_approval": "obtained", "next_batch_allowed": False,
            })
            result = self.run_guard("workflow-state", "--root", str(root))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("requires explicit --base-ref", result.stderr)

    def test_atomic_transition_cannot_close_and_advance_in_one_candidate(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.init_repo(root, {
                "schema_version": 2, "current_batch": 2, "batch_status": "open",
                "risk": "critical", "independent_review": "pending",
                "owner_approval": "obtained", "next_batch_allowed": False,
            })
            (root / "BATCH2.md").write_text(
                "# BATCH2\n\n**Statut : clôturé**\n\n### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
            (root / "BATCH3.md").write_text(
                "# BATCH3\n\n**Statut : en cours**\n\n### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
            (root / "workflow" / "state.json").write_text(json.dumps({
                "schema_version": 2, "current_batch": 3, "batch_status": "open",
                "risk": "critical", "independent_review": "pending",
                "owner_approval": "obtained", "next_batch_allowed": False,
            }), encoding="utf-8")
            (root / "PROJECT_STATE.md").write_text(
                "# PROJECT_STATE\n\n## Reprise structurée\n"
                "- stage: Batch 3 — validation\n"
                "- status: en cours\n"
                "- git: lire GitHub\n"
                "- next_action: continuer\n\n## État courant\n",
                encoding="utf-8",
            )
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            subprocess.run(["git", "commit", "-qm", "candidate"], cwd=root, check=True)
            result = self.run_guard(
                "workflow-state", "--root", str(root), "--base-ref", "base"
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("atomic Batch transition rejected", result.stderr)

    def test_negated_predecessor_never_counts_as_closed(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.init_repo(root, {
                "schema_version": 2, "current_batch": 2, "batch_status": "open",
                "risk": "critical", "independent_review": "pending",
                "owner_approval": "obtained", "next_batch_allowed": False,
            })
            (root / "BATCH2.md").write_text(
                "# BATCH2\n\n**Statut : pas encore totalement clôturé**\n\n"
                "### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
            (root / "BATCH3.md").write_text(
                "# BATCH3\n\n**Statut : en cours**\n\n### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
            (root / "workflow" / "state.json").write_text(json.dumps({
                "schema_version": 2, "current_batch": 3, "batch_status": "open",
                "risk": "critical", "independent_review": "pending",
                "owner_approval": "obtained", "next_batch_allowed": False,
            }), encoding="utf-8")
            (root / "PROJECT_STATE.md").write_text(
                "# PROJECT_STATE\n\n## Reprise structurée\n"
                "- stage: Batch 3 — validation\n"
                "- status: en cours\n"
                "- git: lire GitHub\n"
                "- next_action: continuer\n\n## État courant\n",
                encoding="utf-8",
            )
            result = self.run_guard(
                "workflow-state", "--root", str(root), "--base-ref", "base"
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("predecessor BATCH2.md", result.stderr)


if __name__ == "__main__":
    unittest.main()
