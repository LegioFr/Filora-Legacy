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
            "schema_version": 2,
            "validation_states": ["pending", "passed", "failed", "not_required"],
            "risk_levels": ["ordinary", "sensitive", "critical"],
            "closure": {
                "independent_review_required_for": ["sensitive", "critical"],
                "owner_approval_required_for": ["critical"],
                "human_validation_must_not_be_pending": True,
            },
            "next_batch": {
                "requires_current_batch_closed": True,
                "requires_next_batch_allowed": True,
                "requires_contiguous_batch_numbers": True,
            },
            "review_routing": {
                "default": "codex_normal",
                "unknown_means_stop": True,
                "normal_insufficient_without_security_means_stop": True,
            },
            "human_transfer": {
                "first_tool_failure_allows_transfer": False,
                "unknown_equals_impossible": False,
                "requires_reasonable_means_exhausted": True,
                "failure_prefix": "BLOQUÉ:",
            },
            "critical_control_paths": [
                "DEVELOPMENT.md",
                "workflow/contract.json",
                "tools/filora_guard.py",
                ".github/workflows/filora-guard.yml",
                "tests/test_workflow_guard.py",
            ],
            "sensitive_paths": [
                "workflow/state.json",
                "PRODUCT.md",
                "DATA.md",
                "ARCHITECTURE.md",
                ".github/workflows/",
                "package.json",
                "package-lock.json",
            ],
        }

    def state(self, **overrides: object) -> dict:
        value = {
            "schema_version": 2,
            "current_batch": 2,
            "batch_status": "open",
            "risk": "sensitive",
            "independent_review": "pending",
            "owner_approval": "obtained",
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
        batch1_status: str = "clôturé",
        include_batch1: bool = True,
        add_batch3: bool = False,
    ) -> tuple[Path, Path, Path]:
        workflow = root / "workflow"
        workflow.mkdir()
        state_path = workflow / "state.json"
        contract_path = workflow / "contract.json"
        project_path = root / "PROJECT_STATE.md"
        state_payload = state or self.state()
        state_path.write_text(json.dumps(state_payload), encoding="utf-8")
        contract_path.write_text(json.dumps(self.contract()), encoding="utf-8")

        (root / "BATCH0.md").write_text(
            "# Batch 0\n\n## Statut\n\nBatch 0 est **clôturé et intégré à `main`**.\n",
            encoding="utf-8",
        )
        if include_batch1:
            (root / "BATCH1.md").write_text(
                f"# BATCH1\n\n**Statut : {batch1_status}**\n\n"
                "### Jalon humain requis — VALIDÉ\n",
                encoding="utf-8",
            )
        (root / "BATCH2.md").write_text(
            f"# BATCH2\n\n**Statut : {batch2_status}**\n\n"
            f"### Jalon humain requis — {human_marker}\n",
            encoding="utf-8",
        )
        if add_batch3:
            (root / "BATCH3.md").write_text(
                "# BATCH3\n\n**Statut : en cours**\n\n"
                "### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
        project_path.write_text(
            "# PROJECT_STATE\n\n"
            "## Reprise structurée\n"
            f"- stage: Batch {state_payload['current_batch']} — validation\n"
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
            state, contract, project = self.write_fixture(root, self.state(next_batch_allowed=True))
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("cannot be true while the current Batch is open", result.stderr)

    def test_rejects_skipped_batch_number(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(root, include_batch1=False)
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("must be contiguous", result.stderr)

    def test_rejects_new_batch_when_previous_batch_is_open(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state3 = self.state(current_batch=3)
            state, contract, project = self.write_fixture(root, state3, add_batch3=True)
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("predecessor BATCH2.md is not declared closed", result.stderr)

    def test_invalid_predecessor_is_not_treated_as_legacy_closure(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state3 = self.state(current_batch=3)
            state, contract, project = self.write_fixture(root, state3, add_batch3=True)
            (root / "BATCH2.md").write_text(
                "# BATCH2\n\nCe document ne peut pas être clôturé.\n",
                encoding="utf-8",
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("invalid predecessor BATCH2.md", result.stderr)

    def test_non_cloture_is_not_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(
                root,
                self.state(batch_status="open"),
                batch2_status="non clôturé",
                project_status="non clôturé",
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_pas_encore_cloture_is_not_closed(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(
                root,
                self.state(batch_status="open"),
                batch2_status="pas encore clôturé",
                project_status="pas encore clôturé",
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_closed_sensitive_batch_without_independent_review(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            closed = self.state(batch_status="closed", independent_review="pending", next_batch_allowed=True)
            state, contract, project = self.write_fixture(
                root, closed, batch2_status="clôturé", project_status="clôturé"
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("requires independent_review=passed", result.stderr)

    def test_accepts_closed_sensitive_batch_with_required_gates(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            closed = self.state(batch_status="closed", independent_review="passed", next_batch_allowed=True)
            state, contract, project = self.write_fixture(
                root, closed, batch2_status="clôturé", project_status="clôturé"
            )
            result = self.run_workflow(root, state, contract, project)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_project_state_closure_contradiction(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(root, project_status="clôturé")
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("PROJECT_STATE structured status contradicts", result.stderr)

    def test_change_risk_classifies_guard_as_critical(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            contract = Path(tmp) / "contract.json"
            contract.write_text(json.dumps(self.contract()), encoding="utf-8")
            result = self.run_guard("change-risk", "--contract", str(contract), "--path", "tools/filora_guard.py")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "CRITICAL")

    def test_change_risk_classifies_state_as_sensitive(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            contract = Path(tmp) / "contract.json"
            contract.write_text(json.dumps(self.contract()), encoding="utf-8")
            result = self.run_guard("change-risk", "--contract", str(contract), "--path", "workflow/state.json")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "SENSITIVE")

    def test_contract_cannot_remove_guard_from_critical_paths(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            state, contract, project = self.write_fixture(root)
            payload = self.contract()
            payload["critical_control_paths"].remove("tools/filora_guard.py")
            contract.write_text(json.dumps(payload), encoding="utf-8")
            result = self.run_workflow(root, state, contract, project)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("filora_guard.py must remain", result.stderr)

    def test_review_route_uses_normal_when_security_is_not_needed(self) -> None:
        result = self.run_guard("review-route", "--security-property", "no", "--normal-sufficient", "yes")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "CODEX_NORMAL")

    def test_review_route_uses_security_only_when_security_property_needs_it(self) -> None:
        result = self.run_guard("review-route", "--security-property", "yes", "--normal-sufficient", "no")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "CODEX_SECURITY")

    def test_review_route_stops_when_normal_is_insufficient_without_security(self) -> None:
        result = self.run_guard("review-route", "--security-property", "no", "--normal-sufficient", "no")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("another proof mechanism", result.stderr)

    def test_review_route_fails_closed_on_unknown(self) -> None:
        result = self.run_guard("review-route", "--security-property", "unknown", "--normal-sufficient", "unknown")
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("STOP", result.stderr)

    def test_first_tool_failure_does_not_allow_human_transfer(self) -> None:
        result = self.run_guard(
            "human-transfer",
            "--operation-authorized", "yes",
            "--reasonable-means-exhausted", "no",
            "--hard-limit", "no",
            "--attempt-count", "1",
            "--alternative-count", "0",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("first tool/method failure is insufficient", result.stderr)

    def test_human_transfer_requires_alternative_and_exhaustion(self) -> None:
        result = self.run_guard(
            "human-transfer",
            "--operation-authorized", "yes",
            "--reasonable-means-exhausted", "yes",
            "--hard-limit", "no",
            "--attempt-count", "2",
            "--alternative-count", "1",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "HUMAN_TRANSFER_ALLOWED")

    def test_known_hard_limit_can_allow_transfer_without_fake_retries(self) -> None:
        result = self.run_guard(
            "human-transfer",
            "--operation-authorized", "yes",
            "--reasonable-means-exhausted", "yes",
            "--hard-limit", "yes",
            "--attempt-count", "0",
            "--alternative-count", "0",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout.strip(), "HUMAN_TRANSFER_ALLOWED")

    def test_unknown_hard_limit_fails_closed(self) -> None:
        result = self.run_guard(
            "human-transfer",
            "--operation-authorized", "yes",
            "--reasonable-means-exhausted", "unknown",
            "--hard-limit", "unknown",
            "--attempt-count", "1",
            "--alternative-count", "0",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("uncertain", result.stderr)


if __name__ == "__main__":
    unittest.main()
