import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "tools" / "filora_guard.py"


class HumanValidationGuardTests(unittest.TestCase):
    def run_guard(self, root: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(GUARD), "batch-human-validation", "--root", str(root)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def write_batch(self, root: Path, number: int, status: str, marker: str | None) -> None:
        lines = [
            f"# BATCH{number}.md — test",
            "",
            f"**Statut : {status}**",
            "",
        ]
        if marker is not None:
            lines.extend([f"### Jalon humain requis — {marker}", ""])
        (root / f"BATCH{number}.md").write_text("\n".join(lines), encoding="utf-8")

    def test_accepts_pending_validation_while_batch_is_open(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "validation humaine en attente", "EN ATTENTE")
            result = self.run_guard(root)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_accepts_reopened_closure_with_pending_validation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(
                root,
                1,
                "intégré techniquement à main — clôture rouverte, validation humaine applicative en attente",
                "EN ATTENTE",
            )
            result = self.run_guard(root)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_closed_batch_with_pending_validation(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "clôturé et intégré à main", "EN ATTENTE")
            result = self.run_guard(root)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("declared closed", result.stderr)

    def test_accepts_closed_batch_with_validated_human_checkpoint(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "clôturé", "VALIDÉ")
            result = self.run_guard(root)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_accepts_closed_batch_when_human_validation_is_not_required(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "clôturé", "NON REQUIS")
            result = self.run_guard(root)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_rejects_missing_human_validation_marker(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "en cours", None)
            result = self.run_guard(root)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("human validation marker", result.stderr)

    def test_rejects_duplicate_human_validation_markers(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "en cours", "EN ATTENTE")
            path = root / "BATCH1.md"
            path.write_text(
                path.read_text(encoding="utf-8") + "### Jalon humain requis — VALIDÉ\n",
                encoding="utf-8",
            )
            result = self.run_guard(root)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("exactly one human validation marker", result.stderr)

    def test_checks_highest_numbered_batch(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.write_batch(root, 1, "clôturé", "VALIDÉ")
            self.write_batch(root, 2, "clôturé", "EN ATTENTE")
            result = self.run_guard(root)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("BATCH2.md", result.stderr)


if __name__ == "__main__":
    unittest.main()
