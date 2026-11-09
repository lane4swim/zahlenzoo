import { describe, expect, it } from 'vitest';
import strings from '../src/data/strings.de.json';
import { check } from '../src/logic/check';
import { analog, digital, hour12, minuteType, timeLabel, wrapDay } from '../src/logic/clock';
import { GENERATORS } from '../src/logic/generators';
import { CLOCK_FAMILIES } from '../src/logic/generators/clock';
import { createRng } from '../src/logic/rng';
import { composeRound } from '../src/logic/rounds';
import { I18n } from '../src/services/i18n';
import type { Task, TaskLevel } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const SEEDS = 400;
const i18n = new I18n();
i18n.load('de', strings);

function tasks(family: string, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, s) =>
    GENERATORS[family]!(level, createRng(s), `t${s}`, P(level)),
  );
}

/** Gesprochene Uhrzeit wie im Spiel. */
const spoken = (time: number) => {
  const { key, params } = timeLabel(time);
  return i18n.t(key, params);
};

describe('Uhrzeiten', () => {
  it('schreibt analog, digital und gesprochen', () => {
    const t = (h: number, m: number) => h * 60 + m;
    expect(analog(t(19, 30))).toBe('7:30');
    expect(analog(t(0, 15))).toBe('12:15');
    expect(digital(t(19, 5))).toBe('19:05');
    expect(hour12(t(12, 0))).toBe(12);
    expect(wrapDay(-30)).toBe(t(23, 30));
    expect(spoken(t(7, 0))).toBe('7 Uhr');
    expect(spoken(t(7, 30))).toBe('halb 8');
    expect(spoken(t(12, 30))).toBe('halb 1');
    expect(spoken(t(7, 15))).toBe('Viertel nach 7');
    expect(spoken(t(7, 45))).toBe('Viertel vor 8');
    expect(minuteType(t(3, 45))).toBe('quarterTo');
    expect(() => minuteType(t(3, 20))).toThrow();
  });
});

describe('Futteruhr', () => {
  it.each([
    ['clock_full', 1, [0]],
    ['clock_half', 1, [30]],
    ['clock_quarter', 1, [15, 45]],
  ] as const)('%s Stufe %i: Uhr lesen mit drei verschiedenen Karten', (family, level, minutes) => {
    for (const t of tasks(family, level)) {
      expect(t.clock!.face).toBe(true);
      expect(minutes).toContain(t.clock!.time % 60);
      expect(t.answer).toBe(analog(t.clock!.time));
      const values = t.options!.map((o) => o.value);
      expect(values).toHaveLength(3);
      expect(new Set(values).size).toBe(3);
      expect(new Set(t.options!.map((o) => i18n.t(o.label!.key, o.label!.params))).size).toBe(3);
      for (const o of t.options!) {
        expect(check(t, o.value).correct).toBe(o.value === t.answer);
        if (o.value !== t.answer) expect(o.errorTag).toBeDefined();
      }
    }
  });

  it('erkennt beim Lesen typische Fehler: halb zur falschen Stunde, Viertel nach statt vor', () => {
    const half = tasks('clock_half', 1).find((t) => t.clock!.time === 7 * 60 + 30)!;
    expect(check(half, '6:30').errorTag).toBe('half_hour_off');
    const quarter = tasks('clock_quarter', 1).find((t) => t.clock!.time % 60 === 45)!;
    const h = hour12(quarter.clock!.time);
    expect(check(quarter, `${h}:15`).errorTag).toBe('quarter_direction');
  });

  it.each([
    ['clock_full', [0]],
    ['clock_half', [0, 30]],
    ['clock_quarter', [15, 45]],
  ] as const)('%s Stufe 2: Zeiger einstellen', (family, minutes) => {
    for (const t of tasks(family, 2)) {
      expect(t.kind).toBe('clock');
      expect(t.clock!.set).toBeDefined();
      expect(minutes).toContain(t.clock!.time % 60);
      expect(t.answer).toBe(analog(t.clock!.time));
      expect(check(t, analog(t.clock!.time)).correct).toBe(true);
      // Prüfung unabhängig von Vormittag und Nachmittag
      expect(check(t, analog(t.clock!.time + 12 * 60)).correct).toBe(true);
      for (const e of t.errorAnswers ?? []) expect(check(t, e.value).errorTag).toBe(e.errorTag);
    }
  });

  it.each([
    ['clock_full', 60],
    ['clock_half', 30],
    ['clock_quarter', 15],
  ] as const)('%s Stufe 3: %i Minuten später oder früher', (family, span) => {
    let forward = 0;
    for (const t of tasks(family, 3)) {
      const later = t.prompt.textKey!.includes('Later');
      if (later) forward++;
      expect(t.prompt.textKey).toMatch(new RegExp(`\\.${span}$`));
      const target = t.clock!.time + (later ? span : -span);
      expect(t.answer).toBe(analog(target));
      const opposite = analog(t.clock!.time + (later ? -span : span));
      expect(check(t, opposite).correct).toBe(false);
      expect(t.options!.map((o) => o.value)).toContain(t.answer);
    }
    expect(forward).toBeGreaterThan(SEEDS / 4);
    expect(forward).toBeLessThan((SEEDS * 3) / 4);
  });

  it('Digitaluhr: vormittags 1 bis 12 Uhr, nachmittags 13 bis 22 Uhr', () => {
    for (const t of tasks('clock_digital', 1)) {
      expect(t.answer).toBe(digital(t.clock!.time));
      expect(Math.floor(t.clock!.time / 60)).toBeLessThanOrEqual(12);
      expect(t.options).toHaveLength(4);
    }
    for (const t of tasks('clock_digital', 2)) {
      const h = Math.floor(t.clock!.time / 60);
      expect(h).toBeGreaterThanOrEqual(13);
      expect(h).toBeLessThanOrEqual(22);
      expect(t.answer).toBe(digital(t.clock!.time));
      expect(check(t, analog(t.clock!.time)).errorTag).toBe('twelve_hours');
      expect(new Set(t.options!.map((o) => o.value)).size).toBe(4);
    }
    for (const t of tasks('clock_digital', 3)) {
      expect(t.kind).toBe('clock');
      expect(t.prompt.textParams!.digital).toBe(digital(t.clock!.time));
      expect(t.answer).toBe(analog(t.clock!.time));
    }
  });

  it('Runden lassen sich in allen Stufen ohne doppelte Aufgaben zusammenstellen', () => {
    for (const family of CLOCK_FAMILIES) {
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
