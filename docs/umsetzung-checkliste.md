# Zahlen-Zoo: Checkliste zur Umsetzung

Stand: 7. November 2026. Grundlage: [`zahlen-zoo-spezifikation.md`](zahlen-zoo-spezifikation.md) (kurz „Spez.“) und [`kompetenzerwartungen-klasse-2.md`](kompetenzerwartungen-klasse-2.md) (kurz „KE“).

Die Checkliste folgt der Roadmap (Spez. Abschnitt 13): fünf Phasen mit je einem Tor. Ein Tor gilt erst als erreicht, wenn alle Punkte der Phase abgehakt sind. Verweise in Klammern nennen den Abschnitt der Quelle.

## 0. Klärungen vor und während der Umsetzung

- [x] Aktuelle stabile Phaser-Hauptversion prüfen und festlegen (Spez. 3): Phaser 4 (4.2.1)
- [ ] Lehrkraft für die inhaltliche Prüfung gewinnen (Spez. 12, KE 5)
- [ ] Die zehn unsicheren Zuordnungen mit der Lehrkraft am Lehrplan-Original klären (KE 5)
  - [ ] 1 Verteilung der Inhalte auf Klasse 1 und 2, Startstufen
  - [ ] 2 Flächeninhalt und Umfang
  - [ ] 3 Brüche ¼, ½, ¾ bei Größen
  - [ ] 4 Kombinatorik und Wahrscheinlichkeit
  - [ ] 5 Division als Verteilen und Aufteilen
  - [ ] 6 Reihen der Kernaufgaben im Einmaleins (1, 2, 5, 10)
  - [ ] 7 Rechengesetze in `smart_calc`
  - [ ] 8 Kraft der 5 und der 10
  - [ ] 9 Obergrenzen bei Geld und Größen
  - [ ] 10 Familiennamen, Stufenzuschnitt, Zuordnung zu Bereichen
- [ ] Ergebnis der Klärung in `families.json` sowie in Spez. Abschnitt 2 und 6 nachtragen (KE 5)
- [ ] Offene Familien ausarbeiten (KE 5): `smart_calc`, `strategy_pick`, `shapes_compose`, `time_units`, `exact_or_estimate`, `solids_basic`, `cube_buildings`, Raumorientierung (Lagebegriffe, Raster 5 × 5)
- [ ] Illustrationsstil für Tiere und Karte festlegen (Spez. 11, Risiken); Stand: Stilvorgabe 0.1 in [`stilprobe/style-guide.md`](../stilprobe/style-guide.md), offene Punkte dort unter „Noch festzulegen“
- [ ] Schrift wählen (Andika oder Atkinson Hyperlegible), Probedruck `1 l I` und `0 O` (Spez. 11); Andika laut Stilvorgabe gewählt und eingebunden, Probedruck offen
- [ ] Testgeräte bereitstellen: iPad mit Safari, Android-Tablet mit Chrome, Chromebook, Laptop mit Maus (Spez. 12)

## Phase 1: Fundament (1 bis 2 Wochen)

**Projekt und Werkzeuge** (Spez. 3)

- [x] Projekt mit Vite (TypeScript) anlegen
- [x] Phaser, Vitest, ESLint, Prettier, vite-plugin-pwa installieren; Versionen in `package.json` festschreiben (exakt gepinnt; TypeScript 6.0, weil typescript-eslint TypeScript 7 noch nicht unterstützt)
- [x] Skripte `dev`, `build`, `preview`, `test`, `lint` einrichten (dazu `typecheck`, `format`, `test:watch`)
- [x] `tsconfig.json` mit `strict: true` und `noUncheckedIndexedAccess`
- [x] ESLint-Regel `no-restricted-imports`: kein `phaser` in `src/logic/` (Spez. 4)
- [x] Phaser-Skalierung „FIT“, zentriert, Basis 1024 × 768, Querformat
- [x] `base` in `vite.config.ts` für das gewählte Hosting setzen, falls Unterpfad (Spez. 12): GitHub Pages, `base` = `/zahlenzoo/`; über `BASE_PATH` überschreibbar

