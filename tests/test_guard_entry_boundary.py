import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "tools" / "filora_guard.py"


class GuardEntryBoundaryTests(unittest.TestCase):
    def run_guard(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(GUARD), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_split_implementation_entry_no_longer_exists(self) -> None:
        self.assertFalse((ROOT / "tools" / "filora_guard_impl.py").exists())

    def test_duplicate_root_is_rejected_before_argparse_can_select_last_value(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = self.run_guard(
                "workflow-state",
                "--root", tmp,
                "--root", str(ROOT),
                "--base-ref", "origin/test-preview",
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate structural option is forbidden: --root", result.stderr)

    def test_duplicate_root_mixed_equals_form_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            result = self.run_guard(
                "workflow-state",
                "--root", tmp,
                f"--root={ROOT}",
                "--base-ref", "origin/test-preview",
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate structural option is forbidden: --root", result.stderr)

    def test_duplicate_base_ref_is_rejected(self) -> None:
        result = self.run_guard(
            "workflow-state",
            "--root", str(ROOT),
            "--base-ref", "origin/test-preview",
            "--base-ref", "HEAD~1",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate structural option is forbidden: --base-ref", result.stderr)

    def test_duplicate_base_ref_equals_form_is_rejected(self) -> None:
        result = self.run_guard(
            "workflow-state",
            "--root", str(ROOT),
            "--base-ref=DOES_NOT_EXIST",
            "--base-ref=HEAD",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate structural option is forbidden: --base-ref", result.stderr)

    def test_duplicate_state_equals_form_is_rejected(self) -> None:
        result = self.run_guard(
            "workflow-state",
            "--root", str(ROOT),
            "--state=missing.json",
            "--state=workflow/state.json",
            "--base-ref", "origin/test-preview",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate structural option is forbidden: --state", result.stderr)

    def test_abbreviated_structural_option_is_rejected(self) -> None:
        result = self.run_guard(
            "workflow-state",
            "--root", str(ROOT),
            "--base-r", "DOES_NOT_EXIST",
            "--base-ref", "origin/test-preview",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("unrecognized arguments", result.stderr)

    def test_head_cannot_authenticate_as_pr_base(self) -> None:
        result = self.run_guard(
            "workflow-state",
            "--root", str(ROOT),
            "--base-ref", "HEAD",
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("not HEAD", result.stderr)

    def test_ambiguous_closed_prefix_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "BATCH1.md").write_text(
                "# BATCH1\n\n**Statut : clôturé en apparence, mais toujours pas clôturé**\n\n"
                "### Jalon humain requis — NON REQUIS\n",
                encoding="utf-8",
            )
            result = self.run_guard("batch-human-validation", "--root", str(root))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ambiguous lifecycle status", result.stderr)


if __name__ == "__main__":
    unittest.main()
