import { describe, expect, it } from 'vitest';
import numberWords from '../src/data/numbers.de.json';
import { check } from '../src/logic/check';
import { GENERATORS } from '../src/logic/generators';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Task, TaskLevel, Term } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const SEEDS = 400;
const WORDS = numberWords as Record<string, string>;

function tasks(family: string, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) =>
    GENERATORS[family]!(level, createRng(s), `t${s}`, P(level)),
  );
}

/** Wert eines Ausdrucks aus Zahlen, +, −, Zehnern (Z) und Einern (E). */
function value(terms: readonly Term[]): number {
  let sum = 0;
  let sign = 1;
  for (let i = 0; i < terms.length; i++) {
    const t = terms[i];
    if (t === '+') sign = 1;
    else if (t === '-') sign = -1;
    else if (typeof t === 'number') {
      const unit = terms[i + 1];
      sum += sign * (unit === 'Z' ? t * 10 : t);
    }
  }
  return sum;
}

/** Setzt die Lösung in die Lücke und prüft, ob beide Seiten gleich sind. */
function balanced(task: Task): boolean {
  const terms = task.prompt.terms.map((t) => (t === '?' ? (task.answer as number) : t));
  const eq = terms.indexOf('=');
  return value(terms.slice(0, eq)) === value(terms.slice(eq + 1));
}

describe('Zahlwörter', () => {
  it('gibt es für 0 bis 100', () => {
    expect(WORDS['num.0']).toBe('null');
    expect(WORDS['num.21']).toBe('einundzwanzig');
    expect(WORDS['num.47']).toBe('siebenundvierzig');
    expect(WORDS['num.17']).toBe('siebzehn');
    expect(WORDS['num.100']).toBe('hundert');
    expect(Object.keys(WORDS)).toHaveLength(101);
  });
});

describe('Affenwald', () => {
  it.each([1, 2, 3] as const)('Zählen Stufe %i: gleiche Schritte, Lösung passt', (level) => {
    for (const t of tasks('count_steps_100', level)) {
      const nums = t.prompt.terms
        .filter((x) => x !== ',')
        .map((x) => (x === '?' ? (t.answer as number) : (x as number)));
      const d = nums[1]! - nums[0]!;
      for (let i = 1; i < nums.length; i++) expect(nums[i]! - nums[i - 1]!).toBe(d);
      for (const n of nums) expect(n >= 0 && n <= 100).toBe(true);
      if (level === 1) expect(d).toBe(1);
      if (level === 2) expect(d).toBe(-1);
      if (level === 3) expect([3, 4, 10]).toContain(Math.abs(d));
      if (level < 3) expect(nums.some((n) => n % 10 === 0)).toBe(true);
    }
  });

  it('Zahlen lesen: Wort zur Zahl, Zahlendreher erkannt', () => {
    for (const t of tasks('read_write_100', 2)) {
      expect(t.prompt.textParams!.word).toBe(`@num.${t.answer as number}`);
      const n = t.answer as number;
      if (n % 11 !== 0 && n % 10 !== 0) {
        expect(check(t, String(Number(String(n).split('').reverse().join('')))).errorTag).toBe(
          'digits_swapped',
        );
      }
    }
    for (const t of tasks('read_write_100', 1))
      expect((t.answer as number) <= 20 || (t.answer as number) % 10 === 0).toBe(true);
    for (const t of tasks('read_write_100', 3)) {
      expect(t.options).toHaveLength(3);
      for (const o of t.options!) expect(WORDS[o.label!.key]).toBeDefined();
      expect(new Set(t.options!.map((o) => o.value)).size).toBe(3);
    }
  });

  it.each([2, 3] as const)('Zehner und Einer Stufe %i: beide Seiten gleich', (level) => {
    for (const t of tasks('place_value_100', level))
      expect(balanced(t), JSON.stringify(t.prompt.terms)).toBe(true);
  });

  it('Zehner und Einer Stufe 1 und Blitzblick: Bild zeigt die Lösung', () => {
    for (const t of tasks('place_value_100', 1)) {
      const v = t.display!.visual;
      expect(v.type).toBe('tensones');
      if (v.type === 'tensones') expect(v.tens * 10 + v.ones).toBe(t.answer);
      expect(t.display!.flashMs).toBeUndefined();
    }
    for (const level of [1, 2, 3] as const) {
      for (const t of tasks('quick_count', level)) {
        const v = t.display!.visual;
        const n =
          v.type === 'tenframe'
            ? v.first
            : v.type === 'tensones'
              ? v.tens * 10 + v.ones
              : v.type === 'dots'
                ? v.rows * v.cols
                : -1;
        expect(n).toBe(t.answer);
        expect(t.display!.flashMs).toBeGreaterThan(0);
      }
    }
  });

  it.each([1, 2] as const)('Vergleichen Stufe %i: das Zeichen stimmt', (level) => {
    const answers = new Set<string>();
    for (const t of tasks('compare_100', level)) {
      const i = t.prompt.terms.indexOf('?');
      const a = value(t.prompt.terms.slice(0, i));
      const b = value(t.prompt.terms.slice(i + 1));
      expect(t.answer).toBe(a < b ? '<' : a > b ? '>' : '=');
      answers.add(t.answer as string);
      expect(check(t, t.answer as string).correct).toBe(true);
    }
    expect(answers.has('<') && answers.has('>')).toBe(true);
    if (level === 2) expect(answers.has('=')).toBe(true);
  });

  it('Ordnen: vier verschiedene Zahlen, Lösung sortiert', () => {
    for (const t of tasks('compare_100', 3)) {
      expect(t.kind).toBe('order');
      const values = t.options!.map((o) => Number(o.value));
      expect(new Set(values).size).toBe(4);
      const answer = t.answer as number[];
      const up = [...values].sort((x, y) => x - y);
      expect([up, [...up].reverse()]).toContainEqual(answer);
      expect(check(t, answer.join(',')).correct).toBe(true);
      expect(check(t, [...answer].reverse().join(',')).correct).toBe(false);
    }
  });
});

