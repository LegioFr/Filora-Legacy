#!/usr/bin/env python3
"""Mechanical dependency-direction check for Filora source files."""

from __future__ import annotations

import re
import sys
from pathlib import Path

IMPORT_RE = re.compile(
    r"(?:import|export)\s+(?:type\s+)?(?:[^'\"]*?\s+from\s+)?['\"]([^'\"]+)['\"]"
)


def layer_for(path: Path, src_root: Path) -> str | None:
    try:
        first = path.resolve().relative_to(src_root.resolve()).parts[0]
    except (ValueError, IndexError):
        return None
    return first if first in {"app", "domains", "shared"} else None


def resolve_relative(source: Path, specifier: str) -> Path | None:
    if not specifier.startswith('.'):
        return None
    return (source.parent / specifier).resolve()


def violations(src_root: Path) -> list[str]:
    found: list[str] = []
    for source in sorted((*src_root.rglob('*.ts'), *src_root.rglob('*.tsx'))):
        source_layer = layer_for(source, src_root)
        if source_layer is None:
            continue
        text = source.read_text(encoding='utf-8')
        for specifier in IMPORT_RE.findall(text):
            target = resolve_relative(source, specifier)
            if target is None:
                continue
            target_layer = layer_for(target, src_root)
            forbidden = (
                source_layer == 'domains' and target_layer == 'app'
            ) or (
                source_layer == 'shared' and target_layer in {'app', 'domains'}
            )
            if forbidden:
                found.append(
                    f"{source.relative_to(src_root)}: {source_layer} must not depend on {target_layer} ({specifier})"
                )
    return found


def main() -> int:
    src_root = Path(sys.argv[1] if len(sys.argv) > 1 else 'src')
    if not src_root.is_dir():
        print(f"architecture check: source root not found: {src_root}", file=sys.stderr)
        return 2
    found = violations(src_root)
    if found:
        print('architecture check failed:', file=sys.stderr)
        for item in found:
            print(f"- {item}", file=sys.stderr)
        return 1
    print('architecture check passed')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
