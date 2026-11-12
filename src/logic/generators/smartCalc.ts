import { optionsFromErrors, swapDigits } from '../options';
import { choice, kindShare } from '../params';
import type { Rng } from '../rng';
import type {
  Generator,
  Hint,
  Task,
  TaskOption,
  Term,
  TextParams,
  TypicalError,
} from '../../types/task';

/**
 * Pinguinfelsen: Geschickt rechnen (KE: vorteilhaft rechnen; Stufen nach der Klärung mit
 * der Lehrkraft vom 11.11.2026).
 * Stufe 1: Tauschaufgaben (4 + 57 → 57 + 4; Tauschen nur bei Plus).
 * Stufe 2: Nachbaraufgaben aus einer bekannten Aufgabe (25 + 25 = 50 → 25 + 26),
 *          Verdopplungen als Startaufgaben, auch mit Zehnerzahlen und Minus.
 * Stufe 3: Hilfsaufgaben mit glatten Zehnern (47 + 9 über 47 + 10 − 1, 63 − 19 über
 *          63 − 20 + 1).
 */
export const SMART_CALC = 'smart_calc';

const MINUS = '−';
const expr = (a: number, op: '+' | '-', b: number) => `${a} ${op === '+' ? '+' : MINUS} ${b}`;

type Built = Pick<Task, 'prompt' | 'answer' | 'hints' | 'strategyId' | 'dedupeKey'> & {
  options?: TaskOption[];
  errors?: TypicalError[];
};

function clean(errors: readonly TypicalError[], answer: number): TypicalError[] {
  return errors.filter(
    (e, i) =>
      e.value >= 0 &&
      e.value <= 100 &&
      e.value !== answer &&
      errors.findIndex((f) => f.value === e.value) === i,
  );
}

// ---------------------------------------------------------------------------
// Stufe 1: Tauschaufgaben

function swap(rng: Rng): Built {
  const small = rng.int(2, 9);
  let big = rng.int(21, 99 - small);
  if (big % 10 === 0) big++;
  const sum = small + big;
  const p: TextParams = {
    small,
    big,
    sum,
    task: expr(small, '+', big),
    swapped: expr(big, '+', small),
  };
  const hints: [Hint, Hint, Hint] = [
    { key: 'hint.smart.swap.1' },
    {
      key: 'hint.smart.swap.2',
      params: p,
      visual: { type: 'jumps', start: big, jumps: [small], hideResults: true },
    },
    { key: 'hint.smart.swap.3', params: p, visual: { type: 'jumps', start: big, jumps: [small] } },
  ];
  const variant = rng.pick(['compute', 'same', 'allowed'] as const);
  if (variant === 'compute') {
    return {
      prompt: { terms: [small, '+', big, '=', '?'] },
      answer: sum,
      hints,
      strategyId: 'smart_swap',
      dedupeKey: `smart:swap:${small}+${big}`,
      errors: [
        { value: big - small, errorTag: 'wrong_operation' },
        { value: sum + 10, errorTag: 'tens_off' },
        { value: sum - 1, errorTag: 'ones_off' },
      ],
    };
  }
  if (variant === 'same') {
    // Welche Aufgabe hat dasselbe Ergebnis? Nur die Tauschaufgabe.
    const answer = expr(big, '+', small);
    const wrong = [
      { value: expr(big, '-', small), errorTag: 'swap_minus' },
      // Ziffern vertauscht (57 → 75): andere Zahl, anderes Ergebnis
      ...(swapDigits(big) !== undefined && swapDigits(big) !== big
        ? [{ value: expr(swapDigits(big)!, '+', small), errorTag: 'digits_swapped' }]
        : []),
      { value: expr(small + 1, '+', big), errorTag: 'ones_off' },
    ].filter((w, i, all) => w.value !== answer && all.findIndex((x) => x.value === w.value) === i);
    return {
      prompt: {
        terms: [],
        textKey: 'task.prompt.smart.same',
        textParams: { task: p.task as string },
      },
      answer,
      options: rng.shuffle([{ value: answer }, ...wrong.slice(0, 2)]),
      hints,
      strategyId: 'smart_swap',
      dedupeKey: `smart:same:${small}+${big}`,
    };
  }
  // Wo darf man tauschen? Bei Plus ja, bei Minus nicht.
  const a = rng.int(21, 89);
  const b = rng.int(3, 9);
  const plusOk = `${expr(small, '+', big)} = ${expr(big, '+', small)}`;
  const minusWrong = `${expr(a, '-', b)} = ${expr(b, '-', a)}`;
  return {
    prompt: { terms: [], textKey: 'task.prompt.smart.allowed' },
    answer: plusOk,
    options: rng.shuffle([{ value: plusOk }, { value: minusWrong, errorTag: 'swap_minus' }]),
    hints: [
      { key: 'hint.smart.swap.1' },
      { key: 'hint.smart.allowed.2', params: { a, b } },
      { key: 'hint.smart.allowed.3', params: { ok: plusOk } },
    ],
    strategyId: 'smart_swap',
    dedupeKey: `smart:allowed:${small}+${big}:${a}-${b}`,
  };
}

