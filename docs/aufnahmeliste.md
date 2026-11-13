# Aufnahmeliste

Sätze, die das Spiel vorliest und die sich einsprechen lassen (Spezifikation 11, Variante B).
Sätze mit Zahlen oder Namen (Platzhalter wie `{n}`) liest weiter die Sprachausgabe des
Browsers; sie stehen deshalb nicht in der Liste. Erzeugt mit `python3 art/build_voice.py --list`;
dieselbe Liste zum Abhaken steht in `aufnahmeliste.csv`.

## So geht es

1. Einen Satz pro Datei aufnehmen, ruhig und freundlich, eher langsam (Zweitklässler).
   Ein Handy genügt; leiser Raum, etwa 20 cm Abstand. Format egal (WAV, M4A, MP3, OGG).
2. Datei nach dem Schlüssel benennen, z. B. `hint.add_bridge.1.m4a`, und in `art/voice/` legen.
3. `python3 art/build_voice.py` ausführen: schneidet Stille ab, gleicht die Lautstärke an,
   legt `public/assets/audio/voice/<schlüssel>.mp3` ab und trägt den Schlüssel in
   `src/data/voice.json` ein. Ab dann spielt das Spiel die Aufnahme.

Fehlt eine Aufnahme, liest das Spiel den Satz wie bisher mit der Browserstimme vor.
Ändert sich ein Text, muss er neu aufgenommen werden (das Werkzeug meldet keine Textänderungen;
die Spalte Text zeigt den Stand beim Erzeugen der Liste).

| Priorität | Inhalt | Sätze |
| --- | --- | --- |
| 1 | Hinweise der Hilfestufe 1 (zuerst aufnehmen) | 107 |
| 2 | Arbeitsanweisungen und Aussagen auf Antwortkarten | 112 |
| 3 | Hinweise der Hilfestufe 2 | 101 |
| 4 | Hinweise der Hilfestufe 3 | 10 |
| | zusammen | 330 |


## Priorität 1

