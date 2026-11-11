#!/usr/bin/env python3
"""Zahlen-Zoo: Belohnungen. Dekoration für die Zoo-Karte (12 Stück, 192 × 192) und
Abzeichen für das Sticker-Album (12 Stück, 256 × 256).

Keine Texte in den Grafiken: Namen und Bedingungen stehen in den Sprachdateien.
Farben, Linienstärken und Hilfsfunktionen aus der Stilprobe. Aufruf: npm run art
"""
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
sys.path.insert(0, str(REPO / "stilprobe"))
import build_assets as ba  # noqa: E402

C, K, SW, SI = ba.C, ba.K, ba.SW, ba.SI
svg, ell, circ, path, rect, limb = ba.svg, ba.ell, ba.circ, ba.path, ba.rect, ba.limb
SHADOW = ba.TOKENS["shadow"]["opacity"]


def shadow(cx=96, cy=176, rx=60, ry=9):
    return ell(cx, cy, rx, ry, K, False, f'opacity="{SHADOW}"')


def star_path(cx, cy, ro, ri, n=5, rot=-90):
    pts = []
    for i in range(2 * n):
        r = ro if i % 2 == 0 else ri
        a = math.radians(rot + i * 180 / n)
        pts.append(f"{cx + r * math.cos(a):.1f} {cy + r * math.sin(a):.1f}")
    return "M " + " L ".join(pts) + " Z"


def flower(x, y, petal, r=9):
    b = ""
    for i in range(5):
        a = math.radians(i * 72 - 90)
        b += circ(x + r * math.cos(a), y + r * math.sin(a), r * 0.75, petal, extra=f'stroke-width="{SI}"')
    return b + circ(x, y, r * 0.55, C["sonne"], extra=f'stroke-width="{SI}"')


# ============================================================ Dekoration (192 × 192)

def deko_ballons():
    b = ""
    for x, y, col, sx in ((70, 62, C["rosa"], 120), (112, 50, C["wasser"], 108), (100, 92, C["sonne"], 112)):
        b += path(f"M {x} {y + 34} Q {x + 6} {y + 70} {sx} 170", sw=SI)
    for x, y, col, _ in ((70, 62, C["rosa"], 0), (112, 50, C["wasser"], 0), (100, 92, C["sonne"], 0)):
        b += ell(x, y, 26, 32, col)
        b += path(f"M {x - 5} {y + 32} L {x} {y + 40} L {x + 5} {y + 32} Z", col, sw=SI)
        b += ell(x - 9, y - 12, 6, 10, C["weiss"], False, 'opacity="0.6"')
    return svg(192, 192, b)


def deko_drachen():
    b = path("M 100 108 C 120 130 90 150 116 168 C 130 178 140 170 150 182", sw=SI)
    for i, (x, y) in enumerate(((112, 132), (106, 152), (126, 170))):
        col = (C["rosa"], C["sonne"], C["wasser"])[i]
        b += path(f"M {x} {y} l -10 -6 l 0 12 z M {x} {y} l 10 -6 l 0 12 z", col, sw=SI)
    b += path("M 96 20 L 150 64 L 100 108 L 46 62 Z", C["orange"])
    b += path("M 96 20 L 100 108 M 46 62 L 150 64", sw=SI)
    b += path("M 96 20 L 150 64 L 98 64 Z", C["sonne"], False, extra='opacity="0.8"')
    return svg(192, 192, b)


def deko_windrad():
    b = shadow()
    b += rect(90, 92, 12, 84, 5, C["erde"])
    for i, col in enumerate((C["rosa"], C["sonne"], C["wasser"], C["gras"])):
        a = i * 90
        b += (f'<g transform="rotate({a} 96 88)">'
              + path("M 96 88 C 96 52 112 36 132 40 C 126 60 116 76 96 88 Z", col) + "</g>")
    b += circ(96, 88, 9, C["papier"])
    return svg(192, 192, b)


def deko_vogelhaus():
    b = shadow()
    b += rect(91, 108, 12, 68, 5, C["erde"])
    b += rect(56, 64, 82, 58, 8, C["orange"])
    b += path("M 46 70 L 97 30 L 148 70 Z", C["rosa"])
    b += circ(97, 90, 12, C["kontur"], False)
    b += rect(90, 106, 16, 6, 3, C["erde"], extra=f'stroke-width="{SI}"')
    # kleiner Vogel auf dem Dach
    b += ell(124, 46, 14, 11, C["wasser"]) + circ(132, 40, 8, C["wasser"])
    b += path("M 139 40 l 7 2 l -7 3 z", C["sonne"], sw=SI) + circ(133, 38, 1.8, K, False)
    return svg(192, 192, b)