// ---------------------------------------------------------------------------
// Stufe 2: Nachbaraufgaben

function neighbor(rng: Rng): Built {
  const kind = rng.pick(['double', 'tens', 'minus'] as const);
  const delta = rng.pick([1, -1]);
  let a: number;
  let b: number;
  let op: '+' | '-' = '+';
  if (kind === 'double') {
    // Verdopplungen als Startaufgaben (Entscheidung der Lehrkraft)
    a = rng.pick([5, 10, 15, 20, 25, 30, 35, 40, 45]);
    b = a;
  } else if (kind === 'tens') {
    a = 10 * rng.int(1, 8);
    b = 10 * rng.int(1, 9 - a / 10);
  } else {
    op = '-';
    a = 10 * rng.int(3, 10);
    b = 10 * rng.int(1, a / 10 - 1);
  }
  const known = op === '+' ? a + b : a - b;
  const b2 = b + delta;
  const answer = op === '+' ? a + b2 : a - b2;
  // typischer Fehler: in die falsche Richtung angepasst
  const wrongWay = op === '+' ? known - delta : known + delta;
  const p: TextParams = {
    known: `${expr(a, op, b)} = ${known}`,
    task: expr(a, op, b2),
    answer,
    more: delta > 0 ? 1 : 0,
    a,
    b,
    b2,
    knownResult: known,
  };
  const how =
    op === '+' ? (delta > 0 ? 'plusMore' : 'plusLess') : delta > 0 ? 'minusMore' : 'minusLess';
  return {
    prompt: {
      terms: [a, op, b2, '=', '?'],
      textKey: 'task.prompt.smart.neighbor',
      textParams: { known: p.known as string },
    },
    answer,
    hints: [
      { key: 'hint.smart.neighbor.1', params: p },
      { key: `hint.smart.neighbor.2.${how}`, params: p },
      { key: 'hint.smart.neighbor.3', params: p },
    ],
    strategyId: kind === 'double' ? 'smart_neighbor_double' : 'smart_neighbor',
    dedupeKey: `smart:nb:${a}${op}${b2}`,
    errors: [
      { value: wrongWay, errorTag: 'neighbor_direction' },
      { value: known, errorTag: 'neighbor_known' },
      { value: answer + 10, errorTag: 'tens_off' },
    ],
  };
}

// ---------------------------------------------------------------------------
// Stufe 3: Hilfsaufgaben mit glatten Zehnern

