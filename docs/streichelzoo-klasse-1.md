# Streichelzoo: Entwurf für Klasse 1

Entwurf, Stand 26.11.2026. Umsetzung begonnen: erster Schnitt mit Klasse im Profil, Bereich und drei Themen (Stand in `umsetzung-checkliste.md`, Phase 4b). Ergänzend: `zahlen-zoo-spezifikation.md`, `kompetenzerwartungen-klasse-2.md`, `ausarbeitung-offene-familien.md`. Alle Entscheidungen (Abschnitt 9) und Fragen an die Lehrkraft (Abschnitt 10) wurden am 26.11.2026 mit „Ja“ beantwortet; dazu kam die Vorgabe, so wenig Text wie möglich zu zeigen. Die Abschnitte unten berücksichtigen das bereits.

## Ergebnis der Klärung (26.11.2026)

Wo eine Frage zwei Möglichkeiten nannte, ist das „Ja“ so gedeutet, wie es in der Spalte „Gilt jetzt“ steht.

| Frage | Gilt jetzt |
| --- | --- |
| Klasse im Profil oder nur ein zusätzlicher Bereich? | Klasse im Profil (Deutung: Vorschlag angenommen) |
| Leittier Ziege, eigene Familien-IDs, Ort am Eingang, 24 Sterne, eigene Phase | wie vorgeschlagen |
| Zahlenraum bis 20, Ordnungszahlen bis 5, Zeichen <, >, = in Klasse 1 | wie vorgeschlagen |
| Zehnerübergang am Ende von Klasse 1 | ja: `addsub_20` Stufe 3 bleibt |
| Formen und Muster in Klasse 1 | ja: Themen in der Scheune des Streichelzoos (Abschnitt 6) |
| Geld und Uhr in Klasse 1 | ja: Geld bis 20 € (Stufe 1 bis 10 €; Deutung, die Frage nannte 10 € oder 20 €) und volle Stunden, beides in der Scheune |
| Fingerbilder als Hilfe | erwünscht: in Hinweisstufe 2 neben Fünfer- und Zehnerstruktur (Abschnitt 5) |
| Menge Text | minimieren: Kinder der Klasse 1 sehen keinen Aufgabentext, nur Bildsymbole, Ziffern und Rechnungen; alles Sprachliche kommt als Ton (Abschnitt 5) |

## 1. Ziel und Rahmen

Der Streichelzoo ist ein neuer Bereich am Eingang der Zoo-Karte, in dem Kinder der 1. Klasse mit Ziegen, Kaninchen, Meerschweinchen und Hühnern Zahlen bis 20 entdecken. Er macht den Zahlen-Zoo für Klasse 1 spielbar und dient Kindern der 2. Klasse als Wiederholung.

| Punkt | Festlegung im Entwurf |
| --- | --- |
| Zielgruppe | 6 bis 7 Jahre, Klasse 1; Klasse 2 freiwillig zur Wiederholung |
| Leittier | Ziege (Baby: Zicklein); weitere Tiere des Streichelzoos erscheinen als Aufgabenbilder |
| Zahlenraum | bis 10 in den Stufen 1, bis 20 in den Stufen 2 und 3 |
| Themen | 8 Aufgabenfamilien im Gehege (Abschnitt 4), passend zu den 8 Reitern (`MAX_TABS_PER_ROW = 4`, zwei Reihen); 4 weitere in der Scheune (Abschnitt 6) |
| Runde | 6 bis 8 Aufgaben statt 8 bis 12 |
| Lesen | nicht nötig: Jede Aufgabe wird beim Erscheinen vorgelesen; sichtbar sind nur Bildsymbol, Bilder, Ziffern und Rechnungen |
| Technik | gleiche Logik, Szenen und Eingabeformen wie die übrigen Bereiche; neue Familien greifen soweit möglich auf vorhandene Generatoren zurück |

**Nicht-Ziele:** Ziffern schreiben üben (nicht prüfbar mit Ziffernblock), Lesen lernen, eigener Spielmodus nur für Klasse 1, Zeitdruck jeder Art.

## 2. Lehrplangrundlage und Befund

Der NRW-Lehrplan nennt keine Erwartungen für das Ende von Klasse 1, nur für das Ende der Schuleingangsphase (Klasse 1 und 2). Die Verteilung auf die beiden Schuljahre legt die Schule fest. Der Entwurf folgt der üblichen Verteilung in Lehrwerken für Klasse 1; sie wurde am 26.11.2026 bestätigt (Abschnitt 10).

