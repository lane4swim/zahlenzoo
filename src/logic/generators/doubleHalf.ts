import { optionsFromErrors, swapDigits, uniqueErrors } from '../options';
import { choice, kindShare } from '../params';
import type { Rng } from '../rng';
import type { Generator, Task, TextParams, TypicalError, Visual } from '../../types/task';

/**
 * Elefantenwiese: Verdoppeln und Halbieren (KE: double_half, schnelles Kopfrechnen).
 * Stufe 1: bis 20 (Doppelte bis 10 + 10, Hälften gerader Zahlen bis 20), Zehnerfeld.
 * Stufe 2: bis 100 ohne Übergang (23 → 46, 30 → 60; Hälfte von 86, 60).
 * Stufe 3: bis 100 mit Übergang (37 → 74; Hälfte von 70, 74, 50): Zehner und Einer einzeln.
 */
export const DOUBLE_HALF = 'double_half';

type Stage = 'small' | 'plain' | 'carry';

/** Zahl, die verdoppelt wird, je Stufe. */
function doubleBase(stage: Stage, rng: Rng): number {
  if (stage === 'small') return rng.int(2, 10);
  if (stage === 'plain') {
    // Zehnerzahl bis 40 oder Einer bis 4 (kein Übergang): 30, 23, 41
    return rng.chance(0.3) ? rng.int(1, 4) * 10 : rng.int(1, 4) * 10 + rng.int(1, 4);
  }
  // mit Übergang: Einer 5 bis 9 (37 → 74) oder Zehnerzahl über 40 (50 → 100 nur selten)
  return rng.int(1, 4) * 10 + rng.int(5, 9);
}

/** Zahl, die halbiert wird, je Stufe (immer gerade). */
function halfBase(stage: Stage, rng: Rng): number {
  if (stage === 'small') return 2 * rng.int(1, 10);
  if (stage === 'plain') {
    // gerade Zehner und gerade Einer: 86, 60, 42
    return rng.int(1, 4) * 20 + 2 * rng.int(0, 4);
  }
  // ungerade Zehner: 70, 74, 50, 36
  const tens = rng.pick([1, 3, 5, 7, 9]);
  return tens * 10 + 2 * rng.int(0, 4);
}

function doubleTask(n: number, stage: Stage): Omit<Task, 'id' | 'level' | 'kind' | 'family'> {
  const result = 2 * n;
  const tens = Math.floor(n / 10) * 10;
  const ones = n % 10;
  const p: TextParams = { n, result, tens, ones, tens2: 2 * tens, ones2: 2 * ones };
  const visual: Visual =
    stage === 'small'
      ? { type: 'tenframe', first: n, second: n, op: '+' }
      : { type: 'tensones', tens: 2 * (tens / 10), ones: 2 * ones };
  const errors: TypicalError[] = [
    { value: n + 2, errorTag: 'double_plus2' },
    { value: result + 1, errorTag: 'ones_off' },
    { value: result - 1, errorTag: 'ones_off' },
    { value: result - 10, errorTag: 'no_carry' },
    { value: result + 10, errorTag: 'tens_off' },
  ];
  // Übergang vergessen: 37 → 64 (Einer 14 nur als 4 gezählt)
  if (stage === 'carry') errors.push({ value: 2 * tens + ((2 * ones) % 10), errorTag: 'no_carry' });
  const split = stage !== 'small' && tens > 0 && ones > 0;
  return {
    prompt: { terms: ['?'], textKey: 'task.prompt.doubleOf', textParams: { n } },
    answer: result,
    hints: [
      { key: split ? 'hint.dh.double.split.1' : 'hint.double.1', params: p },
      { key: split ? 'hint.dh.double.split.2' : 'hint.dh.double.2', params: p, visual },
      { key: 'hint.double.3', params: p },
    ],
    strategyId: 'double',
    typicalErrors: uniqueErrors(
      errors.filter((e) => e.value > 0 && e.value <= 100),
      result,
    ),
    dedupeKey: `dh:double:${n}`,
  };
}

function halfTask(n: number, stage: Stage): Omit<Task, 'id' | 'level' | 'kind' | 'family'> {
  const half = n / 2;
  const tens = Math.floor(n / 10) * 10;
  const ones = n % 10;
  // Stufe 3: ungerade Zehner zerlegen (74 = 60 + 14), sonst Zehner und Einer einzeln
  const big = stage === 'carry' && tens % 20 !== 0 ? tens - 10 : tens;
  const rest = n - big;
  const p: TextParams = { n, half, tens: big, ones: rest, halfTens: big / 2, halfOnes: rest / 2 };
  const visual: Visual =
    stage === 'small'
      ? { type: 'dots', rows: 2, cols: half }
      : { type: 'tensones', tens: Math.floor(n / 10), ones };
  const errors: TypicalError[] = [
    { value: 2 * n, errorTag: 'doubled' },
    { value: n - 2, errorTag: 'subtracted' },
    { value: half + 1, errorTag: 'ones_off' },
    { value: half - 1, errorTag: 'ones_off' },
    { value: half + 5, errorTag: 'half_tens' },
    { value: half - 5, errorTag: 'half_tens' },
  ];
  // typisch bei ungeraden Zehnern: die übrigen 10 vergessen (74 → 30 + 2 = 32)
  if (stage === 'carry') {
    errors.push({ value: Math.floor(tens / 20) * 10 + ones / 2, errorTag: 'half_tens' });
  }
  const split = stage !== 'small' && ones + (tens - big) > 0 && big > 0;
  const swapped = swapDigits(half);
  if (swapped !== undefined) errors.push({ value: swapped, errorTag: 'digits_swapped' });
  return {
    prompt: { terms: ['?'], textKey: 'task.prompt.halfOf', textParams: { n } },
    answer: half,
    hints: [
      { key: split ? 'hint.dh.half.split.1' : 'hint.half.1', params: p },
      { key: split ? 'hint.dh.half.split.2' : 'hint.dh.half.2', params: p, visual },
      { key: 'hint.half.3', params: p },
    ],
    strategyId: 'half',
    typicalErrors: uniqueErrors(
      errors.filter((e) => e.value > 0 && e.value <= 100),
      half,
    ),
    dedupeKey: `dh:half:${n}`,
  };
}

export const doubleHalf: Generator = (level, rng, id, params): Task => {
  const stage = choice(params, 'stage', ['small', 'plain', 'carry'] as const);
  const half = rng.chance(0.5);
  const base = half
    ? halfTask(halfBase(stage, rng), stage)
    : doubleTask(doubleBase(stage, rng), stage);
  const answer = base.answer as number;
  const errors = base.typicalErrors ?? [];
  const cards = errors.length >= 2 && rng.chance(kindShare(params, 'choice'));
  return {
    id,
    family: DOUBLE_HALF,
    level,
    kind: cards ? 'choice' : 'number-input',
    ...base,
    ...(cards ? { options: optionsFromErrors(answer, errors, rng) } : {}),
  };
};
