#!/usr/bin/env python3
"""Zahlen-Zoo: erzeugt SVG-Quellen und PNG-Raster aus tokens.json.
Aufruf: python3 build_assets.py   (Playwright/Chromium für das Rendern nötig)
Alle Farben stammen ausschließlich aus TOKENS['colors']."""
import json, math, os, sys
from pathlib import Path

ROOT = Path(__file__).parent
SVG = ROOT / 'svg'; PNG = ROOT / 'png'
SVG.mkdir(exist_ok=True); PNG.mkdir(exist_ok=True)

TOKENS = {
  "version": "0.1-stilprobe",
  "stroke": {"main": 4, "inner": 2.5, "base_figure_px": 512,
             "rule": "4 px bei 512 px Figurenhöhe; Innenlinien 2.5 px; runde Enden und Ecken"},
  "light": "oben links, höchstens eine Schattenstufe",
  "fonts": {"text": "Andika (SIL OFL)", "display": "Fredoka (SIL OFL)",
            "install": "npm i @fontsource/andika @fontsource/fredoka (selbst gehostet, kein Google-CDN)"},
  "colors": {
    "kontur":        {"hex": "#4A3426", "use": "Konturen, Text auf hellen Flächen"},
    "text":          {"hex": "#3A2A20", "use": "Fließtext und Ziffern im Spiel"},
    "papier":        {"hex": "#FFF8EC", "use": "Karten, Tasten, helle Flächen"},
    "karte-schatten":{"hex": "#E8D3A8", "use": "Tastenkante, leere Sterne"},
    "himmel":        {"hex": "#BFE6F2", "use": "Himmel"},
    "himmel-tief":   {"hex": "#8FCDE3", "use": "Himmel oben, Wasser hell"},
    "wasser":        {"hex": "#5BB8D9", "use": "Wasser, Zehnerstangen"},
    "gras-hell":     {"hex": "#B5E08F", "use": "Boden"},
    "gras":          {"hex": "#8CCB6B", "use": "Hügel, richtig-Symbol"},
    "gras-dunkel":   {"hex": "#5FA84F", "use": "Schattenseiten Vegetation"},
    "laub":          {"hex": "#3F8F4F", "use": "Baumkronen, Ranken"},
    "laub-hell":     {"hex": "#A9D98F", "use": "ferne Hügel (ohne Kontur)"},
    "sonne":         {"hex": "#FFD25A", "use": "Sonne, Banane, Glühbirne"},
    "stern":         {"hex": "#FFC83D", "use": "Sterne"},
    "orange":        {"hex": "#FFB347", "use": "Einerwürfel, Zähler, weicher Hinweis"},
    "rosa":          {"hex": "#FF8FA3", "use": "Wangen, Zunge, Blumen"},
    "ohr-rosa":      {"hex": "#F7B7A6", "use": "Innenohr"},
    "erde":          {"hex": "#C98F5A", "use": "Baumstämme, Wege"},
    "weiss":         {"hex": "#FFFFFF", "use": "Glanzlichter, Wolken"},
    "mund":          {"hex": "#8C3B33", "use": "Mundinneres"},
    "grau-warm":     {"hex": "#C9BBA3", "use": "Sockel, Silhouetten"},
    "affe-fell":     {"hex": "#B9794A", "use": "Affe Fell"},
    "affe-hell":     {"hex": "#F1CFA0", "use": "Affe Gesicht und Bauch"},
    "affe-dunkel":   {"hex": "#8F5A34", "use": "Affe Haarschopf und Nase"}
  },
  "shadow": {"color": "kontur", "opacity": 0.14, "rule": "nur Bodenschatten, flache Ellipse"}
}
C = {k: v["hex"] for k, v in TOKENS["colors"].items()}
K = C["kontur"]
SW = TOKENS["stroke"]["main"]; SI = TOKENS["stroke"]["inner"]

