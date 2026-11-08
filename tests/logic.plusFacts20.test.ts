import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { plusFacts20 } from '../src/logic/generators/plusFacts20';
import { createRng } from '../src/logic/rng';
import type { Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const SEEDS = 1000;
const P = paramsOf('plus_facts_20');

function forAllSeeds(level: TaskLevel, fn: (task: Task) => void) {
  for (let seed = 0; seed < SEEDS; seed++) {
    fn(plusFacts20(level, createRng(seed), `t${seed}`, P(level)));
  }
}

describe('plus_facts_20', () => {
  it.each([1, 2, 3] as TaskLevel[])('bleibt in Stufe %i im Zahlenraum bis 20', (level) => {
    forAllSeeds(level, (task) => {
      const m = task.math!;
      expect(m.op === '+' ? m.a + m.b : m.a - m.b).toBe(m.result);
      for (const n of [m.a, m.b, m.result]) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(20);
      }
    });
  });

  it('übt in Stufe 1 Plus bis 10 und das Zerlegen der 10', () => {
    let decompose = 0;
    forAllSeeds(1, ({ math: m, kind }) => {
      expect(m!.op).toBe('+');
      expect(m!.result).toBeLessThanOrEqual(10);
      if (m!.missing === 'b') {
        decompose++;
        expect(m!.result).toBe(10);
        expect(['gap', 'choice']).toContain(kind);
      }
    });
    expect(decompose).toBeGreaterThan(200);
  });

  it('bleibt in Stufe 2 ohne Übergang und übt in Stufe 3 den Zehnerübergang mit Umkehraufgaben', () => {
    forAllSeeds(2, ({ math: m }) => {
      expect(m!.a).toBeGreaterThanOrEqual(10);
      expect(m!.carry).toBe(false);
      expect(m!.result).toBeLessThanOrEqual(19);
    });
    let minus = 0;
    forAllSeeds(3, ({ math: m }) => {
      expect(m!.carry).toBe(true);
      if (m!.op === '-') {
        minus++;
        expect(m!.a).toBeGreaterThan(10);
        expect(m!.result).toBeLessThan(10);
      } else {
        expect(m!.result).toBeGreaterThan(10);
      }
    });
    expect(minus).toBeGreaterThan(200);
  });

  it('zeigt in den Hinweisen das Zehnerfeld', () => {
    forAllSeeds(3, (task) => {
      const [, h2, h3] = task.hints;
      expect(h2.visual?.type).toBe('tenframe');
      expect(h3.visual?.type).toBe('tenframe');
    });
  });

  it.each([1, 2, 3] as TaskLevel[])('liefert in Stufe %i gültige Antwortkarten', (level) => {
    forAllSeeds(level, (task) => {
      if (task.kind !== 'choice') return;
      const values = task.options!.map((o) => Number(o.value));
      expect(new Set(values).size).toBe(4);
      for (const o of task.options!) {
        expect(check(task, o.value).correct).toBe(Number(o.value) === task.answer);
      }
    });
  });
});
