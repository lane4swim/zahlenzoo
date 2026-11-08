import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { neighbors100 } from '../src/logic/generators/neighbors100';
import { createRng } from '../src/logic/rng';
import { paramsOf } from './helpers/content';
import type { Task, TaskLevel, Term } from '../src/types/task';

const SEEDS = 1000;
const P = paramsOf('neighbors_100');

function forAllSeeds(level: TaskLevel, fn: (task: Task) => void) {
  for (let seed = 0; seed < SEEDS; seed++)
    fn(neighbors100(level, createRng(seed), `t${seed}`, P(level)));
}

const numbersOf = (terms: readonly Term[]) =>
  terms.filter((t): t is number => typeof t === 'number');

/** Setzt die Lösung in die Lücke ein. */
const filled = (task: Task) =>
  task.prompt.terms.map((t) => (t === '?' ? (task.answer as number) : t)) as Array<number | string>;

describe('neighbors_100', () => {
  it.each([1, 2, 3] as TaskLevel[])(
    'bleibt in Stufe %i für 1000 Startwerte im Zahlenraum 0 bis 100 mit genau einer Lücke',
    (level) => {
      forAllSeeds(level, (task) => {
        expect(task.prompt.terms.filter((t) => t === '?')).toHaveLength(1);
        for (const n of [...numbersOf(task.prompt.terms), task.answer as number]) {
          expect(Number.isInteger(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
          expect(n).toBeLessThanOrEqual(100);
        }
        expect(task.prompt.textKey).toMatch(/^task\.prompt\./);
      });
    },
  );

  it('bildet in Stufe 1 drei aufeinanderfolgende Zahlen', () => {
    let crossings = 0;
    forAllSeeds(1, (task) => {
      const row = filled(task).filter((t): t is number => typeof t === 'number');
      expect(row).toHaveLength(3);
      expect(row[1]! - row[0]!).toBe(1);
      expect(row[2]! - row[1]!).toBe(1);
      if (row.some((n) => n % 10 === 0)) crossings++;
    });
    expect(crossings / SEEDS).toBeGreaterThan(0.3);
  });

  it('fragt in Stufe 2 nach dem passenden Nachbarzehner', () => {
    forAllSeeds(2, (task) => {
      const [lower, , n, , upper] = filled(task) as number[];
      expect(lower! % 10).toBe(0);
      expect(upper! - lower!).toBe(10);
      expect(n!).toBeGreaterThan(lower!);
      expect(n!).toBeLessThan(upper!);
    });
  });

  it('bildet in Stufe 3 Folgen mit gleichem Schritt 2, 5 oder 10', () => {
    const steps = new Set<number>();
    let backward = 0;
    forAllSeeds(3, (task) => {
      const row = filled(task).filter((t): t is number => typeof t === 'number');
      expect(row).toHaveLength(4);
      const step = row[1]! - row[0]!;
      for (let i = 2; i < row.length; i++) expect(row[i]! - row[i - 1]!).toBe(step);
      steps.add(Math.abs(step));
      if (step < 0) backward++;
      expect(task.prompt.terms[0]).not.toBe('?');
    });
    expect([...steps].sort((a, b) => a - b)).toEqual([2, 5, 10]);
    expect(backward).toBeGreaterThan(100);
  });

  it.each([1, 2, 3] as TaskLevel[])('liefert in Stufe %i passende Antwortkarten', (level) => {
    forAllSeeds(level, (task) => {
      if (task.kind !== 'choice') return;
      const values = task.options!.map((o) => Number(o.value));
      expect(new Set(values).size).toBe(4);
      expect(values).toContain(task.answer);
      for (const o of task.options!) {
        const v = Number(o.value);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
        expect(check(task, o.value).correct).toBe(v === task.answer);
      }
    });
  });

  it('erkennt typische Fehler', () => {
    forAllSeeds(1, (task) => {
      for (const e of task.typicalErrors ?? []) {
        expect(e.value).not.toBe(task.answer);
        expect(check(task, e.value)).toEqual({ correct: false, errorTag: e.errorTag });
      }
    });
  });

  it('zeigt in den Hinweisen die Hundertertafel, in Stufe 3 mit der Lösung', () => {
    forAllSeeds(2, (task) => {
      const [, h2, h3] = task.hints;
      expect(h2.visual?.type).toBe('hundred');
      expect(h2.visual?.type === 'hundred' && h2.visual.marked).not.toContain(task.answer);
      expect(h3.visual?.type === 'hundred' && h3.visual.marked).toContain(task.answer);
    });
  });

  it('ist mit gleichem Startwert reproduzierbar', () => {
    expect(neighbors100(3, createRng(42), 'x', P(3))).toEqual(
      neighbors100(3, createRng(42), 'x', P(3)),
    );
  });
});
