import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import {
  areaCount,
  patternContinue,
  shapesBasic,
  symmetryCheck,
} from '../src/logic/generators/geometry';
import {
  anchorSizes,
  compareLength,
  lengthConvert,
  measureLength,
} from '../src/logic/generators/lengths';
import { shapesCompose } from '../src/logic/generators/compose';
import { gridDraw, spaceOrientation } from '../src/logic/generators/space';
import {
  combinatorics,
  readCalendar,
  readChart,
  readTable,
  tallyChart,
} from '../src/logic/generators/data';
import { cubeBuildings, solidsBasic } from '../src/logic/generators/solids';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Generator, Task, TaskLevel } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const SEEDS = 300;
const LEVELS = [1, 2, 3] as TaskLevel[];
const FAMILIES: Array<[string, Generator]> = [
  ['measure_length', measureLength],
  ['compare_length', compareLength],
  ['anchor_sizes', anchorSizes],
  ['length_convert', lengthConvert],
  ['shapes_basic', shapesBasic],
  ['pattern_continue', patternContinue],
  ['symmetry_check', symmetryCheck],
  ['area_count', areaCount],
  ['shapes_compose', shapesCompose],
  ['grid_draw', gridDraw],
  ['space_orientation', spaceOrientation],
  ['tally_chart', tallyChart],
  ['read_table', readTable],
  ['read_chart', readChart],
  ['read_calendar', readCalendar],
  ['combinatorics', combinatorics],
  ['solids_basic', solidsBasic],
  ['cube_buildings', cubeBuildings],
];

function tasks(family: string, gen: Generator, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) => gen(level, createRng(s), `t${s}`, P(level)));
}

describe.each(FAMILIES)('%s', (family, gen) => {
  it('Karten: genau eine richtig, keine doppelt, Fehler passen zur Karte', () => {
    for (const level of LEVELS) {
      for (const t of tasks(family, gen, level)) {
        expect(t.hints).toHaveLength(3);
        if (!t.options) {
          expect(check(t, String(t.answer)).correct).toBe(true);
          continue;
        }
        const right = t.options.filter((o) => check(t, o.value).correct);
        expect(right).toHaveLength(1);
        expect(new Set(t.options.map((o) => o.value)).size).toBe(t.options.length);
        for (const o of t.options) {
          if (o !== right[0] && o.errorTag) expect(check(t, o.value).errorTag).toBe(o.errorTag);
        }
      }
    }
  });

  it('Runden lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen', () => {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 30; seed++) {
        const { round, factory } = composeRound({
          family,
          generator: gen,
          params: paramsOf(family),
          rules: RULES,
          level,
          rng: createRng(seed),
        });
        const keys = round.tasks.map((t) => t.dedupeKey);
        expect(new Set(keys).size).toBe(keys.length);
        for (let r = 0; r < RULES.maxRepeats; r++) factory.next(level);
      }
    }
  });
});

describe('Messen', () => {
  it('die Länge passt zum Lineal', () => {
    for (const level of LEVELS) {
      for (const t of tasks('measure_length', measureLength, level)) {
        const v = t.display!.visual;
        expect(v.type).toBe('ruler');
        if (v.type !== 'ruler') continue;
        const len = v.items.map((i) => i.to - i.from);
        const expected = v.items.length === 2 ? Math.abs(len[0]! - len[1]!) : len[0]!;
        expect(t.answer).toBe(expected);
        for (const i of v.items) expect(i.to).toBeLessThanOrEqual(v.max);
        if (level === 1) expect(v.items[0]!.from).toBe(0);
      }
    }
  });
});

describe('Umwandeln', () => {
  it('erkennt 1 m = 10 cm und vergessene Null', () => {
    const t = tasks('length_convert', lengthConvert, 2).find(
      (u) => u.prompt.terms.length === 7 && u.prompt.terms[6] === 'cm' && u.prompt.terms[5] === '?',
    );
    if (!t) return;
    const [m, , c] = t.prompt.terms as number[];
    expect(t.answer).toBe(m! * 100 + c!);
  });
});

describe('Flächen und Umfang', () => {
  it('Fläche zählt die Kästchen', () => {
    for (const t of tasks('area_count', areaCount, 1)) {
      const v = t.display!.visual;
      if (v.type !== 'cells' || t.options) continue;
      expect(t.answer).toBe(v.figures[0]!.cells.length);
    }
  });
});