**Gerüst** (Spez. 4)

- [x] Ordnerstruktur `src/scenes`, `src/ui`, `src/logic`, `src/services`, `src/types`, `public/assets`, `tests`
- [x] Leere Szenen: Boot, Menu, Map, Area, Task, RoundEnd, Parent, Settings
- [x] Typen `Task`, `TaskKind`, `Hint`, `CheckResult` in `src/types/task.ts` (Spez. 6); `level` umfasst auch Stufe 0 (Einspluseins im Pinguinfelsen)
- [x] `src/logic/rng.ts`: startwertbasierter Zufall (z. B. mulberry32), kein `Math.random()` (per ESLint-Regel in `src/logic/` verboten)
- [x] Ereignisse `answer-submitted` und `round-finished`; keine globalen Variablen (Dienste werden den Szenen im Konstruktor übergeben)
- [x] Aufräumen von Ereignissen und Tweens beim Verlassen jeder Szene (`BaseScene`)
- [x] `t(key)`-Funktion und `strings.de.json` (Spez. 3, 11)

**Automatische Prüfung**

- [x] GitHub Actions: Lint, Tests und Build bei jeder Änderung (Spez. 12)
- [x] Erste Vitest-Tests für `rng.ts` (dazu Runde und Texte)

- [x] **Tor 1:** Eine leere Runde läuft, Tests und Build sind grün.

## Phase 2: Vertikaler Schnitt (3 bis 4 Wochen)

Ein Bereich komplett: Pinguinfelsen mit `add_100` (Spez. 13).

**Spiellogik** (Spez. 6, 7, 8)

- [x] Generator für den gewählten Bereich mit drei Stufen (`src/logic/generators/add100.ts`)
- [x] Falsche Antwortkarten aus typischen Fehlern mit `errorTag` (± 10, ± 1, Ziffern vertauscht, Übertrag vergessen; beim Ergänzen: Endzahl statt Differenz)
- [x] Duplikate verwerfen; Tauschaufgaben zählen als gleich
- [x] `check(task, input)` mit Normalisierung (führende Nullen, Leerzeichen) und gleichwertigen Antworten
- [x] Rundenzusammenstellung: 8 bis 12 Aufgaben, Mischung 70 / 20 / 10, leicht ansteigende Reihenfolge
- [x] Ablauf bei Fehlern: Hinweis 1, Hinweis 2 mit Bild, Lösung Schritt für Schritt; Familie kommt später erneut (höchstens 2 Wiederholungen je Runde)
- [x] Sterne pro Runde (1, 2 bei 70 %, 3 bei 90 % im ersten Versuch)
- [x] Stufenfreischaltung nach einer Runde mit mindestens 2 Sternen

**Oberfläche** (Spez. 9)

- [x] Mindestens 3 Aufgabentypen: `number-input`, `choice`, `gap`
- [x] UI-Bausteine: Numpad, AnswerCards, HintBar (`HintPanel`), StarMeter, Button
- [x] Tippflächen mindestens 64 × 64 px, Abstand mindestens 16 px (Tasten 96 px nach Stilvorgabe)
- [x] Layout: obere Leiste mit Fortschritt, Aufgabe in der Mitte, Eingabe unten, Tier links
- [x] Immer sichtbar: Zurück zur Karte, Hinweis, Vorlesen (Vorlesen über die Sprachausgabe des Browsers)
- [x] Schrift mindestens 28 px, Ziffern 48 px; Kontrast mindestens 4,5 : 1 (Andika und Fredoka selbst gehostet)
- [x] Hilfsdarstellungen einblendbar: Zehner und Einer, Rechenstrich, Hundertertafel (Spez. 2)
- [x] Platzhaltergrafiken für Tier, Hintergrund und UI (Pinguin gezeichnet, Hintergrund einfarbig, Symbole aus der Stilprobe)

