# Zahlen-Zoo

Browser-Lernspiel für Kinder der 2. und 3. Klasse (Phaser, TypeScript, Vite).

## Dokumente

- [Spezifikation](docs/zahlen-zoo-spezifikation.md)
- [Kompetenzerwartungen Klasse 2 (NRW)](docs/kompetenzerwartungen-klasse-2.md)
- [Checkliste zur Umsetzung](docs/umsetzung-checkliste.md)

## Entwicklung

Voraussetzung: Node.js 22.13 oder neuer.

| Befehl            | Wirkung                                     |
| ----------------- | ------------------------------------------- |
| `npm install`     | Abhängigkeiten installieren                 |
| `npm run dev`     | Entwicklungsserver mit Hot Reload           |
| `npm run build`   | Typprüfung und Produktions-Build in `dist/` |
| `npm run preview` | Build lokal ansehen                         |
| `npm test`        | Vitest für die Spiellogik                   |
| `npm run lint`    | ESLint und Prettier-Prüfung                 |
| `npm run format`  | Code mit Prettier formatieren               |

Das Spiel wird über GitHub Pages unter <https://lane4swim.github.io/zahlenzoo/> ausgeliefert; `base` ist deshalb `/zahlenzoo/`. Für anderes Hosting: `BASE_PATH=/ npm run build`.

Jeder Push auf `main` baut das Spiel und veröffentlicht es (`.github/workflows/deploy.yml`). Voraussetzung: In den Einstellungen des Repositorys unter Pages ist als Quelle „GitHub Actions“ gewählt.

## Inhalte anpassen

Bereiche, Aufgaben und Startwerte stehen in `src/data/`. Sie werden mit dem Programm gebaut, damit Code und Daten nach einem Update immer zusammenpassen, und beim Start geprüft. Ein Fehler in einer Datei wird im Spiel mit Datei und Stelle angezeigt. Nach einer Änderung genügt ein Push auf `main`: Der Workflow baut und veröffentlicht neu.

| Datei                              | Inhalt                                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `rules.json`                       | Startwerte: Rundengröße, Mischung der Stufen, Versuche, Sternschwellen, Freischaltung                     |
| `areas.json`                       | Bereiche der Weltkarte, Tier, Aufgabenfamilie, Vorgängerbereich                                           |
| `families.json`                    | Aufgabenfamilien mit Parametern je Stufe (z. B. Kernreihen des Einmaleins) und Anteilen der Eingabeformen |
| `animals.json`                     | Tiergrafiken, Kartensymbol, Plätze in Gehege und Aufgabenansicht, Sternpreis der Babys                    |
| `strings.de.json`, `hints.de.json` | Oberflächentexte, Hinweise und Fehlerrückmeldungen                                                        |
| `praise.de.json`                   | Lob, abwechselnd verwendet                                                                                |
| `legal.json`                       | Impressum und Datenschutz (Angaben folgen vor der Veröffentlichung)                                       |

Neue Aufgabenfamilien brauchen zusätzlich einen Generator in `src/logic/generators/` (Eintrag in `index.ts`).