**Inhalte für Klasse 1 (sinngemäß, nicht aus dem Lehrplan; bestätigt am 26.11.2026)**

| Schwerpunkt | Inhalte Klasse 1 | Familie im Streichelzoo |
| --- | --- | --- |
| Zahlverständnis | Anzahlen zählen und bestimmen bis 20, auch in Gruppen | `count_20` |
| Zahlverständnis | Anzahlen schnell erfassen (Würfelbild, Kraft der 5, Zehnerfeld) | `quick_count_20` |
| Zahlverständnis | Zahlen bis 20 lesen und hören, Zahlenreihe, Nachbarzahlen, Ordnungszahlen, Zahlenstrahl | `numbers_20` |
| Zahlverständnis | mehr, weniger, gleich viel; Zeichen <, >, = | `compare_20` |
| Schnelles Kopfrechnen | Zahlen bis 10 zerlegen, zur 10 ergänzen | `decompose_10` |
| Operationsverständnis und Kopfrechnen | Plus und Minus bis 10, Tausch- und Umkehraufgaben, Rechengeschichten mit Bild | `addsub_10` |
| Kopfrechnen | Plus und Minus bis 20 ohne und mit Zehnerübergang, Verdoppeln bis 10 + 10 | `addsub_20` |
| Raum und Form | Lagebeziehungen (oben, unten, vor, hinter, neben, zwischen, links, rechts) | `position_1` |
| Raum und Form | Formen wiedererkennen, Muster fortsetzen | Scheune · `shapes_1`, `pattern_1` |
| Größen | Geld bis 20 €, volle Stunden | Scheune · `money_20`, `clock_1` |

**Befund**

- Viele Stufen 1 der Klasse-2-Bereiche enthalten schon Stoff aus Klasse 1: `plus_facts_20` (Plus bis 10, Zahlenhäuser), `quick_count` (Zehnerfeld bis 10 und 20), `number_line` (0 bis 20), `read_write_100` (Zahlwort bis 20), `space_orientation` (Lagewörter), `double_half` (Doppelte bis 10 + 10), `story_addsub` (bis 20). Diese Generatoren lassen sich mit kleineren Zahlen weiterverwenden.
- Es fehlen für Klasse 1: Zählen mit Antippen, Mengen ohne Zahlen vergleichen, Ordnungszahlen, Minus bis 10 als eigene Stufe und eine Stufe mit Bildern und ohne Ziffern.
- Formen, Muster, Geld bis 20 € und volle Stunden gehören zu Klasse 1 (Klärung vom 26.11.2026). Sie liegen in der Scheune des Streichelzoos (Abschnitt 6), weil Kinder der Klasse 1 Schmetterlingshaus, Zoo-Kasse und Futteruhr über die Freischaltkette erst spät erreichen.
- Die prozessbezogenen Erwartungen und Leitlinien aus `kompetenzerwartungen-klasse-2.md`, Abschnitt 3, gelten unverändert. Für Klasse 1 wiegt eine besonders schwer: Hinweise führen vom zählenden Rechnen weg (Kraft der 5, Zerlegen), nicht zum Abzählen in Einzelschritten.

## 3. Einbindung ins Spiel

### Klasse im Profil

Jedes Profil bekommt eine Klasse (1 oder 2). Die Frage erscheint beim Anlegen des Profils als zwei große Karten mit den Ziffern 1 und 2 und wird vorgelesen („In welche Klasse gehst du?“); sie lässt sich im Erwachsenenbereich ändern, etwa zum Schuljahreswechsel. Fortschritt geht beim Wechsel nicht verloren.

| | Klasse 1 | Klasse 2 |
| --- | --- | --- |
| Zu Beginn offen | Streichelzoo | Streichelzoo, Affenwald, Pinguinfelsen |
| Affenwald und Pinguinfelsen | öffnen bei 24 Sternen im Streichelzoo (Startwert `gradeOneBridgeStars` in `rules.json`) oder beim Wechsel auf Klasse 2 | offen |
| Übrige Bereiche | wie bisher über den Vorgängerbereich | wie bisher |
| Vorlesen beim Erscheinen der Aufgabe | immer an | wie bisher (Einstellung) |
| Aufgaben- und Hinweistext | ausgeblendet (Abschnitt 5) | wie bisher |
| Rundenlänge | 6 bis 8 Aufgaben | 8 bis 12 Aufgaben |
| Tagesfutter | nur aus dem Streichelzoo, 4 Aufgaben | wie bisher; Streichelzoo-Familien zählen mit, wenn geübt |

