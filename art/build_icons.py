#!/usr/bin/env python3
"""Zahlen-Zoo: App-Symbole (PWA, Startbildschirm, Favicon) aus dem fertigen Affenbild.

Sonnengelber Grund mit Kontur, darauf der fröhliche Affe des Affenwalds (erstes Gehege).
Maskierbare Variante: Grund bis zum Rand, Affe in der sicheren Mitte (80 %).
Aufruf: npm run art  (oder einzeln: python3 art/build_icons.py); schreibt public/icons/.
Farben aus stilprobe/tokens.json.
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
TOKENS = json.loads((REPO / "stilprobe" / "tokens.json").read_text(encoding="utf-8"))
OUT = REPO / "public" / "icons"
ANIMAL = REPO / "public" / "assets" / "img" / "animals" / "affenwald_affe_froh_512.png"


def color(name: str) -> str:
    entry = TOKENS["colors"].get(name)
    if not entry:
        raise SystemExit(f"Farbe {name} fehlt in tokens.json")
    return entry["hex"]


SUN = color("sonne")
OUTLINE = color("kontur")


def icon(size: int, maskable: bool) -> Image.Image:
    scale = 4  # glatte Kanten: groß zeichnen, dann verkleinern
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    if maskable:
        d.rectangle([0, 0, s, s], fill=SUN)
        inner = 0.62
    else:
        pad = round(s * 0.04)
        d.rounded_rectangle([pad, pad, s - pad, s - pad], radius=round(s * 0.22), fill=SUN,
                            outline=OUTLINE, width=max(4, round(s * 0.03)))
        inner = 0.78
    animal = Image.open(ANIMAL).convert("RGBA")
    box = animal.getbbox()
    if box:
        animal = animal.crop(box)
    target = round(s * inner)
    ratio = target / max(animal.size)
    animal = animal.resize((round(animal.width * ratio), round(animal.height * ratio)), Image.LANCZOS)
    img.alpha_composite(animal, ((s - animal.width) // 2, (s - animal.height) // 2 + round(s * 0.02)))
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    icon(192, False).save(OUT / "icon-192.png")
    icon(512, False).save(OUT / "icon-512.png")
    icon(512, True).save(OUT / "icon-512-maskable.png")
    icon(180, True).convert("RGB").save(OUT / "apple-touch-icon-180.png")
    icon(64, False).save(OUT / "favicon-64.png")
    icon(32, False).save(OUT / "favicon-32.png")
    print("Symbole geschrieben:", ", ".join(sorted(p.name for p in OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