**Spielstand** (Spez. 10)

- [x] `save.ts` mit `localStorage`, Versionsnummer und Migrationsgerüst; beschädigter Spielstand wird gesichert, Export und Import als JSON vorbereitet
- [x] Mehrere Profile mit Spitzname und Tierbild, Auswahl und Löschen (Löschen im Erwachsenenbereich)

**Tests**

- [x] Generator: 1000 Startwerte, Zahlenraum eingehalten, Antwortkarten verschieden, keine Duplikate
- [x] Prüfer: richtige, falsche, gleichwertige und fehlerhaft formatierte Eingaben
- [x] Spielstand: Speichern und Laden (dazu Export, Import, Migration, Profile)

**Spieltest**

- [ ] Spieltest mit mindestens 5 Kindern der 2. Klasse, beobachtet, ohne Erklärung; Stockstellen notieren

- [ ] **Tor 2:** 5 Kinder spielen den Bereich ohne Hilfe von außen.

## Phase 3: Inhalte Klasse 2 (8 bis 10 Wochen)

**Daten** (Spez. 11)

- [ ] `areas.json`
- [ ] `families.json`
- [ ] `animals.json`
- [ ] `hints.de.json`
- [ ] `word-templates.de.json` (30 bis 40 Vorlagen)
- [ ] `strings.de.json` (vollständig)
- [ ] `praise.de.json` (mehrere Varianten je Anlass)
- [ ] `achievements.json`
- [ ] `legal.json` (Gerüst; Daten folgen in Phase 4)

**Bereiche und Familien** (Spez. 5, KE 2)

- [ ] Affenwald: `count_steps_100`, `read_write_100`, `place_value_100`, `quick_count`, `order_100`, `compare_100`, `neighbors_100`, `number_sequences`; davon `neighbors_100` fertig (Stufe 1 Nachbarzahlen, Stufe 2 Nachbarzehner, Stufe 3 Zahlenfolgen in 2er-, 5er- und 10er-Schritten)
- [ ] Pinguinfelsen: Stufe 0 `plus_facts_20`; `add_100`, `sub_100`, `decompose_10`, `complement_tens`, `tens_calc`, `estimate_100`, `smart_calc`, `path_choice`, `story_addsub`
- [ ] Elefantenwiese: `double_half`, `mult_core`, `mult_derive`, Division als Verteilen und Aufteilen, `story_multdiv`
- [ ] Zoo-Kasse: `money_calc`, `money_convert`, `compare_money`, `question_pick`, `exact_or_estimate`
- [ ] Futteruhr: `clock_full`, `clock_half`, `clock_quarter` (mit Dreiviertelstunde), `clock_digital`, `compare_duration`, `time_units`, `fraction_units`
- [ ] Schmetterlingshaus: `shapes_basic`, `pattern_continue`, `shapes_compose`, `symmetry_check` (erkennen, nicht zeichnen), `grid_draw`
- [ ] Giraffenhof: `measure_length`, `compare_length`, `anchor_sizes`, `length_convert`, `fraction_units`
- [ ] Zoo-Zählung: `tally_chart`, `read_table`, `read_chart`, `read_calendar`, `combinatorics`
- [ ] Raumorientierung: `route_instructions`, `position_words` auf Weltkarte und im Gehege
- [ ] Baumodus aus dem Gehege: `solids_basic`, `cube_buildings`
- [ ] Freier Modus „Muster erfinden“ ohne Sterne, Ergebnis im Zoo ausgestellt (KE 5)
- [ ] Übergreifend: `match_repr`, `strategy_pick`, Erklärfrage an eine erwachsene Person nach der Runde

**Weitere Aufgabentypen und Eingabeformen** (Spez. 6, KE 6)