24 Sterne entsprechen etwa 8 bis 12 Runden mit guten Ergebnissen. Damit kann ein sicheres Kind gegen Ende von Klasse 1 in die Klasse-2-Bereiche hineinschnuppern, ohne dass es dort zu früh landet.

### Eigene Karte (geändert am 26.11.2026)

Der Streichelzoo ist eine eigene Karte wie der große Zoo, mit eigenen Gehegen. Welche Karte nach „Spielen“ erscheint, hängt von der Klasse ab: Klasse 1 beginnt im Streichelzoo, Klasse 2 im großen Zoo. Ein Wegweiser in der Mitte des Hauptwegs führt jeweils zur anderen Karte; „Zurück zur Karte“ führt aus Gehege, Aufgabe und Rundenende auf die Karte des Geheges.

| Gehege | Tier | Themen | Freischaltung |
| --- | --- | --- | --- |
| Ziegenwiese | Ziege | `count_20`, `quick_count_20` | offen |
| Hasenstall | Hase | `addsub_10` | 6 Sterne auf der Ziegenwiese |
| Meerschweinchen | Meerschweinchen | `numbers_20`, `compare_20` | 6 Sterne im Hasenstall |
| Eselweide | Esel | `decompose_10`, `addsub_20`, `position_1` | 6 Sterne bei den Meerschweinchen |
| Ponyhof | Pony | `shapes_1`, `pattern_1`, `money_20`, `clock_1` (die Themen der Scheune aus Abschnitt 6) | 6 Sterne auf der Eselweide |
| weitere, z. B. Hühner | | neue Themen | jeweils über das vorige Gehege |

Damit sind alle Themen aus den Abschnitten 4 und 6 umgesetzt. `position_1`, `pattern_1`, `money_20` und `clock_1` nutzen die Generatoren der Klasse 2 mit eigenen Parametern in `families.json` (Hülle `gradeOneFrom` in `src/logic/generators/gradeOne.ts`: eigene Familie, höchstens drei Karten). Bei Formen zeigen die Karten Formen statt Wörtern; beim Geldlegen steht für Klasse 1 der Betrag als Zahl über dem Zahlteller.

Umsetzung von `compare_20` Stufe 1: Die beiden Tiergruppen stehen auf zwei großen Antwortkarten; das Kind tippt die Karte mit mehr (oder weniger) Tieren. Die Gruppen zeigen verschiedene Tiere, damit die Größe der Bilder nicht über „mehr“ entscheidet. Bei `numbers_20` Stufe 1 wird das Zahlwort nur vorgelesen; geantwortet wird immer mit drei Karten.

Ein neues Gehege braucht einen Eintrag in `areas.json` mit `"map": "streichelzoo"`, eine Lage unter `streichelzoo.areas` in `map-layout.json`, ein Tier in `animals.json` mit Grafiken (`art/build_animals.py`) und Laut (`art/build_audio.py`) sowie Gehege- und Aufgabenhintergrund (`art/build_backgrounds.py`). Alle sechs Plätze der beiden Reihen sind bis auf den Platz unten rechts (Scheune) belegt; ein weiteres Gehege kommt dorthin oder braucht eine dritte Reihe auf der Karte (`art/build_map.py`, `background_petting`).

Für Klasse 1 öffnen Affenwald und Pinguinfelsen (`gradeOneBridge` in `areas.json`), wenn im ganzen Streichelzoo zusammen 24 Sterne gesammelt sind. Die Scheune aus Abschnitt 6 kann ein eigenes Gehege werden, z. B. der Ponyhof.

### Ablauf einer Runde für Klasse 1

1. Die Ziege steht am Gatter; die Aufgabe wird vorgelesen, sichtbar sind nur Bildsymbol, Bild und Zahlen.
2. Das Kind antwortet mit Antippen, Ziehen oder dem vorhandenen Ziffernblock.
3. Richtig: Ein Tier wird gestreichelt oder gefüttert (Möhre, Heu, Löwenzahn), die Fußspuren füllen sich, ein kurzer Lobsatz erklingt.
4. Falsch: Hinweis 1 wird vorgelesen und zeigt sofort ein Bild; ein zweiter Versuch folgt.
5. Nach 6 bis 8 Aufgaben gibt es Sterne wie in allen Bereichen (Spezifikation, Abschnitt 8); der Abschluss ist eine Tieranimation ohne Text.

