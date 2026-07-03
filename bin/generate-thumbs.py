#!/usr/bin/env python3
"""
Generate thumbnail images for the gallery overview.
Thumbnails are written to assets/images/gallery/thumbs/ at max 600px width.
Source images: assets/images/gallery/*.{jpg,jpeg,png,webp}
Usage: python3 bin/generate-thumbs.py
"""

import pathlib
import sys

try:
    from PIL import Image
except ImportError:
    print("Pillow is not installed. Run: pip install Pillow")
    sys.exit(1)

THUMB_WIDTH = 600
SRC_DIR = pathlib.Path(__file__).parent.parent / "assets" / "images" / "gallery"
THUMB_DIR = SRC_DIR / "thumbs"
EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

THUMB_DIR.mkdir(exist_ok=True)

generated = 0
for src in sorted(SRC_DIR.iterdir()):
    if src.suffix.lower() not in EXTENSIONS:
        continue

    dest = THUMB_DIR / src.name

    # Skip if thumb already up-to-date
    if dest.exists() and dest.stat().st_mtime >= src.stat().st_mtime:
        print(f"  skip  {src.name} (unchanged)")
        continue

    with Image.open(src) as img:
        w, h = img.size
        if w > THUMB_WIDTH:
            new_h = int(h * THUMB_WIDTH / w)
            img = img.resize((THUMB_WIDTH, new_h), Image.LANCZOS)

        # Preserve format; convert PNG/WEBP with transparency to JPEG background
        if src.suffix.lower() in {".jpg", ".jpeg"}:
            img.save(dest, "JPEG", quality=82, optimize=True)
        elif src.suffix.lower() == ".png":
            img.save(dest, "PNG", optimize=True)
        elif src.suffix.lower() == ".webp":
            img.save(dest, "WEBP", quality=82)

    print(f"  thumb {src.name}  ({w}x{h} → {img.size[0]}x{img.size[1]})")
    generated += 1

print(f"\nDone. {generated} thumbnail(s) generated in {THUMB_DIR}")
