import tempfile
import unittest
from pathlib import Path

from tools.check_claude_review_prompt import check_prompt
from tools.prepare_claude_review import DOCUMENTS, build_package, render_prompt


class ClaudeReviewPackageTests(unittest.TestCase):
    def make_root(self, base: Path) -> None:
        for name in DOCUMENTS:
            (base / name).write_text(f"content of {name}\n", encoding="utf-8")

    def test_package_contains_exact_reference_and_all_documents(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_root(root)
            sha = "a" * 40
            payload = build_package(root, "test-preview", sha)
            self.assertIn("source_branch: test-preview", payload)
            self.assertIn(f"source_sha: {sha}", payload)
            for name in DOCUMENTS:
                self.assertIn(f"<!-- BEGIN {name} -->", payload)
                self.assertIn(f"<!-- END {name} -->", payload)

    def test_package_rejects_non_preview_branch(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_root(root)
            with self.assertRaises(ValueError):
                build_package(root, "main", "a" * 40)

    def test_package_rejects_missing_document(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_root(root)
            (root / "DATA.md").unlink()
            with self.assertRaises(FileNotFoundError):
                build_package(root, "test-preview", "a" * 40)

    def test_versioned_prompt_satisfies_guard(self):
        self.assertEqual(check_prompt(Path("claude/REVIEW_PROMPT.md")), [])

    def test_guard_rejects_weakened_prompt(self):
        with tempfile.TemporaryDirectory() as tmp:
            prompt = Path(tmp) / "prompt.md"
            prompt.write_text("Review Filora", encoding="utf-8")
            self.assertTrue(check_prompt(prompt))

    def test_rendered_prompt_embeds_exact_reference(self):
        template = Path("claude/REVIEW_PROMPT.md").read_text(encoding="utf-8")
        sha = "b" * 40
        prompt = render_prompt(template, "test-preview", sha)
        self.assertNotIn("{{EXPECTED_", prompt)
        self.assertGreaterEqual(prompt.count("test-preview"), 2)
        self.assertGreaterEqual(prompt.count(sha), 2)


if __name__ == "__main__":
    unittest.main()
