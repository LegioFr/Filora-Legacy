from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from tools.prepare_docs_mirror import DOCUMENTS, prepare_mirror


class PrepareDocsMirrorTests(unittest.TestCase):
    def make_root(self, path: Path) -> None:
        for name in DOCUMENTS:
            (path / name).write_text(f"content for {name}\n", encoding="utf-8")

    def test_prepares_only_expected_documents_and_sync_info(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir) / "repo"
            output = Path(temp_dir) / "mirror"
            root.mkdir()
            output.mkdir()
            self.make_root(root)
            (output / "stale.txt").write_text("stale", encoding="utf-8")

            prepare_mirror(
                root=root,
                output=output,
                sha="abc123",
                branch="main",
                synced_at="2026-08-28T18:00:00Z",
            )

            self.assertEqual(
                sorted(path.name for path in output.iterdir()),
                sorted((*DOCUMENTS, "SYNC_INFO.md")),
            )
            sync_info = (output / "SYNC_INFO.md").read_text(encoding="utf-8")
            self.assertIn("source_branch: main", sync_info)
            self.assertIn("source_sha: abc123", sync_info)
            self.assertIn("synchronized_at_utc: 2026-08-28T18:00:00Z", sync_info)
            self.assertNotIn("stale.txt", sync_info)

    def test_prepares_claude_payload_as_exact_text_copies(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir) / "repo"
            output = Path(temp_dir) / "mirror"
            claude_output = Path(temp_dir) / "claude"
            root.mkdir()
            self.make_root(root)
            claude_output.mkdir()
            (claude_output / "stale.txt").write_text("stale", encoding="utf-8")

            prepare_mirror(
                root=root,
                output=output,
                sha="preview123",
                branch="test-preview",
                synced_at="2026-08-28T18:00:00Z",
                claude_output=claude_output,
            )

            expected_names = {
                "PROJECT_STATE.txt",
                "PRODUCT.txt",
                "DATA.txt",
                "ARCHITECTURE.txt",
                "DEVELOPMENT.txt",
                "SYNC_INFO.txt",
            }
            self.assertEqual(
                {path.name for path in claude_output.iterdir()}, expected_names
            )

            for source_name in (*DOCUMENTS, "SYNC_INFO.md"):
                target_name = f"{Path(source_name).stem}.txt"
                self.assertEqual(
                    (claude_output / target_name).read_text(encoding="utf-8"),
                    (output / source_name).read_text(encoding="utf-8"),
                )

    def test_accepts_test_preview_source(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir) / "repo"
            output = Path(temp_dir) / "mirror"
            root.mkdir()
            self.make_root(root)

            prepare_mirror(
                root=root,
                output=output,
                sha="preview123",
                branch="test-preview",
                synced_at="2026-08-28T18:00:00Z",
            )

            sync_info = (output / "SYNC_INFO.md").read_text(encoding="utf-8")
            self.assertIn("source_branch: test-preview", sync_info)
            self.assertIn("source_sha: preview123", sync_info)

    def test_rejects_unapproved_source(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir) / "repo"
            output = Path(temp_dir) / "mirror"
            root.mkdir()
            self.make_root(root)

            with self.assertRaisesRegex(ValueError, "main or test-preview"):
                prepare_mirror(
                    root=root,
                    output=output,
                    sha="abc123",
                    branch="feature/example",
                    synced_at="2026-08-28T18:00:00Z",
                )

    def test_fails_when_required_document_is_missing(self) -> None:
        with TemporaryDirectory() as temp_dir:
            root = Path(temp_dir) / "repo"
            output = Path(temp_dir) / "mirror"
            root.mkdir()
            self.make_root(root)
            (root / "DATA.md").unlink()

            with self.assertRaisesRegex(FileNotFoundError, "DATA.md"):
                prepare_mirror(
                    root=root,
                    output=output,
                    sha="abc123",
                    branch="main",
                    synced_at="2026-08-28T18:00:00Z",
                )


if __name__ == "__main__":
    unittest.main()
