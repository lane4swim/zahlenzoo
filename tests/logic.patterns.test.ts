import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { ZOO_PLAN, zooRoutes } from '../src/logic/generators/space';
import { parseCells, walk } from '../src/logic/grid';
import { exhibitPattern, MAX_PATTERNS, patternPeriod } from '../src/logic/patterns';
import { createRng } from '../src/logic/rng';
import { createProfile } from '../src/services/save';
import type { ShapeSpec, Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const A: ShapeSpec = { kind: 'circle', color: 'red' };
const B: ShapeSpec = { kind: 'square', color: 'blue' };
const C: ShapeSpec = { kind: 'triangle', color: 'yellow' };

describe('Muster erfinden', () => {
  it('erkennt, nach wie vielen Formen sich ein Muster wiederholt', () => {
    expect(patternPeriod([A, B, A, B, null])).toBe(2);
    expect(patternPeriod([A, B, C, A, B, C, A])).toBe(3);
    expect(patternPeriod([A, A, A])).toBe(1);
    expect(patternPeriod([A, B, A])).toBe(0); // noch kein ganzer zweiter Durchgang
    expect(patternPeriod([A, B, C, B])).toBe(0);
    expect(patternPeriod([A, B, null, A, B])).toBe(0); // bis zur Lücke
    expect(patternPeriod([])).toBe(0);
  });

  it('stellt höchstens sechs Muster aus, das neueste zuerst', () => {
    let p = createProfile('Mia', 'monkey');
    for (let i = 0; i < MAX_PATTERNS + 2; i++)
      p = exhibitPattern(p, [A, B, i % 2 ? A : C], `2026-11-${10 + i}`);
    expect(p.zoo.patterns).toHaveLength(MAX_PATTERNS);
    expect(p.zoo.patterns![0]!.at).toBe(`2026-11-${10 + MAX_PATTERNS + 1}`);
  });
});

function tasks(level: TaskLevel): Task[] {
  const P = paramsOf('zoo_routes');
  return Array.from({ length: 300 }, (_, s) => zooRoutes(level, createRng(s), `t${s}`, P(level)));
}

describe('Wege im Zoo', () => {
  it('Zooplan wie die Karte: 4 Gehege oben, 4 unten', () => {
    expect(ZOO_PLAN.map((z) => z[0])).toEqual([
      'affenwald',
      'pinguinfelsen',
      'elefantenwiese',
      'zookasse',
      'zoozaehlung',
      'giraffenhof',
      'schmetterlingshaus',
      'futteruhr',
    ]);
  });

  it('Felder wählen: Lösung im Plan, typische Fehler werden erkannt', () => {
    for (const level of [1, 2] as TaskLevel[]) {
      for (const t of tasks(level)) {
        const [cell] = parseCells(String(t.answer))!;
        expect(cell![0]).toBeLessThan(4);
        expect(cell![1]).toBeLessThan(2);
        for (const e of t.errorAnswers ?? []) {
          expect(e.value).not.toBe(t.answer);
          expect(check(t, e.value).errorTag).toBe(e.errorTag);
        }
      }
    }
  });

  it('Wege: nur der richtige Weg kommt am Ziel an', () => {
    for (const t of tasks(3)) {
      if (t.grid) {
        expect(check(t, String(t.answer)).correct).toBe(true);
        continue;
      }
      const v = t.display!.visual;
      if (v.type !== 'board') throw new Error('Zooplan erwartet');
      const ends = t.options!.map((o) => walk(v.start!.cell, o.moves!, 4, 2));
      const goal = walk(v.start!.cell, String(t.answer), 4, 2).end;
      t.options!.forEach((o, i) => {
        const ok = !ends[i]!.blocked && ends[i]!.end.join() === goal.join();
        expect(ok).toBe(o.value === t.answer);
      });
    }
  });
});
