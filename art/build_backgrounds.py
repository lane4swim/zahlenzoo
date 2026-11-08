#!/usr/bin/env python3
"""Zahlen-Zoo: Hintergründe für die Menüs und die übrigen sechs Bereiche.

Menüs: Start (Zoo-Eingang mit Schild für den Titel), Profil, Erwachsene (ruhig),
Rundenende (Konfetti). Bereiche: je ein Gehege-Hintergrund (Platz links unten für
das Tier, Tafel rechts der Mitte) und ein Aufgaben-Hintergrund (ruhige Mitte,
Standfläche links bei y ≈ 330, Hilfe-Knöpfe darunter).
Nutzt Hilfsfunktionen und Farben der Stilprobe; keine anderen Farbwerte.
Aufruf: npm run art
"""
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
sys.path.insert(0, str(REPO / "stilprobe"))
sys.path.insert(0, str(ROOT))
import build_assets as ba  # noqa: E402
import build_scenes as bs  # noqa: E402

C, K, SW, SI = ba.C, ba.K, ba.SW, ba.SI
svg, ell, circ, path, rect = ba.svg, ba.ell, ba.circ, ba.path, ba.rect
W, H = 1024, 768


# ============================================================== Bausteine
def hills(y, color, outline=True, amp=40, phase=0):
    d = f"M 0 {y} "
    for i in range(5):
        x0 = i * 256
        d += f"Q {x0 + 128} {y + (-amp if (i + phase) % 2 == 0 else amp * 0.6)} {x0 + 256} {y} "
    d += f"V {H} H 0 Z"
    return path(d, color, outline)


def bush(x, y, s=1.0):
    return (ell(x, y, 60 * s, 30 * s, C["gras-dunkel"])
            + ell(x - 18 * s, y - 12 * s, 16 * s, 8 * s, C["gras"], False, 'opacity="0.6"'))


def flower(x, y, color, r=9):
    return circ(x, y, r, C[color]) + circ(x, y, r * 0.38, C["orange"], False)


def flowers(points):
    return "".join(flower(x, y, c) for (x, y, c) in points)


def stone(x, base, w, h, color="grau-warm"):
    d = (f"M {x - w / 2} {base} Q {x - w / 2} {base - h} {x - w * 0.1} {base - h} "
         f"Q {x + w / 2} {base - h * 1.05} {x + w / 2} {base} Z")
    return path(d, C[color]) + ell(x - w * 0.18, base - h * 0.7, w * 0.12, h * 0.1, C["weiss"], False, 'opacity="0.4"')


def acacia(x, base, s=1.0):
    trunk = path(f"M {x - 7 * s} {base} L {x - 4 * s} {base - 90 * s} L {x - 30 * s} {base - 130 * s} "
                 f"M {x + 7 * s} {base} L {x + 4 * s} {base - 100 * s} L {x + 34 * s} {base - 136 * s}",
                 sw=12 * s, extra=f'stroke="{K}"')
    trunk += path(f"M {x - 7 * s} {base} L {x - 4 * s} {base - 90 * s} L {x - 30 * s} {base - 130 * s} "
                  f"M {x + 7 * s} {base} L {x + 4 * s} {base - 100 * s} L {x + 34 * s} {base - 136 * s}",
                  sw=6 * s, extra=f'stroke="{C["erde"]}"')
    crown = ell(x, base - 150 * s, 96 * s, 30 * s, C["laub"])
    crown += ell(x - 20 * s, base - 160 * s, 40 * s, 10 * s, C["gras-dunkel"], False, 'opacity="0.55"')
    return trunk + crown


def palm_leaf(x, y, rot, s=1.0):
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            + path("M 0 0 Q 60 -40 130 -10 Q 70 -6 0 0 Z", C["gras"])
            + path("M 10 -4 Q 70 -24 120 -10", sw=SI, extra='opacity="0.6"') + "</g>")


