import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import {
  allPairs,
  allStacks,
  combinatorics,
  readCalendar,
  readChart,
  readTable,
  tallyChart,
} from '../src/logic/generators/data';
import { createRng } from '../src/logic/rng';
import type { Generator, Task, TaskLevel } from '../src/types/task';
import { paramsOf } from './helpers/content';

const SEEDS = 300;
const DAYS = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];

function tasks(family: string, gen: Generator, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) => gen(level, createRng(s), `t${s}`, P(level)));
}

describe('Strichlisten', () => {
  it('Stufe 1: Antwort ist eine Zeile der Liste; vergessener Querstrich wird erkannt', () => {
    for (const t of tasks('tally_chart', tallyChart, 1)) {
      const v = t.display!.visual;
      if (v.type !== 'tally') throw new Error('Strichliste erwartet');
      expect(v.rows.map((r) => r.n)).toContain(t.answer);
      const n = t.answer as number;
      if (n >= 5) expect(check(t, String(n - Math.floor(n / 5))).errorTag).toBe('tally_cross');
    }
  });

  it('Stufe 2: genau eine Karte ist richtig gebündelt', () => {
    for (const t of tasks('tally_chart', tallyChart, 2)) {
      const right = t.options!.filter((o) => check(t, o.value).correct);
      expect(right).toHaveLength(1);
      expect(right[0]!.tally!.bundled).toBe(true);
    }
  });
});

describe('Tabellen und Diagramme', () => {
  it('Tabellenwerte stammen aus der Tabelle, am meisten ist eindeutig', () => {
    for (const t of tasks('read_table', readTable, 1)) {
      const v = t.display!.visual;
      if (v.type !== 'table') throw new Error('Tabelle erwartet');
      expect(v.rows.flatMap((r) => r.values)).toContain(t.answer);
    }
    for (const t of tasks('read_table', readTable, 2)) {
      const v = t.display!.visual;
      if (v.type !== 'table') continue;
      for (const row of v.rows) expect(new Set(row.values).size).toBe(row.values.length);
    }
  });

  it('Säulen liegen auf der Skala; Linien gezählt statt Werte wird erkannt', () => {
    for (const level of [1, 2, 3] as TaskLevel[]) {
      for (const t of tasks('read_chart', readChart, level)) {
        const v = t.display!.visual;
        if (v.type !== 'bars') throw new Error('Diagramm erwartet');
        for (const item of v.items) {
          expect(item.value % v.step).toBe(0);
          expect(item.value).toBeLessThanOrEqual(v.max);
        }
        if (t.prompt.textKey === 'task.prompt.chart.value' && v.step > 1) {
          expect(check(t, String((t.answer as number) / v.step)).errorTag).toBe('chart_scale');
        }
      }
    }
  });
});

describe('Kalender', () => {
  it('Wochentag passt zum Kalenderblatt', () => {
    let asked = 0;
    for (const t of tasks('read_calendar', readCalendar, 1)) {
      const v = t.display!.visual;
      if (v.type !== 'calendar' || t.kind !== 'choice') continue;
      const d = Number(t.prompt.textParams!.d);
      expect(t.answer).toBe(DAYS[(v.start + d - 1) % 7]);
      asked++;
    }
    expect(asked).toBeGreaterThan(100);
  });

  it('Eine Woche später: plus 7, einen Tag später wird erkannt', () => {
    for (const t of tasks('read_calendar', readCalendar, 2)) {
      if (t.prompt.textKey !== 'task.prompt.calendar.nextWeek') continue;
      const d = Number(t.prompt.textParams!.d);
      expect(t.answer).toBe(d + 7);
      expect(check(t, String(d + 1)).errorTag).toBe('week_day');
    }
  });
});

describe('Möglichkeiten', () => {
  it('Paare und Anordnungen werden richtig gezählt', () => {
    expect(allPairs(['vanilla', 'chocolate', 'strawberry'], ['cone', 'cup'])).toHaveLength(6);
    expect(allStacks(['vanilla', 'chocolate', 'strawberry'], 3)).toHaveLength(6);
    expect(allStacks(['vanilla', 'chocolate', 'strawberry'], 2)).toHaveLength(6);
  });

  it('Welches Eis fehlt: die richtige Karte ist nicht gezeigt, die anderen schon', () => {
    let missing = 0;
    for (const level of [2, 3] as TaskLevel[]) {
      for (const t of tasks('combinatorics', combinatorics, level)) {
        const v = t.display!.visual;
        if (v.type !== 'ice' || !t.options) continue;
        missing++;
        const shown = new Set(v.shown!.map((i) => `${i.base}:${i.scoops.join('-')}`));
        for (const o of t.options) expect(shown.has(o.value)).toBe(o.value !== t.answer);
      }
    }
    expect(missing).toBeGreaterThan(100);
  });

  it('3 Kugeln anordnen: 6 Möglichkeiten, 3 wird als Fehler erkannt', () => {
    const t = tasks('combinatorics', combinatorics, 3).find(
      (u) => u.prompt.textKey === 'task.prompt.ice.stack.3',
    )!;
    expect(t.answer).toBe(6);
    expect(check(t, '3').errorTag).toBe('combo_flavors');
  });
});
