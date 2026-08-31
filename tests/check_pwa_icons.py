#!/usr/bin/env python3
"""Strictly validate Filora PWA PNG icons.

Checks PNG signature, chunk boundaries, CRCs, IHDR dimensions/format,
valid zlib-compressed IDAT scanlines, and requires a terminal IEND chunk.
"""

from __future__ import annotations

import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ICONS = {
    ROOT / "public/icons/filora-192.png": 192,
    ROOT / "public/icons/filora-512.png": 512,
    ROOT / "public/icons/filora-test-192.png": 192,
    ROOT / "public/icons/filora-test-512.png": 512,
}
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def validate_png(path: Path, expected_size: int) -> None:
    data = path.read_bytes()
    if not data.startswith(PNG_SIGNATURE):
        raise ValueError("signature PNG invalide")

    offset = len(PNG_SIGNATURE)
    saw_ihdr = False
    saw_iend = False
    idat_payloads: list[bytes] = []
    width = height = 0

    while offset < len(data):
        if offset + 12 > len(data):
            raise ValueError("chunk PNG tronqué")

        length = struct.unpack(">I", data[offset : offset + 4])[0]
        chunk_type = data[offset + 4 : offset + 8]
        payload_start = offset + 8
        payload_end = payload_start + length
        crc_end = payload_end + 4

        if crc_end > len(data):
            raise ValueError(f"{chunk_type.decode('ascii', 'replace')} dépasse la fin du fichier")

        payload = data[payload_start:payload_end]
        stored_crc = struct.unpack(">I", data[payload_end:crc_end])[0]
        computed_crc = zlib.crc32(chunk_type + payload) & 0xFFFFFFFF
        if stored_crc != computed_crc:
            raise ValueError(
                f"CRC invalide pour {chunk_type.decode('ascii', 'replace')}: "
                f"{stored_crc:08x} != {computed_crc:08x}"
            )

        if chunk_type == b"IHDR":
            if saw_ihdr or length != 13:
                raise ValueError("IHDR invalide")
            width, height, bit_depth, color_type, compression, filtering, interlace = struct.unpack(
                ">IIBBBBB", payload
            )
            if (width, height) != (expected_size, expected_size):
                raise ValueError(
                    f"dimensions {width}x{height}, attendu {expected_size}x{expected_size}"
                )
            if bit_depth != 8 or color_type != 2:
                raise ValueError(
                    f"format attendu RGB 8 bits, obtenu bit_depth={bit_depth}, color_type={color_type}"
                )
            if compression != 0 or filtering != 0 or interlace != 0:
                raise ValueError("paramètres IHDR non supportés")
            saw_ihdr = True
        elif chunk_type == b"IDAT":
            idat_payloads.append(payload)
        elif chunk_type == b"IEND":
            if length != 0:
                raise ValueError("IEND doit être vide")
            saw_iend = True
            if crc_end != len(data):
                raise ValueError("octets présents après IEND")
            break

        offset = crc_end

    if not saw_ihdr:
        raise ValueError("IHDR absent")
    if not idat_payloads:
        raise ValueError("IDAT absent")
    if not saw_iend:
        raise ValueError("IEND absent")

    compressed = b"".join(idat_payloads)
    decoder = zlib.decompressobj()
    try:
        scanlines = decoder.decompress(compressed) + decoder.flush()
    except zlib.error as exc:
        raise ValueError(f"flux IDAT zlib invalide: {exc}") from exc

    if not decoder.eof or decoder.unused_data or decoder.unconsumed_tail:
        raise ValueError("flux IDAT zlib incomplet ou contient des données supplémentaires")

    bytes_per_row = 1 + width * 3
    expected_length = height * bytes_per_row
    if len(scanlines) != expected_length:
        raise ValueError(
            f"taille IDAT décompressée {len(scanlines)}, attendu {expected_length}"
        )

    for row in range(height):
        filter_type = scanlines[row * bytes_per_row]
        if filter_type > 4:
            raise ValueError(f"filtre PNG invalide à la ligne {row}: {filter_type}")


def main() -> int:
    failed = False
    for path, size in ICONS.items():
        try:
            validate_png(path, size)
            print(f"OK {path.relative_to(ROOT)}")
        except Exception as exc:
            failed = True
            print(f"ERREUR {path.relative_to(ROOT)}: {exc}", file=sys.stderr)

    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
