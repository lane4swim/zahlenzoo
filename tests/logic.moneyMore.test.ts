import { describe, expect, it } from 'vitest';
import templates from '../src/data/word-templates.de.json';
import { check } from '../src/logic/check';
import { GENERATORS } from '../src/logic/generators';
import { centLabel, compareMoney, euroCentLabel } from '../src/logic/generators/compareMoney';
import { moneyConvert } from '../src/logic/generators/moneyConvert';
import {
  exactOrEstimate,
  QUESTION_DISTRACTORS,
  questionPick,
} from '../src/logic/generators/situations';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Generator, Task, TaskLevel } from '../src/types/task';
import { CONTENT, paramsOf, RULES } from './helpers/content';

const SEEDS = 500;
const T = templates as Record<string, string>;

function tasks(family: string, gen: Generator, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) => gen(level, createRng(s), `t${s}`, P(level)));
}

/** Wert eines Betrags in Cent aus dem Text („1 € 50 ct“, „105 ct“, „3 €“). */
function cents(label: string): number {
  const euro = /(\d+)\s€/.exec(label);
  const cent = /(\d+)\sct/.exec(label);
  return (euro ? Number(euro[1]) * 100 : 0) + (cent ? Number(cent[1]) : 0);
}

/** Rechnung aus Zahlen und Einheiten in Cent, getrennt am Gleichheitszeichen. */
function sides(task: Task, answer: number): [number, number] {
  const terms = task.prompt.terms.map((t) => (t === '?' ? answer : t));
  const eq = terms.indexOf('=');
  const value = (part: typeof terms) => {
    let sum = 0;
    for (let i = 0; i < part.length; i += 2) {
      const n = part[i] as number;
      sum += part[i + 1] === '€' ? n * 100 : n;
    }
    return sum;
  };
  return [value(terms.slice(0, eq)), value(terms.slice(eq + 1))];
}

describe('Cent und Euro umwandeln', () => {
  it.each([1, 2, 3] as const)(
    'Stufe %i: beide Seiten sind gleich viel, Lösung bis 999',
    (level) => {
      for (const t of tasks('money_convert', moneyConvert, level)) {
        const [left, right] = sides(t, t.answer as number);
        expect(left, JSON.stringify(t.prompt.terms)).toBe(right);
        expect(t.answer as number).toBeGreaterThan(0);
        expect(t.answer as number).toBeLessThanOrEqual(999);
        expect(check(t, String(t.answer)).correct).toBe(true);
        if (t.options) {
          expect(new Set(t.options.map((o) => o.value)).size).toBe(4);
          expect(t.options.map((o) => o.value)).toContain(String(t.answer));
        }
      }
    },
  );

  it('hält die Stufen ein: erst volle Euro, dann Zehner-Cent, dann beliebige Cent', () => {
    const centsOf = (t: Task) =>
      t.prompt.terms.includes('ct') ? sides(t, t.answer as number)[0] % 100 : 0;
    for (const t of tasks('money_convert', moneyConvert, 1)) expect(centsOf(t)).toBe(0);
    for (const t of tasks('money_convert', moneyConvert, 2)) expect(centsOf(t) % 10).toBe(0);
    const level3 = tasks('money_convert', moneyConvert, 3).map(centsOf);
    expect(level3.some((c) => c > 0 && c < 10)).toBe(true);
  });

  it('erkennt typische Fehler', () => {
    const t = tasks('money_convert', moneyConvert, 3).find(
      (u) =>
        u.prompt.terms[1] === '€' &&
        u.prompt.terms[3] === 'ct' &&
        (u.prompt.terms[2] as number) < 10,
    )!;
    const [euro, , cent] = t.prompt.terms as number[];
    expect(check(t, `${euro}${cent}`).errorTag).toBe('zero_place');
    expect(check(t, String(euro! * 1000 + cent!)).errorTag).toBe('hundred_cent');
  });
});