| Schlüssel | Text |
| --- | --- |
| `hint.add_stepwise.1` | Rechne erst die Zehner, dann die Einer. |
| `hint.anchor.1` | Denk an Dinge, die du kennst: Ein Fingernagel ist etwa 1 cm breit, eine Tür etwa 2 m hoch. |
| `hint.anchor.longer.1` | 1 m ist ungefähr so lang wie ein großer Schritt von Erwachsenen. |
| `hint.area.compare.1` | Größer heißt nicht länger. Zähle bei beiden die Kästchen. |
| `hint.area.count.1` | Zähle die grünen Kästchen. Ein Kästchen nach dem anderen. |
| `hint.area.perimeter.1` | Der Umfang ist der Weg einmal ganz um die Fläche herum. |
| `hint.calendar.days.1` | Schau auf die letzte Zahl im Kalenderblatt. |
| `hint.calendar.week.1` | Eine Woche hat 7 Tage. Eine Woche später steht direkt darunter. |
| `hint.calendar.weekday.1` | Oben in jeder Spalte steht der Wochentag. |
| `hint.chart.least.1` | Die wenigsten hat die niedrigste Säule. |
| `hint.chart.most.1` | Die meisten hat die höchste Säule. |
| `hint.clock.digital.1` | Digital steht zuerst die Stunde, dann ein Doppelpunkt und die Minuten. |
| `hint.clock.digital.afternoon.1` | Nach 12 Uhr mittags zählt man weiter: 13 Uhr, 14 Uhr, 15 Uhr und so weiter. |
| `hint.clock.later.1` | Eine Stunde hat 60 Minuten. Eine halbe Stunde sind 30 Minuten, eine Viertelstunde 15 Minuten. |
| `hint.clock.read.1.full` | Zeigt der lange Zeiger auf die 12, ist es eine volle Stunde. |
| `hint.clock.read.1.half` | Zeigt der lange Zeiger auf die 6, ist es halb. |
| `hint.clock.read.1.quarterPast` | Zeigt der lange Zeiger auf die 3, ist es Viertel nach. |
| `hint.clock.read.1.quarterTo` | Zeigt der lange Zeiger auf die 9, ist es Viertel vor. |
| `hint.clock.set.1` | Der lange Zeiger zeigt die Minuten, der kurze Zeiger die Stunde. |
| `hint.compare.1` | Vergleiche zuerst die Zehner. Sind sie gleich, vergleiche die Einer. |
| `hint.compare_duration.digits.1` | Vergleiche die Zahlen: Mehr Minuten oder Stunden dauern länger. |
| `hint.compare_duration.units.1` | Rechne alles in Minuten um. Eine Stunde hat 60 Minuten. |
| `hint.compare_length.digits.1` | Vergleiche zuerst die Zehner, dann die Einer. |
| `hint.compare_length.units.1` | Rechne alles in cm um: 1 m sind 100 cm. |
| `hint.compare_money.1` | Schreibe die Beträge in Cent. Denk daran: 1 € = 100 ct. |
| `hint.compare_money.digits.1` | Vergleiche zuerst die Zehner. Sind sie gleich, vergleiche die Einer. |
| `hint.complementTens.1.hundred` | Ergänze erst bis zum nächsten Zehner, dann bis 100. |
| `hint.compose.1` | Schau auf die Ecken des Umrisses. Welches Teil passt hinein? |
| `hint.compose.missing.1` | Schau auf die Lücke: Ist sie eckig oder rund? Wie viele Ecken hat sie? |
| `hint.compose.rotate.1` | Tippe ein Teil an. Tippst du es noch einmal an, dreht es sich. |
| `hint.cubes.build.1` | Tippe ein Feld so oft an, bis dort so viele Würfel stehen wie im Bauplan. |
| `hint.cubes.count.1` | Zähle Turm für Turm. |
| `hint.cubes.hidden.1` | Achtung: Manche Würfel kannst du nicht sehen. |
| `hint.cubes.plan.1` | Im Bauplan steht für jedes Feld, wie viele Würfel darauf stehen. Unten ist vorn. |
| `hint.cubes.view.front.1` | Stell dich vor das Gebäude, auf die Seite „vorn“. |
| `hint.cubes.view.side.1` | Stell dich rechts neben das Gebäude, auf die Seite „rechts“. |
| `hint.cubes.write.1` | Unten links ist vorn. Schau Turm für Turm, wie hoch er ist. |
| `hint.estimate.1` | Runde jede Zahl auf den nächsten Zehner. |
| `hint.exact_or_estimate.1` | Überlege: Muss das Ergebnis auf den Cent stimmen, oder willst du nur wissen, ob es ungefähr passt? |
| `hint.exact_or_estimate.rough.1` | Runde jeden Preis auf den nächsten vollen Zehner. |
| `hint.facts_house.1` | Im Zahlenhaus ergeben die zwei Zahlen in jedem Stockwerk zusammen die Zahl im Dach. |
| `hint.grid.copy.1` | Zähle bei der Vorlage die Kästchen Reihe für Reihe. |
| `hint.grid.mirror.1` | Stell dir vor, du klappst das Blatt an der roten Linie zusammen. |
| `hint.grid.rect.1` | Ein Rechteck hat 4 Ecken. Alle Reihen sind gleich lang. |
| `hint.grid.square.1` | Ein Quadrat hat gleich viele Reihen wie Kästchen in einer Reihe. |
| `hint.leftright.1` | Links ist die Seite, an der Daumen und Zeigefinger ein L bilden. Es gilt: von dir aus gesehen. |
| `hint.length_convert.1` | Denk daran: 1 m = 100 cm. |
| `hint.line.read.1` | Suche die Zahl links vom Pfeil. Zähle dann die Striche bis zum Pfeil. |
| `hint.match.tenframe.1` | Ein volles Zehnerfeld sind 10. Zähle die übrigen Plättchen dazu. |
| `hint.match.tensones.1` | Zähle zuerst die Zehnerstangen, dann die Einerwürfel. |
| `hint.match.word.1` | Im Zahlwort hörst du zuerst die Einer, dann die Zehner. |
| `hint.measure.difference.1` | Miss zuerst beide: den Stift und den Wurm. |
| `hint.measure.offset.1` | Achtung: Der Gegenstand beginnt nicht bei 0. |
| `hint.measure.zero.1` | Der Gegenstand beginnt bei 0. Lies am Ende ab. |
| `hint.money_convert.1` | Denk daran: 1 € = 100 ct. |
| `hint.money_lay.1` | Nimm zuerst große Scheine oder Münzen. Dann legst du den Rest mit kleinen dazu. |
| `hint.mult_1.1` | Mal 1: Die Zahl bleibt, wie sie ist. |
| `hint.odd.1` | Schau, wie sich die erste Zahl von Aufgabe zu Aufgabe ändert. Und die zweite? |
| `hint.package.1` | Vergleiche die Aufgaben untereinander: Wie ändern sich die Zahlen? Wie ändert sich das Ergebnis? |
| `hint.path.1` | Prüfe jeden Schritt einzeln. |
| `hint.pattern.1` | Sprich das Muster laut: Was kommt immer wieder? |
| `hint.place.1` | Eine Stange sind 10, ein Würfel ist 1. |
| `hint.place.bundle.1` | 10 Einer kannst du zu 1 Zehner bündeln. |
| `hint.position.1` | Schau genau: Ist der Schmetterling oben, unten, vorn, hinten oder an der Seite? |
| `hint.question_pick.1` | Lies die Situation noch einmal. Welche Zahlen stehen im Text? |
| `hint.quick.1.dots` | Schau auf die Reihen: Wie viele Punkte sind in einer Reihe? Wie viele Reihen sind es? |
| `hint.quick.1.five` | Schau auf die volle Reihe: Das sind 5. Ein volles Feld sind 10. |
| `hint.quick.1.ten` | Jede Stange sind 10. Zähle erst die Stangen, dann die Würfel. |
| `hint.readwrite.1` | Lies das Wort langsam, Silbe für Silbe. |
| `hint.readwrite.1.order` | Achtung: Im Zahlwort hörst du zuerst die Einer. Geschrieben stehen zuerst die Zehner. |
| `hint.route.1` | Fahre jeden Weg mit dem Finger ab, Pfeil für Pfeil. |
| `hint.route.lay.1` | Lege Pfeil für Pfeil. Der Pinguin läuft mit, so siehst du, wo er ist. |
| `hint.shape.corners.1` | Eine Ecke ist dort, wo zwei Seiten zusammenstoßen. |
| `hint.shape.name.1` | Zähle die Ecken. Schau, ob die Seiten gleich lang sind. |
| `hint.shape.riddle.1` | Lies das Rätsel langsam. Zähle die Ecken in Gedanken. |
| `hint.shape.sides.1` | Eine Seite ist eine gerade Linie von Ecke zu Ecke. |
| `hint.smart.swap.1` | Bei Plus darfst du die Zahlen tauschen. Fang mit der größeren Zahl an. |
| `hint.solid.count.corners.1` | Eine Ecke ist dort, wo Kanten zusammenstoßen. |
| `hint.solid.count.edges.1` | Eine Kante ist eine gerade Linie, an der zwei Flächen zusammenstoßen. |
| `hint.solid.count.faces.1` | Eine Fläche ist eine ebene Seite des Körpers. |
| `hint.solid.name.1` | Schau auf die Flächen: Sind sie eben oder rund? Gibt es eine Spitze? |
| `hint.solid.pick.1` | Prüfe jedes Ding einzeln. Gegenstände zählen auch: ein Ball ist eine Kugel. |
| `hint.solid.prop.curved.1` | Eine ebene Fläche ist ganz flach wie ein Tisch. |
| `hint.solid.prop.roll.1` | Rollen kann ein Körper, wenn er eine runde Seite hat. |
| `hint.solid.prop.squares.1` | Ein Quadrat hat 4 gleich lange Seiten. |
| `hint.solid.prop.stack.1` | Stapeln geht gut, wenn oben und unten eine ebene Fläche ist. |
| `hint.solid.prop.tip.1` | Eine Spitze ist ein Punkt ganz oben, wo alles zusammenläuft. |
| `hint.sort.duration.1` | Rechne alle Zeitspannen in Minuten um. Dann kannst du sie leicht ordnen. |
| `hint.sort.length.1` | Rechne alle Längen in Zentimeter um. Dann kannst du sie leicht ordnen. |
| `hint.story_add.1` | Lies genau: Was weißt du? Was ist gesucht? Hier kommt etwas dazu. |
| `hint.story_measure.1` | Lies genau: Es werden immer gleich viele zusammengepackt. Wie oft geht das? |
| `hint.story_mult.1` | Lies genau: Es sind gleich große Gruppen. Wie viele Gruppen, wie viele in jeder Gruppe? |
| `hint.story_share.1` | Lies genau: Hier wird gerecht verteilt. Jeder bekommt gleich viel. |
| `hint.story_sub.1` | Lies genau: Was weißt du? Was ist gesucht? Hier geht etwas weg. |
| `hint.sub_stepwise.1` | Ziehe erst die Zehner ab, dann die Einer. |
| `hint.symmetry.1` | Stell dir vor, du klappst die Figur an der Linie zusammen. |
| `hint.table.1` | Suche zuerst die richtige Zeile (das Tier) und dann die richtige Spalte (den Tag). |
| `hint.table.sumCol.1` | Zähle alle Zahlen in der Spalte zusammen. |
| `hint.table.sumRow.1` | Zähle alle Zahlen in der Zeile zusammen. |
| `hint.tally.bundle.1` | Ein Bündel mit Querstrich sind 5 Striche. Zähle in Fünferschritten, dann die einzelnen Striche. |
| `hint.tally.compare.1` | Lies zuerst jede Zeile ab: Zähle die Fünferbündel und die einzelnen Striche. |
| `hint.tens.1` | Rechne mit Zehnern wie mit Einern: 4 + 3 = 7, also 40 + 30 = 70. |
| `hint.time_units.calendar.1` | Ein Tag hat 24 Stunden, eine Woche 7 Tage, ein Jahr 12 Monate. |
| `hint.time_units.hour.1` | Eine Stunde hat 60 Minuten: 1 h = 60 min. |
| `hint.time_units.span.1` | Zähle erst bis zur vollen Stunde, dann weiter. |
| `hint.time_units.span.1.same` | Die Stunde bleibt gleich. Schau nur auf die Minuten. |
| `hint.zoo.walk.1` | Der Eimer zeigt, wo du stehst. Gehe mit dem Finger Gehege für Gehege. |