describe('Pinguinfelsen', () => {
  it.each([1, 2, 3] as const)('Blitzrechnen Stufe %i: Gleichung stimmt', (level) => {
    const strategies = ['decompose_10', 'tens_calc', 'complement_tens'];
    for (const t of tasks('quick_tens', level)) {
      expect(balanced(t), JSON.stringify(t.prompt.terms)).toBe(true);
      expect(t.strategyId).toBe(strategies[level - 1]);
      expect(t.answer as number).toBeGreaterThanOrEqual(0);
      expect(t.answer as number).toBeLessThanOrEqual(100);
      if (level === 2)
        for (const x of t.prompt.terms) if (typeof x === 'number') expect(x % 10).toBe(0);
    }
  });

  it('erkennt beim Ergänzen bis 100 den Fehler „je auf 10 ergänzt“', () => {
    const t = tasks('quick_tens', 3).find(
      (u) => u.prompt.terms[0] === 38 && u.prompt.terms[4] === 100,
    )!;
    expect(t.answer).toBe(62);
    expect(check(t, '72').errorTag).toBe('complement_both');
  });

  it.each([1, 2] as const)('Überschlagen Stufe %i: gerundetes Ergebnis', (level) => {
    for (const t of tasks('estimate_100', level)) {
      const [a, op, b] = t.prompt.terms as [number, string, number];
      const r = (n: number) => Math.round(n / 10) * 10;
      const est = op === '+' ? r(a) + r(b) : r(a) - r(b);
      expect(t.answer).toBe(String(est));
      const exact = op === '+' ? a + b : a - b;
      expect(Math.abs(exact - est)).toBeLessThanOrEqual(6);
      expect(t.options).toHaveLength(3);
      expect(new Set(t.options!.map((o) => o.value)).size).toBe(3);
      if (level === 1) expect(op).toBe('+');
    }
  });

  it('Überschlagen Stufe 3: Ergebnis prüfen', () => {
    const seen = new Set<string>();
    for (const t of tasks('estimate_100', 3)) {
      const claim = String(t.prompt.textParams!.claim);
      const m = /(\d+) ([+−]) (\d+) = (\d+)/.exec(claim)!;
      const exact = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
      expect(t.answer).toBe(exact === Number(m[4]) ? 'yes' : 'no');
      if (t.answer === 'no') expect(Math.abs(exact - Number(m[4]))).toBeGreaterThanOrEqual(10);
      seen.add(t.answer as string);
    }
    expect([...seen].sort()).toEqual(['no', 'yes']);
  });

  it.each([1, 2, 3] as const)('Rechenweg Stufe %i: genau ein Weg ist richtig', (level) => {
    for (const t of tasks('path_choice', level)) {
      const correct = t.options!.filter(
        (o) =>
          o.value.split(', ').every((s) => {
            const m = /(\d+) ([+−]) (\d+) = (\d+)/.exec(s)!;
            const r = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
            return r === Number(m[4]);
          }) &&
          /(\d+)$/.exec(o.value)![1] ===
            String(eval(String(t.prompt.textParams!.task).replace('−', '-'))),
      );
      expect(correct.map((o) => o.value)).toEqual([t.answer]);
    }
  });
});

describe('Runden', () => {
  it('lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen', () => {
    const families = [
      'count_steps_100',
      'read_write_100',
      'place_value_100',
      'quick_count',
      'compare_100',
      'quick_tens',
      'estimate_100',
      'path_choice',
    ];
    for (const family of families) {
      for (const level of [1, 2, 3] as TaskLevel[]) {
        for (let seed = 0; seed < 30; seed++) {
          const { round, factory } = composeRound({
            family,
            generator: GENERATORS[family]!,
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
    }
  });
});
