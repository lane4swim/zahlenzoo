# Kompetenzerwartungen Klasse 2 (NRW)

Stand: 7. November 2026. Ergänzend: `zahlen-zoo-spezifikation.md`.

## 1. Grundlage und Befund

Der NRW-Lehrplan nennt Erwartungen am Ende der Schuleingangsphase (Klasse 1 und 2) und am Ende von Klasse 4; für Klasse 3 gibt es keine eigene Stufe. Dieser Tab übersetzt die Erwartungen am Ende von Klasse 2 in Spielinhalte und zeigt, was der Zahlen-Zoo bisher abdeckt.

**Quelle:** [Lehrplan Mathematik Primarstufe NRW](https://lehrplannavigator.nrw.de/system/files/media/document/file/ps_lp_m_einzeldatei_2025_03_18.pdf), Kapitel 2.3 (Stand der Korrektur vom 18.03.2025). Die Erwartungen sind sinngemäß wiedergegeben, nicht wörtlich.

**Lesart:** Das PDF stellt die Spalten „Ende Schuleingangsphase“ und „Ende Klasse 4“ nebeneinander. Die Zuordnung zu Klasse 2 ist aus dem Text abgeleitet; bei Flächeninhalt und Umfang (Klasse 4) und den Brüchen ¼, ½, ¾ bei Größen (Klasse 2) vor Phase 3 am Original mit einer Lehrkraft prüfen.

**Befund**

- Zahlenraum bis 100, Addition und Subtraktion, Kopfrechnen, Geld, Uhrzeit und Muster sind durch die geplanten Bereiche abgedeckt oder teilweise abgedeckt.
- Lücken: Einspluseins im Zahlenraum bis 20, überschlagendes Rechnen, Daten, Tabellen und Kombinatorik, Raumorientierung, Körper und Längenmessen.
- Fünf Stellen der bisherigen Spezifikation weichen vom Lehrplan ab (Abschnitt 4), vor allem beim Einmaleins, bei Brüchen, bei der Uhr und beim Spiegeln.
- Schriftliche Rechenverfahren gehören nicht zu Klasse 2. Leistungen der Schuleingangsphase werden ohne Noten bewertet; das passt zu einem Spiel ohne Ranking.
- Im Einzelspiel nicht prüfbar: Rechenwege in eigenen Worten beschreiben, mit dem Lineal messen, mit Hilfsmitteln zeichnen. Das Spiel ergänzt hier den Unterricht und ersetzt ihn nicht.

## 2. Inhaltsbezogene Erwartungen

Stand: **abgedeckt** = durch Bereich und Familie geplant, **teilweise** = ein Teilaspekt fehlt, **Lücke** = bisher nicht geplant. Familiennamen sind Vorschläge für `families.json`.

Die Tabellen zeigen den Stand vor den Entscheidungen vom 07.11.2026. Danach sind alle Zeilen mit Stand „Lücke“ sowie die Zeilen zu Division, Einmaleins, Uhr, Brüchen, Längen und Symmetrie in V1 eingeplant. Was weiterhin offen ist, steht in Abschnitt 5.

### Zahlen und Operationen

| Schwerpunkt | Erwartung am Ende von Klasse 2 (sinngemäß) | Zahlen-Zoo: Bereich · Familie | Stand |
| --- | --- | --- | --- |
| Zahlverständnis | Zählen vorwärts und rückwärts, in Schritten, mit beliebiger Startzahl, bis 100 | Affenwald · `count_steps_100` | abgedeckt |
| Zahlverständnis | Zahlen bis 100 benennen und schreiben | Affenwald · `read_write_100` (Zahlwort hören, Ziffern setzen) | abgedeckt |
| Zahlverständnis | Zahlen mit Bündelung und Stellenwert darstellen (Zehner und Einer) | Affenwald · `place_value_100` (Zehnerstangen, Einerwürfel) | abgedeckt |
| Zahlverständnis | zwischen Material, Bild, Symbol und Sprache wechseln | alle Bereiche · Aufgabenform `match_repr` | teilweise: Sprache nur über Vorlesen |
| Zahlverständnis | Strukturen zur schnellen Anzahlerfassung nutzen (Kraft der 5 und 10) | Affenwald · `quick_count` (Blitzblick auf Zehnerfeld) | abgedeckt |
| Zahlverständnis | Zahlen ordnen und vergleichen | Affenwald · `order_100`, `compare_100` | abgedeckt |
| Zahlverständnis | Beziehungen beschreiben: Vorgänger, Nachfolger, Hälfte, Doppeltes, um x größer oder kleiner | Affenwald · `neighbors_100`, `number_sequences`; Elefantenwiese · `double_half` | abgedeckt |
| Operationsverständnis | Situationen den vier Rechenarten zuordnen (Hinzufügen, Abziehen, Wiederholen, Verteilen) | Pinguinfelsen · `story_addsub`; Elefantenwiese · `story_multdiv` | teilweise: Verteilen und Aufteilen (Division) fehlt in Klasse 2 |
| Operationsverständnis | Fachbegriffe plus, minus, mal, geteilt verwenden | Vorgabe für Aufgaben- und Hinweistexte | abgedeckt |
| Schnelles Kopfrechnen | Anzahlen erfassen, Zahlen bis 10 zerlegen, auf Stufenzahlen ergänzen, mit Zehnerzahlen rechnen, in Schritten zählen, verdoppeln und halbieren | Pinguinfelsen · `decompose_10`, `complement_tens`, `tens_calc`; Elefantenwiese · `double_half` | abgedeckt |
| Schnelles Kopfrechnen | kleines Einspluseins automatisiert abrufen, Umkehrungen ableiten | Pinguinfelsen · `plus_facts_20` | Lücke: `add_100` beginnt erst bei 34 + 5 |
| Schnelles Kopfrechnen | Kernaufgaben des kleinen Einmaleins automatisiert abrufen, weitere Aufgaben daraus ableiten | Elefantenwiese · `mult_core`, `mult_derive` | teilweise: Spezifikation plant bis Stufe 3 alle Reihen |
| Zahlenrechnen | Addition und Subtraktion bis 100 mündlich oder halbschriftlich mit Rechengesetzen und Zerlegungsstrategien | Pinguinfelsen · `add_100`, `sub_100` | abgedeckt |
| Zahlenrechnen | vorteilhaft rechnen mit Zahlbeziehungen (Nachbarzahlen) und Tauschaufgaben | Pinguinfelsen · `smart_calc` | teilweise: bisher nur die Regel „Tauschaufgaben zählen gleich“ |
| Zahlenrechnen | eigene Rechenwege beschreiben | Pinguinfelsen · `path_choice` (Rechenweg wählen oder ordnen) | teilweise: Beschreiben in Worten nicht prüfbar |
| Ziffernrechnen | keine Erwartung in Klasse 2 | entfällt | nicht nötig |
| Überschlagendes Rechnen | ungefähre Größenordnung bis 100 angeben, Ergebnis auf Plausibilität prüfen | Pinguinfelsen · `estimate_100` (Antwortbereich wählen) | Lücke |
| Flexibles Rechnen | Strategie wählen: stellenweise, schrittweise, Hilfsaufgabe, Kopfrechnen | Hinweise tragen `strategyId`; nach der Lösung Auswahl `strategy_pick` | teilweise |

### Raum und Form

| Schwerpunkt | Erwartung am Ende von Klasse 2 (sinngemäß) | Zahlen-Zoo: Bereich · Familie | Stand |
| --- | --- | --- | --- |
| Raumorientierung | nach mündlicher Anweisung im Raum orientieren; Lagebeziehungen beschreiben (rechts, links, über, unter, vor, hinter) | Weltkarte und Gehege · `route_instructions` (Weg auf dem Zoo-Raster), `position_words` | Lücke |
| Ebene Figuren | Rechteck, Quadrat, Dreieck und Kreis erkennen und mit Fachbegriffen beschreiben (Seite, Ecke) | Schmetterlingshaus · `shapes_basic` | abgedeckt |
| Ebene Figuren | Muster legen, fortsetzen und eigene erfinden | Schmetterlingshaus · `pattern_continue`; Erfinden als freier Modus | teilweise: Erfinden nicht automatisch prüfbar |
| Ebene Figuren | Figuren legen, auslegen, zerlegen, zusammensetzen und vervollständigen | Schmetterlingshaus · `shapes_compose` (Formen ziehen, einrasten) | teilweise: bisher nur Formen erkennen |
| Körper | Würfel, Quader und Kugel erkennen, herstellen, sortieren; einfache Würfelgebäude, auch nach Plan | kein Bereich in V1; Vorschlag `solids_basic`, `cube_buildings` | Lücke |
| Symmetrie | Achsensymmetrie bei einfachen Figuren erkennen (Klappen, Spiegeln) | Schmetterlingshaus · `symmetry_check` | teilweise: Spezifikation sieht „Muster spiegeln“ (zeichnen) vor, das gehört zu Klasse 4 |
| Zeichnen | Linien, Figuren und Muster frei Hand und mit Hilfsmitteln (Lineal, Schablone, Gitterpapier) zeichnen | Schmetterlingshaus · `grid_draw` (Felder im Gitter antippen) | teilweise: Hilfsmittel nicht abbildbar |

### Größen und Messen

| Schwerpunkt | Erwartung am Ende von Klasse 2 (sinngemäß) | Zahlen-Zoo: Bereich · Familie | Stand |
| --- | --- | --- | --- |
| Größen | Längen mit Lineal und Zollstock messen | Giraffenhof · `measure_length` (virtuelles Lineal anlegen) | teilweise: Giraffenhof ist bisher für Klasse 3 geplant |
| Größen | Längen, Zeitspannen und Geldbeträge vergleichen und ordnen | Giraffenhof · `compare_length`; Futteruhr · `compare_duration`; Zoo-Kasse · `compare_money` | teilweise: Giraffenhof fehlt in V1 |
| Größen | Stützpunktvorstellungen für 1 cm, 1 m und 1 € nutzen | Giraffenhof · `anchor_sizes` (Was ist etwa 1 m lang?) | Lücke |
| Größen | Uhrzeiten (volle, halbe, Viertel- und Dreiviertelstunde) auf analogen und digitalen Uhren benennen und einstellen | Futteruhr · `clock_full`, `clock_half`, `clock_quarter`, `clock_digital` | teilweise: Dreiviertelstunde und digitale Uhr fehlen |
| Größen | Einheiten ct und €, cm und m, Minute bis Jahr verwenden und umwandeln | Zoo-Kasse · `money_convert`; Giraffenhof · `length_convert`; Futteruhr · `time_units` | teilweise: Tag, Woche, Monat und Jahr fehlen |
| Größen | alltägliche Brüche ¼, ½, ¾ bei Größen nutzen (z. B. eine halbe Stunde, ein halber Meter) | Futteruhr und Giraffenhof · `fraction_units` | Lücke: Spezifikation führt Brüche erst in Klasse 3 ein |
| Größen | mit Größen rechnen (ganzzahlige Maßzahlen) | Zoo-Kasse · `money_calc` | abgedeckt |
| Sachsituationen | zu Spiel- und Sachsituationen, Rechengeschichten und Bildsachaufgaben Fragen stellen und lösen | alle Bereiche · Aufgabentyp `word`; Zoo-Kasse · `question_pick` (passende Frage wählen) | teilweise: Fragen selbst formulieren nicht prüfbar |
| Sachsituationen | Zeichnungen und Skizzen als Lösungshilfe nutzen | Hinweisstufe 2 mit Bildern | abgedeckt |
| Sachsituationen | begründen, ob ein Näherungswert genügt oder ein genaues Ergebnis nötig ist | Zoo-Kasse · `exact_or_estimate` | Lücke |

### Daten, Häufigkeiten, Wahrscheinlichkeiten

| Schwerpunkt | Erwartung am Ende von Klasse 2 (sinngemäß) | Zahlen-Zoo: Bereich · Familie | Stand |
| --- | --- | --- | --- |
| Daten und Häufigkeiten | Daten aus dem Alltag ermitteln | Zoo-Zählung (neuer Bereich, Vorschlag) · `tally_chart` (Strichliste) | Lücke |
| Daten und Häufigkeiten | Daten aus Kalendern, Diagrammen und Tabellen entnehmen und für Fragen nutzen | Zoo-Zählung · `read_table`, `read_chart`, `read_calendar` | Lücke |
| Wahrscheinlichkeiten | Anzahl von Möglichkeiten bei einfachen Kombinatorikaufgaben bestimmen, zunehmend systematisch | Zoo-Zählung · `combinatorics` (z. B. Futter-Kombinationen) | Lücke |

Aussagen zur Wahrscheinlichkeit von Ereignissen (sicher, möglich, unmöglich) gehören nach meiner Lesart des PDFs zu Klasse 4; das ist am Original zu prüfen.

## 3. Prozessbezogene Erwartungen

Der Lehrplan führt die fünf Prozesse mit Erwartungen am Ende von Klasse 4 auf und verlangt, sie von Klasse 1 an kontinuierlich zu fördern. Im Spiel wirken sie über Hinweise, Aufgabenformen und Rückmeldungen.

| Prozess | Was der Lehrplan betont (sinngemäß) | Umsetzung im Zahlen-Zoo |
| --- | --- | --- |
| Problemlösen | Informationen benennen, Vorgehen planen, Ergebnisse auf Plausibilität prüfen, Fehler finden | Hinweisstufe 1 stellt eine Forscherfrage („Was ist gegeben, was ist gesucht?“); Überschlag vor der Eingabe (`estimate_100`); bei Fehlern eine Aufgabe zur Fehlersuche |
| Modellieren | Sachsituation in ein mathematisches Modell übersetzen und die Lösung auf die Situation zurückbeziehen | Sachaufgaben beginnen mit Bild und Handlung (Tiere füttern) und enden mit der Wahl des passenden Antwortsatzes |
| Kommunizieren | Vorgehen erläutern, Rechenwege darstellen, Fachbegriffe nutzen | Fachbegriffe in allen Texten; Rechenweg wählen statt beschreiben; nach der Runde die Frage „Erkläre einer Person deinen Weg“ (nicht automatisch geprüft) |
| Argumentieren | Vermutungen zu Mustern anstellen, begründen und prüfen | Entdeckeraufgaben (Päckchen wie 3 + 4, 4 + 5, 5 + 6) mit der Frage „Was fällt dir auf?“ als Auswahl |
| Darstellen | Darstellungen verstehen, nutzen und wechseln; Strukturen wie Kraft der 5 und 10 und Kernaufgaben | gemeinsame Darstellungsbibliothek (Zehnerfeld, Hundertertafel, Rechenstrich, Zehnerstangen und Einerwürfel), Aufgabenform `match_repr`, Darstellungen in Hinweisstufe 2 |

**Leitlinien des Lehrplans, die die Spielgestaltung stützen**

- Fehler gelten als Konstruktionsversuche mit vernünftigem Kern: Die Rückmeldung fragt nach dem Denkweg (`errorTag` führt zu einem passenden Hinweis).
- Ziel sind nicht zählende Rechenstrategien und ein gesichertes Stellenwertverständnis: Hinweise zeigen Zerlegen und Bündeln, nie Weiterzählen in Einzelschritten.
- Üben baut auf Verständnis auf: erst Handeln mit Material, dann Vernetzen, dann Geläufigkeit. Tempo-Runden gibt es deshalb nur für bereits sicheres Können.
- In der Schuleingangsphase gibt es keine Noten: Sterne zeigen Lernfortschritt und keinen Vergleich zwischen Kindern.

## 4. Abweichungen und Entscheidungen

Fünf Stellen der Hauptspezifikation weichen vom Lehrplan ab, dazu kommen Lücken bei Bereichen. Die Abweichungen und die neuen Bereiche sind in die Hauptspezifikation übernommen; offene Zuordnungen stehen in Abschnitt 5.

**Abweichungen**

| Nr. | Stelle in der Spezifikation | Lehrplan für Klasse 2 | Vorschlag |
| --- | --- | --- | --- |
| 1 | Abschnitte 2 und 6: Einmaleins mit „allen Reihen“ in Klasse 2 (`mult_table`, Stufe 3) | Kernaufgaben automatisiert abrufen und weitere Aufgaben daraus ableiten; alle Reihen erst bis Ende Klasse 4 | Stufe 1: Kernaufgaben (üblicherweise Reihen 1, 2, 5 und 10; mit Lehrkraft bestätigen); Stufe 2: Ableiten (z. B. 3 × 4 aus 2 × 4 + 4); Stufe 3: Umkehren und Ergänzen |
| 2 | Abschnitte 2 und 6: Uhr bis Viertelstunde (`clock_half`) | auch Dreiviertelstunde; analoge und digitale Uhren | Stufe 3 um Dreiviertelstunde erweitern; Aufgabenform „analog zu digital“ ergänzen |
| 3 | Abschnitt 2: Brüche erst in Klasse 3 | ¼, ½, ¾ bei Größenangaben schon in Klasse 2 | in Futteruhr und Giraffenhof Stufe 2: ½ Stunde = 30 Minuten, ½ m = 50 cm |
| 4 | Abschnitt 2 nennt Längen in cm und m für Klasse 2, Abschnitt 5 plant den Giraffenhof erst für Klasse 3 | Längen messen, Stützpunkte für 1 cm und 1 m, Einheiten cm und m | Giraffenhof schon in V1 mit Längenaufgaben; Hunderterraum bis 1000 und Runden bleiben V2 |
| 5 | Abschnitt 6: Beispiel „Spiegle das Muster“ | Achsensymmetrie erkennen gehört zu Klasse 2, Spiegelbilder zeichnen zu Klasse 4 | Beispiel ändern in „Ist die Figur symmetrisch? Wo liegt die Spiegelachse?“; Zeichnen von Spiegelbildern später |

Die Annahmen zu Klasse 3 (Zahlenraum bis 1000, halbschriftliches Rechnen) sind Planungsannahmen: Der Lehrplan beschreibt nur das Ende von Klasse 4 (Zahlenraum bis 1 000 000, schriftliche Verfahren). Die Zwischenstufe für Klasse 3 sollte mit einer Lehrkraft festgelegt werden.

**Vorgeschlagene Änderungen an den Bereichen für V1**

- Giraffenhof in V1 aufnehmen (Längen, Stützpunkte, Brüche bei Größen).
- Neuer Bereich Zoo-Zählung: Strichlisten, Tabellen, Kalender, Kombinatorik. Mit Giraffenhof und Zoo-Zählung hat V1 acht Bereiche.
- Pinguinfelsen: Stufe 0 mit Einspluseins bis 20; Überschlag und Strategiewahl ergänzen.
- Elefantenwiese: Division als Verteilen und Aufteilen in kleinen Zahlen.
- Raumorientierung als Wegaufgaben auf der Weltkarte und im Gehege.
- Körper (Würfel, Quader, Kugel, einfache Würfelgebäude) in V2 oder als kleiner Baumodus.

Jeder zusätzliche Bereich braucht ein Tier, einen Hintergrund und mehrere Aufgabenfamilien; Phase 3 der Roadmap wird dadurch länger.

**Entscheidungen**

- **Ja:** Giraffenhof schon in V1 (Längen, Stützpunkte, Brüche bei Größen).
- **Ja:** Neuer Bereich „Zoo-Zählung“ in V1.
- **Ja:** Einspluseins bis 20 und Überschlag im Pinguinfelsen.
- **Ja:** Division als Verteilen und Aufteilen in der Elefantenwiese (Klasse 2).
- **Ja:** Raumorientierung als Wegaufgaben.
- **Ja:** Körper in V1 als kleiner Baumodus. Die Frage lautete „V1 oder V2“; ich habe das „Ja“ als V1 gedeutet.
- **Ja:** Die fünf Abweichungen sind in die Hauptspezifikation übernommen (Abschnitte 2, 5, 6, 11 und 13).
- **Ja:** Unsichere Zuordnungen werden mit einer Lehrkraft am Original geprüft (Abschnitt 5).

## 5. Offene Zuordnungen

Auch nach den Entscheidungen bleiben Erwartungen ohne vollständige Zuordnung im Spiel, und einige Lehrplanzuordnungen sind unsicher.

### Erwartungen ohne vollständige Zuordnung im Spiel

| Erwartung | Warum offen | Vorschlag |
| --- | --- | --- |
| Darstellungen mit Sprache wechseln | im Einzelspiel nur über Vorlesen und Auswahl | Aufgabenform `match_repr` mit Zahlwort-Karten |
| Vorteilhaft rechnen (`smart_calc`) | Familie und Stufen noch nicht ausgearbeitet | Tauschaufgaben, Nachbaraufgaben, Hilfsaufgaben als drei Stufen festlegen |
| Rechenwege beschreiben, Fragen selbst formulieren | nicht automatisch prüfbar | Auswahlformen (`path_choice`, `question_pick`) und eine Erklärfrage an eine erwachsene Person |
| Strategie wählen (`strategy_pick`) | Ablauf nach der Lösung noch nicht festgelegt | Auswahl aus stellenweise, schrittweise, Hilfsaufgabe, Kopfrechnen; keine Wertung |
| Muster erfinden | keine Prüfung möglich | freier Modus ohne Sterne, Ergebnis wird im Zoo ausgestellt |
| Figuren legen, zerlegen, vervollständigen (`shapes_compose`) | Familie noch nicht definiert | Formen ziehen und einrasten, Zielfigur als Umriss |
| Zeichnen mit Lineal, Schablone, Freihand | Hilfsmittel nicht abbildbar | Gitter antippen (`grid_draw`); Zeichnen bleibt Teil des Unterrichts |
| Messen mit Lineal | virtuelles Lineal ist nur eine Annäherung | Lineal anlegen und Wert ablesen (`measure_length`) |
| Zeiteinheiten Tag, Woche, Monat, Jahr | Familie `time_units` ohne Stufen | Kalender in der Zoo-Zählung (`read_calendar`) und Umwandeln in der Futteruhr |
| Näherungswert genügt (`exact_or_estimate`) | in keiner Entscheidung berücksichtigt | in der Zoo-Kasse Stufe 3 ergänzen |
| Körper und Würfelgebäude | Baumodus noch nicht spezifiziert | Familien `solids_basic` und `cube_buildings` ausarbeiten |
| Raumorientierung | Raster und Lagebegriffe noch nicht festgelegt | Begriffe rechts, links, über, unter, vor, hinter; Raster 5 × 5 als Startwert |

### Unsichere Zuordnung zu Klasse 2 (am Original klären)

| Nr. | Frage | Annahme im Dokument | Folge, wenn die Annahme nicht stimmt |
| --- | --- | --- | --- |
| 1 | Welche Inhalte der Schuleingangsphase liegen vor Klasse 2? Der Lehrplan nennt nur das Ende der Klasse 2; die Verteilung auf Klasse 1 und 2 legt die Schule fest | Das Spiel setzt bei Klasse 2 mit Einspluseins als Stufe 0 an | Startstufen je Familie ändern |
| 2 | Flächeninhalt und Umfang | gehört zu Klasse 4 | bei Klasse 2: Familie `area_count` im Schmetterlingshaus |
| 3 | Brüche ¼, ½, ¾ bei Größen | gehört zu Klasse 2 | bei Klasse 4: Aufgaben der Stufe 2 in Futteruhr und Giraffenhof streichen |
| 4 | Kombinatorik und Wahrscheinlichkeit | Kombinatorik in Klasse 2, „sicher, möglich, unmöglich“ in Klasse 4 | bei Klasse 2: Familie `chance_words` in der Zoo-Zählung |
| 5 | Division | Verteilen und Aufteilen als Operationsverständnis in Klasse 2, ohne Automatisierung | bei Klasse 3: Division aus der Elefantenwiese streichen |
| 6 | Kernaufgaben des Einmaleins | Reihen 1, 2, 5 und 10; der Lehrplan nennt die Reihen nicht | Reihen in `mult_core` anpassen |
| 7 | Rechengesetze | in Klasse 2 nur Tauschaufgaben und Nachbaraufgaben; Assoziativ-, Distributiv- und Konstanzgesetz in Klasse 4 | weitere Stufen in `smart_calc` |
| 8 | Kraft der 5 und Kraft der 10 | als Darstellung schon in Klasse 2; der Lehrplan nennt sie bei den prozessbezogenen Erwartungen für Klasse 4 | keine Folge für Aufgaben |
| 9 | Obergrenzen bei Geld und Größen | Geld bis 100 € als Annahme; der Lehrplan nennt keine Grenze | Stufen der Zoo-Kasse ändern |
| 10 | Familiennamen, Stufenzuschnitt und Zuordnung zu Bereichen | eigene Vorschläge, keine Lehrplanvorgaben | Abgleich beim Anlegen von `families.json` |

- [x] Die zehn Fragen mit einer Lehrkraft am Original klären (11.11.2026)
- [ ] Ergebnis in `families.json` und in den Abschnitten 2 und 6 der Hauptspezifikation nachtragen; nachgetragen in `families.json` und in [`ausarbeitung-offene-familien.md`](ausarbeitung-offene-familien.md), Spezifikation offen

**Ergebnis der Klärung (11.11.2026):** Die Annahmen 1, 6, 7, 8, 9 und 10 stimmen. Abweichend gilt:

- **2:** Flächeninhalt und Umfang gehören zu Klasse 2: Thema `area_count` im Schmetterlingshaus.
- **3:** Brüche ¼, ½, ¾ bei Größen gehören nicht zu Klasse 2: In der Futteruhr fragt Stufe 2 der Zeiteinheiten jetzt Zeitspannen zwischen zwei Uhrzeiten; im Giraffenhof entfällt ½ m = 50 cm.
- **4:** Kombinatorik gehört zu Klasse 2, etwa „Wie viele Möglichkeiten gibt es, Erdbeere, Schoko und Vanille als 3 Kugeln auf einem Eis anzuordnen?“; zur Wahrscheinlichkeit gab es keine Antwort, sie bleibt bei Klasse 4.
- **5:** Division gehört zu Klasse 2, im kleinen Einmaleins auch mit Rest.

## 6. Weitere Aufgabentypen mit geringem Aufwand

Ja, weitere Typen lassen sich leicht ergänzen. Ein Typ aus vorhandenen Eingabeformen (Ziffernblock, Antwortkarten, Lücke, Ziehen und Ordnen, Zahlenstrahl, Uhr, Geld, Raster) braucht drei Dinge: einen Eintrag in `TaskKind`, einen Generator in `src/logic/generators/` und einen Eintrag in `families.json`, dazu Hinweis- und Lobtexte in JSON. Szenen und Prüfer ändern sich in der Regel nicht. Nur eine neue Eingabeform braucht zusätzlich eine UI-Komponente in `src/ui/`.

| Typ | Eingabeform | Aufwand | Passt zu |
| --- | --- | --- | --- |
| `true_false`: Stimmt die Rechnung? | zwei Antwortkarten | gering | Plausibilität, Operationsverständnis |
| `compare_symbol`: <, > oder = einsetzen | Antwortkarten | gering | Zahlen ordnen und vergleichen |
| `sequence`: Zahlenfolge fortsetzen | Ziffernblock | gering | Beziehungen in Zahlenfolgen |
| `inverse`: Umkehraufgabe zu 7 + 5 = 12 | Ziffernblock | gering | Einspluseins, Umkehrungen |
| `number_house`: Zahl zerlegen | Lücke | gering | Zerlegen bis 10 und 20 |
| `odd_one_out`: Was passt nicht? | Antwortkarten | gering | Muster, Argumentieren |
| `time_order`: Zeitspannen oder Längen ordnen | Ziehen und Ordnen | gering | Größen vergleichen |
| `match_pairs`: Darstellung zu Zahl zuordnen | Paare verbinden (neue Eingabeform) | mittel | Darstellungswechsel |
| `table_read`: Strichliste oder Tabelle lesen | Antwortkarten oder Ziffernblock plus Tabellenansicht | mittel | Daten und Häufigkeiten |
| `route`: Weg auf dem Raster beschreiben | Raster mit Figur (neue Ansicht) | mittel | Raumorientierung |
| `combinatorics`: Möglichkeiten legen und zählen | Ziehen plus Baumdiagramm | mittel | Kombinatorik |
| `cube_build`: Würfelgebäude nach Plan | neue Bauansicht | hoch | Körper |
| Freies Zeichnen | Zeichenfläche | hoch, kaum prüfbar | nicht empfohlen |

Die sieben Typen mit geringem Aufwand liefern zusätzliche Abwechslung ohne neue Oberfläche und sind für V1 gut geeignet.