## Priorität 2

| Schlüssel | Text |
| --- | --- |
| `package.down1` | Das Ergebnis wird immer um 1 kleiner. |
| `package.same` | Das Ergebnis bleibt immer gleich. |
| `package.up1` | Das Ergebnis wird immer um 1 größer. |
| `package.up10` | Das Ergebnis wird immer um 10 größer. |
| `package.up2` | Das Ergebnis wird immer um 2 größer. |
| `task.money.plate` | Tippe Münzen und Scheine an. Tippe auf dem Teller, um etwas zurückzulegen. |
| `task.prompt.anchor.longer` | Was ist länger als 1 m? |
| `task.prompt.area.compare` | Welche Fläche ist größer? |
| `task.prompt.area.count` | Wie viele Kästchen groß ist die grüne Fläche? |
| `task.prompt.area.perimeter` | Wie lang ist der Rand? Zähle die Kästchenseiten. |
| `task.prompt.chart.least` | Von welchem Tier gibt es die wenigsten? |
| `task.prompt.chart.most` | Von welchem Tier gibt es die meisten? |
| `task.prompt.clockDigital` | Es ist Vormittag. Wie zeigt eine Digitaluhr diese Uhrzeit? |
| `task.prompt.clockDigital.afternoon` | Es ist Nachmittag. Wie zeigt eine Digitaluhr diese Uhrzeit? |
| `task.prompt.clockDigital.evening` | Es ist Abend. Wie zeigt eine Digitaluhr diese Uhrzeit? |
| `task.prompt.clockEarlier.15` | Wie spät war es vor einer Viertelstunde? |
| `task.prompt.clockEarlier.30` | Wie spät war es vor einer halben Stunde? |
| `task.prompt.clockEarlier.60` | Wie spät war es vor einer Stunde? |
| `task.prompt.clockLater.15` | Wie spät ist es in einer Viertelstunde? |
| `task.prompt.clockLater.30` | Wie spät ist es in einer halben Stunde? |
| `task.prompt.clockLater.60` | Wie spät ist es in einer Stunde? |
| `task.prompt.clockRead` | Wie spät ist es? |
| `task.prompt.compareSymbol` | Welches Zeichen passt: <, > oder =? |
| `task.prompt.compose.count.rect` | Aus wie vielen Rechtecken besteht die Figur? |
| `task.prompt.compose.count.semi` | Aus wie vielen Halbkreisen besteht die Figur? |
| `task.prompt.compose.count.square` | Aus wie vielen Quadraten besteht die Figur? |
| `task.prompt.compose.count.tri` | Aus wie vielen Dreiecken besteht die Figur? |
| `task.prompt.compose.missing` | Welches Teil fehlt? |
| `task.prompt.cubes.build` | Baue nach dem Bauplan. Tippe ein Feld an: ein Würfel mehr. |
| `task.prompt.cubes.count` | Wie viele Würfel hat das Gebäude? |
| `task.prompt.cubes.view.front` | So sieht das Gebäude von vorn aus. Welches Bild passt? |
| `task.prompt.cubes.view.side` | So sieht das Gebäude von rechts aus. Welches Bild passt? |
| `task.prompt.cubes.whichPlan` | Welcher Bauplan passt zum Gebäude? |
| `task.prompt.cubes.write` | Schreibe den Bauplan: Tippe ein Feld so oft an, wie Würfel darauf stehen. |
| `task.prompt.divideRest` | Teile. Wie viel ist es und wie viel bleibt übrig? |
| `task.prompt.double` | Verdopple die Zahl. |
| `task.prompt.duration.longer` | Was dauert länger? |
| `task.prompt.duration.longest` | Was dauert am längsten? |
| `task.prompt.duration.shortest` | Was dauert am kürzesten? |
| `task.prompt.estimate` | Ungefähr wie viel ist das? |
| `task.prompt.exactOrEstimate` | Muss man hier genau rechnen, oder reicht ungefähr? |
| `task.prompt.grid.copy` | Male die Figur rechts nach. |
| `task.prompt.grid.mirror.h` | Male das Spiegelbild unter der roten Linie. |
| `task.prompt.grid.mirror.v` | Male das Spiegelbild auf der anderen Seite der roten Linie. |
| `task.prompt.half` | Halbiere die Zahl. |
| `task.prompt.howMany` | Wie viele sind es? |
| `task.prompt.ice.missing.pairs` | Eine Kugel in der Waffel oder im Becher: Welches Eis fehlt noch? |
| `task.prompt.ice.missing.stack` | Die Kugeln liegen in verschiedener Reihenfolge übereinander. Welches Eis fehlt noch? |
| `task.prompt.ice.stack.2` | Zwei verschiedene Kugeln übereinander, aus diesen 3 Sorten. Wie viele Möglichkeiten gibt es? |
| `task.prompt.ice.stack.3` | Erdmännchen Emil will alle 3 Sorten als Kugeln übereinander. Wie viele Reihenfolgen gibt es? |
| `task.prompt.length.longer` | Was ist länger? |
| `task.prompt.length.longest` | Was ist am längsten? |
| `task.prompt.length.shortest` | Was ist am kürzesten? |
| `task.prompt.lineRead` | Welche Zahl zeigt der Pfeil? |
| `task.prompt.match` | Was gehört zusammen? Tippe oben eine Karte an, dann die passende unten. |
| `task.prompt.measure.difference` | Wie viele Zentimeter ist der Stift länger als der Wurm? |
| `task.prompt.measure.feather` | Wie lang ist das Blatt? |
| `task.prompt.measure.pencil` | Wie lang ist der Stift? |
| `task.prompt.measure.worm` | Wie lang ist der Wurm? |
| `task.prompt.moreMoney` | Was ist mehr Geld? |
| `task.prompt.mostMoney` | Was ist am meisten Geld? |
| `task.prompt.neighborTens` | Welcher Nachbarzehner fehlt? |
| `task.prompt.neighbors` | Welche Zahl fehlt in der Reihe? |
| `task.prompt.oddOneOut` | Diese Aufgaben sind ein Päckchen. Welche Aufgabe passt nicht dazu? |
| `task.prompt.orderDown` | Ordne die Zahlen: Beginne links mit der größten. Ziehe die Karten oder tippe zwei zum Tauschen an. |
| `task.prompt.orderUp` | Ordne die Zahlen: Beginne links mit der kleinsten. Ziehe die Karten oder tippe zwei zum Tauschen an. |
| `task.prompt.pattern.gap` | Was fehlt im Muster? |
| `task.prompt.pattern.next` | Wie geht das Muster weiter? |
| `task.prompt.pickQuestion` | Welche Frage kannst du mit den Angaben ausrechnen? |
| `task.prompt.pickWord` | Welches Wort passt zur Zahl? |
| `task.prompt.position.where` | Wo ist der Schmetterling? |
| `task.prompt.quickCount` | Schau genau hin! Wie viele sind es? |
| `task.prompt.route.lay` | Lege mit den Pfeilen einen Weg zum Futter. Steine kann der Pinguin nicht betreten. |
| `task.prompt.route.which` | Welcher Weg führt den Pinguin zum Futter? |
| `task.prompt.sequenceGap` | Welche Zahl fehlt in der Zahlenfolge? |
| `task.prompt.sequenceNext` | Wie geht die Zahlenfolge weiter? |
| `task.prompt.shape.corners` | Wie viele Ecken hat die Form? |
| `task.prompt.shape.count.circle` | Wie viele Kreise siehst du? |
| `task.prompt.shape.count.rect` | Wie viele Rechtecke siehst du, die keine Quadrate sind? |
| `task.prompt.shape.count.square` | Wie viele Quadrate siehst du? |
| `task.prompt.shape.count.triangle` | Wie viele Dreiecke siehst du? |
| `task.prompt.shape.name` | Wie heißt diese Form? |
| `task.prompt.shape.riddle.circle` | Ich bin rund und habe keine Ecken. Wer bin ich? |
| `task.prompt.shape.riddle.rect` | Ich habe 4 Ecken. Zwei Seiten sind lang, zwei Seiten sind kurz. Wer bin ich? |
| `task.prompt.shape.riddle.square` | Ich habe 4 Ecken und alle meine Seiten sind gleich lang. Wer bin ich? |
| `task.prompt.shape.riddle.triangle` | Ich habe 3 Ecken und 3 Seiten. Wer bin ich? |
| `task.prompt.shape.sides` | Wie viele Seiten hat die Form? |
| `task.prompt.share` | Verteile gerecht. Wie viele bekommt jede Gruppe? |
| `task.prompt.smart.allowed` | Bei welcher Aufgabe darfst du tauschen? |
| `task.prompt.solid.name.object` | Welche Form hat dieser Gegenstand? |
| `task.prompt.solid.name.plain` | Welcher Körper ist das? |
| `task.prompt.solid.pick.cone` | Tippe alle Kegel an. Dann tippe auf OK. |
| `task.prompt.solid.pick.cube` | Tippe alle Würfel an. Dann tippe auf OK. |
| `task.prompt.solid.pick.cuboid` | Tippe alle Quader an. Dann tippe auf OK. |
| `task.prompt.solid.pick.cylinder` | Tippe alle Zylinder an. Dann tippe auf OK. |
| `task.prompt.solid.pick.pyramid` | Tippe alle Pyramiden an. Dann tippe auf OK. |
| `task.prompt.solid.pick.sphere` | Tippe alle Kugeln an. Dann tippe auf OK. |
| `task.prompt.solid.prop.curved` | Welcher Körper hat gar keine ebene Fläche? |
| `task.prompt.solid.prop.roll` | Welcher Körper kann rollen? |
| `task.prompt.solid.prop.squares` | Welcher Körper hat nur Quadrate als Flächen? |
| `task.prompt.solid.prop.stack` | Welchen Körper kann man gut stapeln? |
| `task.prompt.solid.prop.tip` | Welcher Körper hat eine Spitze? |
| `task.prompt.sort.duration` | Ordne die Zeitspannen: Beginne links mit der kürzesten. Ziehe die Karten oder tippe zwei zum Tauschen an. |
| `task.prompt.sort.length` | Ordne die Längen: Beginne links mit der kürzesten. Ziehe die Karten oder tippe zwei zum Tauschen an. |
| `task.prompt.symmetry.axis` | Wo hat die Figur eine Spiegelachse? |
| `task.prompt.symmetry.yesno` | Ist die Figur symmetrisch zur roten Linie? |
| `task.prompt.tally.most` | Welches Tier wurde am häufigsten gezählt? |
| `task.prompt.tally.total` | Wie viele Tiere wurden zusammen gezählt? |
| `task.prompt.trueFalse` | Stimmt die Rechnung? |
| `task.prompt.units.dayHours.one` | Wie viele Stunden hat ein Tag? |
| `task.prompt.units.weekDays.one` | Wie viele Tage hat eine Woche? |
| `task.prompt.units.yearMonths.one` | Wie viele Monate hat ein Jahr? |

