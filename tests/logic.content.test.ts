/* eslint-disable @typescript-eslint/no-explicit-any -- Testdaten werden gezielt verändert */
import { describe, expect, it } from 'vitest';
import hints from '../src/data/hints.de.json';
import strings from '../src/data/strings.de.json';
import { ContentError, familyParams, parseContent, type RawContent } from '../src/logic/content';
import { GENERATOR_IDS, GENERATORS } from '../src/logic/generators';
import { createRng } from '../src/logic/rng';
import type { TaskLevel } from '../src/types/task';
import { CONTENT, RAW } from './helpers/content';

/** Kopie der Rohdaten mit einer Änderung, um Fehlermeldungen zu prüfen. */
function changed(edit: (raw: Record<string, any>) => void): RawContent {
  const copy = JSON.parse(JSON.stringify(RAW)) as Record<string, any>;
  edit(copy);
  return copy as RawContent;
}

const parse = (raw: RawContent) => parseContent(raw, GENERATOR_IDS);

describe('Inhaltsdateien', () => {
  it('lassen sich lesen und verweisen nur auf Vorhandenes', () => {
    expect(CONTENT.areas.length).toBeGreaterThan(0);
    for (const area of CONTENT.areas) {
      expect(CONTENT.animals[area.animal], area.id).toBeDefined();
      for (const f of area.families) expect(CONTENT.families[f], area.id).toBeDefined();
    }
    expect(CONTENT.praise.firstTry.length).toBeGreaterThan(1);
    expect(CONTENT.legal.privacy.length).toBeGreaterThan(0);
  });

  it('liefern für jede Familie in allen Stufen gültige Aufgaben', () => {
    for (const [id, family] of Object.entries(CONTENT.families)) {
      const generator = GENERATORS[id];
      expect(generator, id).toBeDefined();
      for (let level = 1; level <= CONTENT.rules.maxLevel; level++) {
        expect(family.levels[String(level)], `${id} Stufe ${level}`).toBeDefined();
        const params = familyParams(CONTENT, id, level);
        for (let seed = 0; seed < 300; seed++) {
          const task = generator!(level as TaskLevel, createRng(seed), 't', params);
          expect(task.family).toBe(id);
        }
      }
    }
  });

  it('hat für jedes Tier ein Kartensymbol und Grafiken', () => {
    const images = Object.keys(import.meta.glob('../public/assets/img/**/*.png'));
    const has = (path: string) => images.includes(`../public/assets/img/${path}`);
    for (const animal of Object.values(CONTENT.animals)) {
      expect(has(`map/${animal.icon}_128.png`), animal.icon).toBe(true);
      expect(has(`animals/${animal.prefix}_idle_sheet.png`), animal.prefix).toBe(true);
    }
  });
});

describe('Prüfung beim Laden', () => {
  it.each([
    ['Mischung ergibt nicht 1', (r: any) => (r.rules.round.mix.next = 0.5), /mix/],
    ['Rundengröße außerhalb', (r: any) => (r.rules.round.size = 20), /round.size/],
    ['unbekannte Familie', (r: any) => (r.areas.areas[0].families = ['gibt_es_nicht']), /Familie/],
    [
      'unbekannter Vorgänger',
      (r: any) => (r.areas.areas[2].requires = 'mond'),
      /unbekannten Bereich/,
    ],
    ['unbekanntes Tier', (r: any) => (r.areas.areas[0].animal = 'drache'), /Tier/],
    ['fehlende Stufe', (r: any) => delete r.families.families.add_100.levels['3'], /Stufe 3/],
    ['Anteil über 1', (r: any) => (r.families.families.add_100.kinds.choice = 2), /Anteil/],
    [
      'Platz außerhalb des Bildes',
      (r: any) => (r.animals.animals.penguin.taskSpot.x = 2000),
      /taskSpot/,
    ],
    ['leeres Lob', (r: any) => (r.praise.firstTry = []), /praise/],
  ])('weist ab: %s', (_name, edit, message) => {
    expect(() => parse(changed(edit))).toThrow(ContentError);
    expect(() => parse(changed(edit))).toThrow(message);
  });

  it('meldet fehlende oder unpassende Generator-Parameter', () => {
    const raw = changed((r) => (r.families.families.mult_table.levels['2'].rows = [5]));
    const content = parse(raw);
    const generator = GENERATORS.mult_table!;
    expect(() => generator(2, createRng(1), 't', familyParams(content, 'mult_table', 2))).toThrow(
      /Ableitung/,
    );
    const missing = parse(
      changed((r) => delete r.families.families.add_100.levels['1'].tensPlusTensShare),
    );
    expect(() =>
      GENERATORS.add_100!(1, createRng(1), 't', familyParams(missing, 'add_100', 1)),
    ).toThrow(/tensPlusTensShare/);
  });
});

describe('Texte', () => {
  const keys = new Set([...Object.keys(strings), ...Object.keys(hints)]);

  /** Quelltexte aller Dateien unter src (über Vite, ohne Node-APIs). */
  const sources = import.meta.glob('../src/**/*.ts', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;

  it('enthalten jeden festen Schlüssel, den der Code nutzt', () => {
    const missing: string[] = [];
    for (const [file, text] of Object.entries(sources)) {
      for (const m of text.matchAll(/\bt\(\s*'([\w.]+)'/g)) {
        if (!keys.has(m[1]!)) missing.push(`${m[1]} (${file})`);
      }
    }
    expect(Object.keys(sources).length).toBeGreaterThan(20);
    expect(missing).toEqual([]);
  });

  it('haben Namen für alle Bereiche, Tiere und Strategien', () => {
    for (const area of CONTENT.areas) expect(keys.has(`area.${area.id}`), area.id).toBe(true);
    for (const animal of Object.keys(CONTENT.animals)) {
      expect(keys.has(`avatar.${animal}`), animal).toBe(true);
    }
  });
});
