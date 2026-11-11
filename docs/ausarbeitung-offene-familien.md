# Ausarbeitung der offenen Aufgabenfamilien (Issue #7)

Vorschlag zur fachlichen Prüfung, Stand 11.11.2026. Die Lehrkraft hat am 11.11.2026 alle Fragen beantwortet (über die Seite https://claude.ai/artifact/9tjWZzEEzEgpRJ3fp7FtBU); die Entscheidungen stehen im nächsten Abschnitt und gelten vor den Vorschlägen weiter unten. Für jede Familie aus Issue #7 stehen hier Ziel, Ort im Spiel, Eingabeform, drei Stufen mit Beispielen, typische Fehler und Hinweise.

Grundsätze wie im übrigen Spiel (Spezifikation, Abschnitt 6 und 8):

- Jede Familie hat drei Stufen. Die Stufe öffnet nach einer Runde mit mindestens 2 Sternen.
- Jede falsche Antwort führt zu einer Hilfe; nach drei Versuchen erscheint der Lösungsweg.
- Die drei Hinweisstufen sind: ein lenkender Satz, ein Bild der Strategie, die Lösung mit Weg.
- Fehlerarten mit eigener Rückmeldung werden nur dort angelegt, wo ein typischer Denkfehler erkennbar ist.

## Entscheidungen der Lehrkraft (11.11.2026)

Einige Antworten waren kurz („Ja“ auf eine Frage mit zwei Möglichkeiten). Sie sind hier so gedeutet, wie es in der Spalte „Gilt jetzt“ steht. Wo die Deutung unsicher ist, ist sie markiert.

**Zu den Familien**

| Familie | Frage | Antwort | Gilt jetzt |
| --- | --- | --- | --- |
| `smart_calc` | Tausch- und Nachbaraufgaben, Hilfsaufgaben in Klasse 2? | Ja | Alle drei Stufen wie vorgeschlagen, Hilfsaufgaben mit Ausgleich gehören dazu |
| `smart_calc` | Verdopplungen als Startaufgaben? | Ja | Verdopplungen (25 + 25) dienen als Startaufgaben der Nachbaraufgaben (Deutung) |
| `strategy_pick` | Bezeichnungen der Rechenwege passend? | Ja | stellenweise, schrittweise, Hilfsaufgabe, anders |
| `strategy_pick` | Häufigkeit angemessen? | soll einstellbar sein | Häufigkeit als Startwert in `rules.json` und als Einstellung im Erwachsenenbereich (#30) |
| `shapes_compose` | Dreieck und Halbkreis passend? | Ja | Quadrat, Rechteck, rechtwinkliges Dreieck und Halbkreis (Deutung) |
| `shapes_compose` | Flächen auslegen und vergleichen in Stufe 3? | Ja | Stufe 3 enthält auch Flächen auslegen und vergleichen (siehe Lehrplanfrage 2) |
| `space_orientation` | „neben“ und „zwischen“? | Ja | gehören dazu |
| `space_orientation` | nur „von dir aus gesehen“? | reicht | kein Perspektivwechsel |
| `space_orientation` | Pfeile oder Wörter? | beides | Wege mit Pfeilen und als Text („2 nach rechts“) |
| `solids_basic` | welche Körper? | alles | Würfel, Quader, Kugel, Zylinder, Kegel und Pyramide |
| `cube_buildings` | Bauplan als Draufsicht oder Ansichten? | auch Draufsicht | Ansichten von vorn und von der Seite und Draufsicht mit Zahlen |
| `cube_buildings` | Grundfläche 3 × 3, höchstens 3 hoch? | Ja | wie vorgeschlagen |
| `time_units` | Tage, Wochen, Monate umrechnen? | Ja | Stufe 3 bleibt |
| `exact_or_estimate` | eigenes Thema mit drei Stufen? | Ja | bleibt |

**Zum Lehrplan**

| Nr. | Frage | Antwort | Folge |
| --- | --- | --- | --- |
| 1 | Schuleingangsphase, Stufe 0 | stimmt | keine Änderung |
| 2 | Flächeninhalt und Umfang erst in Klasse 4 | stimmt nicht | gehört zu Klasse 2: neues Thema `area_count` im Schmetterlingshaus (Flächen auslegen und vergleichen, Umfang durch Kästchen zählen) |
| 3 | Brüche ¼, ½, ¾ bei Größen in Klasse 2 | stimmt nicht | **umgesetzt:** Stufe 2 der Zeiteinheiten fragt jetzt Zeitspannen zwischen zwei Uhrzeiten („Von 7:30 bis 8:15 sind es ? Minuten“) statt ½ h = 30 min; im Giraffenhof kein ½ m. Die Uhrzeitwörter „halb“, „Viertel nach“, „Viertelstunde“ bleiben, sie gehören zur Uhrzeit |
| 4 | Kombinatorik in Klasse 2, Wahrscheinlichkeit in Klasse 4 | Kombinatorik ja, mit Beispiel „Wie viele Möglichkeiten gibt es, Erdbeere, Schoko und Vanille als 3 Kugeln auf einem Eis anzuordnen?“ | Kombinatorik in der Zoo-Zählung mit Anordnungen (3 Kugeln: 6 Möglichkeiten); Wahrscheinlichkeit blieb unbeantwortet und bleibt Klasse 4 |
| 5 | Division als Verteilen und Aufteilen | stimmt, „Divisionsaufgaben des kleinen Einmaleins auch mit Rest“ | **umgesetzt:** Thema „Teilen mit Rest“ (`divide_rest`) in der Elefantenwiese: Stufe 1 Antwortkarten (17 : 5 = 3 Rest 2), Stufe 2 Quotient oder Rest eintippen, Stufe 3 Sachaufgaben, die den Rest deuten (voll, übrig, aufrunden) |
| 6 | Kernaufgaben des Einmaleins | 1er-, 2er-, 5er- und 10er-Reihe | bestätigt, keine Änderung |
| 7 | Rechengesetze: Tausch- und Nachbaraufgaben | stimmt | keine Änderung |
| 8 | Kraft der 5 und der 10 als Darstellung | stimmt | keine Änderung |
| 9 | Geld bis 100 €, Längen in cm und m | stimmt | keine Änderung |
| 10 | Namen und Stufenzuschnitt der Themen | stimmt | keine Änderung |

## Übersicht

| Familie | Thema im Spiel | Ort | Neue Eingabeform | Aufwand |
| --- | --- | --- | --- | --- |
| `smart_calc` | Geschickt rechnen | Pinguinfelsen | keine | gering |
| `strategy_pick` | Wie hast du gerechnet? | nach Aufgaben in Pinguinfelsen | keine (Karten mit Bild) | gering |
| `shapes_compose` | Formen legen | Schmetterlingshaus | Teile ziehen, einrasten, drehen | hoch |
| `space_orientation` (Raumorientierung) | Lage und Wege | Schmetterlingshaus | Raster antippen, Pfeile legen | mittel |
| `solids_basic` | Körper | Baustelle (Baumodus) | Mehrfachauswahl | mittel |
| `cube_buildings` | Würfelbauten | Baustelle (Baumodus) | Würfel auf Raster stapeln | hoch |
| `time_units` | Zeiteinheiten | Futteruhr | umgesetzt | – |
| `exact_or_estimate` | Genau oder ungefähr | Zoo-Kasse | umgesetzt | – |

Empfohlene Reihenfolge: `smart_calc` und `strategy_pick` zuerst, weil sie keine neue Eingabeform brauchen und den Pinguinfelsen abschließen. Danach `space_orientation` und `shapes_compose` mit dem Schmetterlingshaus (#17). Den Baumodus zuletzt.

## `smart_calc`: Geschickt rechnen

**Ziel (KE, Zahlenrechnen):** vorteilhaft rechnen mit Tauschaufgaben und Nachbaraufgaben; Hilfsaufgaben nutzen. In Klasse 2 nur Tausch- und Nachbaraufgaben als Rechengesetz-Vorstufe (KE Abschnitt 5, Frage 7). Assoziativ-, Distributiv- und Konstanzgesetz bleiben für Klasse 4.

**Ort und Eingabe:** neues Thema im Pinguinfelsen. Ziffernblock oder Antwortkarten wie bei `add_100`.

| Stufe | Inhalt | Beispiele | Typische Fehler (Rückmeldung) |
| --- | --- | --- | --- |
| 1 | Tauschaufgaben: Bei Plus darf man tauschen; mit der größeren Zahl anfangen | `4 + 57 = ?` (Hinweis: „Tausche: 57 + 4“); „Welche Aufgabe hat dasselbe Ergebnis wie 4 + 57?“ mit den Karten 57 + 4 · 57 − 4 · 54 + 7 | Tauschen bei Minus: „8 − 25 geht nicht wie 25 − 8. Tauschen darfst du nur bei Plus.“ |
| 2 | Nachbaraufgaben: eine bekannte Aufgabe gegeben, die Nachbaraufgabe ableiten | „25 + 25 = 50. Dann ist 25 + 26 = ?“; „50 − 20 = 30. Dann ist 50 − 21 = ?“; Verdopplungen als Startaufgabe | Richtung vertauscht (51 statt 49 bei 50 − 21): „Du ziehst einen mehr ab, also wird es einer weniger.“ |
| 3 | Hilfsaufgaben mit glatten Zehnern: + 9, + 19, − 9, − 19 über + 10 und Ausgleich | `47 + 9 = ?` mit dem Weg 47 + 10 − 1; Lücke `63 − 19 = 63 − 20 + ?`; Karte „Welche Hilfsaufgabe passt?“ | Ausgleich in die falsche Richtung (47 + 10 + 1): „Du hast 1 zu viel dazugetan. Nimm ihn wieder weg.“ |

**Hinweise:**

1. Ein lenkender Satz, z. B. „Gibt es eine leichtere Aufgabe, die du schon kennst?“
2. Bild: Rechenstrich mit dem Sprung der Hilfsaufgabe (+ 10, dann − 1) oder die Tauschaufgabe nebeneinander.
3. Weg und Lösung, z. B. „47 + 10 = 57, 57 − 1 = 56“.

**Für die Lehrkraft:**

- Reichen Tausch- und Nachbaraufgaben als Klasse-2-Inhalt? Gehören Hilfsaufgaben mit Ausgleich (Stufe 3) schon in Klasse 2?
- Sollen Verdopplungen (25 + 25) als Startaufgaben der Nachbaraufgaben dienen, oder zählen sie zur Elefantenwiese (`double_half`)?

## `strategy_pick`: Wie hast du gerechnet?

**Ziel (KE, prozessbezogen):** Rechenwege beschreiben und vergleichen. Beschreiben in Worten ist nicht automatisch prüfbar; das Spiel fragt deshalb nach dem gewählten Weg, ohne ihn zu bewerten.

**Ablauf:**

- Nach einer richtig gelösten Plus- oder Minusaufgabe bis 100 (`add_100`, `sub_100`) erscheint gelegentlich die Frage „Wie hast du gerechnet?“. Das passiert höchstens zweimal je Runde und nur bei Aufgaben mit Zehnerübergang.
- Vier Bildkarten:
  - **Stellenweise:** Zehner und Einer getrennt, z. B. 40 + 20, 7 + 6, 60 + 13.
  - **Schrittweise:** erst die Zehner, dann die Einer am Rechenstrich.
  - **Hilfsaufgabe:** mit glattem Zehner und Ausgleich.
  - **Anders oder im Kopf.**
- Jede Wahl ist richtig. Das Tier lobt den Weg („So kann man es machen!“); Sterne ändern sich nicht.
- Ein Knopf „Zeig mir einen anderen Weg“ zeigt die Aufgabe auf einem der anderen Wege, Schritt für Schritt im Hinweisbereich.
- Die Wahl wird je Familie gezählt. Der Erwachsenenbereich (#30) zeigt, welche Wege das Kind nutzt, ohne Rangfolge.

**Stufen:** keine. Die Frage ist eine Zusatzform, die im Erwachsenenbereich abgeschaltet werden kann.

**Für die Lehrkraft:**

- Passen die vier Wege zu den im Unterricht verwendeten Bezeichnungen (z. B. „Zehner extra, Einer extra“, „Schrittweise“, „Hilfsaufgabe“)?
- Ist die Häufigkeit angemessen, oder stört die Frage den Spielfluss?

## `shapes_compose`: Formen legen

**Ziel (KE, Raum und Form):** Figuren legen, auslegen, zerlegen, zusammensetzen und vervollständigen.

**Ort und Eingabe:** neues Thema im Schmetterlingshaus.

- Neue Eingabeform „Teile legen“: Formteile (Quadrat, Rechteck, rechtwinkliges Dreieck, Halbkreis) liegen unten und werden auf einen Umriss gezogen.
- Nahe am richtigen Platz rastet ein Teil ein. Ein Teil, das nicht passt, gleitet sanft zurück (Spezifikation, Abschnitt 6).
- Antippen dreht ein Teil um 90°.
- Ohne Ziehen geht es mit Antippen von Teil und Zielfeld; das hilft bei Tablets und Barrierefreiheit.

| Stufe | Inhalt | Beispiele | Typische Fehler (Rückmeldung) |
| --- | --- | --- | --- |
| 1 | Auslegen: Teile in richtiger Lage auf einen Umriss legen | Rechteck aus 2 Quadraten und 2 Dreiecken; Haus aus Quadrat und Dreieck | Teil passt nicht: gleitet zurück, Hinweis „Schau auf die Ecken des Umrisses.“ |
| 2 | Zusammensetzen mit Drehen: Teile müssen gedreht werden | Fisch, Schmetterling (Bezug zur Symmetrie), Pfeil | Teil liegt richtig, aber falsch gedreht: „Drehe das Teil, bis es passt.“ |
| 3 | Zerlegen und vervollständigen: Welches Teil fehlt? Aus wie vielen Teilen besteht die Figur? | „Welches Teil fehlt?“ mit 3 Karten; „Aus wie vielen Dreiecken besteht das Quadrat?“ mit dem Ziffernblock | Fehlteil mit falscher Form gewählt: „Vergleiche die Ecken: Das fehlende Teil hat 3 Ecken.“ |

**Hinweise:**

1. Ein Platz leuchtet auf: „Hier passt ein Teil.“
2. Der Umriss des passenden Teils erscheint im Ziel.
3. Ein Teil legt sich selbst; das Kind legt den Rest.

**Grafiken:** Formteile in Token-Farben mit 4-px-Kontur; Umrisse gestrichelt; 8 bis 10 Zielfiguren.

**Für die Lehrkraft:**

- Sind Dreieck und Halbkreis neben Quadrat und Rechteck passend, oder lieber nur Quadrat, Rechteck und Dreieck wie bei Legeplättchen im Unterricht?
- Soll Stufe 3 auch Flächen auslegen und vergleichen („Welche Figur ist größer?“)? Das berührt Flächeninhalt, KE Abschnitt 5, Frage 2.

## `space_orientation`: Lage und Wege (Raumorientierung)

**Ziel (KE, Raumorientierung):** nach Anweisung orientieren; Lagebeziehungen rechts, links, über, unter, vor, hinter (und neben, zwischen) beschreiben. In der KE-Tabelle stehen dafür zwei Familien (`position_words`, `route_instructions`); ich schlage eine Familie mit drei Stufen vor, damit die Themenwahl im Schmetterlingshaus übersichtlich bleibt.

**Ort und Eingabe:**

- Thema im Schmetterlingshaus.
- Stufe 1 und 2: Antwortkarten mit Lagewörtern, oder Antippen eines Feldes auf einem Raster.
- Stufe 3: Pfeilkarten legen (→ ↑ ← ↓), neue einfache Eingabe.
- Raster 5 × 5 als Startwert (KE Abschnitt 5).
- Rechts und links gelten immer „von dir aus gesehen“. Ein kleines Handsymbol am Rand markiert „rechts“ als Hilfe in Hinweis 1.

| Stufe | Inhalt | Beispiele | Typische Fehler (Rückmeldung) |
| --- | --- | --- | --- |
| 1 | Lagewörter: über, unter, vor, hinter, neben, zwischen | Bild im Gehege: „Wo liegt der Ball? Der Ball liegt ___ dem Baum.“ mit 3 Karten; „Tippe auf das Tier zwischen Affe und Pinguin.“ | über und unter oder vor und hinter vertauscht: „Schau noch einmal: Ist der Ball oben oder unten?“ |
| 2 | rechts und links; einem Weg folgen | „Tippe auf das Tier links neben dem Elefanten.“; „Der Pinguin geht 2 nach rechts und 1 nach oben. Wo kommt er an?“ (Feld antippen) | rechts und links vertauscht: „Rechts ist auf der Seite mit der Hand.“ |
| 3 | Wege beschreiben und legen, mit Hindernissen | „Welcher Weg führt zum Futter?“ mit 3 Pfeilfolgen; Weg mit Pfeilkarten selbst legen, Steine versperren Felder | Weg endet falsch: Figur läuft den gelegten Weg ab und bleibt stehen, Hinweis „Zähle die Felder bis zum Futter.“ |

**Hinweise:**

1. Merkhilfe (rechts mit Handsymbol, oben und unten am Bild).
2. Der Weg der Figur wird Schritt für Schritt gezeigt.
3. Der richtige Weg mit Pfeilen und Vorlesen („2 nach rechts, 1 nach oben“).

**Für die Lehrkraft:**

- Gehören „neben“ und „zwischen“ dazu?
- Reicht „von dir aus gesehen“, oder sollen Kinder auch die Sicht eines Tieres einnehmen (Perspektivwechsel)? Das wäre deutlich schwerer.
- Pfeile oder Wörter („2 nach rechts“) als Wegbeschreibung, oder beides?

## Baumodus: `solids_basic` und `cube_buildings`

**Ort:** Die Spezifikation sieht einen kleinen Baumodus vor, ohne eigenen Bereich und erreichbar aus dem Gehege. Vorschlag:

- eine „Baustelle“ mit eigener Szene, erreichbar über einen Knopf im Gehege des Schmetterlingshauses (Raum und Form);
- dort zwei Themen mit je drei Stufen;
- Sterne zählen für das Schmetterlingshaus.

Die Themenwahl dort hat damit keine weiteren Reiter.

### `solids_basic`: Körper

**Ziel (KE, Körper):** Würfel, Quader und Kugel erkennen und sortieren.

**Eingabe:** Antwortkarten; Mehrfachauswahl (Dinge antippen, dann OK) als kleine neue Eingabeform.

| Stufe | Inhalt | Beispiele | Typische Fehler (Rückmeldung) |
| --- | --- | --- | --- |
| 1 | Körper benennen | Bild eines Körpers oder eines Alltagsgegenstands (Spielwürfel, Geschenkbox, Ball, Futterkiste) → Karten Würfel · Quader · Kugel | Würfel und Quader verwechselt: „Beim Würfel sind alle Flächen gleich große Quadrate.“ |
| 2 | Sortieren | „Tippe alle Kugeln an.“ aus 6 Dingen | Ding vergessen oder zu viel: die falsch gewählten Dinge wackeln, Hinweis zur Form |
| 3 | Eigenschaften | „Welcher Körper kann rollen?“, „Welcher Körper hat nur Quadrate als Flächen?“, „Welche Körper kann man gut stapeln?“ | Antwort passt zu einem anderen Körper: Hinweis mit dem Bild des Körpers von mehreren Seiten |

### `cube_buildings`: Würfelbauten

**Ziel (KE, Körper):** einfache Würfelgebäude bauen, auch nach Plan.

**Darstellung und Eingabe:**

- Gebäude auf einer Grundfläche von 3 × 3 Feldern, höchstens 3 Würfel hoch, in isometrischer Ansicht.
- Der Bauplan ist eine Draufsicht mit der Anzahl der Würfel je Feld.
- Neue Eingabe: Antippen eines Feldes legt einen Würfel darauf (bis 3, dann wieder 0); die Ansicht baut mit.

| Stufe | Inhalt | Beispiele | Typische Fehler (Rückmeldung) |
| --- | --- | --- | --- |
| 1 | Würfel zählen, alle Würfel sichtbar | Gebäude aus 4 bis 8 Würfeln, höchstens 2 hoch | ein Würfel doppelt oder gar nicht gezählt: „Zähle Reihe für Reihe.“ |
| 2 | Gebäude und Bauplan zuordnen; Würfel zählen mit verdeckten Würfeln | „Welcher Bauplan passt?“ mit 3 Karten; Turm, unter dem Würfel verdeckt sind | verdeckte Würfel vergessen: „Unter jedem Würfel oben steht noch einer.“ |
| 3 | Nach Plan bauen | Bauplan gegeben, Kind baut auf dem Raster, OK prüft | ein Feld falsch: das Feld blinkt, Hinweis „Vergleiche die Zahl im Plan mit deinem Turm.“ |

**Grafiken:** isometrischer Würfel in Token-Farben, Körper und 8 bis 10 Alltagsgegenstände, Bauplan als Raster.

**Für die Lehrkraft:**

- Gehören Zylinder, Kegel oder Pyramide in Klasse 2 dazu, oder nur Würfel, Quader und Kugel?
- Sind Baupläne mit Zahlen (Draufsicht) in Klasse 2 üblich, oder eher Ansichten von vorn und von der Seite?
- Ist die Grundfläche 3 × 3 mit höchstens 3 Würfeln Höhe passend?

## Bereits umgesetzt (zum Abgleich)

### `time_units`: Zeiteinheiten (Futteruhr)

| Stufe | Inhalt |
| --- | --- |
| 1 | Stunden und Minuten: 2 h = 120 min, 1 h 15 min = 75 min, 180 min = 3 h |
| 2 | Bruchteile der Stunde (KE `fraction_units`): ½ h = 30 min, 1 ½ h = 90 min, 45 min = ¾ h |
| 3 | Tag, Woche, Monat, Jahr: „Wie viele Tage haben 3 Wochen?“, „48 Stunden sind wie viele Tage?“ |

Typische Fehler mit Rückmeldung: 100 statt 60 Minuten je Stunde, 12 statt 24 Stunden am Tag, 5 statt 7 Tage je Woche.

**Für die Lehrkraft:** Ist das Umrechnen von Tagen in Wochen und Monaten in Jahre (Stufe 3) in Klasse 2 angemessen, oder sollte es beim Kennen der Beziehungen bleiben (1 Woche = 7 Tage)?

### `exact_or_estimate`: Genau oder ungefähr (Zoo-Kasse)

| Stufe | Inhalt |
| --- | --- |
| 1 | eindeutige Situationen: Wechselgeld, Preisschild (genau) gegen „Reicht mein Geld für ein Eis?“ (ungefähr) |
| 2 | feinere Situationen: abgezählt bezahlen, gerecht teilen (genau) gegen Einkaufsliste mit viel Spielraum (ungefähr) |
| 3 | Überschlag: „Du hast 50 €. Reicht das Geld für 19 €, 21 € und 8 €?“, Preise nahe an vollen Zehnern |

**Für die Lehrkraft:** Die KE ordnet „Näherungswert genügt“ der Stufe 3 zu. Im Spiel ist es ein eigenes Thema mit drei Stufen. Passt das, oder soll nur Stufe 3 bleiben?

## Offene Fragen zum Lehrplan

Unabhängig von den Familien oben sind zehn Zuordnungen zum Lehrplan unsicher (KE Abschnitt 5, Issue #6). Sie wurden beim Entwurf angenommen und sollten am Original des Lehrplans geprüft werden. Die Tabelle zeigt, wie die Annahme heute im Spiel umgesetzt ist, und was sich ändern müsste, wenn sie nicht stimmt.

| Nr. | Frage | Annahme und Stand im Spiel | Folge, wenn die Annahme nicht stimmt |
| --- | --- | --- | --- |
| 1 | Welche Inhalte der Schuleingangsphase liegen vor Klasse 2? Der Lehrplan nennt nur das Ende von Klasse 2. | Das Spiel beginnt bei Klasse 2; das Einspluseins bis 20 ist als Stufe 0 im Pinguinfelsen eingebaut (`plus_facts_20`). | Startstufen verschieben, Stufe 0 erweitern oder weglassen |
| 2 | Gehören Flächeninhalt und Umfang zu Klasse 2? | Nein, zu Klasse 4; im Spiel gibt es dazu keine Aufgaben. | Thema `area_count` im Schmetterlingshaus ergänzen |
| 3 | Gehören die Brüche ¼, ½, ¾ bei Größen zu Klasse 2? | Ja; eingebaut in der Futteruhr (`time_units` Stufe 2), im Giraffenhof geplant. | Bei Klasse 4: Stufe 2 von `time_units` umbauen, im Giraffenhof weglassen |
| 4 | Kombinatorik und Wahrscheinlichkeit: was gehört zu Klasse 2? | Kombinatorik in Klasse 2 (geplant in der Zoo-Zählung); „sicher, möglich, unmöglich“ in Klasse 4. | Bei Klasse 2: Thema `chance_words` in der Zoo-Zählung |
| 5 | Wie weit geht die Division in Klasse 2? | Verteilen und Aufteilen als Verständnis, ohne Automatisieren; eingebaut in der Elefantenwiese (`mult_table` Stufe 3, `story_multdiv`). | Bei Klasse 3: Division aus der Elefantenwiese streichen |
| 6 | Welche Reihen sind die Kernaufgaben des Einmaleins? | Die Reihen 1, 2, 5 und 10 mit Verdoppeln und Halbieren (`mult_table` Stufe 1). | Reihen anpassen |
| 7 | Welche Rechengesetze gehören zu Klasse 2? | Nur Tausch- und Nachbaraufgaben (siehe `smart_calc`). | Weitere Stufen in `smart_calc` |
| 8 | Kraft der 5 und der 10 schon in Klasse 2? | Als Darstellung ja: Zehnerfeld in Hinweisen und beim Blitzblick (`quick_count`). | Keine Folge für die Aufgaben |
| 9 | Welche Obergrenzen gelten bei Geld und Größen? | Geld bis 100 € (Zoo-Kasse), Längen in cm und m (Giraffenhof, geplant). | Stufen anpassen |
| 10 | Passen Namen, Stufenzuschnitt und Zuordnung der Themen zu den Bereichen? | Eigene Vorschläge; inzwischen 27 Themen in fünf spielbaren Bereichen mit je drei Stufen. | Abgleich in `families.json`; Stufen lassen sich dort ohne Programmänderung anpassen |

**Für die Lehrkraft:**

- Bitte die zehn Annahmen am Original prüfen und je Zeile vermerken: stimmt, stimmt nicht, oder Schule entscheidet.
- Zu Frage 10: Gibt es Themen, deren Stufen zu leicht oder zu schwer zugeschnitten sind?

## Nächste Schritte

1. Umsetzung in der empfohlenen Reihenfolge: `smart_calc` und `strategy_pick` (Pinguinfelsen, #13), dann `space_orientation`, `shapes_compose` und `area_count` mit dem Schmetterlingshaus (#17), Kombinatorik mit der Zoo-Zählung (#19), zuletzt der Baumodus.
2. Die Häufigkeit von `strategy_pick` im Erwachsenenbereich einstellbar machen (#30).
