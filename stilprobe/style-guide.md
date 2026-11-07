# Zahlen-Zoo: Stilvorgabe (Version 0.1, Stilprobe)

Verbindlich für alle Grafiken. Quelle der Werte: `tokens.json`. Erzeugung: `python3 build_assets.py` (SVG → PNG, Kontaktbogen: `python3 kontaktbogen.py`).

## Entscheidungen (7.11.2026)
- Konturlinie: ja. 4 px bei 512 px Figurenhöhe (Hintergründe 1024 × 768: ebenfalls 4 px), Innenlinien 2.5 px, Farbe `kontur` #4A3426, runde Enden und Ecken. Ferne Hintergrundflächen (`laub-hell`) ohne Kontur.
- Palette: 23 benannte Farben in `tokens.json`. Keine anderen Werte verwenden.
- Schrift: Andika (Text und Ziffern, für Leselerner entworfen) und Fredoka (Titel), beide SIL OFL. Einbindung selbst gehostet über `npm i @fontsource/andika @fontsource/fredoka` (Verfügbarkeit beim Installieren prüfen). Keine Texte in Grafiken: Ziffern und Wörter setzt das Spiel; Tasten und Karten sind deshalb leer.
- Animation: voller Umfang je Tier: Idle (6 Bilder, Hin-und-Her-Ablauf, Blinzeln), Freude (8), Fütterung (8), 12 fps. In der Stilprobe ist nur Idle enthalten.
- Raster-PNG werden ausschließlich aus den SVG-Quellen gerendert (1× und @2×). Keine Nacharbeit an PNG.

## Regeln
1. Figuren: Kindchenschema, Kopf ca. 40 % der Höhe, Standlinie y = 470 von 512, Fußpunkt immer gleich, Bodenschatten als flache Ellipse (Kontur, 14 % Deckkraft).
2. Gesicht: runde Augen mit zwei Glanzlichtern, kleine Nase aus zwei Punkten, rosa Wangen. Ausdrücke: neutral, froh, jubelnd, nachdenklich, müde (geschlossene Augen, sanftes Lächeln; nie mürrisch).
3. Licht von oben links, höchstens eine Schattenstufe, keine Verläufe.
4. Oberfläche: Tasten mindestens 96 × 96 px, mit sichtbarer Unterkante. Richtig = Haken (dunkle Kontur auf Grün), Nochmal = orangefarbene Wolke mit Pfeil. Bedeutung nie nur über Farbe.
5. Mathebausteine: Einer = oranger Würfel, Zehner = blaue Stange mit 10 Feldern, Zehnerfeld 5 × 2 (obere Reihe orange, untere blau). Immer gleiche Darstellung.
6. Kontrast: Konturfarbe auf allen Flächen mindestens 5,1 : 1, Text auf Papier 12,98 : 1 (per Skript geprüft).
7. Benennung: `bereich_motiv_variante_größe.svg/png`, Kleinbuchstaben, ohne Umlaute.

## Noch festzulegen
- Hintergrund-Ebenen für Parallax (2 bis 3) und Auflösung der @2x-Hintergründe.
- Münzen und Scheine (eigene vereinfachte Darstellung), Uhr, Lineal, Formen.
- Silhouetten und Kartensymbole (128 × 128) je Tier.
