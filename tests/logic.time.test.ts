import { describe, expect, it } from 'vitest';
import { check } from '../src/logic/check';
import { GENERATORS } from '../src/logic/generators';
import { compareDuration, timeUnits } from '../src/logic/generators/time';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import type { Generator, Task, TaskLevel, Term } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const SEEDS = 400;

function tasks(family: string, gen: Generator, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) => gen(level, createRng(s), `t${s}`, P(level)));
}

/** Minuten einer Seite der Rechnung (Zahlen mit h und min). */
function minutesOf(terms: readonly Term[]): number {
  let sum = 0;
  let pending = 0;
  for (const t of terms) {
    if (typeof t === 'number') pending = t;
    else if (t === 'h') {
      sum += 60 * pending;
      pending = 0;
    } else if (t === 'min') {
      sum += pending;
      pending = 0;
    }
  }
  return sum;
}

/** Minuten seit 0:00 aus „7:30“. */
const clock = (text: string) => {
  const [h, m] = text.split(':').map(Number);
  return h! * 60 + m!;
};

describe('Zeitspannen vergleichen', () => {
  it.each([
    [1, 2, false],
    [2, 2, true],
    [3, 3, true],
  ] as const)(
    'Stufe %i: %i Zeitspannen, verschieden lang, Lösung stimmt',
    (level, count, mixedUnits) => {
      let shortest = 0;
      for (const t of tasks('compare_duration', compareDuration, level)) {
        const values = t.options!.map((o) => Number(o.value));
        expect(values).toHaveLength(count);
        expect(new Set(values).size).toBe(count);
        const want = t.prompt.textKey!.endsWith('shortest')
          ? Math.min(...values)
          : Math.max(...values);
        if (t.prompt.textKey!.endsWith('shortest')) shortest++;
        expect(t.answer).toBe(String(want));
        const keys = new Set(t.options!.map((o) => o.label!.key));
        if (mixedUnits) expect(keys.size).toBeGreaterThan(1);
        else expect(keys.size).toBe(1);
        for (const o of t.options!) expect(check(t, o.value).correct).toBe(o.value === t.answer);
      }
      if (level === 3) expect(shortest).toBeGreaterThan(SEEDS / 4);
    },
  );
});

describe('Zeiteinheiten', () => {
  it('Stufe 1: beide Seiten sind gleich lang', () => {
    const kinds = new Set<string>();
    for (const t of tasks('time_units', timeUnits, 1)) {
      const eq = t.prompt.terms.indexOf('=');
      const filled = t.prompt.terms.map((x) => (x === '?' ? (t.answer as number) : x));
      expect(minutesOf(filled.slice(eq + 1)), JSON.stringify(filled)).toBe(
        minutesOf(filled.slice(0, eq)),
      );
      kinds.add(t.dedupeKey.split(':')[1]!);
      expect(check(t, String(t.answer)).correct).toBe(true);
      if (t.options) expect(new Set(t.options.map((o) => o.value)).size).toBe(t.options.length);
    }
    expect(kinds.size).toBe(3);
  });

  it('Stufe 2: Zeitspannen zwischen zwei Uhrzeiten, meist über die volle Stunde', () => {
    let crossing = 0;
    for (const t of tasks('time_units', timeUnits, 2)) {
      expect(t.prompt.textKey).toBe('task.prompt.units.span');
      const start = clock(String(t.prompt.textParams!.start));
      const end = clock(String(t.prompt.textParams!.end));
      expect(t.answer).toBe(end - start);
      expect(t.answer as number).toBeGreaterThanOrEqual(10);
      expect(t.answer as number).toBeLessThanOrEqual(60);
      expect(end % 5).toBe(0);
      if (Math.floor(end / 60) > Math.floor(start / 60)) crossing++;
      // keine Brüche mehr (Entscheidung der Lehrkraft: ¼, ½, ¾ nicht in Klasse 2)
      expect(JSON.stringify(t)).not.toMatch(/[¼½¾]/);
    }
    expect(crossing).toBeGreaterThan(SEEDS / 2);
  });

  it('erkennt 100 statt 60 Minuten und halb gezählte Zeitspannen', () => {
    const h = tasks('time_units', timeUnits, 1).find((u) => u.dedupeKey === 'units:hToMin:2')!;
    expect(check(h, '200').errorTag).toBe('hundred_minutes');
    const t = tasks('time_units', timeUnits, 2).find(
      (u) => u.prompt.textParams!.start === '7:30' && u.prompt.textParams!.end === '8:15',
    );
    if (t) {
      expect(check(t, '85').errorTag).toBe('hundred_minutes');
      expect(check(t, '30').errorTag).toBe('span_part');
    }
    const any = tasks('time_units', timeUnits, 2).find(
      (u) => (u.typicalErrors ?? []).length === 2,
    )!;
    const [numbers, part] = any.typicalErrors!;
    expect(check(any, String(numbers!.value)).errorTag).toBe('hundred_minutes');
    expect(check(any, String(part!.value)).errorTag).toBe('span_part');
  });

  it('Stufe 3: Tag, Woche, Monat und Jahr', () => {
    const per: Record<string, number> = {
      dayHours: 24,
      weekDays: 7,
      yearMonths: 12,
      hoursDays: 24,
      daysWeeks: 7,
      monthsYears: 12,
    };
    const seen = new Set<string>();
    for (const t of tasks('time_units', timeUnits, 3)) {
      const id = t.prompt.textKey!.replace('task.prompt.units.', '').replace('.one', '');
      seen.add(id);
      const n = Number(t.prompt.textParams!.n);
      const forward = !['hoursDays', 'daysWeeks', 'monthsYears'].includes(id);
      expect(t.answer).toBe(forward ? n * per[id]! : n / per[id]!);
      if (id === 'dayHours') expect(check(t, String(n * 12)).errorTag).toBe('day_hours');
      if (id === 'weekDays') expect(check(t, String(n * 5)).errorTag).toBe('week_days');
    }
    expect(seen.size).toBe(6);
  });
});

describe('Runden der Futteruhr', () => {
  it('lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen', () => {
    for (const family of ['compare_duration', 'time_units']) {
      for (const level of [1, 2, 3] as TaskLevel[]) {
        for (let seed = 0; seed < 40; seed++) {
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
