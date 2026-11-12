import { describe, expect, it } from 'vitest';
import layout from '../src/data/map-layout.json';
import strings from '../src/data/strings.de.json';
import { CONTENT } from './helpers/content';

/**
 * Alle Dekorationen der Zoo-Karte bleiben sichtbar: Sie werden vor Gehegen und Bedienelementen
 * gezeichnet, also darf nichts davon über ihnen liegen. Der Test liest dieselben Daten wie
 * MapScene (map-layout.json, decor.json) und schlägt fehl, sobald ein Knopf, ein Schild oder
 * eine neue Dekoration eine Dekoration verdeckt.
 */
type Box = { name: string; left: number; top: number; right: number; bottom: number };

const WIDTH = 1024;
const HEIGHT = 768;
/** Kern einer Dekoration: die Mitte ihres Bildes (Ränder sind meist durchsichtig). */
const CORE = 0.7;
const T = strings as Record<string, string>;

const box = (name: string, x: number, y: number, w: number, h: number): Box => ({
  name,
  left: x - w / 2,
  top: y - h / 2,
  right: x + w / 2,
  bottom: y + h / 2,
});
const overlaps = (a: Box, b: Box) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

/** Bedienelemente der Karte (Knöpfe, Titel, Sterne, Hinweis). */
const ui: Box[] = Object.entries(layout.ui).map(([name, u]) => box(name, u.x, u.y, u.w, u.h));

/**
 * Gehege-Marker wie in AreaMarker: Tierbild 128 px (Mitte 18 px über dem Punkt) und
 * Namensschild 40 px hoch, 66 px unter dem Punkt; Breite aus der Namenslänge (22 px Schrift,
 * großzügig 12 px je Zeichen) plus Rand und Sterne.
 */
const markers: Box[] = Object.entries(layout.areas).flatMap(([id, p]) => {
  const name = T[`area.${id}`] ?? id;
  const plateW = name.length * 12 + 28 + 58;
  return [
    box(`${id} (Bild)`, p.x, p.y - 18, 128, 128),
    box(`${id} (Schild)`, p.x, p.y + 66, plateW, 40),
  ];
});

const decor = CONTENT.decor.map((d) => ({
  d,
  full: box(d.id, d.x, d.y, d.size, d.size),
  core: box(d.id, d.x, d.y, d.size * CORE, d.size * CORE),
}));

describe('Dekorationen auf der Zoo-Karte', () => {
  it('liegen ganz auf dem Bildschirm', () => {
    for (const { full } of decor) {
      expect(full.left, full.name).toBeGreaterThanOrEqual(0);
      expect(full.top, full.name).toBeGreaterThanOrEqual(0);
      expect(full.right, full.name).toBeLessThanOrEqual(WIDTH);
      expect(full.bottom, full.name).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it('werden von keinem Knopf, Titel, Hinweis oder Sternschild verdeckt', () => {
    const hits = decor.flatMap(({ core }) =>
      ui.filter((u) => overlaps(core, u)).map((u) => `${core.name} unter ${u.name}`),
    );
    expect(hits).toEqual([]);
  });

  it('werden von keinem Gehege-Bild oder Namensschild verdeckt', () => {
    const hits = decor.flatMap(({ core }) =>
      markers.filter((m) => overlaps(core, m)).map((m) => `${core.name} unter ${m.name}`),
    );
    expect(hits).toEqual([]);
  });

  it('überdecken sich nicht gegenseitig', () => {
    const hits: string[] = [];
    decor.forEach((a, i) =>
      decor.slice(i + 1).forEach((b) => {
        if (overlaps(a.core, b.core)) hits.push(`${a.core.name} und ${b.core.name}`);
      }),
    );
    expect(hits).toEqual([]);
  });

  it('die Bedienelemente selbst überlappen weder einander noch die Gehege', () => {
    const hits: string[] = [];
    ui.forEach((a, i) => {
      ui.slice(i + 1).forEach((b) => overlaps(a, b) && hits.push(`${a.name} und ${b.name}`));
      markers.forEach((m) => overlaps(a, m) && hits.push(`${a.name} auf ${m.name}`));
    });
    expect(hits).toEqual([]);
  });
});
