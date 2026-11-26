# Streichelzoo: Entwurf für Klasse 1

Entwurf zur Prüfung, Stand 26.11.2026. Ergänzend: `zahlen-zoo-spezifikation.md`, `kompetenzerwartungen-klasse-2.md`, `ausarbeitung-offene-familien.md`. Nichts davon ist umgesetzt; die Entscheidungen in Abschnitt 9 und die Fragen an die Lehrkraft in Abschnitt 10 stehen vor der Umsetzung.

## 1. Ziel und Rahmen

Der Streichelzoo ist ein neuer Bereich am Eingang der Zoo-Karte, in dem Kinder der 1. Klasse mit Ziegen, Kaninchen, Meerschweinchen und Hühnern Zahlen bis 20 entdecken. Er macht den Zahlen-Zoo für Klasse 1 spielbar und dient Kindern der 2. Klasse als Wiederholung.

| Punkt | Festlegung im Entwurf |
| --- | --- |
| Zielgruppe | 6 bis 7 Jahre, Klasse 1; Klasse 2 freiwillig zur Wiederholung |
| Leittier | Ziege (Baby: Zicklein); weitere Tiere des Streichelzoos erscheinen als Aufgabenbilder |
| Zahlenraum | bis 10 in den Stufen 1, bis 20 in den Stufen 2 und 3 |
| Themen | 8 Aufgabenfamilien (Abschnitt 4), passend zu den 8 Reitern im Gehege (`MAX_TABS_PER_ROW = 4`, zwei Reihen) |
| Runde | 6 bis 8 Aufgaben statt 8 bis 12 |
| Lesen | Jede Aufgabe wird beim Erscheinen vorgelesen; Text höchstens ein kurzer Satz, Anweisung zusätzlich als Bildsymbol |
| Technik | gleiche Logik, Szenen und Eingabeformen wie die übrigen Bereiche; neue Familien greifen soweit möglich auf vorhandene Generatoren zurück |

**Nicht-Ziele:** Ziffern schreiben üben (nicht prüfbar mit Ziffernblock), Lesen lernen, eigener Spielmodus nur für Klasse 1, Zeitdruck jeder Art.

## 2. Lehrplangrundlage und Befund

Der NRW-Lehrplan nennt keine Erwartungen für das Ende von Klasse 1, nur für das Ende der Schuleingangsphase (Klasse 1 und 2). Die Verteilung auf die beiden Schuljahre legt die Schule fest. Der Entwurf folgt der üblichen Verteilung in Lehrwerken für Klasse 1; sie ist mit einer Lehrkraft zu bestätigen (Abschnitt 10).

**Annahme für Klasse 1 (sinngemäß, nicht aus dem Lehrplan)**

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

**Befund**

- Viele Stufen 1 der Klasse-2-Bereiche enthalten schon Stoff aus Klasse 1: `plus_facts_20` (Plus bis 10, Zahlenhäuser), `quick_count` (Zehnerfeld bis 10 und 20), `number_line` (0 bis 20), `read_write_100` (Zahlwort bis 20), `space_orientation` (Lagewörter), `double_half` (Doppelte bis 10 + 10), `story_addsub` (bis 20). Diese Generatoren lassen sich mit kleineren Zahlen weiterverwenden.
- Es fehlen für Klasse 1: Zählen mit Antippen, Mengen ohne Zahlen vergleichen, Ordnungszahlen, Minus bis 10 als eigene Stufe und eine Stufe mit Bildern und ohne Ziffern.
- Formen, Muster, Geld bis 20 € und volle Stunden gehören in vielen Lehrwerken schon zu Klasse 1. Der Entwurf nimmt sie nicht in den Streichelzoo auf, sondern schlägt eine Stufe 0 in den vorhandenen Bereichen vor (Abschnitt 6); Entscheidung in Abschnitt 9.
- Die prozessbezogenen Erwartungen und Leitlinien aus `kompetenzerwartungen-klasse-2.md`, Abschnitt 3, gelten unverändert. Für Klasse 1 wiegt eine besonders schwer: Hinweise führen vom zählenden Rechnen weg (Kraft der 5, Zerlegen), nicht zum Abzählen in Einzelschritten.

## 3. Einbindung ins Spiel

### Klasse im Profil

Jedes Profil bekommt eine Klasse (1 oder 2). Die Frage erscheint beim Anlegen des Profils als zwei große Bildkarten („Ich gehe in die 1. Klasse“, „… in die 2. Klasse“) und lässt sich im Erwachsenenbereich ändern, etwa zum Schuljahreswechsel. Fortschritt geht beim Wechsel nicht verloren.

