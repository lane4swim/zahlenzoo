import { optionsFromErrors, swapDigits } from '../options';
import type { Rng } from '../rng';
import type {
  Generator,
  Hint,
  Task,
  TaskKind,
  TaskLevel,
  Term,
  TypicalError,
} from '../../types/task';

/**
 * Affenwald: Zahlenraum bis 100 (Spezifikation, Abschnitt 5; KE: neighbors_100,
 * number_sequences).
 * Stufe 1: Nachbarzahlen (Vorgänger, Nachfolger, Zahl dazwischen), oft am Zehnerübergang.
 * Stufe 2: Nachbarzehner (40 < 47 < 50).
 * Stufe 3: Zahlenfolgen in 2er-, 5er- und 10er-Schritten, vorwärts und rückwärts.
 */
export const NEIGHBORS_100 = 'neighbors_100';
const MIN = 0;
const MAX = 100;

type Variant = {
  terms: Term[];
  answer: number;
  strategyId: string;
  textKey: string;
  hint1: Hint;
  hint3: Hint;
  known: number[];
  errors: TypicalError[];
};

const inRange = (n: number) => n >= MIN && n <= MAX;

/** Zahlenreihe mit Kommas; die Stelle `missing` wird zur Lücke. */
function row(numbers: readonly number[], missing: number): Term[] {
  const terms: Term[] = [];
  numbers.forEach((n, i) => {
    if (i > 0) terms.push(',');
    terms.push(i === missing ? '?' : n);
  });
  return terms;
}

function neighbors(rng: Rng): Variant {
  // Ein Drittel der Aufgaben liegt am Zehnerübergang (39, 40, 41).
  const c = rng.chance(0.35) ? rng.int(1, 9) * 10 + rng.pick([-1, 0]) : rng.int(1, 99);
  const numbers = [c - 1, c, c + 1];
  const missing = rng.int(0, 2);
  const answer = numbers[missing] as number;
  const strategyId = ['neighbor_pred', 'neighbor_between', 'neighbor_succ'][missing] as string;
  const errors: TypicalError[] = [];
  // Zehnerübergang: 39 → 30 statt 40, 40 → 49 statt 39
  if (missing === 2 && answer % 10 === 0)
    errors.push({ value: answer - 10, errorTag: 'tens_crossing' });
  if (missing === 0 && answer % 10 === 9)
    errors.push({ value: answer + 10, errorTag: 'tens_crossing' });
  if (missing === 0) errors.push({ value: c + 1, errorTag: 'direction' });
  if (missing === 2) errors.push({ value: c - 1, errorTag: 'direction' });
  const swapped = swapDigits(answer);
  if (swapped !== undefined) errors.push({ value: swapped, errorTag: 'digits_swapped' });
  errors.push(
    { value: answer + 10, errorTag: 'tens_off' },
    { value: answer - 10, errorTag: 'tens_off' },
  );
  const known = numbers.filter((_, i) => i !== missing);
  return {
    terms: row(numbers, missing),
    answer,
    strategyId,
    textKey: 'task.prompt.neighbors',
    hint1: { key: `hint.${strategyId}.1`, params: { a: c - 1, c, b: c + 1 } },
    hint3: { key: 'hint.answer.3', params: { answer } },
    known,
    errors,
  };
}

function neighborTens(rng: Rng): Variant {
  let n = rng.int(11, 99);
  if (n % 10 === 0) n += rng.int(1, 9);
  if (n > 99) n = 99;
  const lower = Math.floor(n / 10) * 10;
  const upper = lower + 10;
  const askLower = rng.chance(0.5);
  const answer = askLower ? lower : upper;
  const terms: Term[] = askLower ? ['?', '<', n, '<', upper] : [lower, '<', n, '<', '?'];
  const strategyId = askLower ? 'neighbor_tens_lower' : 'neighbor_tens_upper';
  return {
    terms,
    answer,
    strategyId,
    textKey: 'task.prompt.neighborTens',
    hint1: { key: `hint.${strategyId}.1`, params: { n, tens: Math.floor(n / 10) } },
    hint3: { key: 'hint.neighborTens.3', params: { n, lower, upper } },
    known: [n, askLower ? upper : lower],
    errors: [
      { value: askLower ? upper : lower, errorTag: 'direction' },
      { value: n, errorTag: 'gave_number' },
      { value: answer + (askLower ? -10 : 10), errorTag: 'tens_off' },
      { value: askLower ? n - 1 : n + 1, errorTag: 'ones_off' },
    ],
  };
}

function sequence(rng: Rng): Variant {
  const step = rng.pick([2, 5, 10]);
  const forward = rng.chance(0.7);
  const length = 4;
  const span = step * (length - 1);
  const start = forward ? rng.int(MIN, MAX - span) : rng.int(MIN + span, MAX);
  const delta = forward ? step : -step;
  const numbers = Array.from({ length }, (_, i) => start + i * delta);
  const missing = rng.int(1, length - 1);
  const answer = numbers[missing] as number;
  const prev = numbers[missing - 1] as number;
  const errors: TypicalError[] = [
    { value: prev - delta, errorTag: 'direction' },
    { value: answer + step, errorTag: 'step_off' },
    { value: answer - step, errorTag: 'step_off' },
    { value: answer + 1, errorTag: 'ones_off' },
    { value: answer - 1, errorTag: 'ones_off' },
  ].filter((e) => e.value !== answer);
  const stepText = `${forward ? '+' : '−'}${step}`;
  return {
    terms: row(numbers, missing),
    answer,
    strategyId: forward ? 'sequence_forward' : 'sequence_backward',
    textKey: missing === length - 1 ? 'task.prompt.sequenceNext' : 'task.prompt.sequenceGap',
    hint1: {
      key: 'hint.sequence.1',
      params: { first: numbers[0] as number, second: numbers[1] as number },
    },
    hint3: { key: 'hint.sequence.3', params: { step: stepText, answer } },
    known: numbers.filter((_, i) => i !== missing),
    errors,
  };
}

function variant(level: TaskLevel, rng: Rng): Variant {
  if (level <= 1) return neighbors(rng);
  if (level === 2) return neighborTens(rng);
  return sequence(rng);
}

export const neighbors100: Generator = (level, rng, id): Task => {
  const v = variant(level, rng);
  // Je Wert nur der erste (wichtigste) Fehler, nur Werte im Zahlenraum.
  const errors = v.errors.filter(
    (e, i) =>
      inRange(e.value) &&
      e.value !== v.answer &&
      v.errors.findIndex((f) => f.value === e.value) === i,
  );
  const lastIsGap = v.terms[v.terms.length - 1] === '?';
  const kind: TaskKind = rng.chance(0.35) ? 'choice' : lastIsGap ? 'number-input' : 'gap';
  const task: Task = {
    id,
    family: NEIGHBORS_100,
    level,
    kind,
    prompt: { terms: v.terms, textKey: v.textKey },
    answer: v.answer,
    hints: [
      v.hint1,
      {
        key: 'hint.hundred.2',
        visual: { type: 'hundred', marked: v.known.filter((n) => n >= 1) },
      },
      {
        ...v.hint3,
        visual: { type: 'hundred', marked: [...v.known, v.answer].filter((n) => n >= 1) },
      },
    ],
    strategyId: v.strategyId,
    typicalErrors: errors,
    dedupeKey: `nb:${v.terms.join(' ')}`,
  };
  if (kind === 'choice') task.options = optionsFromErrors(v.answer, errors, rng);
  return task;
};