## Priorität 3

| Schlüssel | Text |
| --- | --- |
| `hint.anchor.2.cm` | Das Ding ist kleiner als ein Meter. Dann passt Zentimeter. |
| `hint.anchor.2.m` | Das Ding ist größer als ein Meter. Dann passt Meter. |
| `hint.anchor.longer.2` | Welches Ding ist größer als du? |
| `hint.area.count.2` | Zähle Reihe für Reihe. |
| `hint.calendar.count.2` | Zähle jede Zahl in dieser Spalte genau einmal. |
| `hint.calendar.days.2` | Die Tage gehen von 1 bis zum letzten Tag des Monats. |
| `hint.chart.least.2` | Vergleiche die Höhe der Säulen. |
| `hint.chart.most.2` | Vergleiche die Höhe der Säulen. |
| `hint.clock.digital.2.full` | Volle Stunde: Hinter dem Doppelpunkt steht 00. |
| `hint.compare.2.mixed` | Rechne erst aus, welche Zahl auf jeder Seite steht. |
| `hint.compare_duration.2.same` | Beide Zeitspannen haben dieselbe Einheit. Die größere Zahl dauert länger. |
| `hint.compare_length.2.same` | Beide Längen sind in cm. Die größere Zahl ist länger. |
| `hint.compose.count.2` | Zähle langsam, ein Teil nach dem anderen. |
| `hint.compose.count.2.tri` | Achtung: Zwei Dreiecke zusammen sehen manchmal aus wie ein Quadrat. Zähle beide. |
| `hint.compose.lay.2` | Fang mit einem großen Teil an. Dann passen die kleinen in die Lücken. |
| `hint.compose.missing.2.rect` | Die Lücke hat 4 Ecken und ist lang und schmal. |
| `hint.compose.missing.2.semi` | Die Lücke hat eine runde Seite. |
| `hint.compose.missing.2.square` | Die Lücke hat 4 Ecken und 4 gleich lange Seiten. |
| `hint.compose.missing.2.tri` | Die Lücke hat 3 Ecken. |
| `hint.compose.rotate.2` | Vergleiche die schräge oder runde Seite des Teils mit dem Umriss. |
| `hint.count.2` | Springe auf dem Rechenstrich von Zahl zu Zahl. |
| `hint.cubes.hidden.2` | Unter jedem Würfel oben steht noch einer, sonst würde er herunterfallen. |
| `hint.cubes.plan.2` | Vergleiche Feld für Feld. Achte auch darauf, ob links und rechts vertauscht sind. |
| `hint.cubes.view.2` | Von jeder Reihe siehst du nur den höchsten Turm. Die anderen stehen dahinter. |
| `hint.data.count.2` | Schreibe dir die Zahlen auf und vergleiche sie. |
| `hint.dots_minus.2` | Schau auf das Punktefeld: Rechne alle 10 Reihen und nimm die Reihe mit den Ringen weg. |
| `hint.dots_split.2` | Schau auf das Punktefeld: Die orangen Reihen kennst du schon. Die Ringe kommen dazu. |
| `hint.exact_or_estimate.2.estimate` | Hier willst du nur wissen, ob es ungefähr passt. Die Zahlen liegen weit auseinander. |
| `hint.exact_or_estimate.2.exact` | Hier geht es um einen genauen Betrag, zum Beispiel beim Bezahlen, Teilen oder Aufschreiben. |
| `hint.grid.between.2` | Zwischen heißt: in der Mitte. Auf beiden Seiten ist eins der Bilder. |
| `hint.grid.left.2` | Links neben heißt: direkt daneben, auf der Seite deiner L-Hand. |
| `hint.grid.mirror.2` | Ein Kästchen direkt an der Linie hat sein Spiegelbild direkt auf der anderen Seite. |
| `hint.grid.over.2` | Über heißt: direkt ein Feld weiter oben. |
| `hint.grid.right.2` | Rechts neben heißt: direkt daneben, auf der anderen Seite als deine L-Hand. |
| `hint.grid.under.2` | Unter heißt: direkt ein Feld weiter unten. |
| `hint.hundred.2` | Schau auf die Hundertertafel. Die bekannten Zahlen sind markiert. |
| `hint.ice.order.pairs` | Geh ordentlich vor: Nimm die erste Sorte und lege sie in die Waffel und in den Becher. Dann die nächste Sorte. |
| `hint.ice.order.stack` | Geh ordentlich vor: Lege zuerst eine Sorte nach unten und probiere alle Möglichkeiten darüber. Dann die nächste Sorte unten. |
| `hint.ice.pairs.2` | So sind alle Möglichkeiten geordnet: Jede Sorte gibt es in der Waffel und im Becher. |
| `hint.ice.stack.2.2` | So sind alle geordnet: Für jede Sorte unten gibt es 2 Sorten oben. |
| `hint.ice.stack.2.3` | 3 Sorten unten, je 2 Sorten oben: 3 · 2 = 6. |
| `hint.ice.stack.3.2` | So sind alle geordnet: Für jede Sorte unten gibt es 2 Reihenfolgen darüber. |
| `hint.jumps.2` | Schau auf den Rechenstrich. Mach die Sprünge mit. |
| `hint.length_convert.whole.2.toCm` | Jeder Meter sind 100 cm. Zähle in Hunderterschritten. |
| `hint.length_convert.whole.2.toM` | Je 100 cm sind 1 m. Wie oft passt 100 hinein? |
| `hint.measure.zero.2` | Wo ist das Ende? Schau auf die Zahl darunter. |
| `hint.money_convert.toCentFull.2` | Jeder Euro sind 100 ct. Zähle in Hunderterschritten: 100, 200, 300 … |
| `hint.package.rule.both_up` | Beide Zahlen werden immer um 1 größer. Also wird das Ergebnis um 2 größer. |
| `hint.package.rule.first_up` | Die erste Zahl wird immer um 1 größer, die zweite bleibt. Also wird das Ergebnis um 1 größer. |
| `hint.package.rule.minus_first_up` | Die erste Zahl wird immer um 1 größer, abgezogen wird immer gleich viel. Also wird das Ergebnis um 1 größer. |
| `hint.package.rule.minus_same` | Beide Zahlen werden um 1 größer. Der Unterschied bleibt gleich. |
| `hint.package.rule.same` | Die erste Zahl wird um 1 größer, die zweite um 1 kleiner. Das Ergebnis bleibt gleich. |
| `hint.package.rule.tens_up` | Die erste Zahl wird immer um 10 größer, die zweite bleibt. Also wird das Ergebnis um 10 größer. |
| `hint.position.2.behind` | Der Tisch verdeckt den Schmetterling ein bisschen. Er ist weiter weg von dir. |
| `hint.position.2.front` | Der Schmetterling verdeckt den Tisch. Er ist näher bei dir. |
| `hint.position.2.next` | Der Schmetterling ist an der Seite vom Tisch. |
| `hint.position.2.over` | Der Schmetterling ist höher als der Tisch. |
| `hint.position.2.under` | Der Schmetterling ist unten zwischen den Tischbeinen. |
| `hint.question_pick.2` | Die passende Frage kannst du mit den Zahlen aus dem Text ausrechnen. Was schon im Text steht oder gar nicht vorkommt, passt nicht. |
| `hint.quick.2` | Hier ist das Bild noch einmal. |
| `hint.route.2` | Achte auf die Steine: Dort kann der Pinguin nicht hin. |
| `hint.shape.corners.2.circle` | Ein Kreis ist rund. Er hat keine Ecken. |
| `hint.shape.corners.2.rect` | Fahre mit dem Finger um die Form und zähle die Ecken. |
| `hint.shape.corners.2.square` | Fahre mit dem Finger um die Form und zähle die Ecken. |
| `hint.shape.corners.2.triangle` | Fahre mit dem Finger um das Dreieck und zähle die Ecken. |
| `hint.shape.count.2` | Zeige auf jede passende Form und zähle mit. |
| `hint.shape.name.2.circle` | Diese Form ist rund und hat keine Ecken. |
| `hint.shape.name.2.rect` | Diese Form hat 4 Ecken. Zwei Seiten sind länger als die anderen zwei. |
| `hint.shape.name.2.square` | Diese Form hat 4 Ecken und 4 gleich lange Seiten. |
| `hint.shape.name.2.triangle` | Diese Form hat 3 Ecken. |
| `hint.shape.sides.2.circle` | Ein Kreis hat keine geraden Seiten. |
| `hint.shape.sides.2.rect` | Zähle die geraden Linien. |
| `hint.shape.sides.2.square` | Zähle die geraden Linien. |
| `hint.shape.sides.2.triangle` | Zähle die geraden Linien. |
| `hint.solid.cone` | Ein Kegel hat unten einen Kreis und oben eine Spitze. |
| `hint.solid.count.2` | Denk auch an die Seiten, die du nicht siehst: hinten und unten. |
| `hint.solid.count.cube.corners` | Oben 4 Ecken, unten 4 Ecken: zusammen 8. |
| `hint.solid.count.cube.edges` | Oben 4 Kanten, unten 4 Kanten, dazwischen 4: zusammen 12. |
| `hint.solid.count.cube.faces` | Vorn, hinten, links, rechts, oben, unten: 6 Flächen. |
| `hint.solid.count.cuboid.corners` | Oben 4 Ecken, unten 4 Ecken: zusammen 8. |
| `hint.solid.count.cuboid.edges` | Oben 4 Kanten, unten 4 Kanten, dazwischen 4: zusammen 12. |
| `hint.solid.count.cuboid.faces` | Vorn, hinten, links, rechts, oben, unten: 6 Flächen. |
| `hint.solid.count.pyramid.corners` | Unten 4 Ecken, oben die Spitze: zusammen 5. |
| `hint.solid.count.pyramid.edges` | Unten 4 Kanten und 4 Kanten zur Spitze: zusammen 8. |
| `hint.solid.count.pyramid.faces` | Unten ein Viereck und 4 Dreiecke: 5 Flächen. |
| `hint.solid.cube` | Ein Würfel hat 6 gleich große Quadrate als Flächen. |
| `hint.solid.cuboid` | Ein Quader hat 6 Rechtecke als Flächen. Er ist länger als hoch oder breit. |
| `hint.solid.cylinder` | Ein Zylinder hat oben und unten einen Kreis und ist dazwischen rund. |
| `hint.solid.prop.curved.2` | Welcher Körper ist überall rund? |
| `hint.solid.prop.roll.2` | Ecken und gerade Flächen bremsen. Welcher Körper ist rund? |
| `hint.solid.prop.squares.2` | Beim Quader sind manche Flächen länger als breit. |
| `hint.solid.prop.stack.2` | Was rund ist oder eine Spitze hat, rutscht herunter. |
| `hint.solid.prop.tip.2` | Schau, welcher Körper oben spitz zuläuft. |
| `hint.solid.pyramid` | Eine Pyramide hat unten ein Viereck und Dreiecke, die sich oben in einer Spitze treffen. |
| `hint.solid.sphere` | Eine Kugel ist überall rund und hat keine Ecken. |
| `hint.symmetry.2` | Vergleiche Kästchen für Kästchen: Liegt auf der anderen Seite der Linie genau gegenüber auch ein grünes Kästchen? |
| `hint.symmetry.axis.2` | Probiere beide Linien aus: senkrecht durch die Mitte und waagerecht durch die Mitte. |
| `hint.time_units.calendar.2.day` | Ein Tag hat 24 Stunden, Tag und Nacht zusammen. |
| `hint.time_units.calendar.2.week` | Eine Woche hat 7 Tage, von Montag bis Sonntag. |
| `hint.time_units.calendar.2.year` | Ein Jahr hat 12 Monate, von Januar bis Dezember. |
| `hint.time_units.hToMin.2` | Zähle in 60er-Schritten: 60, 120, 180, 240. |

## Priorität 4

| Schlüssel | Text |
| --- | --- |
| `hint.area.compare.3.same` | Beide haben gleich viele Kästchen. Sie sind gleich groß. |
| `hint.cubes.build.3` | Vergleiche Feld für Feld: die Zahl im Plan und deine Zahl. |
| `hint.cubes.plan.3` | Suche den höchsten Turm und schau, wo er im Bauplan steht. |
| `hint.cubes.write.3` | Achte auf die Seiten: Der Turm ganz vorn steht im Plan in der unteren Reihe. |
| `hint.ice.missing.3` | Das gesuchte Eis ist noch nicht dabei. Die anderen Karten gibt es schon. |
| `hint.ice.stack.3.3` | 3 Sorten unten, je 2 Reihenfolgen darüber: 3 · 2 = 6. |
| `hint.match.3` | So gehören die Karten zusammen. |
| `hint.pattern.3` | So geht das Muster richtig. |
| `hint.symmetry.3.no` | Mindestens ein Kästchen hat kein Gegenstück. Die Figur ist nicht symmetrisch. |
| `hint.symmetry.3.yes` | Beide Hälften passen genau aufeinander. Die Figur ist symmetrisch. |
