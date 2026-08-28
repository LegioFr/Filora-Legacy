from __future__ import annotations

import argparse
import shutil
from pathlib import Path

DOCUMENTS = (
    "PROJECT_STATE.md",
    "PRODUCT.md",
    "DATA.md",
    "ARCHITECTURE.md",
    "DEVELOPMENT.md",
)

MIRROR_DOCUMENTS = (*DOCUMENTS, "SYNC_INFO.md")
ALLOWED_SOURCE_BRANCHES = {"main", "test-preview"}


def _reset_directory(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)
    for child in path.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()


def prepare_claude_payload(mirror_output: Path, claude_output: Path) -> None:
    """Prepare text files that rclone can import as native Google Docs.

    Claude project knowledge keeps Google Docs synchronized from Drive. The
    canonical GitHub Markdown remains unchanged; this payload is only a
    transport representation with byte-for-byte identical UTF-8 text.
    """
    _reset_directory(claude_output)

    for name in MIRROR_DOCUMENTS:
        source = mirror_output / name
        if not source.is_file():
            raise FileNotFoundError(f"required mirror document missing: {name}")
        target = claude_output / f"{Path(name).stem}.txt"
        target.write_text(source.read_text(encoding="utf-8"), encoding="utf-8")


def prepare_mirror(
    root: Path,
    output: Path,
    sha: str,
    branch: str,
    synced_at: str,
    claude_output: Path | None = None,
) -> None:
    if branch not in ALLOWED_SOURCE_BRANCHES:
        raise ValueError("documentation mirror source branch must be main or test-preview")

    if not sha.strip():
        raise ValueError("sha must not be empty")

    if not synced_at.strip():
        raise ValueError("synced_at must not be empty")

    _reset_directory(output)

    for name in DOCUMENTS:
        source = root / name
        if not source.is_file():
            raise FileNotFoundError(f"required document missing: {name}")
        shutil.copyfile(source, output / name)

    sync_info = (
        "# Filora documentation mirror\n\n"
        f"- source_branch: {branch}\n"
        f"- source_sha: {sha}\n"
        f"- synchronized_at_utc: {synced_at}\n"
        "- authority: GitHub repository LegioFr/Filora\n"
        "- mirror_role: read-only convenience copy for Claude\n"
    )
    (output / "SYNC_INFO.md").write_text(sync_info, encoding="utf-8")

    if claude_output is not None:
        prepare_claude_payload(output, claude_output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--claude-output", type=Path)
    parser.add_argument("--sha", required=True)
    parser.add_argument("--branch", required=True)
    parser.add_argument("--synced-at", required=True)
    args = parser.parse_args()

    prepare_mirror(
        root=args.root.resolve(),
        output=args.output.resolve(),
        sha=args.sha,
        branch=args.branch,
        synced_at=args.synced_at,
        claude_output=args.claude_output.resolve() if args.claude_output else None,
    )


if __name__ == "__main__":
    main()
