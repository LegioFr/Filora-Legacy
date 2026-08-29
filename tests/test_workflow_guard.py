import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "tools" / "filora_guard.py"


class WorkflowGuardTests(unittest.TestCase):
    def run_guard(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(GUARD), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def contract(self) -> dict:
        return {
            "schema_version": 1,
            "validation_states": ["pending", "passed", "failed", "not_required"],
            "risk_levels": ["ordinary", "sensitive", "critical"],
            "closure": {
                "mechanical_validation_required": True,
                "independent_review_required_for": ["sensitive", "critical"],
                "owner_approval_required_for": ["critical"],
                "human_validation_must_not_be_pending": True,
            },
            "next_batch": {
                "requires_current_batch_closed": True,
                "requires_next_batch_allowed": True,
            },
            "review_routing": {
                "default": "codex_normal",
                "codex_security_requires_security_property": True,
                "codex_security_requires_normal_insufficient": True,
                "unknown_means_stop": True,
            },
            "human_transfer": {
                "first_tool_failure_allows_transfer": False,
                "unknown_equals_impossible": False,
                "requires_reasonable_means_exhausted": True,
                "failure_prefix": "BLOQUÉ:",
            },
            "protected_paths": [
                "DEVELOPMENT.md",
                "workflow/state.json",
                "workflow/contract.json",
                "tools/filora_guard.py",
                ".github/workflows/filora-guard.yml",
                "tests/test_filora_guard.py",
                "tests/test_human_validation_guard.py",
                "tests/test_workflow_guard.py",
            ],
        }

    def state(self, **overrides: object) -> dict:
        value = {
            "schema_version": 1,
            "current_batch": 2,
            "batch_status": "open",
            "risk": "sensitive",
            "mechanical_validation": "pending",
            "independent_review": "pending",
            "owner_approval": "obtained",
            "human_validation": "not_required",
            "next_batch_allowed": False,
        }
        value.update(overrides)
        return value

    def write_fixture(
        self,
        root: Path,
        state: dict | None = None,
        batch2_status: str = "en validation",
        human_marker: str = "NON REQUIS",
        project_status: str = "en validation sur test-preview",
        add_batch3: bool = False,
    ) -> tuple[Path, Path, Path]:
        workflow = root / "workflow"
        workflow.mkdir()
        state_path = workflow / "state.json"
        contract_path = workflow / "contract.json"
        project_path = root / "PROJECT_STATE.md"
        state_path.write_text(json.dumps(state or self.state()), encoding="utf-8")
        contract_path.write_text(json.dumps(self.contract()), encoding="utf-8")
        (root / "BATCH1.md").write_text(
            "# BATCH1\n\n**Statut : clôturé**\n\n### Jalon humain requis — VALIDÉ\n",
            encoding="utf-8",
        )
        (root / "BATCH2.md").write_text(
            f"# BATCH2\n\n**Statut : {batch2_status}**\n\n### Jalon humain requis — {human_marker}\n",
            encoding="utf-8",
        )
        if add_batch3:
            (root / "BATCH3.md").write_text(
                "# BATCH3\n\n**Statut : en cours**\n\n### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
        project_path.write_text(
            "# PROJECT_STATE\n\n"
            "## Reprise structurée\n"
            "- stage: Batch 2 — validation\n"
            f"- status: {project_status}\n"
            "- git: lire GitHub\n"
            "- next_action: poursuivre la première gate autorisée\n"
            "\n## État courant\n",
            encoding="utf-8",
        )
        return state_path, contract_path, project_path

    def run_workflow(self, root: Path, state: Path, contract: Path, project: Path):
        return self.run_guard(
            "workflow-state",
            "--root", str(root),
            "--state", str(state),
            "--contract", str(contract),
            "--project-state", str(project),
        )

    def test_open_batch_is_coherent_and_next_batch_is_blocked(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(root)
            result = self.run_workflow(root, state, contract, project)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("next_batch_allowed=False", result.stdout)

    def test_rejects_positive_next_batch_authorization_while_open(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(
                root, self.state(next_batch_allowed=True)
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("cannot be true while the current Batch is open", result.stderr)

    def test_rejects_new_batch_when_previous_batch_is_not_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state3 = self.state(current_batch=3)
            state, contract, project = self.write_fixture(root, state3, add_batch3=True)
            project.write_text(
                project.read_text(encoding="utf-8").replace("Batch 2", "Batch 3"),
                encoding="utf-8",
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("earlier BATCH2.md is not declared closed", result.stderr)

    def test_rejects_closed_sensitive_batch_without_independent_review(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            closed = self.state(
                batch_status="closed",
                mechanical_validation="passed",
                independent_review="pending",
                next_batch_allowed=True,
            )
            state, contract, project = self.write_fixture(
                root,
                closed,
                batch2_status="clôturé",
                project_status="clôturé",
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("requires independent_review=passed", result.stderr)

    def test_accepts_closed_sensitive_batch_only_with_required_gates(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            closed = self.state(
                batch_status="closed",
                mechanical_validation="passed",
                independent_review="passed",
                next_batch_allowed=True,
            )
            state, contract, project = self.write_fixture(
                root,
                closed,
                batch2_status="clôturé",
                project_status="clôturé",
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_project_state_closure_contradiction(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(
                root, project_status="clôturé"
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("PROJECT_STATE structured status contradicts", result.stderr)

    def test_rejects_contract_that_allows_security_by_default(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(root)
            payload = self.contract()
            payload["review_routing"]["default"] = "codex_security"
            contract.write_text(json.dumps(payload), encoding="utf-8")
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("review_routing.default", result.stderr)

    def test_review_route_uses_normal_when_security_is_not_needed(self) -> None:
        result = self.run_guard(
            "review-route",
            "--security-property", "no",
            "--normal-sufficient", "yes",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "CODEX_NORMAL")

    def test_review_route_uses_security_only_when_security_property_needs_it(self) -> None:
        result = self.run_guard(
            "review-route",
            "--security-property", "yes",
            "--normal-sufficient", "no",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "CODEX_SECURITY")

    def test_review_route_fails_closed_on_unknown(self) -> None:
        result = self.run_guard(
            "review-route",
            "--security-property", "unknown",
            "--normal-sufficient", "unknown",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("STOP", result.stderr)

    def test_first_tool_failure_does_not_allow_human_transfer(self) -> None:
        result = self.run_guard(
            "human-transfer",
            "--operation-authorized", "yes",
            "--reasonable-means-exhausted", "no",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue(result.stderr.startswith("FAIL: BLOQUÉ:"), result.stderr)

    def test_human_transfer_requires_positive_exhaustion_proof(self) -> None:
        result = self.run_guard(
            "human-transfer",
            "--operation-authorized", "yes",
            "--reasonable-means-exhausted", "yes",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "HUMAN_TRANSFER_ALLOWED")


if __name__ == "__main__":
    unittest.main()
