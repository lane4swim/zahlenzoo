import { describe, expect, it } from 'vitest';
import { add100 } from '../src/logic/generators/add100';
import { createRng } from '../src/logic/rng';
import { stepsText, additionStrategy } from '../src/logic/strategy';
import type { Task, TaskLevel } from '../src/types/task';

const SEEDS = 1000;
const LEVELS: TaskLevel[] = [1, 2, 3];

function forAllSeeds(level: TaskLevel, fn: (task: Task) => void) {
  for (let seed = 0; seed < SEEDS; seed++) fn(add100(level, createRng(seed), `t${seed}`));
}

describe('add_100', () => {
  it.each(LEVELS)('bleibt in Stufe %i für 1000 Startwerte im Zahlenraum bis 100', (level) => {
    forAllSeeds(level, (task) => {
      const m = task.math!;
      expect(m.a + m.b).toBe(m.result);
      for (const n of [m.a, m.b, m.result]) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThan(0);
        expect(n).toBeLessThanOrEqual(100);
      }
      // Zwischenwerte des Rechenwegs bleiben im Zahlenraum.
      const s = additionStrategy(m);
      let pos = s.start;
      for (const jump of s.jumps) {
        expect(jump).toBeGreaterThan(0);
        pos += jump;
        expect(pos).toBeLessThanOrEqual(100);
      }
      expect(pos).toBe(m.result);
    });
  });

  it('hält die Stufenregeln ein', () => {
    forAllSeeds(1, ({ math: m }) => {
      expect(m!.carry).toBe(false);
      const tensPlusTens = m!.a % 10 === 0 && m!.b % 10 === 0;
      expect(tensPlusTens || m!.b < 10).toBe(true);
    });
    forAllSeeds(2, ({ math: m }) => {
      expect(m!.carry).toBe(true);
      expect((m!.a % 10) + m!.b).toBeGreaterThan(10);
      expect(m!.a).toBeGreaterThanOrEqual(10);
      expect(m!.b).toBeLessThan(10);
    });
    let carries = 0;
    forAllSeeds(3, ({ math: m }) => {
      expect(m!.a).toBeGreaterThan(10);
      expect(m!.b).toBeGreaterThan(10);
      expect(m!.a % 10).not.toBe(0);
      expect(m!.b % 10).not.toBe(0);
      if (m!.carry) carries++;
    });
    expect(carries / SEEDS).toBeGreaterThan(0.6);
  });

  it.each(LEVELS)('liefert in Stufe %i Antwortkarten ohne Doppelte, mit errorTag', (level) => {
    let choices = 0;
    forAllSeeds(level, (task) => {
      if (task.kind !== 'choice') return;
      choices++;
      const values = task.options!.map((o) => Number(o.value));
      expect(values).toHaveLength(4);
      expect(new Set(values).size).toBe(4);
      expect(values).toContain(task.answer);
      for (const option of task.options!) {
        const value = Number(option.value);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
        if (value === task.answer) expect(option.errorTag).toBeUndefined();
        else expect(option.errorTag).toBeTruthy();
      }
    });
    expect(choices).toBeGreaterThan(200);
  });

  it('nimmt bei Übergang immer den vergessenen Übertrag als Antwortkarte', () => {
    forAllSeeds(2, (task) => {
      if (task.kind !== 'choice') return;
      const tags = task.options!.map((o) => o.errorTag);
      expect(tags).toContain('carry_forgotten');
    });
  });

  it('baut Lückenaufgaben als a + ? = c mit dem zweiten Summanden als Lösung', () => {
    let gaps = 0;
    forAllSeeds(3, (task) => {
      if (task.kind !== 'gap') return;
      gaps++;
      const m = task.math!;
      expect(task.prompt.terms).toEqual([m.a, '+', '?', '=', m.result]);
      expect(task.answer).toBe(m.b);
    });
    expect(gaps).toBeGreaterThan(100);
  });

  it('ist mit gleichem Startwert reproduzierbar', () => {
    expect(add100(2, createRng(99), 'x')).toEqual(add100(2, createRng(99), 'x'));
  });

  it('gibt Tauschaufgaben denselben Duplikat-Schlüssel', () => {
    const task = add100(3, createRng(5), 'x');
    const { a, b } = task.math!;
    if (task.kind === 'gap') return;
    expect(task.dedupeKey).toBe(`add:${Math.min(a, b)}:${Math.max(a, b)}`);
  });

  it('erzeugt drei Hilfestufen mit Rechenstrich in Stufe 2 und 3', () => {
    forAllSeeds(3, (task) => {
      const [h1, h2, h3] = task.hints;
      expect(h1.key).toMatch(/^hint\.add_\w+\.1$/);
      expect(h2.visual?.type).toBe('jumps');
      expect(h2.visual?.type === 'jumps' && h2.visual.hideResults).toBe(true);
      expect(h3.visual?.type === 'jumps' && h3.visual.hideResults).toBeFalsy();
    });
  });
});

describe('Strategien', () => {
  const info = (a: number, b: number, missing: 'result' | 'b' = 'result') => ({
    op: '+' as const,
    a,
    b,
    result: a + b,
    missing,
    carry: (a % 10) + (b % 10) >= 10,
  });

  it('zerlegt nach Zehnern und Einern statt in Einzelschritten', () => {
    expect(additionStrategy(info(34, 5))).toEqual({ id: 'add_ones', start: 34, jumps: [5] });
    expect(additionStrategy(info(40, 20))).toEqual({ id: 'add_tens', start: 40, jumps: [20] });
    expect(additionStrategy(info(38, 7))).toEqual({ id: 'add_bridge', start: 38, jumps: [2, 5] });
    expect(additionStrategy(info(47, 26))).toEqual({
      id: 'add_stepwise',
      start: 47,
      jumps: [20, 6],
    });
    expect(additionStrategy(info(47, 26, 'b'))).toEqual({
      id: 'add_complement',
      start: 47,
      jumps: [3, 20, 3],
    });
  });

  it('ergänzt Zehnerzahlen in einem Zehnersprung', () => {
    expect(additionStrategy(info(30, 40, 'b'))).toEqual({
      id: 'add_complement_tens',
      start: 30,
      jumps: [40],
    });
  });

  it('beschreibt den Rechenweg als Gleichungen', () => {
    expect(stepsText(additionStrategy(info(47, 26)))).toBe('47 + 20 = 67; 67 + 6 = 73');
  });
});