## 4. Aufgabenfamilien

Jede Familie hat drei Stufen wie im übrigen Spiel. Die Spalte „Grundlage“ nennt den Generator, der sich mit Parametern weiterverwenden lässt. Familien bekommen eigene IDs, damit Sicherheit und Stufe im Profil (`skills`) getrennt von den Klasse-2-Familien bleiben.

| Familie | Thema im Gehege | Eingabeform | Grundlage | Aufwand |
| --- | --- | --- | --- | --- |
| `count_20` | Zählen | `select`, `choice` | neu (Antippen wie bei `solids_basic`) | mittel |
| `quick_count_20` | Blitzblick | `choice` | `quick_count` | gering |
| `numbers_20` | Zahlen bis 20 | `choice`, `number-line`, `match` | `read_write_100`, `number_line`, `match_repr`, `neighbors_100` | gering bis mittel |
| `compare_20` | Mehr oder weniger | `choice` | `compare_100` (Modus `symbol`), neu: Mengenbilder | mittel |
| `decompose_10` | Zerlegen | `gap`, `choice` | `plus_facts_20` Stufe 1 (Zahlenhäuser) | gering |
| `addsub_10` | Plus und Minus bis 10 | `number-input`, `choice`, `word` | `plus_facts_20`, `story_addsub` | gering |
| `addsub_20` | Plus und Minus bis 20 | `number-input`, `choice`, `true_false` | `plus_facts_20`, `double_half` | gering |
| `position_1` | Wo ist das Kaninchen? | `choice`, `grid` | `space_orientation` | gering |

### `count_20` Zählen

Ziel: Anzahlen sicher bestimmen, zuerst mit Antippen, dann in Gruppen.

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | bis 10, Tiere in einer Reihe; jedes angetippte Tier bekommt ein Häkchen | „Wie viele Küken sind es?“ (7 Küken antippen, dann Karte 7) |
| 2 | bis 10, Tiere verstreut; eine Anzahl abzählen | „Gib der Ziege 6 Möhren.“ (6 antippen, OK) |
| 3 | bis 20, in Fünfer- oder Zehnergruppen (Stall mit 2 Reihen zu 5) | „Wie viele Kaninchen sind im Stall?“ (14) |

Typische Fehler und `errorTag`: `count_skip` (ein Tier ausgelassen, Antwort − 1), `count_double` (doppelt gezählt, + 1), `count_last_word` (letzte Zahl nicht als Anzahl verstanden; zeigt sich, wenn das Kind beim Antippen richtig zählt, dann eine andere Karte wählt).

Hinweise: 1 „Tippe jedes Tier genau einmal an.“ 2 Bild: angetippte Tiere werden in eine Fünferreihe geschoben. 3 Tiere zählen sich nacheinander mit Zahl über dem Kopf, das letzte Wort ist hervorgehoben.

### `quick_count_20` Blitzblick

Ziel: Anzahlen ohne Abzählen erfassen (Kraft der 5).

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | Würfelbilder 1 bis 6 und Fingerbilder bis 10, 2,5 Sekunden sichtbar | Würfel mit 5 Augen; eine volle Hand und 2 Finger |
| 2 | Zehnerfeld bis 10, 2 Sekunden | 8 Punkte: oben 5, unten 3 |
| 3 | zwei Zehnerfelder bis 20 (wie `quick_count` Stufe 2) | 13 |

Fehler: `quick_off_by_one` (± 1), `quick_five` (Fünferreihe übersehen, ± 5). Hinweis 2 zeigt das Bild noch einmal mit umrandeter Fünferreihe.

### `numbers_20` Zahlen bis 20

Ziel: Zahl, Zahlwort, Menge und Lage in der Zahlenreihe verbinden.

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | Zahlwort hören, Ziffer bis 10 wählen; Ordnungszahlen bis 5 | „Tippe die Sieben.“ „Welches Huhn ist das dritte?“ |
| 2 | Zahlen bis 20: Nachbarzahlen, fehlende Zahl in der Reihe, Menge zur Zahl (`match`) | „Welche Zahl kommt nach 12?“ 15, 16, ?, 18 |
| 3 | Zahlenstrahl 0 bis 20 (wie `number_line` Stufe 1); Zahlwort zu Zahl mit Verwechslung 12 und 21 | „Wo liegt 14?“ |

