import { describe, expect, it } from 'vitest';
import { aidsFor, numberLineFor, tenFrameFor } from '../src/logic/aids';
import type { MathInfo, Task } from '../src/types/task';

const task = (math: MathInfo | undefined, terms: Task['prompt']['terms'] = []): Task => ({
  id: 't',
  family: 'f',
  level: 1,
  kind: 'number-input',
  prompt: { terms },
  answer: math ? (math.missing === 'b' ? math.b : math.result) : 0,
  hints: [{ key: 'a' }, { key: 'b' }, { key: 'c' }],
  dedupeKey: 'x',
  ...(math ? { math } : {}),
});
const plus = (a: number, b: number): MathInfo => ({
  op: '+',
  a,
  b,
  result: a + b,
  missing: 'result',
  carry: false,
});

describe('Rechenhilfen', () => {
  it('bis 20: Zehnerfeld und Rechenstrich, keine Hundertertafel (2 + 2)', () => {
    expect(aidsFor(task(plus(2, 2)), false)).toEqual(['tenFrame', 'numberLine']);
    expect(aidsFor(task(plus(2, 2)), true)).toEqual(['tenFrame', 'numberLine']);
  });

  it('über 20: Zehnerstangen, Rechenstrich und Hundertertafel', () => {
    expect(aidsFor(task(plus(47, 26)), false)).toEqual(['tensOnes', 'numberLine', 'hundredBoard']);
  });

  it('ohne Rechnung kein Rechenstrich; Klasse 1 bekommt dann keine Hilfe', () => {
    const compare = task(undefined, [7, '?', 4]);
    expect(aidsFor(compare, false)).toEqual(['tensOnes']);
    expect(aidsFor(compare, true)).toEqual([]);
    expect(aidsFor(task(undefined, [57, '?', 75]), false)).toEqual(['tensOnes', 'hundredBoard']);
    expect(aidsFor(task(undefined, ['?']), false)).toEqual([]);
  });

  it('Rechenstrich zeigt den Sprung; das Ergebnis bleibt verdeckt', () => {
    expect(numberLineFor(plus(2, 2))).toEqual({
      start: 2,
      jumps: [2],
      hideResults: true,
      hideJumps: false,
    });
    const minus: MathInfo = { op: '-', a: 9, b: 4, result: 5, missing: 'result', carry: false };
    expect(numberLineFor(minus).jumps).toEqual([-4]);
  });

  it('Ergänzen: Start und Ziel stehen da, der Sprung ist verdeckt', () => {
    const gap: MathInfo = { op: '+', a: 6, b: 4, result: 10, missing: 'b', carry: false };
    expect(numberLineFor(gap)).toEqual({
      start: 6,
      jumps: [4],
      hideResults: false,
      hideJumps: true,
    });
    expect(tenFrameFor(gap)).toEqual({ first: 6, second: 0, op: '+' });
    expect(tenFrameFor(plus(3, 4))).toEqual({ first: 3, second: 4, op: '+' });
  });
});
