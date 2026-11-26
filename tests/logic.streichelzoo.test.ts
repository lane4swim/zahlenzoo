import { describe, expect, it } from 'vitest';
import { familyParams } from '../src/logic/content';
import {
  addSub10,
  count20,
  groupPoints,
  quickCount20,
  rowPoints,
  scatterPoints,
} from '../src/logic/generators/streichelzoo';
import { createRng } from '../src/logic/rng';
import type { Task, TaskLevel } from '../src/types/task';
import { CONTENT } from './helpers/content';

const params = (family: string, level: number) => familyParams(CONTENT, family, level);
const levels = [1, 2, 3] as TaskLevel[];

/** Gemeinsame Regeln für Klasse 1: höchstens drei Karten, alle verschieden, keine Lösung doppelt. */
function checkCards(task: Task): void {
  if (!task.options) return;
  expect(task.options.length).toBeLessThanOrEqual(3);
  const values = task.options.map((o) => o.value);
  expect(new Set(values).size).toBe(values.length);
  expect(values).toContain(String(task.answer));
}

describe('Streichelzoo: Zählen', () => {
  it('bleibt im Zahlenraum der Stufe, Dinge überlappen nicht', () => {
    const range = { 1: [3, 10], 2: [4, 10], 3: [11, 20] } as const;
    for (const level of levels) {
      for (let seed = 0; seed < 300; seed++) {
        const task = count20(level, createRng(seed), 't', params('count_20', level));
        const n = task.answer as number;
        expect(n).toBeGreaterThanOrEqual(range[level as 1 | 2 | 3][0]);
        expect(n).toBeLessThanOrEqual(range[level as 1 | 2 | 3][1]);
        const visual = task.display!.visual;
        expect(visual.type).toBe('count');
        if (visual.type !== 'count') continue;
        expect(visual.points).toHaveLength(n);
        for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
            const [a, b] = [visual.points[i]!, visual.points[j]!];
            expect(Math.hypot(a[0] - b[0], a[1] - b[1])).toBeGreaterThanOrEqual(56);
          }
        }
        checkCards(task);
      }
    }
  });

  it('ordnet in Fünferreihen: zwei Zehner nebeneinander', () => {
    expect(rowPoints(3)).toEqual([
      [-60, 0],
      [0, 0],
      [60, 0],
    ]);
    const twenty = groupPoints(20);
    const ys = new Set(twenty.map((p) => p[1]));
    expect(ys.size).toBe(2);
    // Lücke zwischen dem 5. und 6. Ding einer Reihe fehlt, zwischen den Zehnern ist sie da
    expect(twenty[5]![0] - twenty[4]![0]).toBeLessThan(0);
    expect(twenty[10]![0] - twenty[4]![0]).toBe(60 + 40);
    expect(scatterPoints(10, createRng(1))).toHaveLength(10);
  });
});

describe('Streichelzoo: Blitzblick', () => {
  it('zeigt in Stufe 1 Würfel- und Fingerbilder, danach Zehnerfelder', () => {
    const types = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      for (const level of levels) {
        const task = quickCount20(level, createRng(seed), 't', params('quick_count_20', level));
        const visual = task.display!.visual;
        expect(task.family).toBe('quick_count_20');
        expect(task.display!.flashMs).toBeGreaterThan(0);
        const n = task.answer as number;
        if (level === 1) {
          types.add(visual.type);
          if (visual.type === 'dice') expect(n).toBeLessThanOrEqual(6);
          if (visual.type === 'fingers') expect(n).toBeLessThanOrEqual(10);
        } else {
          expect(['tenframe', 'dots']).toContain(visual.type);
          expect(n).toBeLessThanOrEqual(level === 2 ? 10 : 20);
        }
        checkCards(task);
      }
    }
    expect(types).toEqual(new Set(['dice', 'fingers']));
  });
});

describe('Streichelzoo: Plus und Minus bis 10', () => {
  it('bleibt bis 10 und ohne negative Ergebnisse', () => {
    for (const level of levels) {
      for (let seed = 0; seed < 300; seed++) {
        const task = addSub10(level, createRng(seed), 't', params('addsub_10', level));
        const m = task.math!;
        expect(m.result).toBeGreaterThanOrEqual(1);
        expect(Math.max(m.a, m.b, m.result)).toBeLessThanOrEqual(10);
        expect(m.op === '+' ? m.a + m.b : m.a - m.b).toBe(m.result);
        if (level === 1) expect(m.op).toBe('+');
        if (level === 2) expect(m.op).toBe('-');
        // Stufen 1 und 2 zeigen immer ein Bild, Stufe 3 nie
        expect(Boolean(task.prompt.picture), `${level} ${seed}`).toBe(level < 3);
        checkCards(task);
      }
    }
  });

  it('mischt in Stufe 3 Plus, Minus und Umkehraufgaben', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const task = addSub10(3, createRng(seed), 't', params('addsub_10', 3));
      seen.add(task.prompt.textKey === 'task.prompt.inverse' ? 'inverse' : task.math!.op);
    }
    expect(seen).toEqual(new Set(['+', '-', 'inverse']));
  });
});