Fehler: `mirror_digit` (6 und 9, Spiegelziffern), `teen_swap` (zwölf → 21), `neighbor_wrong_side` (Vorgänger statt Nachfolger). Zahlen bis 20 als Zahlwort werden eingesprochen (Abschnitt 7), nicht über die Sprachausgabe des Browsers.

### `compare_20` Mehr oder weniger

Ziel: Mengen und Zahlen vergleichen, zuerst ohne Ziffern.

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | zwei Gehege als Bild, bis 10; das Gehege mit mehr oder weniger Tieren antippen, bei gleich vielen das Gleichheitszeichen | „Wo sind mehr Schafe?“ |
| 2 | Zahlen bis 10 mit <, >, = (Krokodilmaul als Bildhilfe nur im Hinweis) | 7 ☐ 4 |
| 3 | bis 20 vergleichen; Unterschied als Anzahl | „Wie viele Hühner mehr als Enten?“ (Paare bilden im Bild) |

Fehler: `symbol_reversed` (< und > vertauscht), `size_not_count` (große Tiere wirken mehr: bei Stufe 1 bewusst Aufgaben mit 3 Eseln gegen 5 Küken), `difference_total` (Summe statt Unterschied).

Hinweis 2 bei Stufe 1 und 3: Tiere stellen sich paarweise gegenüber; was übrig bleibt, ist der Unterschied.

### `decompose_10` Zerlegen

Ziel: alle Zerlegungen bis 10 kennen, Zehnerfreunde sicher.

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | Zahlen 3 bis 6 zerlegen: Tiere auf zwei Wiesen | „5 Kaninchen. 2 sind im Stall. Wie viele draußen?“ |
| 2 | Zahlenhaus bis 10 (`gap`) | Zahlenhaus 8: 3 und ?, 6 und ? |
| 3 | Zehnerfreunde: zur 10 ergänzen | 7 + ? = 10 |

Fehler: `decompose_sum` (Zahl addiert statt ergänzt: 8 und 3 → 11), `off_by_one`. Hinweis 2: Zehnerfeld mit zwei Farben.

### `addsub_10` Plus und Minus bis 10

Ziel: Plus und Minus bis 10 als Handlung verstehen und ohne Abzählen rechnen.

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | Plus bis 10 mit Bild (Hinzufügen); 40 % Bildrechengeschichten | „4 Ziegen sind im Gehege. 3 kommen dazu.“ |
| 2 | Minus bis 10 mit Bild (Wegnehmen) | „7 Möhren. Die Ziege frisst 2.“ |
| 3 | Plus und Minus gemischt ohne Bild; Tausch- und Umkehraufgaben | 3 + 6, 6 + 3; aus 4 + 5 = 9 wird 9 − 5 |

Bei Rechengeschichten sieht das Kind die Szene als Bild und hört die Geschichte; es wählt in Stufe 1 die passende Rechnung (Karten „4 + 3“, „4 − 3“, „3 + 3“), danach das Ergebnis.

Fehler: `op_swapped` (Plus statt Minus), `off_by_one` (Zählfehler, Start- oder Endzahl doppelt), `operand_echo` (eine der Zahlen als Antwort).

Hinweise: 1 „Wie viele waren es zuerst? Kommen welche dazu oder gehen welche weg?“ 2 Zehnerfeld oder Fingerbild: erst 5, dann der Rest (Kraft der 5). 3 Lösung mit Bild und vorgelesenem Satz.

### `addsub_20` Plus und Minus bis 20

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | ohne Zehnerübergang, analog zum kleinen Einspluseins | 13 + 4 (wie 3 + 4), 17 − 5 |
| 2 | Verdoppeln bis 10 + 10 und Fast-Verdoppeln | 6 + 6, 6 + 7 |
| 3 | Zehnerübergang mit Zehnerfeld (Kraft der 10) | 8 + 5 = 8 + 2 + 3; 13 − 5 |

Der Zehnerübergang in Stufe 3 gehört nach der Klärung vom 26.11.2026 zu Klasse 1. `plus_facts_20` im Pinguinfelsen bleibt unverändert und übt dasselbe für Klasse 2 ohne Bildvorgabe.

Fehler: `ten_crossing` (13 statt 12 o. ä. beim Übergang), `analog_wrong` (13 + 4 = 7, Zehner vergessen), `off_by_one`. Hinweis 2 Stufe 3: zwei Zehnerfelder, das erste wird erst voll gemacht.

### `position_1` Wo ist das Kaninchen?

