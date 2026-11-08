import { describe, expect, it } from 'vitest';
import { add100, ADD_100 } from '../src/logic/generators/add100';
import { createRng } from '../src/logic/rng';
import {
  appendTask,
  composeRound,
  createRound,
  currentTask,
  hillOrder,
  isFinished,
  levelMix,
  progress,
  recordOutcome,
  summarize,
  TaskFactory,
} from '../src/logic/rounds';
import type { TaskLevel } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

const compose = (level: TaskLevel, seed: number, size?: number) =>
  composeRound({
    family: ADD_100,
    generator: add100,
    params: paramsOf(ADD_100),
    rules: RULES,
    level,
    rng: createRng(seed),
    ...(size ? { size } : {}),
  });

describe('Runde', () => {
  it('läuft von Anfang bis Ende durch', () => {
    let { round } = compose(1, 1);
    expect(progress(round)).toEqual({ done: 0, total: 10 });
    for (let i = 0; i < 10; i++) {
      expect(isFinished(round)).toBe(false);
      expect(currentTask(round)).toBe(round.tasks[i]);
      round = recordOutcome(round, i < 7 ? 'first_try' : i < 9 ? 'with_help' : 'wrong');
    }
    expect(isFinished(round)).toBe(true);
    expect(currentTask(round)).toBeUndefined();
    expect(summarize(round)).toEqual({ total: 10, firstTry: 7, withHelp: 2, wrong: 1 });
    expect(() => recordOutcome(round, 'first_try')).toThrow(RangeError);
  });

  it('hängt Wiederholungen an und ändert den alten Zustand nicht', () => {
    const { round, factory } = compose(2, 3);
    const longer = appendTask(round, factory.next(2));
    expect(longer.tasks).toHaveLength(11);
    expect(round.tasks).toHaveLength(10);
    expect(() => appendTask(longer, longer.tasks[0]!)).toThrow(RangeError);
  });

  it('lehnt leere Runden, doppelte IDs und unpassende Größen ab', () => {
    expect(() => createRound([])).toThrow(RangeError);
    const { round } = compose(1, 1);
    expect(() => createRound([round.tasks[0]!, round.tasks[0]!])).toThrow(RangeError);
    expect(() => compose(1, 1, 7)).toThrow(RangeError);
    expect(() => compose(1, 1, 13)).toThrow(RangeError);
  });
});

describe('Rundenzusammenstellung', () => {
  it('mischt 70 / 20 / 10 aus aktueller, vorheriger und nächster Stufe', () => {
    expect(levelMix(2, 10, RULES)).toEqual([
      [2, 7],
      [1, 2],
      [3, 1],
    ]);
    expect(levelMix(1, 10, RULES)).toEqual([
      [1, 9],
      [2, 1],
    ]);
    expect(levelMix(3, 10, RULES)).toEqual([
      [3, 8],
      [2, 2],
    ]);
    for (const size of [8, 9, 10, 11, 12]) {
      for (const level of [1, 2, 3] as TaskLevel[]) {
        const total = levelMix(level, size, RULES).reduce((sum, [, n]) => sum + n, 0);
        expect(total).toBe(size);
      }
    }
  });

  it('enthält in 1000 Runden keine doppelten Aufgaben, auch keine Tauschaufgaben', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const level = ((seed % 3) + 1) as TaskLevel;
      const { round } = compose(level, seed);
      const keys = round.tasks.map((t) => t.dedupeKey);
      expect(new Set(keys).size).toBe(keys.length);
      const ids = round.tasks.map((t) => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('ordnet leicht ansteigend: schwerste Aufgaben in der Mitte', () => {
    const ordered = hillOrder([1, 1, 1, 1, 2, 2, 2, 3], (n) => n, createRng(1));
    expect(ordered[0]).toBe(1);
    expect(ordered[ordered.length - 1]).toBe(1);
    const peak = ordered.indexOf(3);
    expect(peak).toBeGreaterThan(1);
    expect(peak).toBeLessThan(ordered.length - 2);
    for (let i = 1; i <= peak; i++) expect(ordered[i]!).toBeGreaterThanOrEqual(ordered[i - 1]!);
    for (let i = peak + 1; i < ordered.length; i++) {
      expect(ordered[i]!).toBeLessThanOrEqual(ordered[i - 1]!);
    }
  });

  it('liefert mit TaskFactory immer neue Aufgaben', () => {
    const factory = new TaskFactory(ADD_100, add100, paramsOf(ADD_100), createRng(8));
    const keys = Array.from({ length: 40 }, () => factory.next(1).dedupeKey);
    expect(new Set(keys).size).toBe(40);
  });
});