def bunting(y, x0=0, x1=W, sag=40, n=14):
    colors = ["rosa", "sonne", "wasser", "gras", "orange"]
    out = path(f"M {x0} {y} Q {(x0 + x1) / 2} {y + sag * 2} {x1} {y}", sw=SI)
    for i in range(n):
        t = (i + 0.5) / n
        px = x0 + (x1 - x0) * t
        py = (1 - t) ** 2 * y + 2 * (1 - t) * t * (y + sag * 2) + t ** 2 * y
        c = C[colors[i % len(colors)]]
        out += path(f"M {px - 16} {py} L {px + 16} {py} L {px} {py + 34} Z", c, sw=SI)
    return out


def confetti(seed_points):
    colors = ["rosa", "sonne", "wasser", "gras", "orange", "stern"]
    out = ""
    for i, (x, y, rot) in enumerate(seed_points):
        c = C[colors[i % len(colors)]]
        if i % 3 == 0:
            out += circ(x, y, 9, c, extra=f'stroke-width="{SI}"')
        else:
            out += f'<rect x="{x - 12}" y="{y - 5}" width="24" height="10" rx="4" fill="{c}" stroke-width="{SI}" transform="rotate({rot} {x} {y})"/>'
    return out


def rays(cx, cy, n=12, r0=70, r1=200):
    out = ""
    for i in range(n):
        a = i * 2 * math.pi / n
        b = a + math.pi / n * 0.5
        out += path(f"M {cx + r0 * math.cos(a)} {cy + r0 * math.sin(a)} L {cx + r1 * math.cos(a)} {cy + r1 * math.sin(a)} "
                    f"L {cx + r1 * math.cos(b)} {cy + r1 * math.sin(b)} Z", C["weiss"], False, extra='opacity="0.45"')
    return out


def fence(x0, x1, y):
    out = rect(x0, y - 36, x1 - x0, 12, 6, C["erde"]) + rect(x0, y - 8, x1 - x0, 12, 6, C["erde"])
    for x in range(int(x0) + 20, int(x1), 60):
        out += rect(x - 8, y - 56, 16, 70, 6, C["erde"])
    return out


def task_ground(far_color, ground_color, ground2_color=None, behind=""):
    """Aufgaben-Hintergrund: Himmel, ferne Formen ohne Kontur, `behind` (z. B. der Hügel
    links), dann der Boden, der den Fuß des Hügels verdeckt."""
    b = bs.sky()
    b += hills(548, far_color, False, 50)
    b += behind
    b += hills(600, C[ground_color], True, 24, 1)
    if ground2_color:
        b += path(f"M 0 676 Q 512 640 {W} 676 V {H} H 0 Z", C[ground2_color])
    return b


def ledge(color, top=332, crest=176, foot_x=340, foot_y=660, cap=None, shine=True):
    """Hügel links als Standfläche für das Tier; die Hilfe-Knöpfe liegen auf dem Hang."""
    d = (f"M -10 {top + 6} Q {crest * 0.5} {top - 14} {crest} {top} "
         f"C {crest + 70} {top + 12} {foot_x - 70} {foot_y - 90} {foot_x} {foot_y} L {foot_x} {H} H -10 Z")
    out = path(d, C[color])
    if cap:
        out += path(f"M -10 {top + 6} Q {crest * 0.5} {top - 14} {crest} {top} "
                    f"C {crest + 40} {top + 6} {crest + 60} {top + 30} {crest + 70} {top + 44} "
                    f"Q {crest * 0.5} {top + 30} -10 {top + 46} Z", C[cap])
    if shine:
        out += ell(100, top + 4, 64, 7, C["weiss"], False, 'opacity="0.35"')
    return out


def tuft(x, y, s=1.0):
    return path(f"M {x - 12 * s} {y} Q {x - 10 * s} {y - 22 * s} {x - 4 * s} {y - 30 * s} "
                f"Q {x} {y - 14 * s} {x + 2 * s} {y} Q {x + 8 * s} {y - 26 * s} {x + 14 * s} {y - 32 * s} "
                f"Q {x + 14 * s} {y - 14 * s} {x + 14 * s} {y} Z", C["gras-dunkel"], sw=SI)