def svg(w, h, body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs>{defs}</defs><g stroke="{K}" stroke-width="{SW}" stroke-linejoin="round" '
            f'stroke-linecap="round">{body}</g></svg>')

def ell(cx, cy, rx, ry, fill, outline=True, extra=""):
    st = "" if outline else ' stroke="none"'
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}"{st} {extra}/>'

def circ(cx, cy, r, fill, outline=True, extra=""):
    return ell(cx, cy, r, r, fill, outline, extra)

def path(d, fill="none", outline=True, sw=None, extra=""):
    st = "" if outline else ' stroke="none"'
    w = f' stroke-width="{sw}"' if sw else ""
    return f'<path d="{d}" fill="{fill}"{st}{w} {extra}/>'

def rect(x, y, w, h, r, fill, outline=True, extra=""):
    st = "" if outline else ' stroke="none"'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}"{st} {extra}/>'

def limb(x1, y1, x2, y2, w, fill):
    """Gliedmaße mit Kontur: dicke Konturlinie, darüber Füllung."""
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{K}" stroke-width="{w+2*SW}"/>'
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{fill}" stroke-width="{w}"/>')

# ---------------------------------------------------------------- Affe
def eye(cx, cy, kind):
    if kind == "round":
        return (circ(cx, cy, 17, K, False) + circ(cx-5, cy-6, 6, C["weiss"], False)
                + circ(cx+6, cy+6, 3, C["weiss"], False))
    if kind == "look":
        return (circ(cx-3, cy-4, 17, K, False) + circ(cx-9, cy-11, 6, C["weiss"], False)
                + circ(cx+3, cy+2, 3, C["weiss"], False))
    if kind == "happy":
        return path(f"M {cx-17} {cy+6} Q {cx} {cy-22} {cx+17} {cy+6}", sw=6)
    if kind == "sleepy":
        return path(f"M {cx-17} {cy-2} Q {cx} {cy+14} {cx+17} {cy-2}", sw=6)
    if kind == "blink":
        return path(f"M {cx-16} {cy} Q {cx} {cy+9} {cx+16} {cy}", sw=6)
    raise ValueError(kind)

def mouth(kind, cid):
    if kind == "smile":
        return path("M 232 270 Q 256 290 280 270", sw=5)
    if kind in ("open", "big"):
        d = ("M 226 264 Q 256 312 286 264 Z" if kind == "open" else "M 218 260 Q 256 330 294 260 Z")
        cl = f'<clipPath id="{cid}"><path d="{d}"/></clipPath>'
        tongue = ell(256, 300 if kind == "big" else 290, 15, 9, C["rosa"], False, f'clip-path="url(#{cid})"')
        return cl, path(d, C["mund"]) + tongue
    if kind == "wave":
        return path("M 236 278 Q 248 268 258 277 T 280 272", sw=5)
    if kind == "flat":
        return path("M 242 272 Q 256 284 270 272", sw=5)
    raise ValueError(kind)

EXPR = {  # Ausdruck -> (Augen, Mund, Arme, Zusatz)
  "neutral":      ("round",  "smile", "down", ""),
  "froh":         ("round",  "open",  "down", ""),
  "jubelnd":      ("happy",  "big",   "up",   ""),
  "nachdenklich": ("look",   "wave",  "down", "brow"),
  "muede":        ("sleepy", "flat",  "down", ""),
}