| | Klasse 1 | Klasse 2 |
| --- | --- | --- |
| Zu Beginn offen | Streichelzoo | Streichelzoo, Affenwald, Pinguinfelsen |
| Affenwald und Pinguinfelsen | öffnen bei 24 Sternen im Streichelzoo (Startwert `gradeOneBridgeStars` in `rules.json`) oder beim Wechsel auf Klasse 2 | offen |
| Übrige Bereiche | wie bisher über den Vorgängerbereich | wie bisher |
| Vorlesen beim Erscheinen der Aufgabe | an | wie bisher (Einstellung) |
| Rundenlänge | 6 bis 8 Aufgaben | 8 bis 12 Aufgaben |
| Tagesfutter | nur aus dem Streichelzoo, 4 Aufgaben | wie bisher; Streichelzoo-Familien zählen mit, wenn geübt |

24 Sterne entsprechen etwa 8 bis 12 Runden mit guten Ergebnissen. Damit kann ein sicheres Kind gegen Ende von Klasse 1 in die Klasse-2-Bereiche hineinschnuppern, ohne dass es dort zu früh landet.

### Ort auf der Karte

Die 8 Gehege liegen in zwei Reihen (y = 270 und y = 560), dazwischen der Hauptweg (`PATH_Y = 415` in `art/build_map.py`). Vorschlag: Der Streichelzoo sitzt als kleineres Gehege in der Mitte des Hauptwegs am Zooeingang (etwa x = 512, y = 415). Lage und Größe sind mit `map-layout.json` und dem Test `tests/logic.mapLayout.test.ts` gegen die Dekorationen zu prüfen.

### Ablauf einer Runde für Klasse 1

1. Die Ziege steht am Gatter; die Aufgabe wird vorgelesen.
2. Das Kind antwortet mit Antippen, Ziehen oder dem vorhandenen Ziffernblock.
3. Richtig: Ein Tier wird gestreichelt oder gefüttert (Möhre, Heu, Löwenzahn), die Fußspuren füllen sich.
4. Falsch: Hinweis 1 wird vorgelesen und zeigt sofort ein Bild; ein zweiter Versuch folgt.
5. Nach 6 bis 8 Aufgaben gibt es Sterne wie in allen Bereichen (Spezifikation, Abschnitt 8).

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
| 1 | Würfelbilder 1 bis 6, 2,5 Sekunden sichtbar | Würfel mit 5 Augen |
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
| 1 | zwei Gehege als Bild, bis 10; Karten „mehr“, „weniger“, „gleich viel“ oder das Gehege antippen | „Wo sind mehr Schafe?“ |
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

Bei Rechengeschichten wählt das Kind in Stufe 1 die passende Rechnung (Karten „4 + 3“, „4 − 3“, „3 + 3“), danach das Ergebnis.

Fehler: `op_swapped` (Plus statt Minus), `off_by_one` (Zählfehler, Start- oder Endzahl doppelt), `operand_echo` (eine der Zahlen als Antwort).

Hinweise: 1 „Wie viele waren es zuerst? Kommen welche dazu oder gehen welche weg?“ 2 Zehnerfeld: erst 5, dann der Rest (Kraft der 5). 3 Lösung mit Bild und vorgelesenem Satz.

### `addsub_20` Plus und Minus bis 20

| Stufe | Inhalt | Beispiel |
| --- | --- | --- |
| 1 | ohne Zehnerübergang, analog zum kleinen Einspluseins | 13 + 4 (wie 3 + 4), 17 − 5 |
| 2 | Verdoppeln bis 10 + 10 und Fast-Verdoppeln | 6 + 6, 6 + 7 |
| 3 | Zehnerübergang mit Zehnerfeld (Kraft der 10) | 8 + 5 = 8 + 2 + 3; 13 − 5 |

Stufe 3 hängt an Lehrkraftfrage 2 (Abschnitt 10). `plus_facts_20` im Pinguinfelsen bleibt unverändert und übt dasselbe für Klasse 2 ohne Bildvorgabe.

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

- **Vorlesen zuerst:** Jede Aufgabe und jeder Hinweis wird automatisch vorgelesen. Der Vorlese-Knopf bleibt zum Wiederholen.
- **Wenig Text:** Ein Satz pro Aufgabe, nur Wörter, die Kinder in den ersten Schulmonaten hören und lesen. Anweisungen tragen zusätzlich ein Bildsymbol (Finger für „antippen“, Auge für „schau“, Hand mit Möhre für „gib“).
- **Größere Tippflächen:** mindestens 80 × 80 Pixel statt 64 × 64, Abstand 20 Pixel. Antwortkarten höchstens 3 statt 4.
- **Bilder vor Ziffern:** In Stufe 1 jeder Familie ist eine Menge sichtbar; Ziffern allein erst ab Stufe 2 oder 3.
- **Kein Abzählen als Hinweis:** Ausnahme ist nur `count_20`. Sonst zeigen Hinweise Fünfer- und Zehnerstruktur, Zerlegen und Paare bilden.
- **Kürzere Runden:** 6 bis 8 Aufgaben; Rundenabschluss mit Tieranimation statt Text.
- **Lob:** eigene Lobsätze, noch kürzer („Genau!“, „Du hast jedes Tier gezählt.“) in `praise.de.json`.