# ============================================================== Menüs
def menu_start():
    b = [bs.sky()]
    b.append(circ(140, 110, 50, C["sonne"]) + ba.cloud(880, 80, 0.7) + ba.cloud(420, 60, 0.5))
    b.append(hills(430, C["laub-hell"], False, 40))
    b.append(hills(560, C["gras"], True, 30, 1))
    b.append(path(f"M 0 650 Q 512 610 {W} 650 V {H} H 0 Z", C["gras-hell"]))
    # Weg durch das Tor
    b.append(path("M 330 768 Q 420 640 470 600 L 554 600 Q 604 640 694 768 Z", C["karte-schatten"]))
    # Bäume und Zaun links und rechts
    b.append(ba.tree(70, 610, 50, 330, [(-10, -10, 74), (50, -40, 60), (-50, -60, 56)]))
    b.append(ba.tree(954, 610, 50, 340, [(10, -10, 74), (-50, -40, 60), (50, -60, 56)]))
    b.append(fence(0, 230, 620) + fence(794, W, 620))
    # Tor: zwei Pfeiler, Bogen, Schild für den Titel (Text setzt das Spiel)
    for x in (220, 744):
        b.append(rect(x, 230, 60, 410, 14, C["erde"]))
        b.append(rect(x + 10, 250, 12, 360, 6, C["weiss"], False, 'opacity="0.25"'))
        b.append(rect(x - 8, 214, 76, 30, 10, C["papier"]))
        b.append(circ(x + 30, 196, 18, C["stern"]))
    b.append(path("M 250 236 Q 512 160 774 236", sw=22, extra=f'stroke="{K}"')
             + path("M 250 236 Q 512 160 774 236", sw=14, extra=f'stroke="{C["erde"]}"'))
    b.append(path("M 330 196 V 218 M 694 196 V 218", sw=SI))
    b.append(rect(300, 100, 424, 100, 26, C["papier"]))
    b.append(rect(312, 112, 400, 76, 18, C["papier"], extra=f'stroke-width="{SI}" opacity="0.6"'))
    b.append(bush(150, 680, 1.0) + bush(880, 690, 1.1))
    b.append(flowers([(40, 720, "rosa"), (260, 700, "sonne"), (780, 712, "rosa"), (990, 740, "weiss"),
                      (300, 744, "weiss"), (720, 748, "sonne")]))
    return svg(W, H, "".join(b))


def menu_profile():
    b = [bs.sky(top_band=False)]
    b.append(bunting(14, -20, W + 20, 26, 16))
    b.append(ba.cloud(130, 170, 0.55) + ba.cloud(900, 200, 0.6))
    b.append(hills(560, C["laub-hell"], False, 36))
    b.append(hills(630, C["gras"], True, 22, 1))
    b.append(path(f"M 0 700 Q 512 676 {W} 700 V {H} H 0 Z", C["gras-hell"]))
    for (x, y, c) in [(70, 300, "rosa"), (120, 250, "wasser"), (40, 230, "sonne"),
                      (950, 290, "gras"), (900, 240, "orange"), (985, 220, "rosa")]:
        b.append(path(f"M {x} {y + 40} Q {x + 10} {y + 120} {x - 6} {y + 200}", sw=SI))
        b.append(ell(x, y, 30, 38, C[c]) + ell(x - 10, y - 14, 7, 11, C["weiss"], False, 'opacity="0.5"'))
        b.append(path(f"M {x - 6} {y + 38} L {x + 6} {y + 38} L {x} {y + 46} Z", C[c], sw=SI))
    b.append(bush(60, 650, 0.9) + bush(970, 660, 1.0))
    b.append(flowers([(140, 720, "rosa"), (240, 744, "sonne"), (820, 730, "rosa"), (920, 748, "weiss"),
                      (40, 748, "sonne"), (1000, 712, "rosa")]))
    return svg(W, H, "".join(b))