describe('Geld vergleichen', () => {
  it('beschriftet Beträge', () => {
    expect(euroCentLabel(150)).toBe('1 € 50 ct');
    expect(euroCentLabel(300)).toBe('3 €');
    expect(euroCentLabel(45)).toBe('45 ct');
    expect(centLabel(105)).toBe('105 ct');
  });

  it.each([
    [1, 2],
    [2, 2],
    [3, 3],
  ] as const)('Stufe %i: %i verschiedene Beträge, Lösung ist richtig', (level, count) => {
    let mixed = 0;
    for (const t of tasks('compare_money', compareMoney, level)) {
      const values = t.options!.map((o) => o.value);
      expect(values).toHaveLength(count);
      expect(new Set(values.map(cents)).size, values.join(' | ')).toBe(count);
      expect(values).toContain(t.answer);
      const a = cents(t.answer as string);
      if (t.prompt.textKey === 'task.prompt.sameAmount') {
        expect(a).toBe(cents(String(t.prompt.textParams!.amount)));
      } else {
        for (const v of values) expect(cents(v)).toBeLessThanOrEqual(a);
      }
      if (values.some((v) => v.includes('€')) && values.some((v) => !v.includes('€'))) mixed++;
      for (const o of t.options!) {
        expect(check(t, o.value).correct).toBe(o.value === t.answer);
      }
    }
    if (level === 1) expect(mixed).toBe(0);
    else expect(mixed).toBeGreaterThan(SEEDS / 3);
  });
});

describe('Sachsituationen', () => {
  it('haben Texte für jede Vorlage und nutzen genau die Platzhalter aus situations.json', () => {
    const qp = CONTENT.situations.filter((s) => s.family === 'question_pick');
    const ee = CONTENT.situations.filter((s) => s.family === 'exact_or_estimate');
    expect(qp.length).toBeGreaterThanOrEqual(20);
    expect(ee.length).toBeGreaterThanOrEqual(20);
    for (const s of CONTENT.situations) {
      const keys = [
        `situation.${s.id}`,
        ...(s.family === 'question_pick'
          ? ['right', ...QUESTION_DISTRACTORS].map((d) => `situation.${s.id}.${d}`)
          : [`situation.${s.id}.why`]),
      ];
      const used = new Set<string>();
      for (const k of keys) {
        expect(T[k], k).toBeDefined();
        for (const m of T[k]!.matchAll(/\{(\w+)\}/g)) used.add(m[1]!);
      }
      expect([...used].sort(), s.id).toEqual(Object.keys(s.params).sort());
      if (s.family === 'exact_or_estimate') expect(['exact', 'estimate']).toContain(s.answer);
    }
  });

  it('wählt die passende Frage: drei Karten, eine richtig, Fehlerart je Stufe', () => {
    for (const level of [1, 2, 3] as const) {
      const kinds = new Set<string>();
      for (const t of tasks('question_pick', questionPick, level)) {
        expect(t.options).toHaveLength(3);
        expect(t.answer).toBe('right');
        expect(t.prompt.instructionKey).toBe('task.prompt.pickQuestion');
        for (const o of t.options!) {
          if (o.value !== 'right') kinds.add(o.value);
          expect(check(t, o.value).correct).toBe(o.value === 'right');
        }
      }
      expect([...kinds].sort()).toEqual(level === 1 ? ['absurd', 'missing'] : ['given', 'missing']);
    }
  });

  it('genau oder ungefähr: Stufe 1 und 2 aus Vorlagen, beide Antworten kommen vor', () => {
    for (const level of [1, 2] as const) {
      const answers = new Set<string>();
      for (const t of tasks('exact_or_estimate', exactOrEstimate, level)) {
        const id = t.prompt.textKey!.replace('situation.', '');
        const s = CONTENT.situations.find((x) => x.id === id)!;
        expect(s.levels).toContain(level);
        expect(t.answer).toBe(s.answer);
        answers.add(t.answer as string);
      }
      expect([...answers].sort()).toEqual(['estimate', 'exact']);
    }
  });

  it('Überschlag (Stufe 3): Rundung entscheidet sicher, ob das Geld reicht', () => {
    const answers = new Set<string>();
    for (const t of tasks('exact_or_estimate', exactOrEstimate, 3)) {
      const p = t.prompt.textParams!;
      const prices = String(p.prices)
        .split(', ')
        .map((x) => parseInt(x, 10));
      const budget = parseInt(String(p.budget), 10);
      const rough = parseInt(String(p.roughSum), 10);
      const sum = prices.reduce((s, v) => s + v, 0);
      expect(t.answer).toBe(sum <= budget ? 'yes' : 'no');
      expect(rough <= budget).toBe(sum <= budget);
      expect(Math.abs(sum - budget)).toBeGreaterThanOrEqual(4);
      answers.add(t.answer as string);
    }
    expect([...answers].sort()).toEqual(['no', 'yes']);
  });
});

describe('Runden der Zoo-Kasse', () => {
  it('lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen, auch mit Wiederholungen', () => {
    for (const family of CONTENT.areas.find((a) => a.id === 'zookasse')!.families) {
      for (const level of [1, 2, 3] as TaskLevel[]) {
        for (let seed = 0; seed < 50; seed++) {
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
