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
        path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        return path

    def valid_packet(self) -> dict:
        return {
            "mission": "Vérifier le delta ciblé",
            "question": "Le changement respecte-t-il le contrat concerné ?",
            "state_sha": SHA,
            "state_verified": True,
            "context_budget_chars": 2000,
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

    def test_review_packet_accepts_bounded_structural_packet(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), self.valid_packet())
            result = self.run_guard("review-packet", str(path))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Semantic sufficiency and minimality still require review", result.stdout)

    def test_review_packet_rejects_unverified_url_only(self) -> None:
        packet = self.valid_packet()
        packet["inputs"][0] = {
            "kind": "diff",
            "purpose": "Évaluer le changement réel",
            "url": "https://example.invalid/diff",
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("access_verified", result.stderr)

    def test_review_packet_accepts_verified_url_only(self) -> None:
        packet = self.valid_packet()
        packet["inputs"][0] = {
            "kind": "diff",
            "purpose": "Évaluer le changement réel",
            "url": "https://example.invalid/diff",
            "access_verified": True,
        }
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_review_packet_rejects_placeholder_content(self) -> None:
        packet = self.valid_packet()
        packet["inputs"][0]["content"] = "placeholder"
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("placeholder", result.stderr)

    def test_review_packet_rejects_duplicate_content(self) -> None:
        packet = self.valid_packet()
        packet["inputs"][1]["content"] = packet["inputs"][0]["content"]
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicates content", result.stderr)

    def test_review_packet_rejects_huge_self_declared_budget(self) -> None:
        packet = self.valid_packet()
        packet["context_budget_chars"] = 10_000_000
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("gate ceiling", result.stderr)

    def test_review_packet_counts_payload_outside_input_content(self) -> None:
        packet = self.valid_packet()
        packet["context_budget_chars"] = 500
        packet["extra"] = "x" * 1000
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("serialized review packet", result.stderr)

    def test_review_packet_rejects_unverified_state(self) -> None:
        packet = self.valid_packet()
        packet["state_verified"] = False
        with tempfile.TemporaryDirectory() as tmp:
            path = self.write_json(Path(tmp), packet)
            result = self.run_guard("review-packet", str(path))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("state_verified", result.stderr)

    def state_text(self, extra: str = "") -> str:
        return (
            "# PROJECT_STATE\n\n"
            "## Reprise structurée\n"
            "- stage: Batch 0\n"
            "- status: en cours\n"
            "- git: abc123\n"
            "- next_action: corriger les contrôles\n"
            f"{extra}"
            "\n## Historique\n"
            "Ancien état : Batch 0 non démarré\n"
        )

    def test_project_state_accepts_unique_structured_state(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "PROJECT_STATE.md"
            state.write_text(self.state_text(), encoding="utf-8")
            result = self.run_guard(
                "project-state",
                "--file", str(state),
                "--expect-stage", "Batch 0",
                "--expect-status", "en cours",
                "--expect-git", "abc123",
                "--expect-next", "corriger les contrôles",
            )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_project_state_rejects_duplicate_key(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "PROJECT_STATE.md"
            state.write_text(
                self.state_text(extra="- stage: ancien état\n"),
                encoding="utf-8",
            )
            result = self.run_guard("project-state", "--file", str(state))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("duplicate structured state key", result.stderr)

    def test_project_state_ignores_old_history_but_checks_authoritative_field(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "PROJECT_STATE.md"
            state.write_text(self.state_text(), encoding="utf-8")
            result = self.run_guard(
                "project-state",
                "--file", str(state),
                "--expect-stage", "Batch 0 clôturé",
            )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("structured stage", result.stderr)

    def test_project_state_rejects_duplicate_structured_section(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            state = Path(tmp) / "PROJECT_STATE.md"
            state.write_text(
                self.state_text() + "\n## Reprise structurée\n- stage: x\n",
                encoding="utf-8",
            )
            result = self.run_guard("project-state", "--file", str(state))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("must appear exactly once", result.stderr)

    def test_canonical_presence_accepts_all_four(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("PRODUCT.md", "DATA.md", "ARCHITECTURE.md", "DEVELOPMENT.md"):
                (root / name).write_text("x", encoding="utf-8")
            result = self.run_guard("canonical-presence", "--root", str(root))
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_canonical_presence_rejects_missing_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("DATA.md", "ARCHITECTURE.md", "DEVELOPMENT.md"):
                (root / name).write_text("x", encoding="utf-8")
            result = self.run_guard("canonical-presence", "--root", str(root))
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("PRODUCT.md", result.stderr)


if __name__ == "__main__":
    unittest.main()
