#!/usr/bin/env python3
"""Zahlen-Zoo: Grafiken für die Szenen Pinguinfelsen und Affenwald.

Tiere (Ausdrücke, Animationen Idle/Freude/Fütterung, Baby), Hintergründe für
Gehege und Aufgabenansicht, Futterobjekte und Symbole der Aufgabenansicht.
Nutzt Hilfsfunktionen, Linienstärken und Farben der Stilprobe; keine anderen Farbwerte.
Aufruf: npm run art
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
sys.path.insert(0, str(REPO / "stilprobe"))
import build_assets as ba  # noqa: E402

C, K, SW, SI = ba.C, ba.K, ba.SW, ba.SI
svg, ell, circ, path, rect, limb = ba.svg, ba.ell, ba.circ, ba.path, ba.rect, ba.limb
P = C["pinguin-gefieder"]
SHADOW = ba.TOKENS["shadow"]["opacity"]

# Bewegungsabläufe (12 fps laut Stilvorgabe)
IDLE_BOB = [0, 2, 4, 6, 4, 2]
JOY_LIFT = [0, 10, 26, 38, 38, 26, 10, 0]


def shadow(lift=0, rx=130):
    s = max(0.55, 1 - lift / 90)
    return ell(256, 481, rx * s, 16 * s, K, False, f'opacity="{SHADOW}"')


def lifted(body, lift):
    return f'<g transform="translate(0,{-lift})">{body}</g>' if lift else body


def scaled(body, cx, cy, s, ty=0):
    return f'<g transform="translate({cx},{cy + ty}) scale({s}) translate({-cx},{-cy})">{body}</g>'


# ============================================================== Affe
# Erweiterte Fassung von ba.monkey: Arme je Seite frei, Gegenstand in der Hand, Sprung.
ARM = {"down": (140, 430), "up": (108, 258), "mid": (104, 330)}


def monkey(eyes="round", mouth="smile", left="down", right="down", bob=0.0, lift=0, brow=False,
           held=None, tag="m", baby=False):
    F, H, D = C["affe-fell"], C["affe-hell"], C["affe-dunkel"]
    defs = ""
    body = []
    body.append(path("M 345 412 C 440 424 478 332 430 292 C 408 274 386 296 406 308",
                     sw=34, extra=f'stroke="{K}"') +
                path("M 345 412 C 440 424 478 332 430 292 C 408 274 386 296 406 308",
                     sw=26, extra=f'stroke="{F}"'))
    for x in (196, 316):
        body.append(ell(x, 458, 54, 24, F) + ell(x, 463, 34, 12, H, False))
    body.append(ell(256, 372 + bob * 0.5, 98, 96 - bob * 0.5, F))
    body.append(ell(256, 388, 64, 66, H, False))

    def arm(side, pose):
        sh = 172 if side == "left" else 340
        if isinstance(pose, tuple):
            hx, hy = pose
        else:
            ax = ARM[pose]
            hx, hy = (ax[0], ax[1]) if side == "left" else (512 - ax[0], ax[1])
        return limb(sh, 342 + bob * 0.5, hx, hy, 40, F) + circ(hx, hy, 27, F), (hx, hy)

    left_svg, _ = arm("left", left)
    right_svg, right_hand = arm("right", right)
    front_right = isinstance(right, tuple)
    body.append(left_svg)
    if not front_right:
        body.append(right_svg)

    g = []
    for x in (118, 394):
        g.append(circ(x, 215, 42, F) + circ(x, 215, 22, C["ohr-rosa"], False))
    g.append(path("M 220 100 C 210 62 246 48 256 76 C 270 50 304 66 292 102 Z", D))
    g.append(ell(256, 210, 142, 124, F))
    g.append(ell(218, 196, 64, 56, H, False) + ell(294, 196, 64, 56, H, False))
    g.append(ell(256, 250, 92, 64, H, False))
    g.append(ell(176, 252, 20, 13, C["rosa"], False, 'opacity="0.55"'))
    g.append(ell(336, 252, 20, 13, C["rosa"], False, 'opacity="0.55"'))
    g.append(ba.eye(214, 206, eyes) + ba.eye(298, 206, eyes))
    if brow:
        g.append(path("M 280 176 Q 298 164 316 176", sw=5))
    g.append(circ(247, 238, 3.5, D, False) + circ(265, 238, 3.5, D, False))
    m = ba.mouth(mouth, f"{tag}-mc")
    if isinstance(m, tuple):
        defs += m[0]
        g.append(m[1])
    else:
        g.append(m)
    head = "".join(g)

    if baby:
        out = (scaled("".join(body), 256, 480, 0.74)
               + scaled(f'<g transform="translate(0,{-bob})">{head}</g>', 256, 210, 0.86, 92))
    else:
        out = "".join(body) + f'<g transform="translate(0,{-bob})">{head}</g>'
    if front_right:
        out += right_svg
    if held is not None:
        # Gegenstand liegt in der Hand: erst der Gegenstand, dann die Hand darüber.
        hx, hy = right_hand
        out += held(hx, hy) + circ(hx, hy, 27, F)
    return svg(512, 512, shadow(lift) + lifted(out, lift), defs)


def banana_in_hand(size):
    # Stiel in der Hand, Spitze zeigt zum Mund; abgebissene Bananen sind kürzer.
    def draw(hx, hy):
        return even_stroke(ba.banana(hx + 6, hy + 4, 120, size), size)
    return draw


MONKEY_EXPR = {
    "neutral": dict(eyes="round", mouth="smile"),
    "froh": dict(eyes="round", mouth="open"),
    "jubelnd": dict(eyes="happy", mouth="big", left="up", right="up"),
    "nachdenklich": dict(eyes="look", mouth="wave", brow=True),
    "muede": dict(eyes="sleepy", mouth="flat"),
}


def monkey_joy(i):
    lift = JOY_LIFT[i]
    arms = "down" if i in (0, 7) else "mid" if i in (1, 6) else "up"
    happy = 0 < i < 7
    return monkey(eyes="happy" if happy else "round", mouth="big" if happy else "open",
                  left=arms, right=arms, lift=lift, tag=f"mj{i}")


MOUTH_POS = (338, 290)
MID_POS = (362, 356)
LOW_POS = (372, 430)


def monkey_feed(i):
    # Banane zum Mund, zweimal abbeißen, zufrieden.
    frames = [
        (LOW_POS, "round", "smile", 1.15),
        (MID_POS, "look", "smile", 1.15),
        (MOUTH_POS, "round", "open", 1.15),
        (MOUTH_POS, "happy", "flat", 0.9),
        (MID_POS, "happy", "wave", 0.9),
        (MOUTH_POS, "round", "open", 0.9),
        (MOUTH_POS, "happy", "flat", 0.65),
        (LOW_POS, "happy", "smile", 0.65),
    ]
    pos, eyes, mouth, size = frames[i]
    return monkey(eyes=eyes, mouth=mouth, right=pos, held=banana_in_hand(size), tag=f"mf{i}")


# ============================================================== Pinguin
FLIPPER = {
    "down": ((150, 352, 18), (362, 352, -18)),
    "mid": ((128, 300, 62), (384, 300, -62)),
    "up": ((140, 232, 145), (372, 232, -145)),
    "hold": ((150, 352, 18), (340, 300, -120)),
}


def beak(kind, tag):
    o = C["orange"]
    closed = path("M 228 236 Q 256 224 284 236 Q 272 258 256 268 Q 240 258 228 236 Z", o)
    if kind == "closed":
        return "", closed
    if kind == "puff":
        return "", closed + ell(194, 248, 22, 15, C["rosa"], False, 'opacity="0.55"') + ell(
            318, 248, 22, 15, C["rosa"], False, 'opacity="0.55"')
    big = kind == "big"
    lower_d = ("M 236 250 Q 256 300 276 250 Z" if big else "M 238 248 Q 256 278 274 248 Z")
    cid = f"{tag}-bc"
    defs = f'<clipPath id="{cid}"><path d="{lower_d}"/></clipPath>'
    inner = path(lower_d, C["mund"])
    if big:
        inner += ell(256, 282, 12, 8, C["rosa"], False, f'clip-path="url(#{cid})"')
    upper = path("M 226 236 Q 256 222 286 236 Q 272 252 256 256 Q 240 252 226 236 Z", o)
    lip = path(lower_d.replace(" Z", ""), sw=SI)
    return defs, inner + lip + upper


def penguin(eyes="round", mouth="closed", flippers="down", bob=0.0, lift=0, brow=False,
            fish=None, tag="p", baby=False):
    body_color = C["grau-warm"] if baby else P
    fl = FLIPPER[flippers]
    body = []
    for x in (212, 300):
        body.append(ell(x, 464, 44, 16, C["orange"]))
    for (cx, cy, rot) in fl:
        body.append(ell(cx, cy + bob * 0.5, 24, 74, body_color, extra=f'transform="rotate({rot} {cx} {cy + bob * 0.5})"'))
    body.append(ell(256, 352 + bob * 0.5, 118, 126 - bob * 0.5, body_color))
    body.append(ell(256, 376 + bob * 0.4, 84, 96 - bob * 0.4, C["papier"], False))
    body.append(ell(226, 330, 16, 26, C["weiss"], False, 'opacity="0.35"'))

    defs, beak_svg = beak(mouth, tag)
    g = []
    g.append(path("M 236 96 C 228 64 252 58 256 80 C 262 56 286 64 276 96 Z", body_color))
    g.append(circ(256, 190, 104, body_color))
    g.append(ell(222, 198, 46, 54, C["papier"], False) + ell(290, 198, 46, 54, C["papier"], False))
    g.append(ell(256, 240, 62, 40, C["papier"], False))
    g.append(circ(214, 128, 16, C["weiss"], False, 'opacity="0.3"'))
    g.append(ell(194, 240, 16, 10, C["rosa"], False, 'opacity="0.55"'))
    g.append(ell(318, 240, 16, 10, C["rosa"], False, 'opacity="0.55"'))
    g.append(ba.eye(222, 196, eyes) + ba.eye(290, 196, eyes))
    if brow:
        g.append(path("M 272 160 Q 290 148 310 160", sw=5))
    g.append(beak_svg)
    head = "".join(g)
    if baby:
        out = (scaled("".join(body), 256, 480, 0.72)
               + scaled(f'<g transform="translate(0,{-bob})">{head}</g>', 256, 190, 0.84, 128))
    else:
        out = "".join(body) + f'<g transform="translate(0,{-bob})">{head}</g>'
    if fish:
        out += fish
    return svg(512, 512, shadow(lift, 120) + lifted(out, lift), defs)


def fish_shape(x, y, rot=0, s=1.0, tail_only=False):
    """Fisch mit Mittelpunkt (x, y); tail_only zeigt nur die Schwanzflosse."""
    tail = path("M 30 0 L 58 -20 Q 50 0 58 20 Z", C["wasser"])
    body = (ell(0, 0, 40, 22, C["wasser"]) + ell(-4, 6, 28, 10, C["weiss"], False, 'opacity="0.7"')
            + circ(-22, -5, 4, K, False) + path("M -6 -20 Q 6 -32 18 -18", C["wasser"], sw=SI))
    inner = tail if tail_only else tail + body
    # Linienstärke ausgleichen, damit die Kontur bei jeder Größe 4 px bleibt.
    inner = inner.replace(f'stroke-width="{SI}"', f'stroke-width="{SI / s:.2f}"')
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})" stroke-width="{SW / s:.2f}">'
            f"{inner}</g>")


PENGUIN_EXPR = {
    "neutral": dict(eyes="round", mouth="closed"),
    "froh": dict(eyes="round", mouth="open"),
    "jubelnd": dict(eyes="happy", mouth="big", flippers="up"),
    "nachdenklich": dict(eyes="look", mouth="closed", brow=True),
    "muede": dict(eyes="sleepy", mouth="closed"),
}


def penguin_joy(i):
    lift = JOY_LIFT[i]
    fl = "down" if i in (0, 7) else "mid" if i in (1, 6) else "up"
    happy = 0 < i < 7
    return penguin(eyes="happy" if happy else "round", mouth="big" if happy else "open",
                   flippers=fl, lift=lift, tag=f"pj{i}")


def penguin_feed(i):
    # Fisch fliegt in den Schnabel, wird geschluckt, Pinguin freut sich.
    frames = [
        ("round", "closed", "down", fish_shape(452, 176, -12)),
        ("look", "open", "down", fish_shape(404, 214, -6)),
        ("round", "big", "mid", fish_shape(346, 244, 0)),
        ("round", "big", "mid", fish_shape(312, 256, 4, 0.9)),
        ("happy", "closed", "down", fish_shape(290, 252, 6, 0.9, tail_only=True)),
        ("happy", "puff", "down", None),
        ("happy", "open", "mid", None),
        ("happy", "closed", "down", None),
    ]
    eyes, mouth, fl, fish = frames[i]
    return penguin(eyes=eyes, mouth=mouth, flippers=fl, fish=fish, tag=f"pf{i}")


# ============================================================== Hintergründe
def sky(top_band=True):
    b = rect(0, 0, 1024, 768, 0, C["himmel"], False)
    if top_band:
        b += rect(0, 0, 1024, 150, 0, C["himmel-tief"], False)
        b += path("M 0 150 Q 128 170 256 150 T 512 150 T 768 150 T 1024 150 V 130 H 0 Z", C["himmel-tief"], False)
    return b


def snow_rock(x, base, w, h):
    body = f"M {x - w / 2} {base} Q {x - w / 2} {base - h} {x} {base - h} Q {x + w / 2} {base - h} {x + w / 2} {base} Z"
    cap = (f"M {x - w * 0.32} {base - h * 0.76} Q {x} {base - h * 1.03} {x + w * 0.32} {base - h * 0.76} "
           f"Q {x + w * 0.14} {base - h * 0.64} {x} {base - h * 0.72} Q {x - w * 0.15} {base - h * 0.62} "
           f"{x - w * 0.32} {base - h * 0.76} Z")
    return path(body, C["grau-warm"]) + path(cap, C["weiss"], sw=SI)


def floe(x, y, w):
    return ell(x, y, w, w * 0.28, C["weiss"]) + ell(x - w * 0.2, y - 2, w * 0.35, w * 0.08, C["himmel"], False, 'opacity="0.6"')


def waves(y0, y1, step=46):
    out = ""
    for row, y in enumerate(range(y0, y1, step)):
        for x in range(40 + (row % 2) * 70, 1024, 150):
            out += path(f"M {x} {y} q 14 -10 28 0 q 14 10 28 0", sw=3, extra=f'stroke="{C["weiss"]}" opacity="0.55"')
    return out


def background_pinguinfelsen():
    b = [sky()]
    b.append(circ(820, 104, 50, C["sonne"]))
    b.append(ba.cloud(250, 110, 0.85) + ba.cloud(620, 190, 0.7))
    # ferne Eisberge ohne Kontur
    b.append(path("M 0 430 L 90 330 L 160 380 L 260 290 L 370 400 L 470 350 L 560 420 Z", C["weiss"], False, extra='opacity="0.85"'))
    b.append(path("M 600 420 L 700 320 L 770 370 L 860 280 L 960 360 L 1024 330 V 420 Z", C["weiss"], False, extra='opacity="0.85"'))
    # Meer
    b.append(path("M 0 420 Q 256 400 512 420 T 1024 420 V 768 H 0 Z", C["wasser"]))
    b.append(path("M 0 500 Q 300 480 600 500 T 1024 498 V 768 H 0 Z", C["himmel-tief"], False, extra='opacity="0.45"'))
    b.append(waves(460, 700))
    b.append(floe(600, 520, 90) + floe(780, 470, 56) + floe(480, 600, 60))
    # Eisscholle vorn links (Standfläche des Pinguins)
    b.append(path("M -10 610 Q 120 572 280 590 Q 400 604 440 650 L 470 768 H -10 Z", C["papier"]))
    b.append(path("M -10 640 Q 160 626 300 640", sw=SI, extra='opacity="0.5"'))
    b.append(ell(120, 700, 50, 10, C["himmel"], False, 'opacity="0.6"'))
    # Felsen rechts mit Schnee
    b.append(snow_rock(930, 768, 220, 260) + snow_rock(800, 768, 150, 170))
    b.append(snow_rock(1010, 600, 120, 120))
    return svg(1024, 768, "".join(b))


def background_pinguinfelsen_task():
    # Ruhige Mitte für Rechnung und Hinweise (ohne Sonne und Wolken); Leben an den Rändern.
    b = [sky()]
    b.append(path("M 0 540 L 70 470 L 130 500 L 210 440 L 300 500 L 380 470 L 460 520 L 560 470 "
                  "L 650 520 L 760 460 L 850 510 L 940 470 L 1024 500 V 560 H 0 Z", C["weiss"], False,
                  extra='opacity="0.9"'))
    b.append(path("M 0 552 Q 256 540 512 552 T 1024 552 V 768 H 0 Z", C["wasser"]))
    b.append(path("M 0 620 Q 300 604 600 620 T 1024 618 V 768 H 0 Z", C["himmel-tief"], False, extra='opacity="0.45"'))
    b.append(waves(590, 760, 52))
    b.append(floe(560, 585, 46) + floe(820, 600, 34))
    # Eisklippe links: Standfläche für den Pinguin und die Hilfe-Knöpfe
    b.append(path("M -10 340 Q 60 318 150 324 Q 226 330 240 352 Q 250 372 246 420 L 256 768 H -10 Z",
                  C["papier"]))
    b.append(path("M 150 380 L 196 470 L 170 600 L 208 768 H 246 L 236 600 L 248 470 L 240 400 Z",
                  C["himmel"], False, extra='opacity="0.55"'))
    b.append(path("M 20 470 L 60 560 L 40 700", sw=SI, extra='opacity="0.35"'))
    b.append(ell(110, 336, 70, 8, C["himmel"], False, 'opacity="0.6"'))
    # Felsen rechts unten
    b.append(snow_rock(1000, 768, 130, 170))
    return svg(1024, 768, "".join(b))


def background_affenwald_task():
    b = [sky()]
    # ferne Baumkronen und Hügel ohne Kontur, über die ganze Breite
    for (x, y, r) in [(330, 520, 60), (420, 500, 74), (520, 524, 56), (700, 506, 70), (800, 520, 56),
                      (900, 498, 76), (1000, 520, 60)]:
        b.append(circ(x, y, r, C["laub-hell"], False))
    b.append(path("M 0 560 Q 200 500 420 540 T 820 530 T 1024 540 V 768 H 0 Z", C["gras"]))
    b.append(path("M 0 640 Q 512 600 1024 640 V 768 H 0 Z", C["gras-hell"]))
    # Baum links mit Ast als Sitzplatz für den Affen
    b.append(rect(-24, 150, 104, 640, 30, C["erde"]))
    b.append(path("M 66 342 Q 150 326 238 334 Q 252 338 248 352 Q 150 358 66 372 Z", C["erde"]))
    b.append(rect(4, 230, 14, 360, 7, C["weiss"], False, 'opacity="0.25"'))
    crown = [(-10, 40, 120), (120, 10, 92), (60, 120, 74), (210, 70, 64)]
    b.append("".join(circ(x, y, r, C["laub"]) for (x, y, r) in crown))
    b.append("".join(circ(x, y, r - SW / 2, C["laub"], False) for (x, y, r) in crown))
    b.append("".join(circ(x - r * 0.3, y - r * 0.3, r * 0.45, C["gras-dunkel"], False, 'opacity="0.55"')
                     for (x, y, r) in crown[:3]))
    # Ranke rechts, Busch und Blumen unten
    b.append(path("M 1000 120 Q 960 220 992 330", sw=12, extra=f'stroke="{K}"') +
             path("M 1000 120 Q 960 220 992 330", sw=5, extra=f'stroke="{C["gras-dunkel"]}"'))
    b.append(ell(1010, 700, 70, 40, C["gras-dunkel"]))
    for (x, y, c) in [(262, 732, "rosa"), (960, 744, "sonne"), (990, 650, "weiss")]:
        b.append(circ(x, y, 9, C[c]) + circ(x, y, 3.5, C["orange"], False))
    return svg(1024, 768, "".join(b))


# ============================================================== Objekte (256 × 256)
def obj(body):
    return svg(256, 256, ell(128, 236, 80, 10, K, False, f'opacity="{SHADOW}"') + body)


def object_fish():
    return obj(fish_shape(106, 136, 0, 2.0))


def object_bucket():
    b = path("M 70 70 Q 128 10 186 70", sw=10, extra=f'stroke="{K}"') + path("M 70 70 Q 128 10 186 70", sw=4, extra=f'stroke="{C["grau-warm"]}"')
    b += path("M 52 92 L 72 226 Q 128 240 184 226 L 204 92 Z", C["grau-warm"])
    b += ell(128, 92, 76, 18, C["wasser"])
    b += fish_shape(118, 84, -30, 0.8, tail_only=True)
    b += rect(76, 120, 14, 80, 7, C["weiss"], False, 'opacity="0.4"')
    return obj(b)


def even_stroke(body, s):
    """Gruppe mit ausgeglichener Linienstärke für skalierte Hilfsfunktionen der Stilprobe."""
    return f'<g stroke-width="{SW / s:.2f}">{body}</g>'


def object_banana():
    return obj(even_stroke(ba.banana(100, 40, -18, 2.4), 2.4))


def object_bowl():
    b = ba.banana(84, 70, -40, 1.1) + ba.banana(124, 58, -6, 1.1) + fish_shape(160, 120, -20, 0.9)
    b += path("M 30 140 Q 128 132 226 140 Q 214 226 128 228 Q 42 226 30 140 Z", C["orange"])
    b += ell(128, 140, 98, 14, C["erde"])
    b += path("M 52 168 Q 128 186 204 168", sw=SI, extra='opacity="0.5"')
    return obj(b)


# ============================================================== Symbole (96 × 96)
def icon(body):
    return svg(96, 96, body)


def ui_speaker():
    b = path("M 18 38 H 32 L 50 22 V 74 L 32 58 H 18 Z", C["wasser"])
    b += path("M 60 36 Q 68 48 60 60", sw=5) + path("M 70 28 Q 84 48 70 68", sw=5)
    return icon(b)


def ui_back():
    return icon(path("M 70 48 H 26 M 44 28 L 24 48 L 44 68", sw=10))


def ui_next():
    return icon(path("M 26 48 H 70 M 52 28 L 72 48 L 52 68", sw=10))


def ui_map():
    b = path("M 14 24 L 36 16 L 60 24 L 82 16 V 72 L 60 80 L 36 72 L 14 80 Z", C["papier"])
    b += path("M 36 16 V 72 M 60 24 V 80", sw=SI)
    b += path("M 22 56 Q 40 40 50 50 T 74 34", sw=4, extra=f'stroke="{C["erde"]}" stroke-dasharray="2 8"')
    b += circ(74, 34, 6, C["rosa"])
    return icon(b)


def ui_backspace():
    b = path("M 10 48 L 30 22 H 84 V 74 H 30 Z", C["orange"])
    b += path("M 44 36 L 68 60 M 68 36 L 44 60", sw=7)
    return icon(b)


def ui_aid_tens():
    b = ""
    for x in (14, 30, 46):
        b += rect(x, 14, 13, 68, 5, C["wasser"])
    for (x, y) in [(66, 56), (66, 72), (80, 72)]:
        b += rect(x - 6, y - 6, 13, 13, 3, C["orange"], extra=f'stroke-width="{SI}"')
    return icon(b)


def ui_aid_line():
    b = path("M 8 70 H 88", sw=5)
    b += path("M 16 70 Q 40 30 64 70", sw=5, extra=f'stroke="{C["wasser"]}"')
    b += path("M 64 70 Q 74 52 84 70", sw=5, extra=f'stroke="{C["wasser"]}"')
    for x in (16, 64, 84):
        b += path(f"M {x} 62 V 78", sw=4)
    return icon(b)


def ui_aid_hundred():
    b = rect(12, 12, 72, 72, 8, C["papier"])
    for i in range(1, 5):
        b += path(f"M {12 + i * 14.4} 14 V 82 M 14 {12 + i * 14.4} H 82", sw=1.5, extra='opacity="0.6"')
    b += rect(12 + 3 * 14.4, 12 + 1 * 14.4, 14.4, 14.4, 2, C["orange"], extra=f'stroke-width="{SI}"')
    b += rect(12 + 1 * 14.4, 12 + 3 * 14.4, 14.4, 14.4, 2, C["orange"], extra=f'stroke-width="{SI}"')
    return icon(b)


# ============================================================== Ausgabe
FILES = {}
for name, kw in MONKEY_EXPR.items():
    FILES[f"affenwald_affe_{name}_512"] = monkey(tag=f"me-{name}", **kw)
for i, bob in enumerate(IDLE_BOB):
    FILES[f"affenwald_affe_idle_{i}_512"] = monkey(eyes="blink" if i == 5 else "round", bob=bob, tag=f"mi{i}")
for i in range(8):
    FILES[f"affenwald_affe_freude_{i}_512"] = monkey_joy(i)
    FILES[f"affenwald_affe_fuetterung_{i}_512"] = monkey_feed(i)
FILES["affenwald_affe_baby_512"] = monkey(baby=True, tag="mb")

for name, kw in PENGUIN_EXPR.items():
    FILES[f"pinguinfelsen_pinguin_{name}_512"] = penguin(tag=f"pe-{name}", **kw)
for i, bob in enumerate(IDLE_BOB):
    FILES[f"pinguinfelsen_pinguin_idle_{i}_512"] = penguin(eyes="blink" if i == 5 else "round", bob=bob, tag=f"pi{i}")
for i in range(8):
    FILES[f"pinguinfelsen_pinguin_freude_{i}_512"] = penguin_joy(i)
    FILES[f"pinguinfelsen_pinguin_fuetterung_{i}_512"] = penguin_feed(i)
FILES["pinguinfelsen_pinguin_baby_512"] = penguin(baby=True, tag="pb")

FILES["affenwald_hintergrund_1024x768"] = ba.background_affenwald()
FILES["affenwald_aufgabe_1024x768"] = background_affenwald_task()
FILES["pinguinfelsen_hintergrund_1024x768"] = background_pinguinfelsen()
FILES["pinguinfelsen_aufgabe_1024x768"] = background_pinguinfelsen_task()

FILES["objekt_fisch_256"] = object_fish()
FILES["objekt_eimer_256"] = object_bucket()
FILES["objekt_banane_256"] = object_banana()
FILES["objekt_futternapf_256"] = object_bowl()

FILES["ui_vorlesen_96"] = ui_speaker()
FILES["ui_zurueck_96"] = ui_back()
FILES["ui_weiter_96"] = ui_next()
FILES["ui_karte_96"] = ui_map()
FILES["ui_loeschen_96"] = ui_backspace()
FILES["ui_hilfe_zehner_96"] = ui_aid_tens()
FILES["ui_hilfe_rechenstrich_96"] = ui_aid_line()
FILES["ui_hilfe_hundertertafel_96"] = ui_aid_hundred()


def main():
    out = ROOT / "svg"
    out.mkdir(exist_ok=True)
    for name, content in FILES.items():
        (out / f"{name}.svg").write_text(content, encoding="utf-8")
    print("SVG:", len(FILES), "->", out.relative_to(REPO))


if __name__ == "__main__":
    main()