def monkey(expr="neutral", bob=0.0, blink=False, tag="m"):
    eyek, mouthk, arms, extra = EXPR[expr]
    if blink: eyek = "blink"
    F, H, D = C["affe-fell"], C["affe-hell"], C["affe-dunkel"]
    defs = ""; b = []
    b.append(ell(256, 481, 130, 16, K, False, f'opacity="{TOKENS["shadow"]["opacity"]}"'))
    b.append(path("M 345 412 C 440 424 478 332 430 292 C 408 274 386 296 406 308",
                  sw=34, extra=f'stroke="{K}"') +
             path("M 345 412 C 440 424 478 332 430 292 C 408 274 386 296 406 308",
                  sw=26, extra=f'stroke="{F}"'))
    for x in (196, 316):
        b.append(ell(x, 458, 54, 24, F)); b.append(ell(x, 463, 34, 12, H, False))
    b.append(ell(256, 372 + bob*0.5, 98, 96 - bob*0.5, F))
    b.append(ell(256, 388, 64, 66, H, False))
    ax = {"down": (140, 430), "up": (108, 258)}[arms]
    for side in (1, -1):
        sx = 256 + side*(-84) ; hx = 256 + side*(ax[0]-256)*-1 if False else (ax[0] if side == 1 else 512-ax[0])
        sh = 172 if side == 1 else 340
        b.append(limb(sh, 342 + bob*0.5, hx, ax[1], 40, F))
        b.append(circ(hx, ax[1], 27, F))
    g = []  # Kopfgruppe (wippt)
    for x in (118, 394):
        g.append(circ(x, 215, 42, F)); g.append(circ(x, 215, 22, C["ohr-rosa"], False))
    g.append(path("M 220 100 C 210 62 246 48 256 76 C 270 50 304 66 292 102 Z", D))
    g.append(ell(256, 210, 142, 124, F))
    g.append(ell(218, 196, 64, 56, H, False)); g.append(ell(294, 196, 64, 56, H, False))
    g.append(ell(256, 250, 92, 64, H, False))
    g.append(ell(176, 252, 20, 13, C["rosa"], False, 'opacity="0.55"'))
    g.append(ell(336, 252, 20, 13, C["rosa"], False, 'opacity="0.55"'))
    g.append(eye(214, 206, eyek)); g.append(eye(298, 206, eyek))
    if extra == "brow": g.append(path("M 280 176 Q 298 164 316 176", sw=5))
    g.append(circ(247, 238, 3.5, D, False)); g.append(circ(265, 238, 3.5, D, False))
    m = mouth(mouthk, f"{tag}-mc")
    if isinstance(m, tuple): defs += m[0]; g.append(m[1])
    else: g.append(m)
    b.append(f'<g transform="translate(0,{-bob})">' + "".join(g) + "</g>")
    return svg(512, 512, "".join(b), defs)

# ---------------------------------------------------------------- Hintergrund
def cloud(x, y, s=1.0):
    parts = [circ(0, 0, 34, C["weiss"]), circ(40, 8, 28, C["weiss"]), circ(-40, 10, 26, C["weiss"]),
             rect(-62, 8, 120, 30, 15, C["weiss"])]
    cover = rect(-58, 4, 112, 32, 14, C["weiss"], False)
    return f'<g transform="translate({x},{y}) scale({s})">' + "".join(parts) + cover + '</g>'

def tree(x, base, w, top, crown):
    t = rect(x-w/2, top, w, base-top, w/3, C["erde"])
    t += rect(x-w/2+8, top+20, 10, base-top-60, 5, C["weiss"], False, 'opacity="0.25"')
    cr = ""
    for (dx, dy, r) in crown:
        cr += circ(x+dx, top+dy, r, C["laub"])
    cover = ""
    for (dx, dy, r) in crown:
        cover += circ(x+dx, top+dy, r-SW/2, C["laub"], False)
    hi = ""
    for (dx, dy, r) in crown[:3]:
        hi += circ(x+dx-r*0.3, top+dy-r*0.3, r*0.45, C["gras-dunkel"], False, 'opacity="0.55"')
    return t + cr + cover + hi

def banana(x, y, rot=0, s=1.0):
    d = "M 0 0 C 26 4 40 40 30 76 C 26 86 12 84 14 72 C 20 48 12 24 -8 12 C -12 4 -6 -2 0 0 Z"
    return (f'<g transform="translate({x},{y}) rotate({rot}) scale({s})">'
            + path(d, C["sonne"]) + circ(-3, 4, 4, C["erde"], False) + '</g>')

