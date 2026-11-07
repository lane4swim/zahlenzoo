#!/usr/bin/env python3
"""Zahlen-Zoo: SVG-Quellen für die Zoo-Karte und die Kartensymbole.

Nutzt Hilfsfunktionen, Linienstärken und Farben der Stilprobe
(`stilprobe/build_assets.py`, `stilprobe/tokens.json`); keine anderen Farbwerte.
Aufruf: npm run art  (schreibt art/svg/*.svg und rendert PNG nach public/assets/img/map/)
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
sys.path.insert(0, str(REPO / "stilprobe"))
import build_assets as ba  # noqa: E402  (Hilfsfunktionen der Stilprobe)

C, K, SW, SI = ba.C, ba.K, ba.SW, ba.SI
svg, ell, circ, path, rect, tree, cloud = ba.svg, ba.ell, ba.circ, ba.path, ba.rect, ba.tree, ba.cloud
P = C["pinguin-gefieder"]

LAYOUT = json.loads((REPO / "src" / "data" / "map-layout.json").read_text(encoding="utf-8"))["areas"]
PLOT_W, PLOT_H = 214, 168
PATH_Y = 415


def shadow(cx, cy, rx, ry):
    return ell(cx, cy, rx, ry, K, False, f'opacity="{ba.TOKENS["shadow"]["opacity"]}"')


def plot(cx, cy, fill):
    """Gehege: abgerundete Fläche mit Kontur und Zaunpfosten an der Rückseite."""
    x, y = cx - PLOT_W / 2, cy - PLOT_H / 2
    out = rect(x, y, PLOT_W, PLOT_H, 34, fill)
    for i in range(1, 6):
        px = x + i * PLOT_W / 6
        out += rect(px - 4, y - 12, 8, 18, 3, C["erde"])
    out += path(f"M {x + 16} {y - 4} H {x + PLOT_W - 16}", sw=SI)
    return out


def small_tree(x, base, s=1.0):
    return ba.tree(x, base, 18 * s, base - 46 * s, [(0, -12 * s, 30 * s), (20 * s, 0, 22 * s), (-20 * s, 0, 22 * s)])


def flower(x, y, color):
    return circ(x, y, 7, C[color]) + circ(x, y, 2.5, C["orange"], False)


# ------------------------------------------------------------- Gehege-Motive
def deco_affenwald(cx, cy):
    return (plot(cx, cy, C["gras"]) + small_tree(cx - 72, cy - 8) + small_tree(cx + 72, cy - 8)
            + ba.banana(cx + 84, cy + 30, 10, 0.45))


def rock(x, base, w, h):
    """Felsen mit Schneekappe."""
    body = f"M {x - w / 2} {base} Q {x - w / 2} {base - h} {x} {base - h} Q {x + w / 2} {base - h} {x + w / 2} {base} Z"
    cap = (f"M {x - w * 0.3} {base - h * 0.78} Q {x} {base - h * 1.04} {x + w * 0.3} {base - h * 0.78} "
           f"Q {x + w * 0.12} {base - h * 0.66} {x} {base - h * 0.74} Q {x - w * 0.14} {base - h * 0.64} "
           f"{x - w * 0.3} {base - h * 0.78} Z")
    return path(body, C["grau-warm"]) + path(cap, C["weiss"], sw=SI)


def deco_pinguinfelsen(cx, cy):
    out = plot(cx, cy, C["himmel-tief"])
    out += ell(cx - 60, cy + 44, 30, 10, C["weiss"], False, 'opacity="0.6"')
    out += ell(cx + 70, cy + 52, 22, 8, C["weiss"], False, 'opacity="0.6"')
    out += rock(cx - 70, cy + 4, 70, 70) + rock(cx + 74, cy - 2, 60, 58)
    out += ell(cx + 8, cy - 58, 26, 8, C["weiss"])
    return out


def deco_elefantenwiese(cx, cy):
    out = plot(cx, cy, C["gras-hell"])
    out += ell(cx - 66, cy + 40, 36, 18, C["himmel-tief"])
    out += ell(cx + 76, cy - 30, 26, 16, C["gras-dunkel"]) + ell(cx - 80, cy - 34, 22, 14, C["gras-dunkel"])
    return out


def deco_zookasse(cx, cy):
    out = plot(cx, cy, C["karte-schatten"])
    bx, by = cx + 52, cy - 60
    out += rect(bx, by + 18, 44, 40, 6, C["papier"])
    out += rect(bx + 10, by + 28, 24, 14, 4, C["himmel"])
    out += path(f"M {bx - 6} {by + 20} L {bx + 22} {by} L {bx + 50} {by + 20} Z", C["orange"])
    out += circ(cx - 78, cy + 38, 9, C["stern"]) + circ(cx - 60, cy + 46, 9, C["stern"])
    return out


def deco_futteruhr(cx, cy):
    out = plot(cx, cy, C["gras"])
    x, y = cx + 72, cy - 40
    out += rect(x - 5, y, 10, 56, 4, C["erde"])
    out += circ(x, y, 24, C["papier"])
    out += path(f"M {x} {y} V {y - 15}", sw=SI) + path(f"M {x} {y} H {x + 11}", sw=SI)
    out += circ(x, y, 2.5, K, False)
    out += rect(cx - 98, cy + 28, 40, 16, 8, C["erde"])
    return out


def deco_schmetterlingshaus(cx, cy):
    out = plot(cx, cy, C["gras-hell"])
    x, y = cx - 64, cy - 30
    out += path(f"M {x - 32} {y + 26} V {y} A 32 32 0 0 1 {x + 32} {y} V {y + 26} Z", C["himmel"])
    out += path(f"M {x} {y - 32} V {y + 26}", sw=SI) + path(f"M {x - 32} {y + 4} H {x + 32}", sw=SI)
    for (fx, fy, c) in [(cx + 60, cy - 46, "rosa"), (cx + 84, cy - 30, "sonne"), (cx + 88, cy + 34, "rosa"),
                        (cx - 92, cy + 44, "sonne")]:
        out += flower(fx, fy, c)
    return out


def acacia(x, base):
    return (rect(x - 5, base - 50, 10, 50, 4, C["erde"])
            + ell(x, base - 54, 36, 13, C["laub"]))


def deco_giraffenhof(cx, cy):
    out = plot(cx, cy, C["karte-schatten"])
    out += acacia(cx - 74, cy - 6) + acacia(cx + 76, cy + 4)
    return out


def deco_zoozaehlung(cx, cy):
    out = plot(cx, cy, C["karte-schatten"])
    for (mx, my) in [(cx - 72, cy - 34), (cx + 74, cy - 28), (cx + 78, cy + 42)]:
        out += ell(mx, my, 26, 14, C["erde"]) + ell(mx, my - 2, 10, 5, K, False)
    return out


DECO = {
    "affenwald": deco_affenwald,
    "pinguinfelsen": deco_pinguinfelsen,
    "elefantenwiese": deco_elefantenwiese,
    "zookasse": deco_zookasse,
    "futteruhr": deco_futteruhr,
    "schmetterlingshaus": deco_schmetterlingshaus,
    "giraffenhof": deco_giraffenhof,
    "zoozaehlung": deco_zoozaehlung,
}


# ------------------------------------------------------------- Hintergrund
def background_map():
    b = []
    b.append(rect(0, 0, 1024, 768, 0, C["gras-hell"], False))
    # Himmel hinter Titel und Knöpfen
    b.append(rect(0, 0, 1024, 118, 0, C["himmel"], False))
    b.append(path("M 0 118 Q 128 98 256 118 T 512 118 T 768 118 T 1024 118 V 0 H 0 Z", C["himmel"], False))
    b.append(path("M 0 128 Q 160 92 340 120 T 700 112 T 1024 124 V 150 H 0 Z", C["laub-hell"], False))
    b.append(cloud(330, 52, 0.55) + cloud(760, 66, 0.5))
    # Hauptweg zwischen den Reihen, mit Abzweigen zu jedem Gehege
    main = f"M -20 {PATH_Y} Q 128 {PATH_Y - 22} 256 {PATH_Y} T 512 {PATH_Y} T 768 {PATH_Y} T 1044 {PATH_Y}"
    spurs = []
    for a in LAYOUT.values():
        top_row = a["y"] < PATH_Y
        y_edge = a["y"] + PLOT_H / 2 - 10 if top_row else a["y"] - PLOT_H / 2 + 10
        spurs.append(f"M {a['x']} {y_edge} L {a['x']} {PATH_Y}")
    for d, w in [(main, 46), *[(s, 34) for s in spurs]]:
        b.append(path(d, sw=w + 2 * SW, extra=f'stroke="{K}"'))
    for d, w in [(main, 46), *[(s, 34) for s in spurs]]:
        b.append(path(d, sw=w, extra=f'stroke="{C["karte-schatten"]}"'))
    for x in range(40, 1024, 92):
        b.append(ell(x, PATH_Y + 2, 6, 3, C["erde"], False, 'opacity="0.45"'))
    # Gehege
    for area_id, a in LAYOUT.items():
        b.append(DECO[area_id](a["x"], a["y"]))
    # Ränder: Büsche, Bäume, Blumen
    for (x, y) in [(18, 170), (1006, 176), (24, 720), (1000, 716), (272, 740), (520, 748), (760, 742)]:
        b.append(ell(x, y, 46, 26, C["gras-dunkel"]))
    b.append(small_tree(272, 180, 0.9) + small_tree(518, 176, 0.9) + small_tree(760, 182, 0.9))
    for (x, y, c) in [(70, 460, "rosa"), (300, 456, "sonne"), (500, 368, "weiss"), (560, 458, "rosa"),
                      (790, 458, "sonne"), (990, 370, "rosa"), (34, 370, "sonne"), (740, 370, "weiss")]:
        b.append(flower(x, y, c))
    return svg(1024, 768, "".join(b))


# ------------------------------------------------------------- Kartensymbole 128 × 128
def badge(inner):
    return svg(128, 128, shadow(64, 120, 40, 6) + circ(64, 62, 56, C["papier"]) + inner)


def eye(cx, cy):
    return circ(cx, cy, 5.5, K, False) + circ(cx - 2, cy - 2, 2, C["weiss"], False) + circ(cx + 2, cy + 2, 1, C["weiss"], False)


def icon_monkey():
    F, H, D = C["affe-fell"], C["affe-hell"], C["affe-dunkel"]
    s = ""
    for x in (27, 101):
        s += circ(x, 62, 14, F) + circ(x, 62, 7, C["ohr-rosa"], False)
    s += path("M 56 30 C 52 18 62 14 64 22 C 68 14 78 18 72 31 Z", D)
    s += ell(64, 64, 38, 34, F)
    s += ell(54, 60, 17, 15, H, False) + ell(74, 60, 17, 15, H, False) + ell(64, 76, 24, 15, H, False)
    s += ell(40, 76, 6, 4, C["rosa"], False, 'opacity="0.55"') + ell(88, 76, 6, 4, C["rosa"], False, 'opacity="0.55"')
    s += eye(54, 60) + eye(74, 60)
    s += circ(61.5, 70, 1.6, D, False) + circ(66.5, 70, 1.6, D, False)
    s += path("M 57 77 Q 64 83 71 77", sw=SI)
    return badge(s)


def icon_penguin():
    s = circ(64, 64, 38, P)
    s += ell(53, 69, 16, 19, C["papier"], False) + ell(75, 69, 16, 19, C["papier"], False)
    s += ell(64, 82, 22, 13, C["papier"], False)
    s += ell(42, 80, 6, 4, C["rosa"], False, 'opacity="0.55"') + ell(86, 80, 6, 4, C["rosa"], False, 'opacity="0.55"')
    s += eye(54, 66) + eye(74, 66)
    s += path("M 57 75 L 71 75 L 64 85 Z", C["orange"], sw=SI)
    s += circ(52, 40, 6, C["weiss"], False, 'opacity="0.35"')
    return badge(s)


def icon_lock():
    s = shadow(64, 120, 34, 6)
    s += path("M 44 60 V 44 A 20 20 0 0 1 84 44 V 60", sw=14 + 2 * SW, extra=f'stroke="{K}"')
    s += path("M 44 60 V 44 A 20 20 0 0 1 84 44 V 60", sw=14, extra=f'stroke="{C["grau-warm"]}"')
    s += rect(28, 56, 72, 56, 14, C["stern"])
    s += circ(64, 78, 8, K, False) + rect(60.5, 80, 7, 18, 3, K, False)
    s += rect(36, 62, 10, 22, 5, C["weiss"], False, 'opacity="0.45"')
    return svg(128, 128, s)


def icon_sign():
    s = shadow(64, 120, 40, 6)
    s += rect(30, 60, 12, 58, 5, C["erde"]) + rect(86, 60, 12, 58, 5, C["erde"])
    s += rect(14, 26, 100, 56, 12, C["papier"])
    return svg(128, 128, s)


FILES = {
    "karte_hintergrund_1024x768": background_map(),
    "karte_affe_128": icon_monkey(),
    "karte_pinguin_128": icon_penguin(),
    "karte_schloss_128": icon_lock(),
    "karte_schild_128": icon_sign(),
}


def main():
    out = ROOT / "svg"
    out.mkdir(exist_ok=True)
    for name, content in FILES.items():
        (out / f"{name}.svg").write_text(content, encoding="utf-8")
    print("SVG:", len(FILES), "->", out.relative_to(REPO))


if __name__ == "__main__":
    main()
