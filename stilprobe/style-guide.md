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
- Silhouetten je Tier.

## Ergänzungen (7.11.2026)
- Neue Farbe `pinguin-gefieder` #6C8EA3 für Rücken und Kopf des Pinguins (Kontrast zur Kontur 3,3 : 1, wie `affe-fell`).
- Zoo-Karte und Kartensymbole: Quellen in `art/build_map.py` (nutzt die Hilfsfunktionen dieser Stilprobe), Erzeugung mit `npm run art`.
- Kartensymbole 128 × 128: Tierkopf in einem runden Abzeichen (Papier, Kontur 4 px) mit Bodenschatten; gesperrte Bereiche zeigen ein Schloss, Bereiche ohne Aufgaben ein leeres Schild, auf das das Spiel „bald“ setzt.
- Szenengrafiken für Pinguinfelsen und Affenwald: `art/build_scenes.py`. Tiere in 5 Ausdrücken, Idle (6), Freude (8, Sprung mit erhobenen Armen bzw. Flossen), Fütterung (8, Banane bzw. Fisch), Baby (Körper kleiner, Kopf größer; Pinguinküken in `grau-warm`).
- Hintergründe je Bereich zweimal: Gehege (`*_hintergrund_1024x768`) und Aufgabenansicht (`*_aufgabe_1024x768`, ruhige Mitte, Standfläche für das Tier links bei y = 330).
- Skalierte Formen behalten 4 px Kontur (Linienstärke wird beim Skalieren ausgeglichen).
- Kontaktbögen: `art/kontaktbogen_*.png`, erzeugt mit `npm run art`.
- Menü- und übrige Bereichshintergründe: `art/build_backgrounds.py`. Menüs: Start (Zoo-Eingang, Schild für den Titel bei y = 150), Profil (Wimpelkette, Luftballons), Erwachsene (ruhig), Rundenende (Strahlen, Konfetti am Rand). Aufgabenansichten: Hügel, Ast oder Stange links als Standfläche bei y ≈ 330, Fuß des Hügels verschwindet im Boden.
- Übrige Tiere: `art/build_animals.py` (Elefant, Papagei, Eule, Schmetterling, Giraffe, Erdmännchen) mit gemeinsamem Gerüst für Ausdrücke, Idle, Freude, Fütterung, Baby und Kartensymbol. Futter: Heu, Nuss, Beeren, Blüte, Akazienzweig, Käfer. Neue Farbe `elefant-haut` #A3A9B8 (Kontrast zur Kontur 4,9 : 1).
