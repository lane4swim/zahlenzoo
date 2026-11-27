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
import { addSub20, decompose10, shapes1 } from '../src/logic/generators/gradeOne';
import { GENERATORS } from '../src/logic/generators';
import { compare20, numbers20, pairPoints } from '../src/logic/generators/numbers20';
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
    const range = { 1: [2, 10], 2: [4, 10], 3: [11, 20] } as const;
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

describe('Streichelzoo: Zahlen bis 20', () => {
  it('Stufe 1: Zahlwörter bis 10 und Ordnungszahlen bis 5', () => {
    const seen = new Set<string>();
    for (let seed = 0; seed < 300; seed++) {
      const task = numbers20(1, createRng(seed), 't', params('numbers_20', 1));
      const n = task.answer as number;
      if (task.strategyId === 'ordinal') {
        seen.add('ordinal');
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(5);
        const visual = task.display!.visual;
        expect(visual.type === 'count' && visual.marked).toEqual([n - 1]);
      } else {
        seen.add('hear');
        expect(n).toBeLessThanOrEqual(10);
        expect(task.prompt.textParams?.word).toBe(`@num.${n}`);
      }
      checkCards(task);
    }
    expect(seen).toEqual(new Set(['ordinal', 'hear']));
  });

  it('Stufe 2: Zahlenreihe bis 20 mit genau einer Lücke', () => {
    for (let seed = 0; seed < 300; seed++) {
      const task = numbers20(2, createRng(seed), 't', params('numbers_20', 2));
      const terms = task.prompt.terms.filter((t) => t !== ',');
      expect(terms.filter((t) => t === '?')).toHaveLength(1);
      const i = terms.indexOf('?');
      const numbers = terms.map((t, k) => (k === i ? (task.answer as number) : (t as number)));
      numbers.forEach((n, k) => k > 0 && expect(n - numbers[k - 1]!).toBe(1));
      expect(Math.max(...numbers)).toBeLessThanOrEqual(20);
      checkCards(task);
    }
  });

  it('Stufe 3: Zahlenstrahl bis 20 und Zahlwörter 11 bis 20 mit Zahlendreher', () => {
    let teen = false;
    for (let seed = 0; seed < 300; seed++) {
      const task = numbers20(3, createRng(seed), 't', params('numbers_20', 3));
      expect(task.family).toBe('numbers_20');
      const n = task.answer as number;
      expect(n).toBeLessThanOrEqual(20);
      if (task.typicalErrors?.some((e) => e.errorTag === 'teen_swap')) teen = true;
    }
    expect(teen).toBe(true);
  });
});

describe('Streichelzoo: Mehr oder weniger', () => {
  it('Stufe 1: zwei Karten mit Tiergruppen, die richtige hat mehr (weniger) Tiere', () => {
    for (let seed = 0; seed < 300; seed++) {
      const task = compare20(1, createRng(seed), 't', params('compare_20', 1));
      const [left, right] = task.options!;
      const a = left!.group!.n;
      const b = right!.group!.n;
      expect(a).not.toBe(b);
      expect(left!.group!.icon).not.toBe(right!.group!.icon);
      const more = task.prompt.textKey === 'task.prompt.groupsMore';
      const bigger = a > b ? 'left' : 'right';
      expect(task.answer).toBe(more ? bigger : bigger === 'left' ? 'right' : 'left');
    }
  });

  it('Stufe 2 und 3: Zeichen passen, Unterschied ist positiv', () => {
    for (const level of [2, 3] as TaskLevel[]) {
      for (let seed = 0; seed < 300; seed++) {
        const task = compare20(level, createRng(seed), 't', params('compare_20', level));
        if (task.strategyId === 'compare_difference') {
          expect(task.answer as number).toBeGreaterThanOrEqual(1);
          checkCards(task);
          continue;
        }
        const [a, , b] = task.prompt.terms as number[];
        expect(Math.max(a!, b!)).toBeLessThanOrEqual(level === 2 ? 10 : 20);
        expect(task.answer).toBe(a! < b! ? '<' : a! > b! ? '>' : '=');
      }
    }
  });

  it('Paare stehen untereinander, links bündig', () => {
    const p = pairPoints(4, 2);
    expect(p).toHaveLength(6);
    expect(p[0]![0]).toBe(p[4]![0]);
    expect(p[1]![0]).toBe(p[5]![0]);
    expect(p[0]![1]).toBeLessThan(p[4]![1]);
  });
});