- [ ] `drag-sort` mit Einrasten und sanftem Zurückschicken
- [ ] `number-line`
- [ ] `clock` (Zeiger einstellen, Uhrzeit wählen)
- [ ] `money` (Münzen und Scheine ziehen)
- [ ] `pattern` (Raster antippen)
- [ ] `word` (Bild plus Text)
- [ ] Typen mit geringem Aufwand: `true_false`, `compare_symbol`, `sequence`, `inverse`, `number_house`, `odd_one_out`, `time_order`
- [ ] Typen mit mittlerem Aufwand: `match_pairs`, `table_read`, `route`, `combinatorics`
- [ ] `cube_build` für den Baumodus

**Weltkarte und Fortschritt** (Spez. 5)

- [ ] Weltkarte mit 8 Bereichsmarkern (gesperrt, offen, fertig); gezeichnete Karte mit Schloss, Tier und Schild „bald“ fertig, Zustand „fertig“ offen
- [x] Freischaltung: Start mit Affenwald und Pinguinfelsen, weitere Bereiche nach 6 Sternen im Vorgänger
- [ ] Sterne einlösen für Baby-Tiere (benennbar) und Dekoration
- [ ] Sticker-Album mit Mathe-Abzeichen

**Kompetenzmodell** (Spez. 7)

- [ ] Letzte 10 Antworten je Familie, gewichtete Sicherheit, neuere Antworten stärker
- [ ] Stufe steigt (≥ 0,85, mindestens 8 Antworten) und sinkt (< 0,5 über 6 Antworten)
- [ ] Dreimal derselbe `errorTag` in einer Runde: Strategieerklärung mit Bild
- [ ] Tagesfutter: 5 Aufgaben aus den Familien mit niedrigster Sicherheit oder längster Pause (7 Tage)
- [ ] Tempo-Runde angelegt: Auswahl im Menü ab Stufe 2, Zeitmessung, Feld für Zeitbonus (Ausgestaltung V2)
- [ ] Tests: vorgegebene Antwortfolgen führen zu erwarteten Stufenwechseln und Wiederholungen

**Audio** (Spez. 9, 11)

- [ ] `audio.ts`: eingesprochene Datei, sonst Sprachausgabe des Browsers (Variante B)
- [ ] Audio-Schlüssel für jeden Text
- [ ] Ton erst nach der ersten Berührung; Musik und Effekte getrennt regelbar, Standard leise
- [ ] Erste Aufnahmen: Hinweise der Hilfestufe 1

**Grafik und Ressourcen** (Spez. 11)

- [x] Weltkarte (2048 × 1536) und 8 Bereichshintergründe; Weltkarte und Hintergründe für Gehege und Aufgabenansicht aller 8 Bereiche fertig, dazu 4 Menü-Hintergründe (Quellen in `art/`, @2× mit `npm run art` erzeugbar); eingebaut sind bisher Pinguinfelsen und Affenwald
- [ ] 8 Tierarten × 4 Zustände plus 8 Baby-Varianten als Sprite-Sheets; Pinguin und Affe fertig (5 Ausdrücke, Idle, Freude, Fütterung, Baby), 6 Tierarten offen
- [ ] Mathe-Darstellungen: Zehnerfeld, Hundertertafel, Rechenstrich, Zahlenstrahl, Zehnerstangen und Einerwürfel, Uhr, Münzen und Scheine (stilisiert), Muster-Kacheln, Formen, Körper
- [ ] Rund 20 Aufgabenobjekte, 12 Dekorationen, 12 Abzeichen, 8 Profil-Avatare; 4 Futterobjekte fertig (Fisch, Eimer, Banane, Futternapf)
- [ ] UI-Atlas, Tier-Atlas, Objekt-Atlas; Sprite-Sheets je Animation mit Atlas-JSON fertig, Symbole der Aufgabenansicht als Einzelbilder
- [ ] 15 Soundeffekte und 8 Tierlaute, 3 Musikstücke
- [ ] `ATTRIBUTIONS.md` für jede fremde Datei; Lizenzen geprüft (CC0, CC-BY mit Namensnennung, kein NC)

**Inhaltliche Prüfung**