Ziel: Lagewörter verstehen und benutzen.

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | oben, unten, vor, hinter, auf, in | „Tippe das Kaninchen, das hinter dem Stall sitzt.“ |
| 2 | neben, zwischen | „Wer sitzt zwischen Ziege und Schaf?“ |
| 3 | links und rechts von dir aus gesehen (wie `space_orientation` Stufe 2) | „Lege die Möhre rechts neben den Eimer.“ |

Wie im Schmetterlingshaus nur „von dir aus gesehen“, kein Perspektivwechsel (Entscheidung vom 11.11.2026). Fehler: `left_right` (links und rechts vertauscht), `front_back`.

## 5. Gestaltung für Erstklässler

Die Regeln aus Abschnitt 9 der Spezifikation gelten; für den Streichelzoo und für Profile der Klasse 1 kommen diese hinzu:

- **Kein Text im Spiel:** Für Profile der Klasse 1 zeigt das Spiel keinen Aufgaben-, Hinweis- oder Lobtext. Sichtbar bleiben Bilder, Ziffern, Rechenzeichen und Bildsymbole. Text gibt es nur im Erwachsenenbereich.
- **Alles wird gesprochen:** Jede Aufgabe und jeder Hinweis wird automatisch vorgelesen, kurz und mit Wörtern, die Kinder am Schulanfang kennen. Ein Lautsprecher-Knopf wiederholt den Satz.
- **Bildsymbole statt Anweisungen:** Jede Aufgabe trägt ein Symbol für die Handlung (Finger für „antippen“, Auge für „schau“, Hand mit Möhre für „gib“, Pfeil für „ziehen“). Antwortkarten tragen Bilder oder Zahlen, keine Wörter.
- **Knöpfe ohne Beschriftung:** Zurück, Hinweis, Vorlesen und OK als Symbol; die Wörter nur, wenn das Profil Klasse 2 hat.
- **Größere Tippflächen:** mindestens 80 × 80 Pixel statt 64 × 64, Abstand 20 Pixel. Antwortkarten höchstens 3 statt 4.
- **Bilder vor Ziffern:** In Stufe 1 jeder Familie ist eine Menge sichtbar; Ziffern allein erst ab Stufe 2 oder 3.
- **Kein Abzählen als Hinweis:** Ausnahme ist nur `count_20`. Sonst zeigen Hinweise Fünfer- und Zehnerstruktur, Fingerbilder, Zerlegen und Paare bilden.
- **Fingerbilder:** In Hinweisstufe 2 von `quick_count_20`, `decompose_10`, `addsub_10` und `addsub_20` erscheint neben dem Zehnerfeld ein Fingerbild: eine volle Hand ist 5, zwei volle Hände sind 10. Die Finger werden als Ganzes gezeigt, nicht einzeln abgezählt.
- **Kürzere Runden:** 6 bis 8 Aufgaben; Rundenabschluss mit Tieranimation.
- **Lob:** eigene, gesprochene Lobsätze, noch kürzer („Genau!“, „Du hast jedes Tier gezählt.“) in `praise.de.json`.

## 6. Scheune: Formen, Muster, Geld und Uhr

Formen, Muster, Geld und Uhr gehören zu Klasse 1, passen aber nicht mehr in die 8 Reiter des Geheges. Sie liegen deshalb in der Scheune des Streichelzoos. Die Scheune funktioniert wie die Baustelle im Schmetterlingshaus (`site` in `areas.json`): Ein Knopf im Gehege führt hinein, dort stehen 4 eigene Reiter. Die Familien haben eigene IDs (Entscheidung 3) und verwenden die Generatoren der Klasse-2-Familien mit kleineren Parametern.

| Familie | Thema | Grundlage | Stufe 1 | Stufe 2 | Stufe 3 |
| --- | --- | --- | --- | --- | --- |
| `shapes_1` | Formen | `shapes_basic` | Kreis, Dreieck, Quadrat, Rechteck wiedererkennen (gleiche Form antippen) | Form hören und antippen | Formen im Bild finden und zählen (Stall aus Formen) |
| `pattern_1` | Muster | `pattern_continue` | AB-Muster mit Tieren (Huhn, Ente, Huhn, …) | AAB- und ABC-Muster | Lücke in der Mitte |
| `money_20` | Geld | `money_lay` | Euro bis 10 mit 1 €, 2 €, 5 € legen | Euro bis 20 mit 1 €, 2 €, 5 €, 10 € legen | Futter im Hofladen bezahlen: Preis bis 20 € legen, Betrag zweier Münzen nennen |
| `clock_1` | Uhr | `clock_full` | volle Stunden lesen | volle Stunden einstellen | eine Stunde später oder früher (Fütterungszeit) |

