#!/usr/bin/env python3
"""Zahlen-Zoo: stilisierte Münzen und Scheine für die Zoo-Kasse.

Eigene, vereinfachte Darstellung (Spezifikation, Abschnitt 11: nicht nach echten
Münzen oder Scheinen). Keine Texte in der Grafik: Werte setzt das Spiel darauf.
Farben nur aus der Stilprobe. Aufruf: npm run art
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
sys.path.insert(0, str(REPO / "stilprobe"))
import build_assets as ba  # noqa: E402

C, K, SW, SI = ba.C, ba.K, ba.SW, ba.SI
svg, ell, circ, path, rect = ba.svg, ba.ell, ba.circ, ba.path, ba.rect


def coin(fill, ring=None, inner=None):
    """Münze 128 × 128: Rand mit Riffelung, Innenfläche für den Wert."""
    b = circ(64, 64, 58, ring or fill)
    for i in range(24):
        import math
        a = i * math.pi / 12
        b += path(f"M {64 + 52 * math.cos(a)} {64 + 52 * math.sin(a)} L {64 + 57 * math.cos(a)} {64 + 57 * math.sin(a)}",
                  sw=2, extra='opacity="0.35"')
    b += circ(64, 64, 44, inner or fill, extra=f'stroke-width="{SI}"')
    b += ell(44, 42, 12, 7, C["weiss"], False, 'opacity="0.45"')
    return svg(128, 128, b)


def note(fill):
    """Schein 240 × 128 mit Rand, Muster und freier Fläche für den Wert."""
    b = rect(6, 10, 228, 108, 14, fill)
    b += rect(18, 22, 204, 84, 8, C["papier"], extra=f'stroke-width="{SI}" opacity="0.55"')
    for x in (34, 50, 66):
        b += circ(x, 64, 8, fill, False, 'opacity="0.6"')
    b += path("M 160 30 Q 200 64 160 98", sw=SI, extra='opacity="0.5"')
    b += path("M 176 30 Q 216 64 176 98", sw=SI, extra='opacity="0.5"')
    return svg(240, 128, b)


FILES = {
    # Cent: kupferfarben (1, 2, 5) und goldfarben (10, 20, 50); Euro: zweifarbig
    "geld_muenze_kupfer_128": coin(C["erde"]),
    "geld_muenze_gold_128": coin(C["sonne"]),
    "geld_muenze_euro1_128": coin(C["grau-warm"], ring=C["sonne"], inner=C["grau-warm"]),
    "geld_muenze_euro2_128": coin(C["sonne"], ring=C["grau-warm"], inner=C["sonne"]),
    "geld_schein_5_240x128": note(C["grau-warm"]),
    "geld_schein_10_240x128": note(C["rosa"]),
    "geld_schein_20_240x128": note(C["himmel-tief"]),
    "geld_schein_50_240x128": note(C["orange"]),
}


def main():
    out = ROOT / "svg"
    out.mkdir(exist_ok=True)
    for name, content in FILES.items():
        (out / f"{name}.svg").write_text(content, encoding="utf-8")
    print("SVG:", len(FILES), "->", out.relative_to(REPO))


if __name__ == "__main__":
    main()