def menu_adults():
    b = [rect(0, 0, W, H, 0, C["papier"], False)]
    b.append(rect(0, 0, W, 150, 0, C["himmel"], False))
    b.append(path(f"M 0 150 Q 256 170 512 150 T {W} 150 V 120 H 0 Z", C["himmel"], False))
    b.append(path(f"M 0 712 Q 256 690 512 708 T {W} 704 V {H} H 0 Z", C["gras-hell"]))
    b.append(ba.cloud(150, 70, 0.5) + ba.cloud(880, 90, 0.45))
    b.append(bush(40, 716, 0.8) + bush(990, 712, 0.9))
    b.append(flowers([(110, 744, "rosa"), (930, 748, "sonne"), (520, 752, "weiss")]))
    return svg(W, H, "".join(b))


def menu_round_end():
    b = [bs.sky(top_band=False)]
    b.append(rays(512, 230, 16, 150, 560))
    b.append(bunting(10, -20, W + 20, 22, 16))
    b.append(hills(600, C["laub-hell"], False, 30))
    b.append(hills(660, C["gras"], True, 20, 1))
    b.append(path(f"M 0 720 Q 512 700 {W} 720 V {H} H 0 Z", C["gras-hell"]))
    pts = [(60, 140, 20), (110, 260, -30), (40, 380, 50), (150, 470, 10), (90, 560, -20),
           (960, 140, -15), (900, 260, 35), (990, 360, -40), (880, 470, 20), (950, 560, 60),
           (220, 120, 70), (800, 110, -60), (260, 560, 30), (770, 570, -25), (180, 330, -10),
           (850, 350, 15)]
    b.append(confetti(pts))
    b.append(flowers([(260, 740, "rosa"), (860, 744, "sonne"), (980, 720, "weiss")]))
    return svg(W, H, "".join(b))


# ============================================================== Bereiche: Gehege
def gehege_base(far, mid, ground):
    b = bs.sky()
    b += circ(150, 104, 46, C["sonne"]) + ba.cloud(380, 120, 0.7) + ba.cloud(930, 190, 0.6)
    b += hills(420, C[far], False, 44)
    b += hills(520, C[mid], True, 30, 1)
    b += path(f"M 0 630 Q 512 596 {W} 630 V {H} H 0 Z", C[ground])
    return b


def gehege_elefantenwiese():
    b = [gehege_base("laub-hell", "gras", "gras-hell")]
    b.append(ell(860, 690, 150, 46, C["wasser"]) + ell(820, 680, 60, 10, C["weiss"], False, 'opacity="0.5"'))
    b.append(ell(150, 700, 120, 30, C["erde"], extra='opacity="0.9"'))
    b.append(ba.tree(90, 600, 54, 300, [(-10, -10, 84), (60, -40, 70), (-60, -60, 64), (20, -90, 60)]))
    b.append(stone(960, 600, 110, 80) + stone(400, 650, 70, 46))
    b.append(bush(980, 520, 0.9) + bush(330, 560, 0.8))
    b.append(ba.tree(960, 470, 40, 250, [(10, -10, 60), (-36, -30, 48), (36, -50, 44)]))
    b.append("".join(tuft(x, y) for (x, y) in [(260, 650), (380, 700), (520, 690), (700, 720), (900, 740)]))
    b.append(flowers([(300, 720, "rosa"), (440, 740, "sonne"), (620, 730, "weiss")]))
    return svg(W, H, "".join(b))


def gehege_zookasse():
    b = [gehege_base("laub-hell", "gras", "karte-schatten")]
    # Pflaster
    for y in (656, 700, 744):
        b.append(path(f"M 0 {y} Q 512 {y - 20} {W} {y}", sw=2, extra='opacity="0.25"'))
    # Kassenhäuschen links mit gestreiftem Dach (die Tafel steht rechts der Mitte)
    x, y = 180, 300
    b.append(rect(x - 110, y + 60, 220, 270, 14, C["papier"]))
    b.append(rect(x - 70, y + 110, 140, 90, 10, C["himmel"]))
    b.append(rect(x - 96, y + 200, 192, 20, 8, C["erde"]))
    for i in range(6):
        col = C["orange"] if i % 2 == 0 else C["papier"]
        b.append(path(f"M {x - 130 + i * 44} {y + 60} L {x - 120 + i * 44} {y} L {x - 76 + i * 44} {y} "
                      f"L {x - 86 + i * 44} {y + 60} Z", col, sw=SI))
    b.append(path(f"M {x - 130} {y + 60} H {x + 134}", sw=SW))
    b.append(circ(x + 40, y + 190, 13, C["stern"]) + circ(x + 64, y + 194, 13, C["stern"]))
    # Sitzstange und Blumenkübel rechts
    b.append(rect(950, 440, 16, 270, 6, C["erde"]) + rect(900, 440, 116, 16, 8, C["erde"]))
    b.append(path("M 880 720 L 900 660 L 1000 660 L 1020 720 Z", C["orange"]) + bush(950, 650, 0.7))
    b.append(flowers([(920, 636, "rosa"), (980, 632, "sonne"), (950, 624, "weiss")]))
    b.append(circ(400, 720, 14, C["stern"]) + circ(426, 726, 14, C["stern"]))
    return svg(W, H, "".join(b))