## 6. Klasse-1-Inhalte außerhalb des Streichelzoos (Vorschlag)

Für Inhalte, die nicht in die 8 Reiter passen, sieht das Aufgabenmodell schon Stufe 0 vor (`TaskLevel = 0 | 1 | 2 | 3`, bisher ungenutzt). Für Profile der Klasse 1 würde sie in einzelnen Familien als erste Stufe erscheinen, sobald der Bereich offen ist:

| Familie (Bereich) | Stufe 0 | Voraussetzung |
| --- | --- | --- |
| `shapes_basic` (Schmetterlingshaus) | Kreis, Dreieck, Quadrat, Rechteck wiedererkennen, ohne Fachbegriff Ecke und Seite | Lehrkraftfrage 3 |
| `pattern_continue` (Schmetterlingshaus) | AB-Muster mit Tieren statt Formen | Lehrkraftfrage 3 |
| `money_lay` (Zoo-Kasse) | Euro bis 10 mit 1 €, 2 €, 5 €, 10 € | Lehrkraftfrage 4 |
| `clock_full` (Futteruhr) | volle Stunden lesen | Lehrkraftfrage 4 |

Weil Klasse-1-Profile diese Bereiche über die Freischaltkette erst spät erreichen, ist ein zweiter Weg denkbar: eine „Bastelecke“ im Streichelzoo-Gehege (wie die Baustelle im Schmetterlingshaus, `site` in `areas.json`) mit Formen und Mustern. Das ist in diesem Entwurf nicht ausgearbeitet.

## 7. Zu erstellende Ressourcen

| Kategorie | Umfang | Anmerkung |
| --- | --- | --- |
| Tier | Ziege in 4 Zuständen (ruhig, freut sich, frisst, denkt) und Zicklein | wie die übrigen Tiere mit `art/build_animals.py` |
| Aufgabenbilder | Kaninchen, Meerschweinchen, Huhn, Küken, Schaf, Esel, Ente; Möhre, Heu, Löwenzahn, Eimer, Stall | rund 12 Objekte, 256 × 256 |
| Hintergrund | Streichelzoo-Gehege mit Gatter, Stall und Wiese | `art/build_backgrounds.py` |
| Karte | kleineres Gehege am Eingang, Zustände gesperrt (entfällt), offen, fertig; Kartensymbol `karte_ziege` | `art/build_map.py`, `map-layout.json` |
| Profil | Avatar `goat` in `AVATARS` | optional |
| Bildsymbole | antippen, schau, gib, ziehen | für Anweisungen ohne Lesen |
| Ton | Ziegenmeckern, sanftes Streichel-Geräusch | `art/build_audio.py`, Lizenz in `ATTRIBUTIONS.md` |
| Sprache | Zahlwörter 0 bis 20, rund 60 Aufgabensätze, 24 Hinweise der Stufe 1, 10 Lobsätze | in die Aufnahmeliste (`docs/aufnahmeliste.md`); Zahlwörter zuerst, weil die Sprachausgabe des Browsers bei „siebzehn“ oder „zwölf“ je Gerät unterschiedlich klingt |
| Daten | Einträge in `areas.json`, `families.json`, `animals.json`, `hints.de.json`, `praise.de.json`, `strings.de.json`, `stories.json`, `rules.json` | keine neue Datei |

## 8. Technische Umsetzung

| Schritt | Ort | Aufwand |
| --- | --- | --- |
| Klasse im Profil: `grade?: 1 \| 2`, fehlt = 2; keine Migration nötig | `src/types/save.ts`, `src/services/save.ts` | gering |
| Klassenfrage beim Anlegen, Änderung im Erwachsenenbereich | `ProfileCreateScene`, `ParentScene` | gering |
| Bereich `streichelzoo` (Tier `goat`, ohne `requires`, `grades: [1, 2]`) | `areas.json`, `animals.json`, `map-layout.json` | gering |
| Freischaltung je Klasse: Affenwald und Pinguinfelsen für Klasse 1 hinter `gradeOneBridgeStars` | `src/logic/areas.ts` (`areaState` bekommt die Klasse), `rules.json` | gering |
| Rundenlänge und Tagesfutter je Bereich oder Klasse | `rules.json`, `src/logic/rounds.ts`, `src/logic/daily.ts` | gering |
| Familien, die vorhandene Generatoren nutzen: Hülle wie `storyAddSubFor('money_calc')`, die die Familien-ID setzt | `src/logic/generators/index.ts` und betroffene Generatoren | gering bis mittel |
| Neu: `count_20` (Antippen mit Häkchen, Eingabeform `select` wiederverwenden), Mengenbilder für `compare_20`, Ordnungszahlen in `numbers_20` | `src/logic/generators/`, `src/ui/` | mittel |
| Automatisches Vorlesen und größere Tippflächen für Klasse-1-Profile | `TaskScene`, UI-Bausteine | gering bis mittel |
| Tests: Zahlenraum ≤ 10 bzw. ≤ 20 für 1000 Startwerte, Fehlerkarten, Freischaltung je Klasse, Kartenlage | `tests/` | mittel |

