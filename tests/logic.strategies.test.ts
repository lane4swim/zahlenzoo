import { describe, expect, it } from 'vitest';
import { add100 } from '../src/logic/generators/add100';
import { sub100 } from '../src/logic/generators/sub100';
import { createRng } from '../src/logic/rng';
import {
  recordStrategy,
  shouldAskStrategy,
  strategyPaths,
  type StrategyWay,
} from '../src/logic/strategies';
import { createProfile } from '../src/services/save';
import type { MathInfo, Task, TaskLevel } from '../src/types/task';
import { paramsOf, RULES } from './helpers/content';

/** Jeder Schritt „x op y = z“ stimmt, und der letzte endet beim Ergebnis. */
function pathIsCorrect(path: string, result: number): boolean {
  const steps = path.split(', ');
  const ok = steps.every((s) => {
    const m = /^(\d+) ([+−]) (\d+) = (\d+)$/.exec(s);
    if (!m) return false;
    const v = m[2] === '+' ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
    return v === Number(m[4]);
  });
  return ok && steps.at(-1)!.endsWith(`= ${result}`);
}

const math = (op: '+' | '-', a: number, b: number): MathInfo => ({
  op,
  a,
  b,
  result: op === '+' ? a + b : a - b,
  missing: 'result',
  carry: true,
});

describe('Rechenwege für „Wie hast du gerechnet?“', () => {
  it('zeigt die Wege am Beispiel 47 + 26 und 63 − 28', () => {
    expect(strategyPaths(math('+', 47, 26))).toEqual({
      places: '40 + 20 = 60, 7 + 6 = 13, 60 + 13 = 73',
      steps: '47 + 20 = 67, 67 + 6 = 73',
    });
    expect(strategyPaths(math('-', 63, 28))).toEqual({
      steps: '63 − 20 = 43, 43 − 8 = 35',
      helper: '63 − 30 = 33, 33 + 2 = 35',
    });
    expect(strategyPaths(math('+', 38, 7))).toEqual({
      steps: '38 + 2 = 40, 40 + 5 = 45',
      helper: '38 + 10 = 48, 48 − 3 = 45',
    });
  });

  it('alle Wege sind für Aufgaben aus Plus und Minus bis 100 richtig', () => {
    for (const [family, gen] of [
      ['add_100', add100],
      ['sub_100', sub100],
    ] as const) {
      for (const level of [2, 3] as TaskLevel[]) {
        for (let seed = 0; seed < 300; seed++) {
          const t = gen(level, createRng(seed), 't', paramsOf(family)(level));
          if (!t.math?.carry || t.math.missing !== 'result') continue;
          const paths = strategyPaths(t.math);
          for (const [way, path] of Object.entries(paths)) {
            expect(pathIsCorrect(path, t.math.result), `${way}: ${path}`).toBe(true);
          }
        }
      }
    }
  });
});

describe('Wann gefragt wird', () => {
  const task = (family: string, carry: boolean): Task =>
    ({
      family,
      math: { ...math('+', 47, 26), carry },
    }) as unknown as Task;

  it('nur bei den Familien aus rules.json, mit Zehnerübergang, höchstens maxPerRound', () => {
    expect(RULES.strategyPick.families).toContain('add_100');
    const always = { strategyPick: { ...RULES.strategyPick, chance: 1 } };
    const rng = createRng(1);
    expect(shouldAskStrategy(task('add_100', true), always, 0, rng)).toBe(true);
    expect(shouldAskStrategy(task('add_100', false), always, 0, rng)).toBe(false);
    expect(shouldAskStrategy(task('mult_table', true), always, 0, rng)).toBe(false);
    expect(
      shouldAskStrategy(task('add_100', true), always, RULES.strategyPick.maxPerRound, rng),
    ).toBe(false);
    const off = { strategyPick: { ...RULES.strategyPick, chance: 0 } };
    expect(shouldAskStrategy(task('add_100', true), off, 0, rng)).toBe(false);
  });

  it('zählt die gewählten Wege je Familie', () => {
    let p = createProfile('Mia', 'owl');
    const ways: StrategyWay[] = ['steps', 'steps', 'places'];
    for (const w of ways) p = recordStrategy(p, 'add_100', w);
    p = recordStrategy(p, 'sub_100', 'other');
    expect(p.strategyUse).toEqual({ add_100: { steps: 2, places: 1 }, sub_100: { other: 1 } });
  });
});