def gehege_futteruhr():
    b = [gehege_base("laub-hell", "gras", "gras-hell")]
    # Baum mit Höhle links
    b.append(rect(40, 220, 110, 480, 34, C["erde"]))
    b.append(ell(95, 360, 26, 34, C["kontur"], False, 'opacity="0.85"'))
    b.append(path("M 140 470 Q 220 456 300 466 Q 310 470 306 482 Q 220 486 140 494 Z", C["erde"]))
    crown = [(60, 190, 110), (180, 160, 84), (0, 140, 80)]
    b.append("".join(circ(x, y, r, C["laub"]) for (x, y, r) in crown))
    b.append("".join(circ(x, y, r - SW / 2, C["laub"], False) for (x, y, r) in crown))
    # Uhrturm rechts außen (ohne Ziffern), neben der Tafel
    x = 952
    b.append(rect(x - 50, 300, 100, 400, 12, C["papier"]))
    b.append(path(f"M {x - 66} 300 L {x} 230 L {x + 66} 300 Z", C["orange"]))
    b.append(circ(x, 370, 40, C["weiss"]))
    for i in range(12):
        a = i * math.pi / 6
        b.append(path(f"M {x + 32 * math.sin(a)} {370 - 32 * math.cos(a)} L {x + 36 * math.sin(a)} {370 - 36 * math.cos(a)}", sw=3))
    b.append(path(f"M {x} 370 V 346 M {x} 370 H {x + 18}", sw=5) + circ(x, 370, 4, K, False))
    b.append(rect(x - 22, 600, 44, 100, 18, C["erde"]))
    b.append(bush(330, 640, 0.8) + bush(760, 650, 0.8))
    b.append(flowers([(250, 720, "sonne"), (520, 740, "rosa"), (680, 724, "weiss")]))
    return svg(W, H, "".join(b))


def glass_house(x0, x1, top, base):
    w = x1 - x0
    out = path(f"M {x0} {base} V {top + w * 0.25} Q {(x0 + x1) / 2} {top - w * 0.15} {x1} {top + w * 0.25} V {base} Z",
               C["himmel"], extra='opacity="0.95"')
    for i in range(1, 6):
        x = x0 + i * w / 6
        out += path(f"M {x} {base} V {top + 10}", sw=SI, extra='opacity="0.7"')
    for y in (top + w * 0.25 + 60, top + w * 0.25 + 160):
        out += path(f"M {x0} {y} H {x1}", sw=SI, extra='opacity="0.7"')
    out += path(f"M {x0 + 30} {base - 40} L {x0 + 80} {top + 80}", sw=6, extra=f'stroke="{C["weiss"]}" opacity="0.6"')
    return out


