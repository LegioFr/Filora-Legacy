import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GUARD = ROOT / "tools" / "filora_guard.py"
SHA = "a" * 40


class FiloraGuardTests(unittest.TestCase):
    def run_guard(self, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(GUARD), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def write_json(self, directory: Path, payload: dict) -> Path:
        path = directory / "packet.json"
        path.write_text(json.dumps(payload), encoding="utf-8")
        return path

    def valid_packet(self) -> dict:
        return {
            "mission": "Vérifier le delta ciblé",
            "state_sha": SHA,
            "context_budget_chars": 200,
            "inputs": [
                {
                    "kind": "diff",
                    "purpose": "Évaluer le changement réel",
                    "content": "+ ligne modifiée",
                },
                {
                    "kind": "canonical",
                    "purpose": "Comparer à la règle applicable",
                    "content": "règle pertinente",
                },
            ],
        }

    def test_review_packet_accepts_executable_bounded_packet(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), self.valid_packet())
            result = self.run_guard("review-packet", str(path))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PASS", result.stdout)

    def test_review_packet_rejects_missing_usable_content(self) -> None:
        packet = self.valid_packet()
        packet["inputs"][0].pop("content")
        packet["inputs"][0]["url"] = "https://example.invalid/diff"
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("URL or declaration alone is insufficient", result.stderr)

    def test_review_packet_rejects_duplicate_context(self) -> None:
        packet = self.valid_packet()
        packet["inputs"][1]["content"] = packet["inputs"][0]["content"]
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicates content", result.stderr)

    def test_review_packet_rejects_context_over_budget(self) -> None:
        packet = self.valid_packet()
        packet["context_budget_chars"] = 5
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("above the declared mission budget", result.stderr)

    def test_project_state_accepts_expected_transition(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "PROJECT_STATE.md"
            state.write_text(
                "Étape: Batch 0 clôturé\nGit: deadbeef\nProchaine: Batch 1\n",
                encoding="utf-8",
            )
            result = self.run_guard(
                "project-state",
                "--file",
                str(state),
                "--expect-stage",
                "Batch 0 clôturé",
                "--expect-git",
                "deadbeef",
                "--expect-next",
                "Batch 1",
            )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_project_state_rejects_stale_transition(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "PROJECT_STATE.md"
            state.write_text(
                "Étape: Batch 0 en cours\nGit: oldsha\nProchaine: finir Batch 0\n",
                encoding="utf-8",
            )
            result = self.run_guard(
                "project-state",
                "--file",
                str(state),
                "--expect-stage",
                "Batch 0 clôturé",
                "--expect-git",
                "newsha",
                "--expect-next",
                "Batch 1",
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("does not contain expected stage", result.stderr)


if __name__ == "__main__":
    unittest.main()