def background_affenwald():
    b = []
    b.append(rect(0, 0, 1024, 768, 0, C["himmel"], False))
    b.append(rect(0, 0, 1024, 170, 0, C["himmel-tief"], False))
    b.append(path("M 0 170 Q 128 190 256 170 T 512 170 T 768 170 T 1024 170 V 150 H 0 Z", C["himmel-tief"], False))
    b.append(circ(770, 112, 52, C["sonne"]))
    b.append(cloud(250, 120, 0.9)); b.append(cloud(640, 200, 0.75))
    b.append(path("M 0 430 Q 180 340 380 410 T 760 390 T 1024 410 V 768 H 0 Z", C["laub-hell"], False))
    b.append(path("M 0 500 Q 260 420 520 490 T 1024 470 V 768 H 0 Z", C["gras"]))
    b.append(path("M 0 600 Q 512 540 1024 600 V 768 H 0 Z", C["gras-hell"]))
    # Pfad (Mitte bleibt frei und ruhig)
    b.append(path("M 330 768 Q 420 660 512 640 Q 620 620 700 768 Z", C["karte-schatten"], False, extra='opacity="0.55"'))
    # Bäume links und rechts
    b.append(tree(86, 720, 78, 300, [(-10, -10, 92), (70, -40, 80), (-60, -70, 74), (30, -100, 70)]))
    b.append(tree(944, 720, 78, 320, [(10, -10, 92), (-70, -40, 80), (60, -70, 74), (-30, -100, 70)]))
    b.append(tree(222, 640, 46, 420, [(0, -14, 62), (46, -2, 46), (-42, 0, 44)]))
    b.append(tree(812, 640, 46, 430, [(0, -14, 62), (-46, -2, 46), (42, 0, 44)]))
    # Ranken und Bananen
    b.append(path("M 150 330 Q 190 400 160 470", sw=12, extra=f'stroke="{K}"') +
             path("M 150 330 Q 190 400 160 470", sw=5, extra=f'stroke="{C["gras-dunkel"]}"'))
    b.append(banana(150, 472, 8, 0.9)); b.append(banana(168, 468, -6, 0.9))
    b.append(path("M 870 350 Q 836 420 866 490", sw=12, extra=f'stroke="{K}"') +
             path("M 870 350 Q 836 420 866 490", sw=5, extra=f'stroke="{C["gras-dunkel"]}"'))
    # Büsche und Blumen am Rand
    for x in (30, 330, 700, 1000):
        b.append(ell(x, 690, 70, 34, C["gras-dunkel"]))
    for (x, y, c) in [(60, 735, "rosa"), (120, 748, "sonne"), (400, 744, "weiss"), (900, 740, "rosa"), (960, 752, "sonne"), (640, 746, "weiss")]:
        b.append(circ(x, y, 9, C[c])); b.append(circ(x, y, 3.5, C["orange"], False))
    return svg(1024, 768, "".join(b))

# ---------------------------------------------------------------- Oberfläche
def key_blank(w=96, h=96, r=22, lip=6):
    return svg(w, h, rect(4, 4+lip, w-8, h-8-lip+0, r, C["karte-schatten"]) + rect(4, 4, w-8, h-8-lip, r, C["papier"]))

def card_blank(w=240, h=140):
    return key_blank(w, h, 28, 8)

def star_poly(cx, cy, ro, ri):
    pts = []
    for i in range(10):
        a = -math.pi/2 + i*math.pi/5; r = ro if i % 2 == 0 else ri
        pts.append(f"{cx+r*math.cos(a):.1f},{cy+r*math.sin(a):.1f}")
    return " ".join(pts)

