"""
Crop composite card sheets into individual card faces.

Place source images in:
  app/public/images/cards/sources/ss1.jpg  (Axis 2x4 grid)
  app/public/images/cards/sources/ss2.jpg  (SBI Products catalog — Core Cards grid)
  app/public/images/cards/sources/ss3.jpg  (Axis 2x4 duplicate — optional)
  app/public/images/cards/sources/ss4.jpg  (SBI catalog — optional duplicate of ss2)

Or pass a path: python scripts/crop-card-sheets.py path/to/sbi-catalog.jpg

Outputs to public/images/cards/ (served at /images/cards/...)
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "app" / "public" / "images" / "cards" / "sources"
OUT_APP = ROOT / "app" / "public" / "images" / "cards"
OUT_PUBLIC = ROOT / "public" / "images" / "cards"
CARD_SIZE = (760, 480)  # ~1.58 aspect


def find_source(name: str) -> Path | None:
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG"):
        for base in (SOURCES, OUT_APP):
            p = base / f"{name}{ext}"
            if p.is_file():
                return p
    return None


def crop_cell(
    img: Image.Image,
    col: int,
    row: int,
    cols: int,
    rows: int,
    region: tuple[float, float, float, float] = (0, 0, 1, 1),
) -> Image.Image:
    """Crop one grid cell. region = (x0,y0,x1,y1) as fractions of full image."""
    w, h = img.size
    rx0, ry0, rx1, ry1 = region
    rw, rh = w * (rx1 - rx0), h * (ry1 - ry0)
    ox, oy = w * rx0, h * ry0
    margin_x = rw * 0.03
    margin_y = rh * 0.03
    cell_w = (rw - margin_x * (cols + 1)) / cols
    cell_h = (rh - margin_y * (rows + 1)) / rows
    left = ox + margin_x + col * (cell_w + margin_x)
    top = oy + margin_y + row * (cell_h + margin_y)
    box = (int(left), int(top), int(left + cell_w), int(top + cell_h))
    return img.crop(box).resize(CARD_SIZE, Image.Resampling.LANCZOS)


def save_card(crop: Image.Image, filename: str) -> None:
    for out_dir in (OUT_APP, OUT_PUBLIC):
        out_dir.mkdir(parents=True, exist_ok=True)
        path = out_dir / filename
        if filename.endswith(".webp"):
            crop.save(path, "WEBP", quality=88)
        else:
            crop.save(path, "JPEG", quality=92)


def crop_axis_ss1(img: Image.Image) -> None:
    """2 cols x 4 rows — skip duplicate row3-left (same as row2-right)."""
    picks = {
        "axis_pride_signature.jpeg": (0, 1),
        "axis_pride_platinum.jpeg": (1, 0),
        "axis_platinum.jpeg": (1, 1),
        "axis_buzz.jpeg": (2, 1),
        "axis_myzone.jpeg": (3, 0),
        "axis_burgundy_private.jpeg": (3, 1),
    }
    for fname, (row, col) in picks.items():
        save_card(crop_cell(img, col, row, 2, 4), fname)

    # Wire to catalog slugs used in the app
    aliases = {
        "axis_flipkart.jpeg": "axis_myzone.jpeg",
        "axis_magnus.jpeg": "axis_burgundy_private.jpeg",
        "axis_vistara.jpeg": "axis_pride_signature.jpeg",
        "axis_airtel.jpeg": "axis_buzz.jpeg",
    }
    for dest, src in aliases.items():
        src_path = OUT_PUBLIC / src
        if src_path.is_file():
            crop = Image.open(src_path)
            save_card(crop, dest)


def crop_axis_ss2(img: Image.Image) -> None:
    """Irregular 2-2-1-2 layout approximated with fractional regions."""
    w, h = img.size
    picks = [
        ("axis_spicejet_voyage_black.jpeg", (0.02, 0.02, 0.48, 0.28)),
        ("axis_spicejet_voyage.jpeg", (0.52, 0.02, 0.98, 0.28)),
        ("axis_privilege.jpeg", (0.02, 0.30, 0.48, 0.56)),
        ("axis_freecharge.jpeg", (0.52, 0.30, 0.98, 0.56)),
        ("axis_miles_more.jpeg", (0.22, 0.58, 0.78, 0.78)),
        ("axis_aura.jpeg", (0.52, 0.80, 0.98, 0.98)),
    ]
    for fname, (x0, y0, x1, y1) in picks:
        box = (int(w * x0), int(h * y0), int(w * x1), int(h * y1))
        save_card(img.crop(box).resize(CARD_SIZE, Image.Resampling.LANCZOS), fname)


def trim_card_label(crop: Image.Image) -> Image.Image:
    """SBI sheet has card name text below each face — keep top ~82% only."""
    w, h = crop.size
    return crop.crop((0, 0, w, int(h * 0.82)))


def crop_sbi_catalog(img: Image.Image) -> None:
    """SBI 'Products' sheet — left Core Cards block, 2 cols × 4 rows."""
    region = (0.01, 0.10, 0.42, 0.94)
    picks = {
        "sbi_elite.jpeg": (0, 0),
        "sbi_prime.jpeg": (0, 1),
        "sbi_simplyclick.jpeg": (1, 0),
        "sbi_cashback.jpeg": (1, 1),
        "sbi_doctors.jpeg": (2, 0),
        "sbi_elite_business.jpeg": (2, 1),
        "sbi_shaurya.jpeg": (3, 0),
        "sbi_unnati.jpeg": (3, 1),
    }
    for fname, (row, col) in picks.items():
        cell = crop_cell(img, col, row, 2, 4, region)
        save_card(trim_card_label(cell), fname)

    aliases = {
        "sbi_simplysave.jpeg": "sbi_cashback.jpeg",
    }
    for dest, src in aliases.items():
        src_path = OUT_PUBLIC / src
        if src_path.is_file():
            save_card(Image.open(src_path), dest)


def sync_photos_from_app() -> None:
    """Copy all card photos from app/public → public/ (Next.js only serves public/)."""
    OUT_PUBLIC.mkdir(parents=True, exist_ok=True)
    for src in OUT_APP.iterdir():
        if not src.is_file():
            continue
        if src.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
            continue
        dest = OUT_PUBLIC / src.name
        if not dest.exists() or src.stat().st_mtime > dest.stat().st_mtime:
            dest.write_bytes(src.read_bytes())
            print(f"Synced {src.name} → public/images/cards/")


def main() -> None:
    SOURCES.mkdir(parents=True, exist_ok=True)
    sync_photos_from_app()

    ss1 = find_source("ss1")
    ss2 = find_source("ss2")
    ss3 = find_source("ss3")
    ss4 = find_source("ss4")

    if not any([ss1, ss2, ss3, ss4]):
        print(
            "No source sheets found. Save composite images as:\n"
            f"  {SOURCES / 'ss1.jpg'}  (Axis grid)\n"
            f"  {SOURCES / 'ss2.jpg'}  (SBI Products catalog)\n"
            f"  {SOURCES / 'ss4.jpg'}  (SBI catalog alt)\n"
            "Then run: python scripts/crop-card-sheets.py"
        )
        return

    if ss1:
        print(f"Cropping Axis from {ss1.name}")
        crop_axis_ss1(Image.open(ss1).convert("RGB"))
    sbi_sheet = ss2 or ss4
    if len(sys.argv) > 1:
        custom = Path(sys.argv[1]).expanduser().resolve()
        if custom.is_file():
            sbi_sheet = custom
            print(f"Using SBI catalog from {custom}")

    if sbi_sheet:
        print(f"Cropping SBI Core Cards from {sbi_sheet.name}")
        crop_sbi_catalog(Image.open(sbi_sheet).convert("RGB"))
    if ss3 and not ss1:
        print(f"Cropping Axis from {ss3.name}")
        crop_axis_ss1(Image.open(ss3).convert("RGB"))

    print(f"Done. Card faces in {OUT_PUBLIC}")


if __name__ == "__main__":
    main()
