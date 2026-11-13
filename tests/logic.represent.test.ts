import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { matchRepr, numberLine } from '../src/logic/generators/represent';
import { createRng } from '../src/logic/rng';
import type { Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const many = (gen: typeof matchRepr, family: string, level: TaskLevel, n = 200): Task[] =>
  Array.from({ length: n }, (_, seed) => gen(level, createRng(seed), 't', paramsOf(family)(level)));

describe('Darstellungen zuordnen (match_repr)', () => {
  it('jede obere Karte hat genau eine passende untere Karte', () => {
    for (const level of [1, 2, 3] as TaskLevel[]) {
      for (const t of many(matchRepr, 'match_repr', level)) {
        const { top, bottom } = t.match!;
        const answer = t.answer as number[];
        expect(new Set(top.map((c) => c.n)).size).toBe(top.length);
        expect([...answer].sort()).toEqual(bottom.map((_, i) => i));
        top.forEach((c, i) => expect(bottom[answer[i]!]!.n).toBe(c.n));
        expect(check(t, answer.join(',')).correct).toBe(true);
        expect(check(t, [...answer].reverse().join(',')).correct).toBe(answer.length === 1);
      }
    }
  });

  it('Stufe 1 bleibt bis 20 beim Zehnerfeld, Stufe 3 zeigt Zahlwörter', () => {
    for (const t of many(matchRepr, 'match_repr', 1)) {
      expect(t.match!.top.every((c) => c.n <= 20 && c.repr === 'digits')).toBe(true);
      expect(t.match!.bottom.every((c) => c.repr === 'tenframe')).toBe(true);
    }
    for (const t of many(matchRepr, 'match_repr', 3)) {
      expect(t.match!.top.every((c) => c.repr === 'word')).toBe(true);
    }
  });

  it('ab Stufe 2 steckt meist ein Zahlendreher in der Auswahl (36 und 63)', () => {
    const tasks = many(matchRepr, 'match_repr', 2);
    const swapped = tasks.filter((t) => {
      const ns = t.match!.top.map((c) => c.n);
      return ns.some((n) => n % 10 !== 0 && ns.includes((n % 10) * 10 + Math.floor(n / 10)));
    });
    expect(swapped.length / tasks.length).toBeGreaterThan(0.6);
  });
});

describe('Zahlenstrahl (number_line)', () => {
  it('Zielzahlen liegen im Raster, aber nicht auf einer beschrifteten Zahl', () => {
    for (const level of [1, 2, 3] as TaskLevel[]) {
      for (const t of many(numberLine, 'number_line', level)) {
        const n = t.answer as number;
        const spec =
          t.line ??
          (t.display!.visual as { min: number; max: number; ticks: number; labels: number });
        expect(n).toBeGreaterThan(spec.min);
        expect(n).toBeLessThan(spec.max);
        expect((n - spec.min) % spec.labels).not.toBe(0);
        if (t.line) expect(n % t.line.snap).toBe(0);
        else expect((n - spec.min) % spec.ticks).toBe(0);
      }
    }
  });

  it('setzen und ablesen kommen beide vor', () => {
    const kinds = new Set(many(numberLine, 'number_line', 2).map((t) => t.kind));
    expect(kinds).toEqual(new Set(['number-line', 'number-input']));
  });

  it('auf Stufe 3 genügt „ungefähr“ (± 2); ein Zehner daneben wird erkannt', () => {
    const t = many(numberLine, 'number_line', 3).find((x) => x.line && (x.answer as number) > 10)!;
    const n = t.answer as number;
    expect(check(t, String(n + 2)).correct).toBe(true);
    expect(check(t, String(n - 2)).correct).toBe(true);
    expect(check(t, String(n + 4))).toEqual({ correct: false, errorTag: 'line_near' });
    expect(check(t, String(n + 10))).toEqual({ correct: false, errorTag: 'line_tens' });
  });

  it('auf Stufe 1 und 2 muss der Marker genau sitzen', () => {
    for (const level of [1, 2] as TaskLevel[]) {
      const t = many(numberLine, 'number_line', level).find((x) => x.line)!;
      const n = t.answer as number;
      expect(check(t, String(n)).correct).toBe(true);
      expect(check(t, String(n + t.line!.snap)).correct).toBe(false);
    }
  });
});
