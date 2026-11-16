import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { divideShare } from '../src/logic/generators/divideShare';
import { doubleHalf } from '../src/logic/generators/doubleHalf';
import { createRng } from '../src/logic/rng';
import type { Generator, Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const tasks = (gen: Generator, family: string, level: TaskLevel, n = 300): Task[] =>
  Array.from({ length: n }, (_, seed) => gen(level, createRng(seed), 't', paramsOf(family)(level)));

const baseOf = (t: Task) => Number(t.prompt.textParams!['n']);
const isDouble = (t: Task) => t.prompt.textKey === 'task.prompt.doubleOf';

describe('Verdoppeln und Halbieren (double_half)', () => {
  it('rechnet richtig und bleibt im Zahlenraum der Stufe', () => {
    const max = { 1: 20, 2: 100, 3: 100 } as const;
    for (const level of [1, 2, 3] as const) {
      for (const t of tasks(doubleHalf, 'double_half', level)) {
        const n = baseOf(t);
        expect(t.answer).toBe(isDouble(t) ? 2 * n : n / 2);
        expect(Math.max(n, t.answer as number)).toBeLessThanOrEqual(max[level]);
        expect(Number.isInteger(t.answer)).toBe(true);
        expect(check(t, String(t.answer)).correct).toBe(true);
      }
    }
  });

  it('Stufe 2 ohne Übergang, Stufe 3 mit Übergang', () => {
    for (const t of tasks(doubleHalf, 'double_half', 2)) {
      const n = baseOf(t);
      if (isDouble(t)) expect(n % 10).toBeLessThan(5);
      else expect(Math.floor(n / 10) % 2).toBe(0);
    }
    for (const t of tasks(doubleHalf, 'double_half', 3)) {
      const n = baseOf(t);
      if (isDouble(t)) expect(n % 10).toBeGreaterThanOrEqual(5);
      else expect(Math.floor(n / 10) % 2).toBe(1);
    }
  });

  it('erkennt typische Fehler: Übergang vergessen, verdoppelt statt halbiert', () => {
    const d = tasks(doubleHalf, 'double_half', 3).find((t) => isDouble(t) && baseOf(t) === 37);
    if (d) expect(check(d, '64').errorTag).toBe('no_carry');
    const h = tasks(doubleHalf, 'double_half', 2).find((t) => !isDouble(t))!;
    expect(check(h, String(2 * baseOf(h))).errorTag).toBe('doubled');
  });
});

describe('Verteilen und Aufteilen (divide_share)', () => {
  it('Stufe 1: Handeln bis 20; gerecht verteilt ist richtig, ungleich nicht', () => {
    let share = 0;
    let measure = 0;
    for (const t of tasks(divideShare, 'divide_share', 1)) {
      const s = t.share!;
      expect(s.total).toBeLessThanOrEqual(20);
      if (s.mode === 'share') {
        share++;
        const each = s.total / s.groups;
        expect(t.answer).toBe(each);
        const fair = Array.from({ length: s.groups }, () => each);
        expect(check(t, fair.join(',')).correct).toBe(true);
        const unfair = [...fair];
        unfair[0]! += 1;
        unfair[1]! -= 1;
        expect(check(t, unfair.join(','))).toEqual({ correct: false, errorTag: 'share_unequal' });
      } else {
        measure++;
        expect(t.answer).toBe(s.total / s.size);
        expect(check(t, String(t.answer)).correct).toBe(true);
      }
    }
    expect(share).toBeGreaterThan(50);
    expect(measure).toBeGreaterThan(50);
  });

  it('Stufe 2: Das Bild zeigt die verteilten Dinge passend zur Rechnung', () => {
    for (const t of tasks(divideShare, 'divide_share', 2)) {
      const [total, , divisor] = t.prompt.terms as number[];
      const groups = t.prompt.picture!.groups;
      expect(groups.reduce((a, b) => a + b, 0)).toBe(total);
      expect(new Set(groups).size).toBe(1);
      expect(t.answer).toBe(total! / divisor!);
      expect(total).toBeLessThanOrEqual(30);
    }
  });

  it('Stufe 3: passende Rechnung wählen oder aus der Malaufgabe ableiten', () => {
    let which = 0;
    let family = 0;
    for (const t of tasks(divideShare, 'divide_share', 3)) {
      if (t.options) {
        which++;
        const p = t.prompt.textParams!;
        const divisor = Number(p['groups'] ?? p['size']);
        expect(t.answer).toBe(`${p['total']} : ${divisor}`);
        expect(t.options.filter((o) => o.value === t.answer)).toHaveLength(1);
        expect(new Set(t.options.map((o) => o.value)).size).toBe(t.options.length);
      } else {
        family++;
        const [total, , divisor] = t.prompt.terms as number[];
        expect(t.prompt.textParams!['known']).toBe(`${t.answer} · ${divisor} = ${total}`);
      }
    }
    expect(which).toBeGreaterThan(50);
    expect(family).toBeGreaterThan(50);
  });
});
