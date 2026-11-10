import { optionsFromErrors } from '../options';
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
 * Pinguinfelsen: schnelles Kopfrechnen und Rechnen mit Überlegung (KE Abschnitt 2).
 * - quick_tens („Blitzrechnen“): Stufe 1 Zahlen bis 10 zerlegen (KE decompose_10),
 *   Stufe 2 mit Zehnerzahlen rechnen (tens_calc), Stufe 3 auf Zehner und 100 ergänzen
 *   (complement_tens)
 * - estimate_100: Überschlag wählen, Stufe 3 Ergebnis auf Plausibilität prüfen
 * - path_choice: den richtigen Rechenweg erkennen (Fehler finden)
 */
export const QUICK_TENS = 'quick_tens';
export const ESTIMATE_100 = 'estimate_100';
export const PATH_CHOICE = 'path_choice';

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
// Blitzrechnen

type Quick = {
  terms: Term[];
  answer: number;
  strategyId: string;
  hints: [Hint, Hint, Hint];
  errors: TypicalError[];
};

/** Zahlen bis 10 zerlegen: 10 = 7 + ?, 8 = 3 + ? */
function decompose(rng: Rng): Quick {
  const total = rng.chance(0.5) ? 10 : rng.int(5, 9);
  const a = rng.int(1, total - 1);
  const answer = total - a;
  const p = { total, a, answer };
  return {
    terms: [total, '=', a, '+', '?'],
    answer,
    strategyId: 'decompose_10',
    hints: [
      { key: 'hint.decompose.1', params: p },
      {
        key: 'hint.decompose.2',
        params: p,
        visual: { type: 'tenframe', first: a, second: 0, op: '+' },
      },
      {
        key: 'hint.decompose.3',
        params: p,
        visual: { type: 'tenframe', first: a, second: answer, op: '+' },
      },
    ],
    errors: [
      { value: total, errorTag: 'gave_total' },
      { value: answer + 1, errorTag: 'ones_off' },
      { value: answer - 1, errorTag: 'ones_off' },
      { value: total + a, errorTag: 'added' },
    ],
  };
}

/** Mit Zehnerzahlen rechnen: 40 + 30, 90 − 60, 30 + ? = 80 */
function tensCalc(rng: Rng): Quick {
  const op = rng.pick(['+', '-', 'gap'] as const);
  const a = rng.int(1, 8);
  const b = op === '-' ? rng.int(1, a) : rng.int(1, 9 - a);
  const p = { a: a * 10, b: b * 10, ta: a, tb: b };
  if (op === 'gap') {
    const total = a + b;
    const answer = b * 10;
    return {
      terms: [a * 10, '+', '?', '=', total * 10],
      answer,
      strategyId: 'tens_calc',
      hints: [
        { key: 'hint.tens.1' },
        { key: 'hint.tens.2.gap', params: { ...p, total, tt: total * 10 } },
        { key: 'hint.tens.3', params: { calc: `${a} Z + ${b} Z = ${total} Z`, answer } },
      ],
      errors: [
        { value: total * 10, errorTag: 'gave_total' },
        { value: b, errorTag: 'tens_as_ones' },
        { value: answer + 10, errorTag: 'tens_off' },
      ],
    };
  }
  const answer = op === '+' ? (a + b) * 10 : (a - b) * 10;
  const r = answer / 10;
  return {
    terms: [a * 10, op, b * 10, '=', '?'],
    answer,
    strategyId: 'tens_calc',
    hints: [
      { key: 'hint.tens.1' },
      { key: `hint.tens.2.${op === '+' ? 'plus' : 'minus'}`, params: p },
      {
        key: 'hint.tens.3',
        params: { calc: `${a} Z ${op === '+' ? '+' : '−'} ${b} Z = ${r} Z`, answer },
      },
    ],
    errors: [
      { value: r, errorTag: 'tens_as_ones' },
      { value: op === '+' ? (a - b) * 10 : (a + b) * 10, errorTag: 'wrong_operation' },
      { value: answer + 10, errorTag: 'tens_off' },
      { value: answer - 10, errorTag: 'tens_off' },
    ],
  };
}