def deko_sonnenblumen():
    b = shadow(rx=64)
    for x, top, h in ((64, 70, 106), (100, 46, 130), (136, 82, 94)):
        b += path(f"M {x} {top} L {x} 176", sw=8, extra=f'stroke="{K}"')
        b += path(f"M {x} {top} L {x} 176", sw=4, extra=f'stroke="{C["gras-dunkel"]}"')
        b += ell(x + 14, top + 52, 14, 7, C["gras"], extra=f'transform="rotate(-30 {x + 14} {top + 52})"')
        for i in range(12):
            a = math.radians(i * 30)
            b += ell(x + 20 * math.cos(a), top + 20 * math.sin(a), 9, 5, C["sonne"],
                     extra=f'stroke-width="{SI}" transform="rotate({i * 30} {x + 20 * math.cos(a)} {top + 20 * math.sin(a)})"')
        b += circ(x, top, 13, C["erde"])
    return svg(192, 192, b)


def deko_fahne():
    b = shadow(rx=40)
    b += rect(66, 20, 10, 156, 4, C["grau-warm"])
    b += circ(71, 18, 8, C["sonne"])
    b += path("M 76 30 C 104 22 116 44 150 34 L 150 86 C 116 96 104 74 76 82 Z", C["wasser"])
    b += path("M 76 48 C 104 40 116 62 150 52", sw=SI)
    b += path(star_path(112, 60, 12, 5), C["sonne"], sw=SI)
    return svg(192, 192, b)


def deko_laterne():
    b = shadow(rx=36)
    b += rect(88, 72, 16, 104, 6, C["kontur"], False)
    b += rect(91, 72, 10, 104, 4, C["grau-warm"], False)
    b += rect(76, 166, 40, 12, 5, C["grau-warm"])
    b += path("M 70 46 L 122 46 L 114 86 L 78 86 Z", C["sonne"])
    b += path("M 96 46 L 96 86", sw=SI)
    b += path("M 64 46 L 96 22 L 128 46 Z", C["grau-warm"])
    b += ell(88, 60, 5, 10, C["weiss"], False, 'opacity="0.7"')
    return svg(192, 192, b)


def deko_bank():
    b = shadow(rx=74)
    for x in (42, 150):
        b += rect(x - 6, 112, 12, 62, 4, C["erde"])
    b += rect(26, 104, 140, 18, 6, C["erde"])
    b += rect(26, 62, 140, 16, 6, C["erde"])
    b += rect(26, 82, 140, 16, 6, C["erde"])
    b += path("M 40 112 L 40 60 M 152 112 L 152 60", sw=SI)
    return svg(192, 192, b)


def deko_wegweiser():
    b = shadow(rx=40)
    b += rect(89, 40, 14, 136, 5, C["erde"])
    b += path("M 40 52 L 128 52 L 148 68 L 128 84 L 40 84 Z", C["papier"])
    b += path("M 152 96 L 64 96 L 44 112 L 64 128 L 152 128 Z", C["papier"])
    # Tiersymbole statt Schrift: Pfote und Fisch
    b += circ(70, 68, 6, C["affe-fell"], False) + circ(60, 60, 3.5, C["affe-fell"], False)
    b += circ(70, 57, 3.5, C["affe-fell"], False) + circ(80, 60, 3.5, C["affe-fell"], False)
    b += ell(118, 112, 14, 8, C["wasser"], extra=f'stroke-width="{SI}"')
    b += path("M 104 112 l -10 -8 l 0 16 z", C["wasser"], sw=SI)
    b += circ(96, 34, 9, C["sonne"])
    return svg(192, 192, b)


def deko_blumenkuebel():
    b = shadow(rx=54)
    b += path("M 54 112 L 138 112 L 126 174 L 66 174 Z", C["orange"])
    b += rect(48, 102, 96, 16, 6, C["orange"])
    b += ell(96, 104, 42, 6, C["erde"], False)
    for x, y, col in ((70, 82, C["rosa"]), (96, 66, C["sonne"]), (122, 80, C["rosa"]), (84, 50, C["wasser"]), (112, 52, C["rosa"])):
        b += path(f"M {x} {y} L {96 + (x - 96) * 0.4} 104", sw=SI)
        b += flower(x, y, col, 9)
    b += ell(66, 98, 12, 6, C["gras"], extra=f'stroke-width="{SI}"')
    b += ell(126, 98, 12, 6, C["gras"], extra=f'stroke-width="{SI}"')
    return svg(192, 192, b)