def gehege_schmetterlingshaus():
    b = [bs.sky()]
    b.append(glass_house(-40, W + 40, 130, 640))
    b.append(path(f"M 0 610 Q 512 580 {W} 610 V {H} H 0 Z", C["gras-hell"]))
    for (x, y, rot, s) in [(30, 560, -40, 1.4), (60, 520, -80, 1.2), (980, 560, -150, 1.4), (950, 520, -110, 1.2),
                           (340, 600, -60, 0.9), (720, 600, -120, 0.9)]:
        b.append(palm_leaf(x, y, rot, s))
    for (x, y, c, r) in [(120, 600, "rosa", 18), (190, 640, "sonne", 16), (80, 660, "orange", 14),
                         (900, 610, "rosa", 18), (960, 650, "sonne", 14), (840, 660, "orange", 16),
                         (420, 700, "rosa", 12), (600, 710, "sonne", 12), (300, 730, "weiss", 10)]:
        b.append(flower(x, y, c, r))
    b.append(ell(190, 700, 90, 22, C["laub"]) + path("M 120 700 Q 190 650 260 700", C["gras"], sw=SI))
    for x in (120, 940):
        b.append(path(f"M {x} 150 V 250", sw=SI))
        b.append(path(f"M {x - 44} 250 Q {x} 300 {x + 44} 250 Z", C["erde"]))
        b.append(palm_leaf(x - 10, 252, 120, 0.7) + palm_leaf(x + 10, 252, 60, 0.7))
        b.append(flower(x - 16, 244, "rosa", 12) + flower(x + 18, 242, "sonne", 11))
    return svg(W, H, "".join(b))


def gehege_giraffenhof():
    b = [gehege_base("laub-hell", "gras", "karte-schatten")]
    b.append(acacia(120, 640, 1.5) + acacia(930, 600, 1.2) + acacia(520, 520, 0.6))
    # Futterplattform rechts (hoch, für Giraffen)
    b.append(rect(860, 360, 12, 280, 6, C["erde"]) + rect(820, 340, 120, 30, 10, C["erde"]))
    b.append(ell(880, 330, 50, 18, C["gras"]))
    b.append(stone(330, 680, 90, 50, "erde") + bush(720, 690, 0.8))
    b.append(flowers([(260, 740, "rosa"), (600, 750, "weiss")]))
    return svg(W, H, "".join(b))


def gehege_zoozaehlung():
    b = [gehege_base("laub-hell", "karte-schatten", "karte-schatten")]
    for (x, y) in [(330, 690), (620, 730), (900, 690)]:
        b.append(ell(x, y, 70, 26, C["erde"]) + ell(x, y - 4, 26, 10, K, False))
    b.append(stone(110, 640, 200, 150) + stone(980, 560, 120, 90))
    # Aussichtspfosten und leere Zähltafel rechts (Striche setzt später das Spiel)
    b.append(rect(890, 330, 14, 220, 6, C["erde"]) + rect(820, 300, 160, 110, 12, C["papier"]))
    b.append(path("M 840 300 V 284 M 960 300 V 284", sw=SI))
    b.append(bush(470, 640, 0.7))
    return svg(W, H, "".join(b))


# ============================================================== Bereiche: Aufgabenansicht
def aufgabe_elefantenwiese():
    b = [task_ground(C["laub-hell"], "gras", "gras-hell", ledge("gras", cap="gras-hell"))]
    b.append(tuft(200, 344) + tuft(40, 330))
    b.append(ell(1000, 700, 120, 40, C["wasser"]))
    b.append(stone(1000, 600, 90, 70))
    b.append(flowers([(280, 740, "rosa"), (960, 744, "sonne")]))
    return svg(W, H, "".join(b))


def aufgabe_zookasse():
    b = [task_ground(C["laub-hell"], "karte-schatten")]
    for y in (660, 710):
        b.append(path(f"M 250 {y} Q 600 {y - 14} {W} {y}", sw=2, extra='opacity="0.25"'))
    # Sitzstange links: Pfosten mit Querstange, der Papagei sitzt bei y ≈ 330
    b.append(rect(110, 336, 22, H - 336, 8, C["erde"]))
    b.append(rect(20, 326, 220, 18, 9, C["erde"]))
    b.append(path("M 900 768 L 916 700 L 1016 700 L 1032 768 Z", C["orange"]) + bush(966, 690, 0.7))
    # Markise oben rechts
    for i in range(4):
        col = C["orange"] if i % 2 == 0 else C["papier"]
        b.append(path(f"M {870 + i * 44} 230 L {880 + i * 44} 170 L {924 + i * 44} 170 L {914 + i * 44} 230 Z", col, sw=SI))
    b.append(path("M 870 230 H 1030", sw=SW))
    return svg(W, H, "".join(b))