Vorgehen wie bei der Pinguinfelsen-Phase: erst ein vertikaler Schnitt mit Klassenfrage, Bereich und drei Familien (`count_20`, `quick_count_20`, `addsub_10`), dann Spieltest mit Kindern der 1. Klasse, dann die übrigen fünf Familien.

## 9. Entscheidungen vor der Umsetzung

| Nr. | Frage | Vorschlag |
| --- | --- | --- |
| 1 | Klasse im Profil oder Streichelzoo nur als zusätzlicher, immer offener Bereich? | Klasse im Profil; ohne sie landen Erstklässler nach wenigen Sternen in Klasse-2-Aufgaben |
| 2 | Leittier Ziege? | Ja; Alternativen: Kaninchen, Pony |
| 3 | Eigene Familien-IDs oder Stufe 0 in vorhandenen Familien? | eigene IDs für die 8 Streichelzoo-Familien, Stufe 0 nur für Abschnitt 6 |
| 4 | Formen, Muster, Geld und Uhr für Klasse 1: Stufe 0, Bastelecke oder gar nicht? | erst nach Lehrkraftfragen 3 und 4 entscheiden |
| 5 | Ort auf der Karte | Mitte des Hauptwegs am Eingang |
| 6 | Schwelle für Affenwald und Pinguinfelsen bei Klasse 1 | 24 Sterne als Startwert, nach Spieltest anpassen |
| 7 | Gehört der Streichelzoo zu V1 oder zu einer neuen Phase? | eigene Phase nach dem Feinschliff (Phase 4), vor dem Pilot; die Spezifikation (Abschnitte 1, 5, 9, 11, 12, 13) wird nach den Entscheidungen angepasst |

## 10. Fragen an die Lehrkraft

| Nr. | Frage | Annahme im Entwurf | Folge, wenn die Annahme nicht stimmt |
| --- | --- | --- | --- |
| 1 | Reicht der Zahlenraum bis 20 am Ende von Klasse 1? | ja | Stufe 3 einzelner Familien bis 10 begrenzen oder bis 30 erweitern |
| 2 | Gehört der Zehnerübergang (8 + 5) ans Ende von Klasse 1 oder an den Anfang von Klasse 2? | Ende Klasse 1 | `addsub_20` Stufe 3 streichen; bleibt im Pinguinfelsen |
| 3 | Gehören Formen und einfache Muster zu Klasse 1? | ja, ohne Fachbegriffe Ecke und Seite | Stufe 0 in `shapes_basic` und `pattern_continue` entfällt |
| 4 | Geld bis 10 € oder 20 € und volle Stunden in Klasse 1? | Geld bis 10 € ja, Uhr eher Klasse 2 | Stufe 0 in `money_lay` oder `clock_full` anpassen |
| 5 | Ordnungszahlen (der Dritte) in Klasse 1? | ja, bis 5 | aus `numbers_20` Stufe 1 streichen |
| 6 | Zeichen <, >, = schon in Klasse 1? | ja, ab der Mitte des Schuljahres | `compare_20` Stufe 2 nur mit Wörtern |
| 7 | Reicht ein Satz Vorlesetext, oder sollen Aufgaben in den ersten Monaten ganz ohne Schrift auskommen? | ein Satz, immer vorgelesen | Text in Stufe 1 ausblenden, nur Bildsymbol und Ton |
| 8 | Sind Fingerbilder als Hilfe erwünscht oder nur Fünfer- und Zehnerstruktur? | nur Fünfer- und Zehnerstruktur | Hinweisbilder für Stufe 2 ergänzen |

## 11. Prüfung

- Spieltest mit mindestens 5 Kindern der 1. Klasse, getrennt in der ersten und zweiten Schuljahreshälfte, weil Lesen und Zahlenraum sich im Lauf des Jahres stark ändern.
- Akzeptanzkriterium zusätzlich zu Abschnitt 12 der Spezifikation: Ein Kind der 1. Klasse startet eine Runde im Streichelzoo und löst sie ohne Hilfe einer erwachsenen Person, auch wenn es noch nicht liest.
- Inhaltliche Prüfung der Aufgaben, Hinweise und Vorlesetexte durch eine Lehrkraft der Schuleingangsphase.
