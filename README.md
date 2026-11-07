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