def star(full=True):
    p = star_poly(48, 52, 40, 19)
    f = C["stern"] if full else C["karte-schatten"]
    body = f'<polygon points="{p}" fill="{f}" stroke-width="{SW+2}"/>'
    if full: body += circ(40, 40, 5, C["weiss"], False, 'opacity="0.7"')
    return svg(96, 96, body)

def bulb():
    b = "".join(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}"/>' for x1, y1, x2, y2 in
                [(48, 6, 48, 12), (20, 18, 24, 23), (76, 18, 72, 23)])
    b += rect(36, 66, 24, 18, 5, C["grau-warm"]) + circ(48, 42, 26, C["sonne"])
    b += path("M 36 36 Q 38 28 46 25", C["weiss"] if False else "none", False, 4, f'stroke="{C["weiss"]}" opacity="0.8"')
    b += path("M 40 60 H 56", sw=SI)
    return svg(96, 96, b)

def ok_check():
    return svg(96, 96, circ(48, 48, 40, C["gras"]) + path("M 28 50 L 43 64 L 70 34", sw=9))

def retry_cloud():
    cl = (circ(34, 52, 20, C["orange"]) + circ(52, 40, 24, C["orange"]) + circ(68, 54, 18, C["orange"]) +
          rect(18, 52, 66, 22, 11, C["orange"]) + rect(22, 54, 58, 18, 9, C["orange"], False) +
          circ(34, 52, 17, C["orange"], False) + circ(52, 40, 21, C["orange"], False) + circ(68, 54, 15, C["orange"], False))
    cl += path("M 55 46 A 13 13 0 1 0 63 58", sw=6) + f'<polygon points="63,48 56,59 70,59" fill="{K}"/>'
    return svg(96, 96, cl)

# ---------------------------------------------------------------- Mathebausteine
def einer(n=64):
    return svg(n, n, rect(4, 4, n-8, n-8, 12, C["orange"]) +
               rect(11, 11, 14, 8, 4, C["weiss"], False, 'opacity="0.6"'))

def zehner(cell=48):
    h = cell*10; w = cell
    body = rect(4, 4, w-8, h-8, 12, C["wasser"])
    for i in range(1, 10):
        body += f'<line x1="6" y1="{i*cell}" x2="{w-6}" y2="{i*cell}" stroke-width="{SI}"/>'
    body += rect(10, 14, 8, h-28, 4, C["weiss"], False, 'opacity="0.35"')
    return svg(w, h, body)

def counter(color, n=64):
    return svg(n, n, circ(n/2, n/2, 24, C[color]) + circ(n/2-8, n/2-8, 5, C["weiss"], False, 'opacity="0.6"'))

def zehnerfeld(filled=0):
    cell = 64; w = cell*5+8; h = cell*2+8
    body = rect(4, 4, w-8, h-8, 14, C["papier"])
    for i in range(1, 5):
        body += f'<line x1="{4+i*cell}" y1="6" x2="{4+i*cell}" y2="{h-6}" stroke-width="{SI}"/>'
    body += f'<line x1="6" y1="{4+cell}" x2="{w-6}" y2="{4+cell}" stroke-width="{SI}"/>'
    for k in range(filled):
        row, col = divmod(k, 5)
        col_name = "orange" if row == 0 else "wasser"
        body += circ(4+col*cell+cell/2, 4+row*cell+cell/2, 24, C[col_name])
    return svg(w, h, body)

# ---------------------------------------------------------------- Ausgabe
FILES = {}
def add(name, content): FILES[name] = content

for e in EXPR:
    add(f"affenwald_affe_{e}_512", monkey(e, tag=e))
BOB = [0, 2, 4, 6, 4, 2]
for i, bob in enumerate(BOB):
    add(f"affenwald_affe_idle_{i}_512", monkey("neutral", bob=bob, blink=(i == 5), tag=f"i{i}"))