def deko_brunnen():
    b = shadow(rx=76)
    b += ell(96, 150, 76, 26, C["grau-warm"])
    b += ell(96, 146, 62, 18, C["wasser"])
    b += rect(86, 84, 20, 62, 6, C["grau-warm"])
    b += ell(96, 86, 36, 12, C["grau-warm"])
    b += ell(96, 84, 26, 7, C["wasser"], False)
    for dx in (-1, 1):
        b += path(f"M 96 66 C {96 + dx * 30} 40 {96 + dx * 46} 70 {96 + dx * 50} 138", sw=SI,
                  extra=f'stroke="{C["himmel-tief"]}" stroke-width="6"')
    b += path("M 96 80 L 96 50", extra=f'stroke="{C["himmel-tief"]}" stroke-width="8"')
    b += circ(96, 46, 7, C["himmel-tief"], False)
    return svg(192, 192, b)


def deko_ententeich():
    b = ell(96, 132, 84, 42, C["wasser"])
    b += ell(70, 124, 22, 5, C["weiss"], False, 'opacity="0.55"')
    for x in (36, 160):
        b += path(f"M {x} 120 L {x - 4} 82 M {x} 120 L {x + 6} 86", sw=5, extra=f'stroke="{C["gras-dunkel"]}"')
        b += ell(x - 4, 80, 4, 10, C["erde"], extra=f'stroke-width="{SI}"')
    # Ente
    b += ell(104, 136, 30, 18, C["sonne"])
    b += circ(126, 116, 13, C["sonne"])
    b += path("M 137 116 l 14 3 l -14 5 z", C["orange"], sw=SI)
    b += circ(129, 113, 2.6, K, False)
    b += path("M 88 132 C 98 126 108 128 116 136", sw=SI)
    return svg(192, 192, b)


DEKO = {
    "deko_ballons_192": deko_ballons,
    "deko_drachen_192": deko_drachen,
    "deko_windrad_192": deko_windrad,
    "deko_vogelhaus_192": deko_vogelhaus,
    "deko_sonnenblumen_192": deko_sonnenblumen,
    "deko_fahne_192": deko_fahne,
    "deko_laterne_192": deko_laterne,
    "deko_bank_192": deko_bank,
    "deko_wegweiser_192": deko_wegweiser,
    "deko_blumenkuebel_192": deko_blumenkuebel,
    "deko_brunnen_192": deko_brunnen,
    "deko_ententeich_192": deko_ententeich,
}


# ============================================================ Abzeichen (256 × 256)

def medal(color, ring, motif):
    """Rosette: zwei Bänder, gezackter Rand, Fläche mit Motiv (Mitte 128, 112)."""
    b = path("M 92 168 L 70 238 L 96 226 L 110 248 L 124 176 Z", C["wasser"])
    b += path("M 164 168 L 186 238 L 160 226 L 146 248 L 132 176 Z", C["rosa"])
    b += path(star_path(128, 112, 92, 80, n=16, rot=-90), ring)
    b += circ(128, 112, 70, color)
    b += circ(128, 112, 58, C["papier"], extra=f'stroke-width="{SI}" opacity="0.92"')
    b += ell(98, 74, 12, 7, C["weiss"], False, 'opacity="0.55" transform="rotate(-35 98 74)"')
    return svg(256, 256, b + motif)


def m_flag():
    return (rect(98, 64, 8, 92, 3, C["erde"])
            + path("M 106 68 C 130 60 142 82 168 72 L 168 116 C 142 126 130 104 106 112 Z", C["gras"]))


def m_five():
    b = rect(84, 68, 88, 88, 16, C["papier"])
    for x, y in ((106, 90), (150, 90), (128, 112), (106, 134), (150, 134)):
        b += circ(x, y, 9, C["orange"], extra=f'stroke-width="{SI}"')
    return b


def m_three_stars():
    return (path(star_path(128, 96, 28, 12), C["stern"])
            + path(star_path(92, 134, 22, 9.5), C["stern"])
            + path(star_path(164, 134, 22, 9.5), C["stern"]))


def m_star():
    return path(star_path(128, 114, 48, 21), C["stern"]) + ell(114, 100, 6, 9, C["weiss"], False, 'opacity="0.6"')


def m_crown():
    b = path("M 80 146 L 76 84 L 104 112 L 128 72 L 152 112 L 180 84 L 176 146 Z", C["sonne"])
    b += rect(78, 140, 100, 16, 6, C["orange"])
    for x, y in ((76, 82), (128, 70), (180, 82)):
        b += circ(x, y, 7, C["rosa"], extra=f'stroke-width="{SI}"')
    return b