Fehler und Hinweise übernehmen die Familien aus ihrer Grundlage; Hinweistexte werden für Klasse 1 kürzer eingesprochen. Für Profile der Klasse 2 ist die Scheune ebenfalls offen.

Die bisher ungenutzte Stufe 0 (`TaskLevel`) wird damit nicht gebraucht.

## 7. Zu erstellende Ressourcen

| Kategorie | Umfang | Anmerkung |
| --- | --- | --- |
| Tier | Ziege in 4 Zuständen (ruhig, freut sich, frisst, denkt) und Zicklein | wie die übrigen Tiere mit `art/build_animals.py` |
| Aufgabenbilder | Kaninchen, Meerschweinchen, Huhn, Küken, Schaf, Esel, Ente; Möhre, Heu, Löwenzahn, Eimer, Stall | rund 12 Objekte, 256 × 256 |
| Hintergründe | Streichelzoo-Gehege mit Gatter, Stall und Wiese; Scheune innen | `art/build_backgrounds.py` |
| Fingerbilder | eine und zwei Hände mit 0 bis 5 gestreckten Fingern | Vektor, für Blitzblick und Hinweise |
| Karte | eigene Streichelzoo-Karte, Wegweiser auf beiden Karten, Kartensymbole je Tier | `art/build_map.py`, `map-layout.json` |
| Profil | Avatar `goat` in `AVATARS` | optional |
| Bildsymbole | antippen, schau, gib, ziehen, legen (Geld), Uhr stellen; Knöpfe Zurück, Hinweis, Vorlesen, OK, Scheune | für Anweisungen und Knöpfe ohne Text |
| Ton | Ziegenmeckern, sanftes Streichel-Geräusch | `art/build_audio.py`, Lizenz in `ATTRIBUTIONS.md` |
| Sprache | Zahlwörter 0 bis 20, rund 80 Aufgabensätze, Hinweise aller drei Stufen für 12 Familien (rund 100 Sätze, weil kein Text sie ersetzt), 10 Lobsätze, Klassenfrage | in die Aufnahmeliste (`docs/aufnahmeliste.md`); Zahlwörter zuerst, weil die Sprachausgabe des Browsers bei „siebzehn“ oder „zwölf“ je Gerät unterschiedlich klingt |
| Daten | Einträge in `areas.json`, `families.json`, `animals.json`, `hints.de.json`, `praise.de.json`, `strings.de.json`, `stories.json`, `rules.json` | keine neue Datei |

## 8. Technische Umsetzung

| Schritt | Ort | Aufwand |
| --- | --- | --- |
| Klasse im Profil: `grade?: 1 \| 2`, fehlt = 2; keine Migration nötig | `src/types/save.ts`, `src/services/save.ts` | gering |
| Klassenfrage beim Anlegen, Änderung im Erwachsenenbereich | `ProfileCreateScene`, `ParentScene` | gering |
| Gehege des Streichelzoos mit `"map": "streichelzoo"` (Ziegenwiese, Hasenstall, später weitere) | `areas.json`, `animals.json`, `map-layout.json` | gering je Gehege, Grafik mittel |
| Name und Symbol der `site` je Bereich statt fest „Baustelle“ (`area.site`) | `AreaScene`, `strings.de.json` | gering |
| Freischaltung je Klasse: Affenwald und Pinguinfelsen für Klasse 1 hinter `gradeOneBridgeStars` | `src/logic/areas.ts` (`areaState` bekommt die Klasse), `rules.json` | gering |
| Rundenlänge und Tagesfutter je Bereich oder Klasse | `rules.json`, `src/logic/rounds.ts`, `src/logic/daily.ts` | gering |
| Familien, die vorhandene Generatoren nutzen: Hülle wie `storyAddSubFor('money_calc')`, die die Familien-ID setzt | `src/logic/generators/index.ts` und betroffene Generatoren | gering bis mittel |
| Neu: `count_20` (Antippen mit Häkchen, Eingabeform `select` wiederverwenden), Mengenbilder für `compare_20`, Ordnungszahlen in `numbers_20` | `src/logic/generators/`, `src/ui/` | mittel |
| Für Klasse-1-Profile: Text ausblenden, Bildsymbol je Aufgabe, Knöpfe nur als Symbol, Vorlesen immer an, größere Tippflächen | `TaskScene`, `AreaScene`, `RoundEndScene`, UI-Bausteine, `families.json` (Symbol je Familie) | mittel |
| Fingerbilder als Darstellung in Blitzblick und Hinweisstufe 2 | `src/ui/`, `hints.de.json` | mittel |
| Tests: Zahlenraum ≤ 10 bzw. ≤ 20 für 1000 Startwerte, Fehlerkarten, Freischaltung je Klasse, Kartenlage | `tests/` | mittel |