/** Auf Zehner und 100 ergänzen: 47 + ? = 50, 38 + ? = 100, 60 + ? = 100 */
function complement(rng: Rng): Quick {
  const toHundred = rng.chance(0.6);
  let a = toHundred ? rng.int(11, 95) : rng.int(11, 89);
  if (!toHundred && a % 10 === 0) a++;
  const target = toHundred ? 100 : Math.ceil(a / 10) * 10;
  const answer = target - a;
  const toTen = (10 - (a % 10)) % 10;
  const jumps = toHundred && toTen > 0 && answer > toTen ? [toTen, answer - toTen] : [answer];
  const p = { a, target, answer, toTen, next: a + toTen };
  return {
    terms: [a, '+', '?', '=', target],
    answer,
    strategyId: 'complement_tens',
    hints: [
      { key: toHundred ? 'hint.complementTens.1.hundred' : 'hint.complementTens.1.ten', params: p },
      {
        key: 'hint.complementTens.2',
        params: p,
        visual: { type: 'jumps', start: a, jumps, hideResults: true },
      },
      { key: 'hint.complementTens.3', params: p, visual: { type: 'jumps', start: a, jumps } },
    ],
    errors: [
      // 38 + 72 = 100: Zehner und Einer je auf 10 ergänzt
      ...(toHundred && a % 10 !== 0
        ? [{ value: (10 - Math.floor(a / 10)) * 10 + (10 - (a % 10)), errorTag: 'complement_both' }]
        : []),
      { value: answer + 10, errorTag: 'tens_off' },
      { value: answer - 10, errorTag: 'tens_off' },
      { value: answer + 1, errorTag: 'ones_off' },
      { value: target, errorTag: 'gave_total' },
    ],
  };
}

export const quickTens: Generator = (level, rng, id, params): Task => {
  const stage = choice(params, 'stage', ['decompose', 'tens', 'complement'] as const);
  const q =
    stage === 'decompose' ? decompose(rng) : stage === 'tens' ? tensCalc(rng) : complement(rng);
  const errors = clean(q.errors, q.answer);
  const cards = rng.chance(kindShare(params, 'choice'));
  return {
    id,
    family: QUICK_TENS,
    level,
    kind: cards ? 'choice' : q.terms.at(-1) === '?' ? 'number-input' : 'gap',
    prompt: { terms: q.terms },
    answer: q.answer,
    ...(cards ? { options: optionsFromErrors(q.answer, errors, rng) } : {}),
    hints: q.hints,
    strategyId: q.strategyId,
    typicalErrors: errors,
    dedupeKey: `quick:${q.terms.join(' ')}`,
  };
};

// ---------------------------------------------------------------------------
// Überschlagen

/** Zahl, deren Einer weit weg von 5 liegen (x1, x2, x8, x9), damit die Rundung eindeutig ist. */
function nearTen(rng: Rng, min: number, max: number): number {
  for (;;) {
    const n = rng.int(min, max);
    if ([1, 2, 8, 9].includes(n % 10)) return n;
  }
}

/** Beliebige Zahl ohne 5 Einer (die Rundung wäre sonst nicht eindeutig). */
function notFive(rng: Rng, min: number, max: number): number {
  for (;;) {
    const n = rng.int(min, max);
    if (n % 10 !== 5 && n % 10 !== 0) return n;
  }
}

const round10 = (n: number) => Math.round(n / 10) * 10;