describe('Streichelzoo: Eselweide', () => {
  it('Zerlegen: Teile ergeben das Ganze, bis 10', () => {
    for (const level of levels) {
      for (let seed = 0; seed < 300; seed++) {
        const task = decompose10(level, createRng(seed), 't', params('decompose_10', level));
        expect(task.family).toBe('decompose_10');
        expect(task.level).toBe(level);
        const m = task.math!;
        expect(m.a + m.b).toBe(m.result);
        expect(m.result).toBeLessThanOrEqual(level === 1 ? 6 : 10);
        // Stufe 3: Zehnerfreunde, dazwischen Zahlenhäuser
        if (level === 3 && task.display?.visual.type !== 'house') expect(m.result).toBe(10);
        if (level === 2) expect(task.display?.visual.type).toBe('house');
        checkCards(task);
      }
    }
  });

  it('Plus und Minus bis 20: Stufe 1 ohne, Stufe 3 mit Zehnerübergang, Stufe 2 Doppel', () => {
    for (const level of levels) {
      for (let seed = 0; seed < 300; seed++) {
        const task = addSub20(level, createRng(seed), 't', params('addsub_20', level));
        const m = task.math!;
        expect(m.op === '+' ? m.a + m.b : m.a - m.b).toBe(m.result);
        expect(Math.max(m.a, m.b, m.result)).toBeLessThanOrEqual(20);
        expect(m.result).toBeGreaterThanOrEqual(0);
        if (level === 1) {
          expect(m.carry).toBe(false);
          expect(m.a).toBeGreaterThan(10);
        }
        if (level === 2) expect(Math.abs(m.a - m.b)).toBeLessThanOrEqual(1);
        if (level === 3) expect(m.carry).toBe(true);
        checkCards(task);
      }
    }
  });

  it('Lagewörter laufen als eigenes Thema', () => {
    for (const level of levels) {
      const task = GENERATORS.position_1!(level, createRng(3), 't', params('position_1', level));
      expect(task.family).toBe('position_1');
      checkCards(task);
    }
  });
});

describe('Streichelzoo: Ponyhof', () => {
  it('Formen: drei Formenkarten, die gesuchte ist dabei', () => {
    for (const level of [1, 2] as TaskLevel[]) {
      for (let seed = 0; seed < 200; seed++) {
        const task = shapes1(level, createRng(seed), 't', params('shapes_1', level));
        expect(task.options).toHaveLength(3);
        expect(task.options!.every((o) => o.shape)).toBe(true);
        const right = task.options!.filter((o) => o.shape!.kind === task.answer);
        expect(right).toHaveLength(1);
      }
    }
    for (let seed = 0; seed < 200; seed++) {
      const task = shapes1(3, createRng(seed), 't', params('shapes_1', 3));
      const visual = task.display!.visual;
      if (visual.type !== 'shapes') throw new Error('Formen erwartet');
      expect(task.answer).toBeGreaterThanOrEqual(1);
      checkCards(task);
    }
  });

  it('Muster, Geld und Uhr: eigene Themen, höchstens drei Karten, Geld bis 20 €', () => {
    for (const family of ['pattern_1', 'money_20', 'clock_1']) {
      for (const level of levels) {
        for (let seed = 0; seed < 100; seed++) {
          const task = GENERATORS[family]!(level, createRng(seed), 't', params(family, level));
          expect(task.family).toBe(family);
          checkCards(task);
          if (family === 'money_20') {
            expect(task.money!.amount).toBeLessThanOrEqual(level === 1 ? 10 : 20);
          }
        }
      }
    }
  });
});
