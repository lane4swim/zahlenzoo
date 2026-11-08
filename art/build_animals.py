#!/usr/bin/env python3
"""Zahlen-Zoo: die übrigen sechs Tiere (Elefant, Papagei, Eule, Schmetterling,
Giraffe, Erdmännchen) mit derselben Ausstattung wie Pinguin und Affe:
5 Ausdrücke, Idle (6), Freude (8), Fütterung (8), Baby und Kartensymbol 128 × 128.

Jedes Tier zeichnet nur Körper und Kopf; Ausdrücke, Bewegungen, Baby und Symbol
entstehen im gemeinsamen Gerüst. Farben nur aus der Stilprobe.
Aufruf: npm run art
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
sys.path.insert(0, str(REPO / "stilprobe"))
sys.path.insert(0, str(ROOT))
import build_assets as ba  # noqa: E402
import build_scenes as bs  # noqa: E402

C, K, SW, SI = ba.C, ba.K, ba.SW, ba.SI
svg, ell, circ, path, rect, limb = ba.svg, ba.ell, ba.circ, ba.path, ba.rect, ba.limb
SHADOW = ba.TOKENS["shadow"]["opacity"]


# ============================================================== Hilfen
def rot(body, angle, cx, cy):
    return f'<g transform="rotate({angle} {cx} {cy})">{body}</g>'


def place(body, x, y, s=1.0, cx=256, cy=276):
    """Verschiebt eine Form, deren Mitte (cx, cy) ist, nach (x, y) und skaliert sie."""
    return f'<g transform="translate({x},{y}) scale({s}) translate({-cx},{-cy})">{body}</g>'


def mouth_at(kind, x, y, s, tag):
    """Mund der Stilprobe (Affe), verschoben und skaliert. kind: smile, open, big, wave, flat."""
    m = ba.mouth(kind, f"{tag}-m")
    if isinstance(m, tuple):
        return m[0], place(m[1], x, y, s)
    return "", place(m, x, y, s)


def beak_at(kind, x, y, s, tag):
    """Schnabel des Pinguins, verschoben und skaliert. kind: closed, open, big, puff."""
    defs, b = bs.beak(kind, f"{tag}-b")
    return defs, place(b, x, y, s, 256, 246)


MAMMAL_MOUTH = {"closed": "smile", "open": "open", "big": "big", "wave": "wave", "flat": "flat", "puff": "flat"}


def cheeks(x1, x2, y, rx=16, ry=10):
    return (ell(x1, y, rx, ry, C["rosa"], False, 'opacity="0.55"')
            + ell(x2, y, rx, ry, C["rosa"], False, 'opacity="0.55"'))


def brow(on, x, y):
    return path(f"M {x} {y} Q {x + 18} {y - 12} {x + 38} {y}", sw=5) if on else ""


# ============================================================== Futter (Mitte 0, 0)
def item(name):
    if name == "heu":
        out = ell(0, 0, 36, 22, C["sonne"])
        for dx in (-20, -8, 4, 16):
            out += path(f"M {dx} -14 Q {dx + 4} 0 {dx} 14", sw=2, extra='opacity="0.6"')
        return out + rect(-6, -22, 12, 44, 4, C["erde"])
    if name == "nuss":
        return (ell(0, 0, 24, 30, C["erde"]) + path("M 0 -26 Q 6 0 0 26", sw=2, extra='opacity="0.6"')
                + ell(-8, -10, 5, 8, C["weiss"], False, 'opacity="0.4"'))
    if name == "beeren":
        return (path("M 0 -26 Q 16 -36 26 -24 Q 12 -20 0 -26 Z", C["gras"], sw=SI)
                + circ(-12, 8, 14, C["wasser"]) + circ(12, 8, 14, C["wasser"]) + circ(0, -10, 14, C["wasser"])
                + circ(-4, -14, 3, C["weiss"], False))
    if name == "bluete":
        out = ""
        for i in range(5):
            out += rot(ell(0, -18, 12, 18, C["rosa"]), i * 72, 0, 0)
        return out + circ(0, 0, 11, C["sonne"])
    if name == "zweig":
        out = path("M -30 18 Q 0 4 30 -16", sw=6, extra=f'stroke="{C["erde"]}"')
        for (x, y, a) in [(-14, 4, -30), (4, -6, 20), (20, -14, -40)]:
            out += rot(ell(x, y - 12, 9, 15, C["laub"]), a, x, y)
        return out
    if name == "kaefer":
        return (ell(0, 6, 24, 20, C["orange"]) + circ(0, -16, 10, K, False)
                + path("M 0 -12 V 24", sw=SI) + circ(-10, 4, 3.5, K, False) + circ(10, 10, 3.5, K, False)
                + circ(-8, 16, 3, K, False))
    raise ValueError(name)


def item_at(name, x, y, s=1.0, angle=0):
    inner = scale_strokes(item(name), 1 / s)
    return f'<g transform="translate({x},{y}) rotate({angle}) scale({s})" stroke-width="{SW / s:.2f}">{inner}</g>'


# ============================================================== Tiere
# Jede Funktion liefert (defs, body, head, front). Pose: eyes, mouth, limbs (down|mid|up), bob, brow.

def elephant(eyes, mouth, limbs, bob, brow_on, tag):
    E = C["elefant-haut"]
    body = path("M 350 420 Q 392 426 386 462", sw=12, extra=f'stroke="{K}"') + path(
        "M 350 420 Q 392 426 386 462", sw=6, extra=f'stroke="{E}"')
    body += ell(256, 372 + bob * 0.5, 118, 96 - bob * 0.5, E)
    body += ell(222, 352, 22, 30, C["weiss"], False, 'opacity="0.3"')
    for x in (178, 278):
        body += rect(x, 392, 56, 90, 22, E)
        for nx in (x + 14, x + 28, x + 42):
            body += ell(nx, 474, 6, 4, C["papier"], False)
    spread = 18 if limbs == "up" else 0
    head = ""
    for side in (-1, 1):
        ex = 256 + side * (112 + spread)
        head += ell(ex, 212 - spread / 2, 78 + spread / 2, 92, E)
        head += ell(ex + side * -8, 218 - spread / 2, 50, 62, C["ohr-rosa"], False)
    head += circ(256, 206, 104, E)
    head += circ(214, 152, 16, C["weiss"], False, 'opacity="0.3"')
    head += path("M 246 104 Q 240 84 250 76 M 256 102 Q 256 80 264 74 M 266 104 Q 274 86 284 84", sw=SI)
    head += cheeks(194, 318, 246)
    head += ba.eye(216, 194, eyes) + ba.eye(296, 194, eyes) + brow(brow_on, 280, 162)
    defs, m = mouth_at(MAMMAL_MOUTH[mouth], 296, 282, 0.55, tag)
    head += m
    trunk = {
        "down": "M 256 228 C 256 272 240 304 212 314",
        "mid": "M 256 228 C 252 268 228 290 196 284",
        "up": "M 256 228 C 256 184 296 152 330 124",
    }[limbs]
    tip = {"down": (212, 314), "mid": (196, 284), "up": (330, 124)}[limbs]
    head += path(trunk, sw=40 + 2 * SW, extra=f'stroke="{K}"') + path(trunk, sw=40, extra=f'stroke="{E}"')
    head += circ(tip[0], tip[1], 21, E) + circ(tip[0] - 6, tip[1], 3, K, False) + circ(tip[0] + 6, tip[1], 3, K, False)
    for y in (252, 270):
        head += path(f"M 240 {y} Q 256 {y + 6} 272 {y}", sw=2, extra='opacity="0.4"') if limbs != "up" else ""
    return defs, body, head, ""


FLAP = {
    "down": ((150, 352, 18), (362, 352, -18)),
    "mid": ((128, 300, 62), (384, 300, -62)),
    "up": ((140, 232, 145), (372, 232, -145)),
}


def wings(color, limbs, bob, rx=26, ry=78, tip=None):
    out = ""
    for (cx, cy, r) in FLAP[limbs]:
        cy = cy + bob * 0.5
        w = ell(cx, cy, rx, ry, color)
        if tip:
            w += ell(cx, cy + ry * 0.55, rx * 0.8, ry * 0.35, tip, False)
        out += rot(w, r, cx, cy)
    return out


def parrot(eyes, mouth, limbs, bob, brow_on, tag):
    G = C["gras"]
    body = ""
    for (dx, col) in [(-14, "rosa"), (0, "wasser"), (14, "orange")]:
        body += path(f"M {268 + dx} 430 Q {296 + dx} 470 {312 + dx} 506 Q {288 + dx} 488 {262 + dx} 452 Z", C[col], sw=SI)
    body += ell(226, 470, 26, 12, C["grau-warm"]) + ell(286, 470, 26, 12, C["grau-warm"])
    body += ell(256, 352 + bob * 0.5, 104, 120 - bob * 0.5, G)
    body += ell(256, 382 + bob * 0.4, 64, 80 - bob * 0.4, C["sonne"], False)
    body += ell(222, 320, 14, 24, C["weiss"], False, 'opacity="0.35"')
    front = wings(C["wasser"], limbs, bob, 26, 76, C["orange"])
    head = ""
    for (dx, col, h) in [(-18, "rosa", 46), (0, "orange", 62), (18, "sonne", 46)]:
        head += path(f"M {248 + dx} 116 Q {240 + dx} {116 - h} {256 + dx} {100 - h} Q {266 + dx} {116 - h / 2} {264 + dx} 116 Z", C[col])
    head += circ(256, 196, 92, G)
    head += ell(218, 190, 36, 40, C["papier"], False) + ell(294, 190, 36, 40, C["papier"], False)
    head += cheeks(186, 326, 234)
    head += ba.eye(220, 190, eyes) + ba.eye(292, 190, eyes) + brow(brow_on, 276, 154)
    defs, b = beak_at(mouth, 256, 238, 0.95, tag)
    head += b
    return defs, body, head, front


def owl(eyes, mouth, limbs, bob, brow_on, tag):
    O = C["erde"]
    body = ell(220, 472, 24, 10, C["orange"]) + ell(292, 472, 24, 10, C["orange"])
    body += ell(256, 372 + bob * 0.5, 118, 108 - bob * 0.5, O)
    body += ell(256, 392 + bob * 0.4, 78, 80 - bob * 0.4, C["karte-schatten"], False)
    for (x, y) in [(232, 350), (280, 350), (256, 380), (226, 410), (286, 410), (256, 440)]:
        body += path(f"M {x - 10} {y} Q {x} {y + 10} {x + 10} {y}", sw=SI, extra='opacity="0.6"')
    front = wings(O, limbs, bob, 30, 80)
    head = path("M 168 168 L 172 100 L 216 140 Z", O) + path("M 344 168 L 340 100 L 296 140 Z", O)
    head += ell(256, 206, 114, 100, O)
    head += circ(212, 204, 48, C["papier"], extra=f'stroke-width="{SI}"')
    head += circ(300, 204, 48, C["papier"], extra=f'stroke-width="{SI}"')
    head += cheeks(176, 336, 246, 14, 9)
    head += ba.eye(212, 204, eyes) + ba.eye(300, 204, eyes) + brow(brow_on, 282, 150)
    defs, b = beak_at(mouth, 256, 250, 0.6, tag)
    head += b
    return defs, body, head, front


def butterfly(eyes, mouth, limbs, bob, brow_on, tag):
    D = C["affe-dunkel"]
    sx = {"down": 1.0, "mid": 0.72, "up": 1.0}[limbs]
    lift_w = {"down": 0, "mid": 0, "up": -18}[limbs]
    w = ""
    for side in (-1, 1):
        ux, lx = 256 + side * 92, 256 + side * 70
        upper = rot(ell(ux, 262 + lift_w, 88, 104, C["rosa"]), side * 20, ux, 262 + lift_w)
        upper += circ(ux + side * 14, 246 + lift_w, 24, C["sonne"]) + circ(ux - side * 26, 296 + lift_w, 12, C["weiss"], False, 'opacity="0.7"')
        lower = rot(ell(lx, 386, 62, 70, C["orange"]), side * -20, lx, 386)
        lower += circ(lx + side * 8, 396, 14, C["papier"])
        w += upper + lower
    body = f'<g transform="translate(256 330) scale({sx} 1) translate(-256 -330)">{w}</g>'
    body += ell(256, 481, 60, 10, K, False, f'opacity="{SHADOW * 0.6}"')
    body += rect(230, 240 + bob * 0.5, 52, 210, 26, D)
    for y in (300, 340, 380, 420):
        body += path(f"M 238 {y} H 274", sw=2, extra='opacity="0.4"')
    head = path("M 236 140 Q 210 96 200 68", sw=5) + circ(198, 64, 10, D)
    head += path("M 276 140 Q 302 96 312 68", sw=5) + circ(314, 64, 10, D)
    head += circ(256, 190, 72, D)
    head += ell(256, 200, 56, 46, C["affe-hell"], False)
    head += cheeks(214, 298, 220, 11, 7)
    head += ba.eye(234, 190, eyes) + ba.eye(278, 190, eyes) + brow(brow_on, 262, 162)
    defs, m = mouth_at(MAMMAL_MOUTH[mouth], 256, 226, 0.45, tag)
    head += m
    return defs, body, head, ""


def giraffe(eyes, mouth, limbs, bob, brow_on, tag):
    Y, S, D = C["sonne"], C["erde"], C["affe-dunkel"]
    body = path("M 340 400 Q 368 420 372 450", sw=4) + ell(374, 456, 7, 10, D)
    body += rect(222, 214 - bob * 0.5, 68, 200, 30, Y)
    for (x, y) in [(240, 260), (268, 300), (244, 340), (270, 380)]:
        body += ell(x, y, 11, 9, S, False)
    body += ell(256, 394 + bob * 0.3, 104, 62, Y)
    for (x, y) in [(200, 390), (300, 382), (256, 410), (330, 410)]:
        body += ell(x, y, 15, 11, S, False)
    for x in (196, 282):
        body += rect(x, 408, 34, 74, 14, Y) + rect(x - 2, 462, 38, 20, 8, D)
    head = ""
    for x in (226, 274):
        head += rect(x, 78, 12, 40, 6, Y) + circ(x + 6, 76, 10, D)
    for side in (-1, 1):
        ex = 256 + side * 74
        head += rot(ell(ex, 140, 30, 13, Y) + ell(ex, 140, 18, 6, C["ohr-rosa"], False), side * 20, ex, 140)
    head += ell(256, 160, 74, 66, Y)
    head += ell(214, 120, 9, 7, S, False) + ell(298, 126, 8, 6, S, False)
    head += ell(256, 198, 52, 34, C["affe-hell"])
    head += circ(242, 192, 3.5, D, False) + circ(270, 192, 3.5, D, False)
    head += cheeks(198, 314, 186, 13, 8)
    head += ba.eye(226, 150, eyes) + ba.eye(286, 150, eyes) + brow(brow_on, 268, 120)
    defs, m = mouth_at(MAMMAL_MOUTH[mouth], 256, 214, 0.5, tag)
    head += m
    return defs, body, head, ""


def meerkat(eyes, mouth, limbs, bob, brow_on, tag):
    M, S, D = C["affe-hell"], C["erde"], C["affe-dunkel"]
    body = path("M 300 452 Q 372 480 396 432", sw=22 + 2 * SW, extra=f'stroke="{K}"') + path(
        "M 300 452 Q 372 480 396 432", sw=22, extra=f'stroke="{M}"') + circ(396, 430, 12, D)
    body += ell(226, 468, 30, 12, M) + ell(286, 468, 30, 12, M)
    body += ell(256, 352 + bob * 0.5, 86, 126 - bob * 0.5, M)
    body += ell(256, 374 + bob * 0.4, 52, 90 - bob * 0.4, C["papier"], False)
    paws = {
        "down": [((210, 296), (230, 334)), ((302, 296), (282, 334))],
        "mid": [((206, 300), (160, 320)), ((306, 300), (352, 320))],
        "up": [((206, 290), (172, 214)), ((306, 290), (340, 214))],
    }[limbs]
    for (sx_, sy_), (hx, hy) in paws:
        body += limb(sx_, sy_ + bob * 0.5, hx, hy, 24, M) + circ(hx, hy, 15, M)
    head = circ(186, 176, 16, D) + circ(326, 176, 16, D)
    head += ell(256, 188, 80, 72, M)
    head += rot(ell(224, 190, 24, 30, S, False), 15, 224, 190) + rot(ell(288, 190, 24, 30, S, False), -15, 288, 190)
    head += ell(256, 226, 30, 22, C["papier"], False)
    head += ell(256, 214, 9, 6, K, False)
    head += cheeks(196, 316, 220, 12, 8)
    head += ba.eye(226, 188, eyes) + ba.eye(286, 188, eyes) + brow(brow_on, 268, 152)
    defs, m = mouth_at(MAMMAL_MOUTH[mouth], 256, 240, 0.45, tag)
    head += m
    return defs, body, head, ""


# Tierdaten: Zeichnung, Kopfmitte (Baby, Symbol), Mund (Fütterung), Futter, Symbolmaßstab
ANIMALS = {
    "elefantenwiese_elefant": dict(draw=elephant, head=(256, 226), mouth=(300, 282), food="heu", icon=0.25),
    "zookasse_papagei": dict(draw=parrot, head=(256, 190), mouth=(262, 248), food="nuss", icon=0.4),
    "futteruhr_eule": dict(draw=owl, head=(256, 196), mouth=(258, 252), food="beeren", icon=0.38),
    "schmetterlingshaus_schmetterling": dict(draw=butterfly, head=(256, 170), mouth=(256, 228), food="bluete", icon=0.46),
    "giraffenhof_giraffe": dict(draw=giraffe, head=(256, 150), mouth=(256, 214), food="zweig", icon=0.48),
    "zoozaehlung_erdmaennchen": dict(draw=meerkat, head=(256, 190), mouth=(256, 240), food="kaefer", icon=0.48),
}


# ============================================================== Gerüst
def figure(key, eyes="round", mouth="closed", limbs="down", bob=0.0, lift=0, brow_on=False,
           food=None, baby=False, tag="x"):
    a = ANIMALS[key]
    defs, body, head, front = a["draw"](eyes, mouth, limbs, bob, brow_on, tag)
    head = f'<g transform="translate(0,{-bob})">{head}</g>'
    if baby:
        hx, hy = a["head"]
        ty = (480 - (480 - hy) * 0.74) - hy + 24
        out = bs.scaled(body + front, 256, 480, 0.74) + bs.scaled(head, hx, hy, 0.86, ty)
    else:
        out = body + head + front
    if food:
        out += food
    return svg(512, 512, bs.shadow(lift) + bs.lifted(out, lift), defs)


EXPR = {
    "neutral": dict(eyes="round", mouth="closed"),
    "froh": dict(eyes="round", mouth="open"),
    "jubelnd": dict(eyes="happy", mouth="big", limbs="up"),
    "nachdenklich": dict(eyes="look", mouth="wave", brow_on=True),
    "muede": dict(eyes="sleepy", mouth="flat"),
}


def joy(key, i):
    limbs = "down" if i in (0, 7) else "mid" if i in (1, 6) else "up"
    happy = 0 < i < 7
    return figure(key, eyes="happy" if happy else "round", mouth="big" if happy else "open",
                  limbs=limbs, lift=bs.JOY_LIFT[i], tag=f"{key}-j{i}")


def feed(key, i):
    a = ANIMALS[key]
    mx, my = a["mouth"]
    path_ = [(mx + 200, my - 80, 1.4, -12), (mx + 150, my - 44, 1.4, -6), (mx + 100, my - 12, 1.4, 0),
             (mx + 56, my, 1.15, 4), (mx + 26, my + 2, 0.7, 6)]
    frames = [("round", "closed", "down"), ("look", "open", "down"), ("round", "big", "mid"),
              ("round", "big", "mid"), ("happy", "closed", "down"), ("happy", "puff", "down"),
              ("happy", "open", "mid"), ("happy", "closed", "down")]
    eyes, mouth, limbs = frames[i]
    food = item_at(a["food"], *path_[i]) if i < len(path_) else None
    if key.startswith("elefantenwiese") and limbs == "mid":
        limbs = "down"  # der Rüssel bleibt unten, damit das Futter den Mund erreicht
    return figure(key, eyes=eyes, mouth=mouth, limbs=limbs, food=food, tag=f"{key}-f{i}")


def scale_strokes(fragment, factor, limit=8):
    """Gleicht Konturlinien (bis `limit` px) aus; dicke Striche, die Formen bilden
    (Rüssel, Gliedmaßen), behalten ihre Größe."""
    def fix(m):
        w = float(m[1])
        return f'stroke-width="{w * factor:.2f}"' if w <= limit else m[0]
    return re.sub(r'stroke-width="([\d.]+)"', fix, fragment)


def icon(key):
    """Kartensymbol: Kopf im runden Abzeichen, Kontur 4 px wie bei Affe und Pinguin."""
    a = ANIMALS[key]
    defs, body, head, front = a["draw"]("round", "closed", "down", 0, False, f"{key}-icon")
    hx, hy = a["head"]
    s = a["icon"]
    inner = scale_strokes(head, 1 / s)
    group = (f'<g clip-path="url(#{key}-clip)"><g transform="translate({64 - hx * s},{66 - hy * s}) scale({s})" '
             f'stroke-width="{SW / s:.2f}">{inner}</g></g>')
    clip = f'<clipPath id="{key}-clip"><circle cx="64" cy="62" r="54"/></clipPath>'
    badge = ell(64, 120, 40, 6, K, False, f'opacity="{SHADOW}"') + circ(64, 62, 56, C["papier"])
    ring = circ(64, 62, 56, "none")
    return svg(128, 128, badge + group + ring, defs + clip)


FILES = {}
for key in ANIMALS:
    for name, kw in EXPR.items():
        FILES[f"{key}_{name}_512"] = figure(key, tag=f"{key}-{name}", **kw)
    for i, bob in enumerate(bs.IDLE_BOB):
        FILES[f"{key}_idle_{i}_512"] = figure(key, eyes="blink" if i == 5 else "round", bob=bob, tag=f"{key}-i{i}")
    for i in range(8):
        FILES[f"{key}_freude_{i}_512"] = joy(key, i)
        FILES[f"{key}_fuetterung_{i}_512"] = feed(key, i)
    FILES[f"{key}_baby_512"] = figure(key, baby=True, tag=f"{key}-b")
    FILES[f"karte_{key.split('_')[1]}_128"] = icon(key)


def main():
    out = ROOT / "svg"
    out.mkdir(exist_ok=True)
    for name, content in FILES.items():
        (out / f"{name}.svg").write_text(content, encoding="utf-8")
    print("SVG:", len(FILES), "->", out.relative_to(REPO))


if __name__ == "__main__":
    main()