export const estimate100: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['near', 'any', 'check'] as const);
  const plus = mode === 'near' || rng.chance(0.6);
  let a: number;
  let b: number;
  for (;;) {
    a = mode === 'near' ? nearTen(rng, 11, 79) : notFive(rng, plus ? 11 : 31, 89);
    b = mode === 'near' ? nearTen(rng, 11, 89 - a + 8) : notFive(rng, 11, plus ? 89 : a - 6);
    const result = plus ? a + b : a - b;
    const est = plus ? round10(a) + round10(b) : round10(a) - round10(b);
    if (result > 5 && result < 100 && est >= 10 && est <= 100 && Math.abs(result - est) <= 6) break;
  }
  const op = plus ? '+' : '−';
  const result = plus ? a + b : a - b;
  const est = plus ? round10(a) + round10(b) : round10(a) - round10(b);
  const p: TextParams = {
    task: `${a} ${op} ${b}`,
    ra: round10(a),
    rb: round10(b),
    op,
    est,
    result,
  };
  if (mode === 'check') {
    // Plausibel? Ein gezeigtes Ergebnis ist richtig oder typisch falsch (Übertrag vergessen, ±10, ±20)
    const right = rng.chance(0.4);
    let shown = right ? result : result + rng.pick([-10, 10, 20, -20]);
    if (shown <= 0) shown = result + 10;
    const p2 = { ...p, shown, claim: `${a} ${op} ${b} = ${shown}` };
    const answer = right ? 'yes' : 'no';
    return {
      id,
      family: ESTIMATE_100,
      level,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.plausible', textParams: p2 },
      answer,
      options: [
        {
          value: 'yes',
          label: { key: 'option.plausible.yes' },
          ...(right ? {} : { errorTag: 'plausible_wrong' }),
        },
        {
          value: 'no',
          label: { key: 'option.plausible.no' },
          ...(right ? { errorTag: 'plausible_wrong' } : {}),
        },
      ],
      hints: [
        { key: 'hint.estimate.1' },
        { key: 'hint.estimate.2', params: p2 },
        { key: `hint.estimate.check.3.${answer}`, params: p2 },
      ],
      strategyId: 'estimate_check',
      dedupeKey: `estimate:check:${a}${op}${b}=${shown}`,
    };
  }
  // Überschlag wählen: drei runde Zahlen, eine passt
  const candidates = [est - 20, est + 20, est - 30, est + 30, est - 40].filter(
    (v) => v >= 0 && v <= 100,
  );
  const wrong = rng.shuffle(candidates).slice(0, 2);
  const options: TaskOption[] = rng.shuffle([
    { value: String(est), label: { key: 'option.about', params: { n: est } } },
    ...wrong.map((v) => ({
      value: String(v),
      errorTag: 'estimate_off',
      label: { key: 'option.about', params: { n: v } },
    })),
  ]);
  return {
    id,
    family: ESTIMATE_100,
    level,
    kind: 'choice',
    prompt: { terms: plus ? [a, '+', b] : [a, '-', b], textKey: 'task.prompt.estimate' },
    answer: String(est),
    options,
    hints: [
      { key: 'hint.estimate.1' },
      { key: 'hint.estimate.2', params: p },
      { key: 'hint.estimate.3', params: p },
    ],
    strategyId: 'estimate_100',
    dedupeKey: `estimate:${a}${op}${b}`,
  };
};

// ---------------------------------------------------------------------------
// Rechenweg

const step = (x: number, op: string, y: number, r: number) => `${x} ${op} ${y} = ${r}`;
const path = (...steps: string[]) => steps.join(', ');

export const pathChoice: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['add', 'addCarry', 'sub'] as const);
  let a: number;
  let b: number;
  for (;;) {
    if (mode === 'sub') {
      a = rng.int(31, 98);
      b = rng.int(11, a - 10);
    } else {
      a = rng.int(12, 78);
      b = rng.int(11, 99 - a);
    }
    const carry = (a % 10) + (b % 10) >= 10;
    const borrow = a % 10 < b % 10;
    const tensB = Math.floor(b / 10);
    const onesB = b % 10;
    if (onesB === 0 || tensB === 0) continue;
    if (mode === 'add' && carry) continue;
    if (mode === 'addCarry' && !carry) continue;
    if (mode === 'sub' && !borrow && rng.chance(0.6)) continue;
    break;
  }
  const T = Math.floor(b / 10) * 10;
  const O = b % 10;
  const plus = mode !== 'sub';
  const op = plus ? '+' : '−';
  const mid = plus ? a + T : a - T;
  const result = plus ? a + b : a - b;
  const correct = path(step(a, op, T, mid), step(mid, op, O, result));
  // Typische Fehler: Zehner wie Einer gerechnet, Übertrag im zweiten Schritt vergessen,
  // beim Minus im zweiten Schritt addiert.
  const tensAsOnes = plus
    ? path(step(a, op, T / 10, a + T / 10), step(a + T / 10, op, O, a + T / 10 + O))
    : path(step(a, op, T / 10, a - T / 10), step(a - T / 10, op, O, a - T / 10 - O));
  const secondWrong = plus
    ? path(step(a, op, T, mid), step(mid, op, O, (mid % 10) + O >= 10 ? result - 10 : result + 10))
    : path(step(a, op, T, mid), step(mid, '+', O, mid + O));
  const options: TaskOption[] = rng.shuffle([
    { value: correct },
    { value: tensAsOnes, errorTag: 'path_tens_as_ones' },
    { value: secondWrong, errorTag: plus ? 'path_second_step' : 'path_direction' },
  ]);
  const p = { task: `${a} ${op} ${b}`, a, b, T, O, mid, result };
  return {
    id,
    family: PATH_CHOICE,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: 'task.prompt.pathChoice', textParams: { task: p.task } },
    answer: correct,
    options,
    hints: [
      { key: 'hint.path.1' },
      { key: plus ? 'hint.path.2.plus' : 'hint.path.2.minus', params: p },
      { key: 'hint.path.3', params: { ...p, path: correct } },
    ],
    strategyId: PATH_CHOICE,
    dedupeKey: `path:${a}${op}${b}`,
  };
};
