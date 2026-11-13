import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { GENERATORS } from '../src/logic/generators';
import { discoverPackage, makePackage, oddOneOut } from '../src/logic/generators/variants';
import { createRng } from '../src/logic/rng';
import type { Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const tasks = (family: string, level: TaskLevel, n = 400): Task[] =>
  Array.from({ length: n }, (_, seed) =>
    GENERATORS[family]!(level, createRng(seed), 't', paramsOf(family)(level)),
  );

describe('Stimmt die Rechnung? (true_false)', () => {
  it('kommt bei Plus und Minus vor; falsche Rechnungen zeigen einen typischen Fehler', () => {
    for (const family of ['add_100', 'sub_100']) {
      const tf = tasks(family, 2).filter((t) => t.prompt.textKey === 'task.prompt.trueFalse');
      expect(tf.length, family).toBeGreaterThan(20);
      let wrong = 0;
      for (const t of tf) {
        const [a, op, b, , shown] = t.prompt.terms as [number, '+' | '-', number, '=', number];
        const result = op === '+' ? a + b : a - b;
        expect(t.answer).toBe(shown === result ? 'yes' : 'no');
        expect(check(t, String(t.answer)).correct).toBe(true);
        if (t.answer === 'no') {
          wrong++;
          // die Karte „Stimmt“ trägt die Fehlerart der gezeigten falschen Zahl
          expect(check(t, 'yes').errorTag).toBeDefined();
        }
      }
      expect(wrong).toBeGreaterThan(5);
      expect(wrong).toBeLessThan(tf.length - 5);
    }
  });
});

describe('Entdeckerpäckchen', () => {
  const effect = (rows: ReturnType<typeof makePackage>['rows']) => {
    const v = rows.map((r) => (r.op === '+' ? r.a + r.b : r.a - r.b));
    return v.slice(1).map((x, i) => x - v[i]!);
  };

  it('jede Regel ändert das Ergebnis gleichmäßig, alle Zahlen bleiben bis 100', () => {
    const expected = {
      both_up: 2,
      same: 0,
      first_up: 1,
      minus_same: 0,
      minus_first_up: 1,
      tens_up: 10,
    };
    for (let seed = 0; seed < 300; seed++) {
      for (const level of [2, 3]) {
        const { rule, rows } = makePackage(createRng(seed), level);
        expect(new Set(effect(rows))).toEqual(new Set([expected[rule]]));
        for (const r of rows) {
          expect(Math.max(r.a, r.b, r.op === '+' ? r.a + r.b : r.a - r.b)).toBeLessThanOrEqual(100);
          expect(r.op === '+' ? r.a + r.b : r.a - r.b).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it('„Was fällt dir auf?“ hat genau eine richtige Aussage', () => {
    for (let seed = 0; seed < 200; seed++) {
      const t = discoverPackage(2, createRng(seed), 't', 'smart_calc');
      const keys = t.options!.map((o) => o.label!.key);
      expect(new Set(keys).size).toBe(3);
      expect(t.options!.filter((o) => o.value === t.answer)).toHaveLength(1);
      expect(String(t.prompt.textParams!['lines']).split('\n')).toHaveLength(3);
    }
  });

  it('„Was passt nicht?“: genau eine Aufgabe bricht die Regel', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const level of [2, 3] as TaskLevel[]) {
        const t = oddOneOut(level, createRng(seed), 't', 'smart_calc');
        const rows = t.options!.map((o) => {
          const [a, op, b] = o.value.split(' ');
          return { a: Number(a), op: op === '+' ? '+' : '-', b: Number(b) } as const;
        });
        const at = t.options!.findIndex((o) => o.value === t.answer);
        expect(at).toBeGreaterThan(0);
        // mit der passenden Aufgabe statt der falschen ändert sich das Ergebnis gleichmäßig
        const fit = String(t.hints[2].params!['fit']).split(' ');
        const fixed = rows.map((r, i) =>
          i === at ? ({ a: Number(fit[0]), op: r.op, b: Number(fit[2]) } as const) : r,
        );
        expect(new Set(effect(fixed)).size).toBe(1);
        expect(new Set(effect(rows)).size).toBeGreaterThan(1);
        expect(new Set(t.options!.map((o) => o.value)).size).toBe(4);
      }
    }
  });

  it('kommt in „Geschickt rechnen“ ab Stufe 2 vor', () => {
    const keys = new Set(tasks('smart_calc', 2).map((t) => t.prompt.textKey));
    expect(keys.has('task.prompt.package')).toBe(true);
    expect(keys.has('task.prompt.oddOneOut')).toBe(true);
    expect(tasks('smart_calc', 1).some((t) => t.strategyId === 'discover_package')).toBe(false);
  });
});

describe('Größen ordnen (time_order)', () => {
  it('Längen und Zeitspannen von kurz nach lang ziehen', () => {
    for (const family of ['compare_length', 'compare_duration']) {
      const sorted = tasks(family, 3).filter((t) => t.kind === 'drag-sort');
      expect(sorted.length, family).toBeGreaterThan(50);
      for (const t of sorted) {
        const answer = t.answer as number[];
        expect([...answer].sort((a, b) => a - b)).toEqual(answer);
        expect(t.options!.map((o) => Number(o.value)).sort((a, b) => a - b)).toEqual(answer);
        expect(check(t, answer.join(',')).correct).toBe(true);
        expect(check(t, [...answer].reverse().join(',')).correct).toBe(false);
      }
      expect(tasks(family, 2).some((t) => t.kind === 'drag-sort')).toBe(false);
    }
  });
});
