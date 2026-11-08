import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { sub100 } from '../src/logic/generators/sub100';
import { createRng } from '../src/logic/rng';
import { stepsText, subtractionStrategy } from '../src/logic/strategy';
import type { MathInfo, Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const SEEDS = 1000;
const P = paramsOf('sub_100');

function forAllSeeds(level: TaskLevel, fn: (task: Task) => void) {
  for (let seed = 0; seed < SEEDS; seed++) fn(sub100(level, createRng(seed), `t${seed}`, P(level)));
}

const info = (a: number, b: number, missing: 'result' | 'b' = 'result'): MathInfo => ({
  op: '-',
  a,
  b,
  result: a - b,
  missing,
  carry: a % 10 < b % 10,
});

describe('sub_100', () => {
  it.each([1, 2, 3] as TaskLevel[])('bleibt in Stufe %i im Zahlenraum 1 bis 100', (level) => {
    forAllSeeds(level, (task) => {
      const m = task.math!;
      expect(m.a - m.b).toBe(m.result);
      for (const n of [m.a, m.b, m.result]) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(100);
      }
      // Zwischenwerte des Rechenwegs bleiben im Zahlenraum.
      const s = subtractionStrategy(m);
      let pos = s.start;
      for (const j of s.jumps) {
        pos += j;
        expect(pos).toBeGreaterThanOrEqual(0);
        expect(pos).toBeLessThanOrEqual(100);
      }
      expect(pos).toBe(m.missing === 'b' ? m.a : m.result);
    });
  });

  it('hält die Stufenregeln ein', () => {
    forAllSeeds(1, ({ math: m }) => expect(m!.carry).toBe(false));
    forAllSeeds(2, ({ math: m }) => {
      expect(m!.carry).toBe(true);
      expect(m!.b).toBeLessThan(10);
    });
    let borrows = 0;
    forAllSeeds(3, ({ math: m }) => {
      expect(m!.b).toBeGreaterThan(10);
      if (m!.carry) borrows++;
    });
    expect(borrows / SEEDS).toBeGreaterThan(0.6);
  });

  it.each([1, 2, 3] as TaskLevel[])('liefert in Stufe %i gültige Antwortkarten', (level) => {
    forAllSeeds(level, (task) => {
      if (task.kind !== 'choice') return;
      const values = task.options!.map((o) => Number(o.value));
      expect(new Set(values).size).toBe(4);
      expect(values).toContain(task.answer);
      for (const o of task.options!) {
        expect(check(task, o.value).correct).toBe(Number(o.value) === task.answer);
      }
    });
  });

  it('erkennt typische Fehler beim Abziehen über den Zehner', () => {
    const task = sub100(2, createRng(1), 't', P(2));
    const m = task.math!;
    if (task.kind === 'gap') return;
    expect(check(task, m.result + 10).errorTag).toBe('borrow_forgotten');
    expect(check(task, m.a + m.b).errorTag).toBe('added');
  });
});

describe('Strategien beim Minus', () => {
  it('rechnet rückwärts in Schritten', () => {
    expect(subtractionStrategy(info(47, 5))).toEqual({ id: 'sub_ones', start: 47, jumps: [-5] });
    expect(subtractionStrategy(info(70, 30))).toEqual({ id: 'sub_tens', start: 70, jumps: [-30] });
    expect(subtractionStrategy(info(43, 7))).toEqual({
      id: 'sub_bridge',
      start: 43,
      jumps: [-3, -4],
    });
    expect(subtractionStrategy(info(73, 26))).toEqual({
      id: 'sub_stepwise',
      start: 73,
      jumps: [-20, -6],
    });
    expect(subtractionStrategy(info(73, 26, 'b'))).toMatchObject({
      id: 'sub_complement',
      start: 47,
    });
  });

  it('beschreibt den Rechenweg mit Minuszeichen', () => {
    expect(stepsText(subtractionStrategy(info(43, 7)))).toBe('43 − 3 = 40; 40 − 4 = 36');
  });
});
