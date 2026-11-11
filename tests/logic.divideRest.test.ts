import { describe, expect, it } from 'vitest';
import strings from '../src/data/strings.de.json';
import { check } from '../src/logic/check';
import { divideRest, REST_STORIES } from '../src/logic/generators/divideRest';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Task, TaskLevel } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const SEEDS = 400;
const T = strings as Record<string, string>;

function tasks(level: TaskLevel): Task[] {
  const P = paramsOf('divide_rest');
  return Array.from({ length: SEEDS }, (_, s) =>
    divideRest(level, createRng(s), `t${s}`, P(level)),
  );
}

describe('Teilen mit Rest', () => {
  it('Stufe 1: Karten „q Rest r“ mit genau einer richtigen, Rest kleiner als der Teiler', () => {
    let withoutRest = 0;
    for (const t of tasks(1)) {
      const [n, , d] = t.prompt.terms as number[];
      const [q, r] = t.answer as number[];
      expect(q! * d! + r!).toBe(n);
      expect(r!).toBeLessThan(d!);
      expect([2, 5, 10]).toContain(d);
      expect(n!).toBeLessThanOrEqual(100);
      if (r === 0) withoutRest++;
      const right = t.options!.filter((o) => check(t, o.value).correct);
      expect(right).toHaveLength(1);
      expect(new Set(t.options!.map((o) => o.value)).size).toBe(t.options!.length);
      for (const o of t.options!) {
        if (o.value !== right[0]!.value) expect(check(t, o.value).errorTag).toBe(o.errorTag);
        expect(o.label!.key).toBe('divrest.result');
      }
    }
    expect(withoutRest).toBeGreaterThan(0);
    expect(withoutRest).toBeLessThan(SEEDS / 3);
  });

  it('erkennt Rest zu groß, Rest vergessen und vertauscht', () => {
    const t = tasks(1).find((u) => {
      const [q, r] = u.answer as number[];
      return q! > 1 && r! > 0 && q !== r;
    })!;
    const [n, , d] = t.prompt.terms as number[];
    const [q, r] = t.answer as number[];
    expect(n).toBe(q! * d! + r!);
    expect(check(t, `${q! - 1},${r! + d!}`).errorTag).toBe('rest_too_big');
    expect(check(t, `${q},0`).errorTag).toBe('rest_missing');
    expect(check(t, `${r},${q}`).errorTag).toBe('rest_swapped');
  });

  it('Stufe 2: Quotient oder Rest fehlt, die Gleichung geht auf', () => {
    const asked = new Set<string>();
    for (const t of tasks(2)) {
      const terms = t.prompt.terms.map((x) => (x === '?' ? (t.answer as number) : x));
      const [n, , d, , q, , r] = terms as number[];
      expect(q! * d! + r!).toBe(n);
      expect(r!).toBeLessThan(d!);
      asked.add(t.prompt.terms[4] === '?' ? 'q' : 'r');
      expect(check(t, String(t.answer)).correct).toBe(true);
    }
    expect([...asked].sort()).toEqual(['q', 'r']);
  });

  it('Stufe 3: Sachaufgaben deuten den Rest richtig', () => {
    const asks = new Set<string>();
    for (const t of tasks(3)) {
      const [, story, ask] = t.prompt.textKey!.split('.');
      expect(REST_STORIES).toContain(story);
      expect(T[t.prompt.textKey!]).toBeDefined();
      const n = Number(t.prompt.textParams!.n);
      const d = Number(t.prompt.textParams!.d);
      const q = Math.floor(n / d);
      const r = n % d;
      expect(r).toBeGreaterThan(0);
      expect(t.answer).toBe(ask === 'full' ? q : ask === 'left' ? r : q + 1);
      if (ask === 'need') expect(check(t, String(q)).errorTag).toBe('rest_need_more');
      if (ask === 'full') expect(check(t, String(q + 1)).errorTag).toBe('rest_rounded');
      asks.add(ask!);
    }
    expect([...asks].sort()).toEqual(['full', 'left', 'need']);
  });

  it('Runden lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen', () => {
    for (const level of [1, 2, 3] as TaskLevel[]) {
      for (let seed = 0; seed < 40; seed++) {
        const { round, factory } = composeRound({
          family: 'divide_rest',
          generator: divideRest,
          params: paramsOf('divide_rest'),
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
