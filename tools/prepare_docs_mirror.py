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


def prepare_mirror(root: Path, output: Path, sha: str, branch: str, synced_at: str) -> None:
    if branch != "main":
        raise ValueError("official documentation mirror source branch must be main")

    if not sha.strip():
        raise ValueError("sha must not be empty")

    if not synced_at.strip():
        raise ValueError("synced_at must not be empty")

    output.mkdir(parents=True, exist_ok=True)

    for child in output.iterdir():
        if child.is_dir():
            shutil.rmtree(child)
        else:
            child.unlink()

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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path, required=True)
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
    )


if __name__ == "__main__":
    main()
