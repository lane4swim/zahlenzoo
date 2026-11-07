import { describe, expect, it } from 'vitest';
import { placeholderTasks } from '../src/logic/generators/placeholder';
import {
  createRound,
  currentTask,
  isFinished,
  progress,
  recordOutcome,
  summarize,
} from '../src/logic/rounds';

describe('Runde', () => {
  it('läuft eine leere Runde von Anfang bis Ende durch', () => {
    let round = createRound(placeholderTasks(8));
    expect(progress(round)).toEqual({ done: 0, total: 8 });
    expect(currentTask(round)?.id).toBe('placeholder-1');

    for (let i = 0; i < 8; i++) {
      expect(isFinished(round)).toBe(false);
      round = recordOutcome(round, 'first_try');
    }

    expect(isFinished(round)).toBe(true);
    expect(currentTask(round)).toBeUndefined();
    expect(summarize(round)).toEqual({ total: 8, firstTry: 8, withHelp: 0, wrong: 0 });
  });

  it('zählt die Ergebnisarten getrennt', () => {
    let round = createRound(placeholderTasks(3));
    round = recordOutcome(round, 'first_try');
    round = recordOutcome(round, 'with_help');
    round = recordOutcome(round, 'wrong');
    expect(summarize(round)).toEqual({ total: 3, firstTry: 1, withHelp: 1, wrong: 1 });
  });

  it('ändert den bisherigen Zustand nicht', () => {
    const start = createRound(placeholderTasks(2));
    recordOutcome(start, 'first_try');
    expect(progress(start).done).toBe(0);
  });

  it('lehnt leere Runden, doppelte IDs und Antworten nach dem Ende ab', () => {
    expect(() => createRound([])).toThrow(RangeError);
    const [task] = placeholderTasks(1);
    expect(task).toBeDefined();
    expect(() => createRound([task!, task!])).toThrow(RangeError);
    const done = recordOutcome(createRound(placeholderTasks(1)), 'first_try');
    expect(() => recordOutcome(done, 'first_try')).toThrow(RangeError);
  });
});

describe('placeholderTasks', () => {
  it('erzeugt eindeutige IDs und lehnt ungültige Anzahlen ab', () => {
    const tasks = placeholderTasks(12);
    expect(new Set(tasks.map((t) => t.id)).size).toBe(12);
    expect(() => placeholderTasks(0)).toThrow(RangeError);
    expect(() => placeholderTasks(1.5)).toThrow(RangeError);
  });
});
