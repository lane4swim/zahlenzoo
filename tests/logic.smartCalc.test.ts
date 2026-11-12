import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { smartCalc } from '../src/logic/generators/smartCalc';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Task, TaskLevel, Term } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const SEEDS = 400;

function tasks(level: TaskLevel): Task[] {
  const P = paramsOf('smart_calc');
  return Array.from({ length: SEEDS }, (_, s) => smartCalc(level, createRng(s), `t${s}`, P(level)));
}

/** Wert eines Ausdrucks aus Zahlen, + und − (als Begriffe oder als Text). */
function evaluate(parts: readonly (Term | string)[]): number {
  let sum = 0;
  let sign = 1;
  for (const p of parts) {
    if (p === '+') sign = 1;
    else if (p === '-' || p === '−') sign = -1;
    else if (typeof p === 'number') sum += sign * p;
    else if (/^\d+$/.test(String(p))) sum += sign * Number(p);
  }
  return sum;
}
const evalText = (text: string) => evaluate(text.split(' '));

/** Lücke füllen und beide Seiten der Gleichung vergleichen. */
function balanced(t: Task): boolean {
  const terms = t.prompt.terms.map((x) => (x === '?' ? (t.answer as number) : x));
  const eq = terms.indexOf('=');
  return evaluate(terms.slice(0, eq)) === evaluate(terms.slice(eq + 1));
}

describe('Geschickt rechnen', () => {
  it('Stufe 1: Tauschaufgaben, nur bei Plus', () => {
    const kinds = new Set<string>();
    for (const t of tasks(1)) {
      expect(t.strategyId).toBe('smart_swap');
      if (t.prompt.terms.length > 0) {
        kinds.add('compute');
        expect(balanced(t)).toBe(true);
        const [small, , big] = t.prompt.terms as number[];
        expect(small!).toBeLessThan(10);
        expect(big!).toBeGreaterThan(20);
      } else if (t.prompt.textKey === 'task.prompt.smart.same') {
        kinds.add('same');
        const target = evalText(String(t.prompt.textParams!.task));
        const same = t.options!.filter((o) => evalText(o.value) === target);
        expect(same.map((o) => o.value)).toEqual([t.answer]);
      } else {
        kinds.add('allowed');
        expect(String(t.answer)).toContain('+');
        const minus = t.options!.find((o) => o.value !== t.answer)!;
        expect(check(t, minus.value).errorTag).toBe('swap_minus');
      }
    }
    expect([...kinds].sort()).toEqual(['allowed', 'compute', 'same']);
  });

  it('Stufe 2: Nachbaraufgaben weichen um 1 von der bekannten Aufgabe ab', () => {
    let doubles = 0;
    for (const t of tasks(2)) {
      expect(balanced(t)).toBe(true);
      const known = String(t.prompt.textParams!.known);
      const [left, right] = known.split(' = ');
      expect(evalText(left!)).toBe(Number(right));
      expect(Math.abs((t.answer as number) - Number(right))).toBe(1);
      if (t.strategyId === 'smart_neighbor_double') doubles++;
      const wrong = (t.typicalErrors ?? []).find((e) => e.errorTag === 'neighbor_direction');
      if (wrong) expect(check(t, String(wrong.value)).errorTag).toBe('neighbor_direction');
      expect(t.answer as number).toBeLessThanOrEqual(100);
    }
    expect(doubles).toBeGreaterThan(SEEDS / 6);
  });

  it('Stufe 3: Hilfsaufgaben mit glatten Zehnern', () => {
    const kinds = new Set<string>();
    for (const t of tasks(3)) {
      expect(t.strategyId).toBe('smart_helper');
      if (t.prompt.terms.length > 0) {
        expect(balanced(t)).toBe(true);
        kinds.add(t.prompt.terms.length > 5 ? 'gap' : 'compute');
        const near = t.prompt.terms[2] as number;
        expect([9, 19, 29]).toContain(near);
      } else {
        kinds.add('pick');
        const target = evalText(String(t.prompt.textParams!.task));
        const fitting = t.options!.filter((o) => evalText(o.value) === target);
        expect(fitting.map((o) => o.value)).toEqual([t.answer]);
      }
    }
    expect([...kinds].sort()).toEqual(['compute', 'gap', 'pick']);
  });

  it('erkennt den Ausgleich in die falsche Richtung', () => {
    const t = tasks(3).find((u) => u.prompt.terms.length === 5 && u.kind !== 'choice')!;
    const [a, op, near] = t.prompt.terms as [number, string, number];
    const wrong = op === '+' ? a + near + 2 : a - near - 2;
    expect(check(t, String(wrong)).errorTag).toBe('helper_direction');
  });

  it('Runden lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen', () => {
    for (const level of [1, 2, 3] as TaskLevel[]) {
      for (let seed = 0; seed < 40; seed++) {
        const { round, factory } = composeRound({
          family: 'smart_calc',
          generator: smartCalc,
          params: paramsOf('smart_calc'),
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