def m_podium():
    b = rect(84, 116, 30, 42, 4, C["grau-warm"])
    b += rect(114, 96, 30, 62, 4, C["sonne"])
    b += rect(144, 76, 30, 82, 4, C["orange"])
    b += path(star_path(159, 60, 14, 6), C["stern"], sw=SI)
    return b


def m_trophy():
    b = path("M 96 72 L 160 72 C 160 112 146 128 128 130 C 110 128 96 112 96 72 Z", C["sonne"])
    b += path("M 96 80 C 74 80 76 108 100 108 M 160 80 C 182 80 180 108 156 108", sw=SI + 1)
    b += rect(120, 128, 16, 16, 3, C["sonne"])
    b += rect(102, 142, 52, 16, 5, C["erde"])
    b += path(star_path(128, 96, 13, 6), C["papier"], sw=SI)
    return b


def m_dots():
    b = ""
    for r in range(4):
        for c in range(5):
            col = C["wasser"] if r < 2 else C["orange"]
            b += circ(92 + c * 18, 85 + r * 18, 6.5, col, extra=f'stroke-width="{SI}"')
    return b


def m_clock():
    b = circ(128, 112, 40, C["papier"])
    for i in range(12):
        a = math.radians(i * 30)
        b += path(f"M {128 + 32 * math.sin(a):.1f} {112 - 32 * math.cos(a):.1f} L {128 + 37 * math.sin(a):.1f} {112 - 37 * math.cos(a):.1f}", sw=SI)
    b += limb(128, 112, 128, 84, 6, C["wasser"]) + limb(128, 112, 146, 120, 8, C["orange"])
    b += circ(128, 112, 5, K, False)
    return b


def m_coin():
    b = circ(128, 112, 40, C["sonne"])
    b += circ(128, 112, 30, C["stern"], extra=f'stroke-width="{SI}"')
    b += path(star_path(128, 112, 16, 7), C["papier"], sw=SI)
    return b


def m_bulb():
    b = path("M 128 66 C 104 66 94 86 98 102 C 102 118 114 122 116 136 L 140 136 C 142 122 154 118 158 102 C 162 86 152 66 128 66 Z", C["sonne"])
    b += rect(114, 136, 28, 12, 4, C["grau-warm"]) + rect(118, 148, 20, 8, 4, C["grau-warm"])
    b += path("M 120 118 C 120 104 136 104 136 118", sw=SI)
    for a in (-60, -20, 20, 60):
        r = math.radians(a - 90)
        b += path(f"M {128 + 50 * math.cos(r):.1f} {104 + 50 * math.sin(r):.1f} L {128 + 60 * math.cos(r):.1f} {104 + 60 * math.sin(r):.1f}", sw=SI + 1)
    return b


def m_heart():
    return path("M 128 152 C 84 122 80 92 98 80 C 112 70 126 78 128 92 C 130 78 144 70 158 80 C 176 92 172 122 128 152 Z", C["rosa"]) + \
        ell(108, 90, 6, 9, C["weiss"], False, 'opacity="0.6"')


ABZEICHEN = {
    "abzeichen_erste_runde_256": (C["gras"], C["gras-dunkel"], m_flag),
    "abzeichen_fuenf_ohne_hilfe_256": (C["orange"], C["sonne"], m_five),
    "abzeichen_drei_sterne_256": (C["wasser"], C["himmel-tief"], m_three_stars),
    "abzeichen_sterne_25_256": (C["sonne"], C["stern"], m_star),
    "abzeichen_sterne_100_256": (C["rosa"], C["sonne"], m_crown),
    "abzeichen_stufe_3_256": (C["gras"], C["sonne"], m_podium),
    "abzeichen_gehege_fertig_256": (C["orange"], C["stern"], m_trophy),
    "abzeichen_einmaleins_256": (C["himmel-tief"], C["wasser"], m_dots),
    "abzeichen_uhr_256": (C["laub-hell"], C["gras"], m_clock),
    "abzeichen_geld_256": (C["erde"], C["sonne"], m_coin),
    "abzeichen_drangeblieben_256": (C["rosa"], C["orange"], m_bulb),
    "abzeichen_baby_256": (C["ohr-rosa"], C["rosa"], m_heart),
}


def main():
    out = ROOT / "svg"
    out.mkdir(exist_ok=True)
    for name, fn in DEKO.items():
        (out / f"{name}.svg").write_text(fn(), encoding="utf-8")
    for name, (color, ring, motif) in ABZEICHEN.items():
        (out / f"{name}.svg").write_text(medal(color, ring, motif()), encoding="utf-8")
    print(f"{len(DEKO)} Dekorationen, {len(ABZEICHEN)} Abzeichen")


if __name__ == "__main__":
    main()
