import { describe, expect, it } from 'vitest';
import { check, normalize } from '../src/logic/check';
import { add100 } from '../src/logic/generators/add100';
import { createRng } from '../src/logic/rng';
import { paramsOf } from './helpers/content';
import { additionHints } from '../src/logic/strategy';
import type { MathInfo, Task } from '../src/types/task';

function addTask(a: number, b: number, missing: 'result' | 'b' = 'result'): Task {
  const math: MathInfo = {
    op: '+',
    a,
    b,
    result: a + b,
    missing,
    carry: (a % 10) + (b % 10) >= 10,
  };
  return {
    id: 't',
    family: 'add_100',
    level: 3,
    kind: missing === 'b' ? 'gap' : 'number-input',
    prompt: { terms: [] },
    answer: missing === 'b' ? b : a + b,
    hints: additionHints(math),
    math,
    dedupeKey: 'k',
  };
}

describe('normalize', () => {
  it('entfernt Leerzeichen und führende Nullen', () => {
    expect(normalize(' 073 ')).toBe('73');
    expect(normalize('0')).toBe('0');
    expect(normalize('000')).toBe('0');
    expect(normalize('7 3')).toBe('73');
    expect(normalize('   ')).toBeUndefined();
  });
});

describe('check', () => {
  const task = addTask(47, 26);

  it('erkennt richtige Antworten in jedem Format', () => {
    expect(check(task, 73)).toEqual({ correct: true });
    expect(check(task, '73')).toEqual({ correct: true });
    expect(check(task, ' 073 ')).toEqual({ correct: true });
  });

  it('meldet ungültige Eingaben, ohne sie als Fehler zu werten', () => {
    expect(check(task, '')).toEqual({ correct: false, invalid: true });
    expect(check(task, 'abc')).toEqual({ correct: false, invalid: true });
    expect(check(task, [73])).toEqual({ correct: false, invalid: true });
    expect(check(task, Number.NaN)).toEqual({ correct: false, invalid: true });
  });

  it('ordnet typische Fehler einem errorTag zu', () => {
    expect(check(task, 63)).toEqual({ correct: false, errorTag: 'carry_forgotten' });
    expect(check(task, 37)).toEqual({ correct: false, errorTag: 'digits_swapped' });
    expect(check(task, 83)).toEqual({ correct: false, errorTag: 'tens_off' });
    expect(check(task, 74)).toEqual({ correct: false, errorTag: 'ones_off' });
    expect(check(task, 72)).toEqual({ correct: false, errorTag: 'ones_off' });
    expect(check(task, 50)).toEqual({ correct: false });
  });

  it('erkennt beim Ergänzen die Endzahl als Fehler', () => {
    const gap = addTask(47, 26, 'b');
    expect(check(gap, 26)).toEqual({ correct: true });
    expect(check(gap, 73)).toEqual({ correct: false, errorTag: 'gave_total' });
  });

  it('nimmt den errorTag einer angetippten Antwortkarte', () => {
    for (let seed = 0; seed < 200; seed++) {
      const t = add100(2, createRng(seed), 'c', paramsOf('add_100')(2));
      if (t.kind !== 'choice') continue;
      for (const option of t.options!) {
        const result = check(t, option.value);
        expect(result.correct).toBe(Number(option.value) === t.answer);
        if (!result.correct) expect(result.errorTag).toBe(option.errorTag);
      }
    }
  });

  it('erlaubt bei Zahlenlisten eine beliebige Reihenfolge, wenn die Aufgabe das vorsieht', () => {
    const list: Task = { ...task, answer: [40, 7], unordered: true };
    expect(check(list, [7, 40])).toEqual({ correct: true });
    expect(check(list, '40, 7')).toEqual({ correct: true });
    expect(check(list, [7, 41]).correct).toBe(false);
    expect(check({ ...list, unordered: false }, [7, 40]).correct).toBe(false);
  });

  it('vergleicht Text-Antworten ohne Groß- und Kleinschreibung und Leerzeichen', () => {
    const text: Task = { ...task, math: undefined, answer: 'Viertel nach 7' };
    expect(check(text, 'viertel nach 7 ').correct).toBe(true);
    expect(check(text, 'Viertelnach7').correct).toBe(true);
    expect(check(text, 'halb 8').correct).toBe(false);
  });
});