add("affenwald_hintergrund_1024x768", background_affenwald())
add("ui_taste_leer_96", key_blank()); add("ui_karte_leer_240x140", card_blank())
add("ui_stern_voll_96", star(True)); add("ui_stern_leer_96", star(False))
add("ui_hinweis_gluehbirne_96", bulb()); add("ui_richtig_haken_96", ok_check()); add("ui_nochmal_wolke_96", retry_cloud())
add("mathe_einer_64", einer()); add("mathe_zehner_48x480", zehner())
add("mathe_zaehler_orange_64", counter("orange")); add("mathe_zaehler_wasser_64", counter("wasser"))
add("mathe_zehnerfeld_leer_328x136", zehnerfeld(0)); add("mathe_zehnerfeld_7_328x136", zehnerfeld(7))

def hex_to_rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))
def lum(h):
    f = lambda c: c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    r, g, b = map(f, hex_to_rgb(h)); return 0.2126*r + 0.7152*g + 0.0722*b
def contrast(a, b):
    la, lb = lum(C[a]), lum(C[b]); hi, lo = max(la, lb), min(la, lb); return (hi+0.05)/(lo+0.05)

def main():
    json.dump(TOKENS, open(ROOT / "tokens.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    for n, s in FILES.items(): (SVG / f"{n}.svg").write_text(s, encoding="utf-8")
    print("SVG:", len(FILES))
    print("Kontraste (Mindestwert 4.5 für Text, 3 für Grafik):")
    bad = 0
    for fg, bg in [("text","papier"),("kontur","papier"),("kontur","gras"),("kontur","orange"),("kontur","sonne"),
                   ("kontur","wasser"),("kontur","stern"),("kontur","karte-schatten"),("kontur","gras-hell"),("kontur","himmel")]:
        c = contrast(fg, bg); flag = "" if c >= 4.5 else "  <-- unter 4.5"
        bad += c < 3; print(f"  {fg:>8} auf {bg:<15} {c:5.2f}{flag}")
    if bad: sys.exit("Kontrast unter 3 gefunden")
    render()

def render():
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        br = p.chromium.launch(); n = 0
        for name, s in FILES.items():
            import re
            m = re.search(r'width="([\d.]+)" height="([\d.]+)"', s); w, h = float(m[1]), float(m[2])
            for scale, suf in ((1, ""), (2, "@2x")):
                pg = br.new_page(viewport={"width": int(w), "height": int(h)}, device_scale_factor=scale)
                pg.set_content(f'<html><body style="margin:0;background:transparent">{s}</body></html>')
                pg.screenshot(path=str(PNG / f"{name}{suf}.png"), omit_background=True,
                              clip={"x": 0, "y": 0, "width": w, "height": h}); pg.close(); n += 1
        br.close()
    print("PNG:", n)
    spritesheet("affenwald_affe_idle", len(BOB))

def spritesheet(prefix, n, size=256):
    from PIL import Image
    sheet = Image.new("RGBA", (size*n, size), (0, 0, 0, 0)); frames = {}
    for i in range(n):
        im = Image.open(PNG / f"{prefix}_{i}_512@2x.png").convert("RGBA").resize((size, size), Image.LANCZOS)
        sheet.paste(im, (i*size, 0))
        frames[f"{prefix}_{i}"] = {"frame": {"x": i*size, "y": 0, "w": size, "h": size}, "rotated": False,
            "trimmed": False, "spriteSourceSize": {"x": 0, "y": 0, "w": size, "h": size}, "sourceSize": {"w": size, "h": size}}
    sheet.save(PNG / f"{prefix}_sheet.png")
    json.dump({"frames": frames, "meta": {"image": f"{prefix}_sheet.png", "size": {"w": size*n, "h": size}, "scale": "1",
               "fps": 12, "frameSequence": [0, 1, 2, 3, 4, 5, 4, 3, 2, 1]}},
              open(PNG / f"{prefix}_sheet.json", "w"), indent=2)
    print("Spritesheet:", prefix)

if __name__ == "__main__":
    main()