Vorgehen wie bei der Pinguinfelsen-Phase: erst ein vertikaler Schnitt mit Klassenfrage, Bereich und drei Familien (`count_20`, `quick_count_20`, `addsub_10`), dann Spieltest mit Kindern der 1. Klasse, dann die übrigen fünf Familien und die Scheune.

## 9. Entscheidungen (26.11.2026)

| Nr. | Frage | Antwort | Gilt jetzt |
| --- | --- | --- | --- |
| 1 | Klasse im Profil oder Streichelzoo nur als zusätzlicher, immer offener Bereich? | Ja | Klasse im Profil (Deutung) |
| 2 | Leittier Ziege? | Ja | Ziege, Baby Zicklein |
| 3 | Eigene Familien-IDs oder Stufe 0 in vorhandenen Familien? | Ja | eigene IDs für alle 12 Familien (Gehege und Scheune); Stufe 0 bleibt ungenutzt |
| 4 | Formen, Muster, Geld und Uhr für Klasse 1: Stufe 0, Bastelecke oder gar nicht? | Ja | in der Scheune des Streichelzoos (Abschnitt 6); Deutung, weil die Kinder die Stufe 0 in fernen Bereichen kaum erreichen |
| 5 | Ort auf der Karte | Ja | zuerst Mitte des Hauptwegs; am 26.11.2026 ersetzt durch eine eigene Karte mit Wegweiser (Abschnitt 3) |
| 6 | Schwelle für Affenwald und Pinguinfelsen bei Klasse 1 | Ja | 24 Sterne als Startwert, nach Spieltest anpassen |
| 7 | Gehört der Streichelzoo zu V1 oder zu einer neuen Phase? | Ja | eigene Phase nach dem Feinschliff (Phase 4), vor dem Pilot; Spezifikation Abschnitte 1, 5, 9, 11, 12 und 13 anpassen |

## 10. Fragen an die Lehrkraft (26.11.2026)

| Nr. | Frage | Antwort | Gilt jetzt |
| --- | --- | --- | --- |
| 1 | Reicht der Zahlenraum bis 20 am Ende von Klasse 1? | Ja | bis 20 |
| 2 | Gehört der Zehnerübergang (8 + 5) ans Ende von Klasse 1? | Ja | `addsub_20` Stufe 3 bleibt |
| 3 | Gehören Formen und einfache Muster zu Klasse 1? | Ja | `shapes_1`, `pattern_1` in der Scheune, ohne Fachbegriffe Ecke und Seite |
| 4 | Geld und volle Stunden in Klasse 1? | Ja | `money_20` (Stufe 1 bis 10 €, Stufe 2 und 3 bis 20 €; Deutung), `clock_1` mit vollen Stunden |
| 5 | Ordnungszahlen (der Dritte) in Klasse 1? | Ja | bis 5 in `numbers_20` Stufe 1 |
| 6 | Zeichen <, >, = schon in Klasse 1? | Ja | `compare_20` ab Stufe 2 |
| 7 | Wie viel Text verträgt eine Aufgabe? | Text minimieren | kein Aufgaben-, Hinweis- und Lobtext für Klasse 1; Bildsymbole und Ton (Abschnitt 5) |
| 8 | Sind Fingerbilder als Hilfe erwünscht? | Ja | in Hinweisstufe 2 neben Fünfer- und Zehnerstruktur (Abschnitt 5) |

## 11. Prüfung

- Spieltest mit mindestens 5 Kindern der 1. Klasse, getrennt in der ersten und zweiten Schuljahreshälfte, weil Lesen und Zahlenraum sich im Lauf des Jahres stark ändern.
- Akzeptanzkriterium zusätzlich zu Abschnitt 12 der Spezifikation: Ein Kind der 1. Klasse startet eine Runde im Streichelzoo und löst sie ohne Hilfe einer erwachsenen Person, auch wenn es noch nicht liest.
- Inhaltliche Prüfung der Aufgaben, Hinweise und Vorlesetexte durch eine Lehrkraft der Schuleingangsphase.
