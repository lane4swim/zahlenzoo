import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { CORE_ROWS, multTable } from '../src/logic/generators/multTable';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Task, TaskLevel } from '../src/types/task';

const SEEDS = 1000;

function forAllSeeds(level: TaskLevel, fn: (task: Task) => void) {
  for (let seed = 0; seed < SEEDS; seed++) fn(multTable(level, createRng(seed), `t${seed}`));
}

/** Wertet die Rechnung mit eingesetzter Lösung aus und prüft die Gleichung. */
function holds(task: Task): boolean {
  const t = task.prompt.terms.map((x) => (x === '?' ? (task.answer as number) : x));
  const [a, op, b, , c] = t as [number, string, number, string, number];
  return op === '·' ? a * b === c : a / b === c;
}

describe('mult_table', () => {
  it.each([1, 2, 3] as TaskLevel[])(
    'bildet in Stufe %i für 1000 Startwerte richtige Gleichungen im Zahlenraum bis 100',
    (level) => {
      forAllSeeds(level, (task) => {
        expect(task.prompt.terms.filter((x) => x === '?')).toHaveLength(1);
        expect(holds(task)).toBe(true);
        for (const n of task.prompt.terms) {
          if (typeof n === 'number') {
            expect(Number.isInteger(n)).toBe(true);
            expect(n).toBeGreaterThanOrEqual(1);
            expect(n).toBeLessThanOrEqual(100);
          }
        }
      });
    },
  );

  it('nutzt in Stufe 1 nur Kernaufgaben, Verdoppeln und Halbieren', () => {
    const seen = new Set<string>();
    forAllSeeds(1, (task) => {
      seen.add(task.strategyId!.replace(/_\d+$/, ''));
      const [a, op, b] = task.prompt.terms as [number, string, number];
      if (task.strategyId!.startsWith('mult_core')) {
        expect(op).toBe('·');
        expect(CORE_ROWS.some((r) => r === a || r === b)).toBe(true);
      }
      if (task.strategyId === 'half') expect(op).toBe(':');
    });
    expect([...seen].sort()).toEqual(['double', 'half', 'mult_core']);
  });

  it('leitet in Stufe 2 Reihen 3, 4, 6, 7, 8, 9 ab und zeigt die Kernaufgabe farbig', () => {
    forAllSeeds(2, (task) => {
      const [a, , b] = task.prompt.terms as [number, string, number];
      expect([3, 4, 6, 7, 8, 9].some((r) => r === a || r === b)).toBe(true);
      const visual = task.hints[1].visual;
      expect(visual?.type).toBe('dots');
      if (visual?.type === 'dots') {
        expect(visual.split).toBeGreaterThan(0);
        expect(visual.split).toBeLessThan(visual.rows);
        expect(visual.rows * visual.cols).toBeGreaterThanOrEqual(task.answer as number);
      }
    });
  });

  it('übt in Stufe 3 Umkehren und Verteilen', () => {
    const kinds = new Set<string>();
    forAllSeeds(3, (task) => {
      kinds.add(task.strategyId!);
      if (task.strategyId === 'mult_inverse') expect(task.prompt.terms[0]).toBe('?');
      if (task.strategyId === 'divide_share') expect(task.prompt.terms[1]).toBe(':');
    });
    expect([...kinds].sort()).toEqual(['divide_share', 'mult_inverse']);
  });

  it.each([1, 2, 3] as TaskLevel[])('liefert in Stufe %i gültige Antwortkarten', (level) => {
    forAllSeeds(level, (task) => {
      if (task.kind !== 'choice') return;
      const values = task.options!.map((o) => Number(o.value));
      expect(new Set(values).size).toBe(4);
      expect(values).toContain(task.answer);
      for (const o of task.options!)
        expect(check(task, o.value).correct).toBe(Number(o.value) === task.answer);
    });
  });

  it('erkennt Plus statt Mal als typischen Fehler', () => {
    forAllSeeds(1, (task) => {
      if (!task.strategyId!.startsWith('mult_core')) return;
      const [a, , b] = task.prompt.terms as [number, string, number];
      if (a + b === task.answer) return;
      const e = task.typicalErrors!.find((x) => x.value === a + b);
      if (e) expect(check(task, a + b).errorTag).toBe(e.errorTag);
    });
  });

  it('bildet Runden ohne doppelte Aufgaben, Tauschaufgaben zählen gleich', () => {
    for (let seed = 0; seed < 300; seed++) {
      const level = ((seed % 3) + 1) as TaskLevel;
      const { round } = composeRound({
        family: 'mult_table',
        generator: multTable,
        level,
        rng: createRng(seed),
      });
      const keys = round.tasks.map((t) => t.dedupeKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});