function helper(rng: Rng): Built {
  const op = rng.pick(['+', '-'] as const);
  const near = rng.pick([9, 19, 29]);
  const ten = near + 1;
  let a: number;
  for (;;) {
    a = op === '+' ? rng.int(12, 99 - near) : rng.int(near + 12, 98);
    if (a % 10 !== 0) break;
  }
  const answer = op === '+' ? a + near : a - near;
  const mid = op === '+' ? a + ten : a - ten;
  const helperExpr = `${expr(a, op, ten)} ${op === '+' ? MINUS : '+'} 1`;
  const wrongHelper = `${expr(a, op, ten)} ${op === '+' ? '+' : MINUS} 1`;
  const p: TextParams = { a, near, ten, mid, answer, task: expr(a, op, near), helper: helperExpr };
  const jumps = op === '+' ? [ten, -1] : [-ten, 1];
  const hints: [Hint, Hint, Hint] = [
    { key: 'hint.smart.helper.1', params: p },
    {
      key: 'hint.smart.helper.2',
      params: p,
      visual: { type: 'jumps', start: a, jumps, hideResults: true },
    },
    { key: 'hint.smart.helper.3', params: p, visual: { type: 'jumps', start: a, jumps } },
  ];
  // Ausgleich in die falsche Richtung: 47 + 10 + 1 oder 63 − 20 − 1
  const wrongWay = op === '+' ? mid + 1 : mid - 1;
  const variant = rng.pick(['compute', 'compute', 'pick', 'gap'] as const);
  if (variant === 'pick') {
    const other = `${a} ${op === '+' ? MINUS : '+'} ${ten} ${op === '+' ? '+' : MINUS} 1`;
    return {
      prompt: {
        terms: [],
        textKey: 'task.prompt.smart.helper',
        textParams: { task: p.task as string },
      },
      answer: helperExpr,
      options: rng.shuffle([
        { value: helperExpr },
        { value: wrongHelper, errorTag: 'helper_direction' },
        { value: other, errorTag: 'wrong_operation' },
      ]),
      hints,
      strategyId: 'smart_helper',
      dedupeKey: `smart:pick:${a}${op}${near}`,
    };
  }
  if (variant === 'gap') {
    const terms: Term[] = [a, op, near, '=', a, op, ten, op === '+' ? '-' : '+', '?'];
    return {
      prompt: { terms },
      answer: 1,
      hints,
      strategyId: 'smart_helper',
      dedupeKey: `smart:gap:${a}${op}${near}`,
      errors: [
        { value: 10, errorTag: 'helper_correction' },
        { value: 2, errorTag: 'ones_off' },
      ],
    };
  }
  return {
    prompt: { terms: [a, op, near, '=', '?'] },
    answer,
    hints,
    strategyId: 'smart_helper',
    dedupeKey: `smart:helper:${a}${op}${near}`,
    errors: [
      { value: wrongWay, errorTag: 'helper_direction' },
      { value: mid, errorTag: 'helper_no_correction' },
      { value: answer + 10, errorTag: 'tens_off' },
    ],
  };
}

export const smartCalc: Generator = (level, rng, id, params): Task => {
  const stage = choice(params, 'stage', ['swap', 'neighbor', 'helper'] as const);
  const b = stage === 'swap' ? swap(rng) : stage === 'neighbor' ? neighbor(rng) : helper(rng);
  const base = {
    id,
    family: SMART_CALC,
    level,
    prompt: b.prompt,
    hints: b.hints,
    strategyId: b.strategyId,
    dedupeKey: b.dedupeKey,
  };
  if (b.options) return { ...base, kind: 'choice', answer: b.answer, options: b.options };
  const answer = b.answer as number;
  const errors = clean(b.errors ?? [], answer);
  const cards = errors.length >= 2 && rng.chance(kindShare(params, 'choice'));
  const lastIsGap = b.prompt.terms.at(-1) === '?';
  return {
    ...base,
    kind: cards ? 'choice' : lastIsGap ? 'number-input' : 'gap',
    answer,
    typicalErrors: errors,
    ...(cards ? { options: optionsFromErrors(answer, errors, rng) } : {}),
  };
};