- [ ] Aufgaben, Hinweise, Sachaufgaben und Lobtexte durch eine Lehrkraft geprüft (Grundwortschatz, Fachbegriffe)

- [ ] **Tor 3:** Eine Lehrkraft hat Aufgaben und Hinweise geprüft.

## Phase 4: Feinschliff (2 bis 3 Wochen)

**Offline und Installation** (Spez. 3, 12)

- [ ] vite-plugin-pwa: alle Dateien beim ersten Besuch ablegen
- [ ] PWA-Icons (192, 512, maskierbar), Logo, Favicon
- [ ] Update-Knopf „Neue Version laden“ statt Neuladen mitten in der Runde
- [ ] Schrift lokal als WOFF2, keine Fremdserver

**Barrierefreiheit** (Spez. 9)

- [ ] Hoher-Kontrast-Modus und größere Schrift als Einstellung
- [ ] Reduzierte Bewegung (auch nach Betriebssystem-Vorgabe)
- [ ] Farbenblind-sichere Palette; Information nie nur durch Farbe
- [ ] Tastaturbedienung für Laptops (Pfeiltasten, Eingabe, Leertaste)
- [ ] DOM-Overlay für Textmenüs prüfen (Risiko Bildschirmleser)

**Erwachsenenbereich** (Spez. 7, 10)

- [ ] Zugang über Erwachsenen-Knopf mit Rechenaufgabe
- [ ] Übersicht je Familie: Sicherheit und häufigste Fehlerart
- [ ] Export und Import des Spielstands als JSON
- [ ] Knopf „Alle lokalen Daten löschen“
- [ ] Tests: Export, Import und Migration älterer Versionen

**Rechtliches und Datenschutz** (Spez. 10)

- [ ] Impressum und Datenschutzerklärung über die Fußzeile des Menüs, offline verfügbar
- [ ] Angaben in `legal.json` eintragen
- [ ] Texte rechtlich prüfen lassen
- [ ] Seite „Danksagung“ im Spiel
- [ ] Keine Cookies, keine Analyse-Dienste, keine externen Skripte (prüfen)

**Akzeptanzkriterien** (Spez. 12)

- [ ] 60 Bilder pro Sekunde in der Aufgabenansicht auf einem mittleren Tablet
- [ ] Erster Start im WLAN unter 5 Sekunden bis zur Weltkarte
- [ ] Gesamtgröße unter 25 MB
- [ ] Nach dem ersten Laden vollständig offline spielbar
- [ ] 20 Runden pro Bereich ohne Absturz oder unlösbare Aufgabe
- [ ] Kinder der 2. Klasse starten eine Runde ohne Hilfe
- [ ] Jede falsche Antwort zeigt eine Hilfe
- [ ] Geräteprüfung auf allen vier Testgeräten
- [ ] Optional: Playwright-Durchlauf je Aufgabentyp mit simulierter Touch-Eingabe

- [ ] **Tor 4:** Alle Akzeptanzkriterien aus Spez. Abschnitt 12 sind erfüllt.

## Phase 5: Pilot und Erweiterung (3 bis 4 Wochen)

- [ ] Deployment auf statischem Hosting mit HTTPS: GitHub Pages über `.github/workflows/deploy.yml` bei jedem Push auf `main` eingerichtet; offen ist die erste erfolgreiche Veröffentlichung
- [ ] Bei Schuleinsatz: Abstimmung mit der Datenschutzstelle des Landes
- [ ] Pilot in einer Klasse
- [ ] Auswertung; Startwerte (Freischaltung, Stufenregeln, Sterne) in JSON anpassen
- [ ] Zwischenstufe für Klasse 3 mit einer Lehrkraft festlegen (KE 4)
- [ ] Planung V2: Klasse 3 (Zahlenraum bis 1000, Runden, Einmaleins sicher, Gewicht, Rauminhalt), Ausgestaltung der Tempo-Runde

- [ ] **Tor 5:** Pilot ausgewertet, Plan für V2 steht.