def aufgabe_futteruhr():
    b = [task_ground(C["laub-hell"], "gras", "gras-hell")]
    b.append(rect(-24, 120, 104, 700, 30, C["erde"]))
    b.append(ell(30, 250, 18, 26, K, False, 'opacity="0.85"'))
    b.append(path("M 66 344 Q 150 328 238 336 Q 252 340 248 354 Q 150 360 66 374 Z", C["erde"]))
    crown = [(-10, 40, 120), (120, 10, 92), (210, 70, 60)]
    b.append("".join(circ(x, y, r, C["laub"]) for (x, y, r) in crown))
    b.append("".join(circ(x, y, r - SW / 2, C["laub"], False) for (x, y, r) in crown))
    # kleine Uhr unten rechts
    b.append(rect(978, 600, 16, 170, 6, C["erde"]) + circ(986, 580, 34, C["weiss"]))
    b.append(path("M 986 580 V 560 M 986 580 H 1000", sw=4))
    b.append(flowers([(300, 740, "sonne"), (930, 748, "rosa")]))
    return svg(W, H, "".join(b))


def aufgabe_schmetterlingshaus():
    b = [bs.sky()]
    b.append(glass_house(-40, W + 40, 40, 610))
    b.append(path(f"M 0 600 Q 512 580 {W} 600 V {H} H 0 Z", C["gras-hell"]))
    # großes Blatt links als Sitzplatz
    b.append(path("M -20 360 Q 100 300 250 336 Q 140 380 -20 400 Z", C["gras"]))
    b.append(path("M -10 372 Q 100 340 236 338", sw=SI, extra='opacity="0.6"'))
    b.append(rect(40, 380, 14, H - 380, 6, C["gras-dunkel"]))
    for (x, y, c, r) in [(990, 620, "rosa", 18), (950, 680, "sonne", 14), (300, 720, "orange", 12),
                         (120, 700, "rosa", 14), (180, 740, "sonne", 10)]:
        b.append(flower(x, y, c, r))
    b.append(palm_leaf(1030, 560, -150, 1.2))
    return svg(W, H, "".join(b))


def aufgabe_giraffenhof():
    b = [task_ground(C["laub-hell"], "karte-schatten", None, ledge("karte-schatten", cap="gras"))]
    b.append(acacia(560, 560, 0.5) + acacia(800, 548, 0.4))
    b.append(stone(60, 470, 60, 36, "erde"))
    b.append(acacia(1000, 768, 1.1))
    return svg(W, H, "".join(b))


def aufgabe_zoozaehlung():
    b = [task_ground(C["laub-hell"], "karte-schatten", None, ledge("grau-warm"))]
    b.append(ell(620, 720, 60, 20, C["erde"]) + ell(620, 716, 22, 8, K, False))
    b.append(stone(250, 560, 70, 50) + stone(40, 640, 80, 60, "erde"))
    b.append(stone(1000, 700, 120, 110))
    return svg(W, H, "".join(b))


FILES = {
    "menue_start_1024x768": menu_start(),
    "menue_profil_1024x768": menu_profile(),
    "menue_erwachsene_1024x768": menu_adults(),
    "menue_rundenende_1024x768": menu_round_end(),
}
for area in ["elefantenwiese", "zookasse", "futteruhr", "schmetterlingshaus", "giraffenhof", "zoozaehlung"]:
    FILES[f"{area}_hintergrund_1024x768"] = globals()[f"gehege_{area}"]()
    FILES[f"{area}_aufgabe_1024x768"] = globals()[f"aufgabe_{area}"]()


def main():
    out = ROOT / "svg"
    out.mkdir(exist_ok=True)
    for name, content in FILES.items():
        (out / f"{name}.svg").write_text(content, encoding="utf-8")
    print("SVG:", len(FILES), "->", out.relative_to(REPO))


if __name__ == "__main__":
    main()
