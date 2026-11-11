import { optionsFromErrors, swapDigits } from '../options';
import { choice, kindShare, num, nums, share } from '../params';
import type { Rng } from '../rng';
import type { FamilyParams } from '../../types/content';
import type {
  Generator,
  Hint,
  Task,
  TaskKind,
  TaskOption,
  Term,
  TypicalError,
  Visual,
} from '../../types/task';

/**
 * Affenwald: Zahlverständnis bis 100 (KE Abschnitt 2). Je Familie drei Stufen:
 * - count_steps_100: vorwärts und rückwärts zählen mit beliebiger Startzahl, über den Zehner
 * - read_write_100: Zahlwörter lesen und als Ziffern schreiben, Zahlwort zur Zahl wählen
 * - place_value_100: Zehner und Einer (Bündeln, Zerlegen, Umbündeln)
 * - quick_count: Blitzblick auf Zehnerfeld und Zehnerstangen (Kraft der 5 und der 10)
 * - compare_100: vergleichen (<, >, =) und ordnen (KE compare_100, order_100)
 */
export const COUNT_STEPS_100 = 'count_steps_100';
export const READ_WRITE_100 = 'read_write_100';
export const PLACE_VALUE_100 = 'place_value_100';
export const QUICK_COUNT = 'quick_count';
export const COMPARE_100 = 'compare_100';

const MAX = 100;

/** Je Wert nur der erste Fehler, nur Werte im Zahlenraum und ungleich der Lösung. */
function clean(errors: readonly TypicalError[], answer: number, max = MAX): TypicalError[] {
  return errors.filter(
    (e, i) =>
      e.value >= 0 &&
      e.value <= max &&
      e.value !== answer &&
      errors.findIndex((f) => f.value === e.value) === i,
  );
}

/** Ziffernblock oder Antwortkarten (Anteil aus families.json) für eine Zahlantwort. */
function numberTask(
  base: Omit<Task, 'kind' | 'options'>,
  rng: Rng,
  params: FamilyParams,
  errors: TypicalError[],
): Task {
  const answer = base.answer as number;
  const cards = errors.length >= 2 && rng.chance(kindShare(params, 'choice'));
  const lastIsGap = base.prompt.terms.at(-1) === '?' || base.prompt.terms.length <= 1;
  const kind: TaskKind = cards ? 'choice' : lastIsGap ? 'number-input' : 'gap';
  return {
    ...base,
    kind,
    typicalErrors: errors,
    ...(cards ? { options: optionsFromErrors(answer, errors, rng) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Zählen

/** Zahlenreihe mit Kommas; die Stelle `missing` wird zur Lücke. */
function row(numbers: readonly number[], missing: number): Term[] {
  const terms: Term[] = [];
  numbers.forEach((n, i) => {
    if (i > 0) terms.push(',');
    terms.push(i === missing ? '?' : n);
  });
  return terms;
}

export const countSteps: Generator = (level, rng, id, params): Task => {
  const step = rng.pick(nums(params, 'steps'));
  const forward = rng.chance(share(params, 'forwardShare'));
  const length = 5;
  const span = step * (length - 1);
  // Bei Einerschritten liegt die Reihe über einem Zehnerübergang (57, 58, 59, 60, 61).
  let start: number;
  if (step === 1) {
    const ten = 10 * rng.int(1, 9);
    start = forward ? ten - rng.int(1, 3) : ten + rng.int(1, 3);
  } else {
    start = forward ? rng.int(1, MAX - span - 1) : rng.int(span, MAX - 1);
    // keine Vielfachen des Schritts als Start, damit es nicht nur die Einmaleinsreihe ist
    if (start % step === 0) start += 1;
  }
  const delta = forward ? step : -step;
  const numbers = Array.from({ length }, (_, i) => start + i * delta);
  const missing = rng.int(1, length - 1);
  const answer = numbers[missing]!;
  const prev = numbers[missing - 1]!;
  const errors = clean(
    [
      // über den Zehner: nach 59 kommt nicht 50 (oder vor 60 nicht 69)
      ...(step === 1 && answer % 10 === 0 && forward
        ? [{ value: answer - 10, errorTag: 'tens_crossing' }]
        : []),
      ...(step === 1 && answer % 10 === 9 && !forward
        ? [{ value: answer + 10, errorTag: 'tens_crossing' }]
        : []),
      { value: prev - delta, errorTag: 'direction' },
      { value: answer + step, errorTag: 'step_off' },
      { value: answer - step, errorTag: 'step_off' },
      ...(step !== 1
        ? [
            { value: answer + 1, errorTag: 'ones_off' },
            { value: answer - 1, errorTag: 'ones_off' },
          ]
        : []),
    ],
    answer,
  );
  const jumps = Array.from({ length: missing }, () => delta);
  return numberTask(
    {
      id,
      family: COUNT_STEPS_100,
      level,
      prompt: {
        terms: row(numbers, missing),
        textKey: missing === length - 1 ? 'task.prompt.sequenceNext' : 'task.prompt.sequenceGap',
      },
      answer,
      hints: [
        { key: `hint.count.1.${forward ? 'forward' : 'back'}`, params: { step } },
        {
          key: 'hint.count.2',
          visual: { type: 'jumps', start: numbers[0]!, jumps, hideResults: true },
        },
        {
          key: 'hint.sequence.3',
          params: { step: `${forward ? '+' : '−'}${step}`, answer },
          visual: { type: 'jumps', start: numbers[0]!, jumps },
        },
      ],
      strategyId: forward ? 'count_forward' : 'count_backward',
      dedupeKey: `count:${numbers.join(',')}:${missing}`,
    },
    rng,
    params,
    errors,
  );
};

// ---------------------------------------------------------------------------
// Zahlen lesen und schreiben

/** Zahl für die Stufe: bis 20 und volle Zehner, sonst 21 bis 99 ohne volle Zehner. */
function readNumber(rng: Rng, small: boolean): number {
  if (small) return rng.chance(0.3) ? 10 * rng.int(1, 10) : rng.int(0, 20);
  let n = rng.int(21, 99);
  if (n % 10 === 0) n++;
  return n;
}

export const readWrite: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['write', 'pick'] as const);
  const n = readNumber(rng, num(params, 'small') === 1);
  const swapped = swapDigits(n);
  const errors = clean(
    [
      ...(swapped !== undefined ? [{ value: swapped, errorTag: 'digits_swapped' }] : []),
      { value: n + 10, errorTag: 'tens_off' },
      { value: n - 10, errorTag: 'tens_off' },
      { value: n + 1, errorTag: 'ones_off' },
      { value: n - 1, errorTag: 'ones_off' },
    ],
    n,
  );
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const hints: [Hint, Hint, Hint] = [
    { key: n > 20 && ones > 0 ? 'hint.readwrite.1.order' : 'hint.readwrite.1' },
    { key: 'hint.readwrite.2', params: { tens, ones }, visual: { type: 'tensones', tens, ones } },
    { key: 'hint.readwrite.3', params: { n, word: `@num.${n}` } },
  ];
  if (mode === 'write') {
    return numberTask(
      {
        id,
        family: READ_WRITE_100,
        level,
        prompt: {
          terms: ['?'],
          textKey: 'task.prompt.writeNumber',
          textParams: { word: `@num.${n}` },
        },
        answer: n,
        hints,
        strategyId: 'read_number_word',
        dedupeKey: `read:write:${n}`,
      },
      rng,
      params,
      errors,
    );
  }
  // Zahlwort wählen: drei Karten mit Zahlwörtern, oft mit Zahlendreher
  const wrong = errors.slice(0, 2);
  const options: TaskOption[] = rng.shuffle([
    { value: String(n), label: { key: `num.${n}` } },
    ...wrong.map((e) => ({
      value: String(e.value),
      errorTag: e.errorTag,
      label: { key: `num.${e.value}` },
    })),
  ]);
  return {
    id,
    family: READ_WRITE_100,
    level,
    kind: 'choice',
    prompt: { terms: [n], textKey: 'task.prompt.pickWord' },
    answer: n,
    options,
    hints,
    strategyId: 'write_number_word',
    typicalErrors: errors,
    dedupeKey: `read:pick:${n}`,
  };
};

// ---------------------------------------------------------------------------
// Zehner und Einer

export const placeValue: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['picture', 'split', 'bundle'] as const);
  if (mode === 'bundle') {
    // Umbündeln: 3 Z 14 E = 44, oder 52 = 4 Z ? E
    const tens = rng.int(1, 8);
    const ones = rng.int(10, 19);
    const n = tens * 10 + ones;
    const back = rng.chance(0.4);
    const answer = back ? ones : n;
    const terms: Term[] = back ? [n, '=', tens, 'Z', '?', 'E'] : [tens, 'Z', ones, 'E', '=', '?'];
    const errors = clean(
      back
        ? [
            { value: ones - 10, errorTag: 'no_bundle' },
            { value: ones + 10, errorTag: 'tens_off' },
          ]
        : [
            { value: Number(`${tens}${ones}`), errorTag: 'no_bundle' },
            { value: n - 10, errorTag: 'no_bundle' },
            { value: n + 10, errorTag: 'tens_off' },
          ],
      answer,
      999,
    );
    const p = { tens, ones, rest: ones - 10, n, bundled: tens + 1 };
    return numberTask(
      {
        id,
        family: PLACE_VALUE_100,
        level,
        prompt: { terms },
        answer,
        hints: [
          { key: 'hint.place.bundle.1' },
          { key: 'hint.place.bundle.2', params: p, visual: { type: 'tensones', tens, ones } },
          {
            key: 'hint.place.bundle.3',
            params: p,
            visual: { type: 'tensones', tens: tens + 1, ones: ones - 10 },
          },
        ],
        strategyId: 'place_bundle',
        dedupeKey: `place:bundle:${terms.join(' ')}`,
      },
      rng,
      params,
      errors,
    );
  }
  let n = rng.int(11, 99);
  if (n % 10 === 0) n++;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const swapped = swapDigits(n);
  const p = { tens, ones, n };
  const visual: Visual = { type: 'tensones', tens, ones };
  if (mode === 'picture') {
    const errors = clean(
      [
        ...(swapped !== undefined ? [{ value: swapped, errorTag: 'digits_swapped' }] : []),
        { value: n + 10, errorTag: 'tens_off' },
        { value: n - 10, errorTag: 'tens_off' },
        { value: n + 1, errorTag: 'ones_off' },
        { value: n - 1, errorTag: 'ones_off' },
      ],
      n,
    );
    return numberTask(
      {
        id,
        family: PLACE_VALUE_100,
        level,
        prompt: { terms: ['?'], textKey: 'task.prompt.howMany' },
        display: { visual },
        answer: n,
        hints: [
          { key: 'hint.place.1' },
          { key: 'hint.place.2', params: p },
          { key: 'hint.place.3', params: p },
        ],
        strategyId: 'place_count',
        dedupeKey: `place:picture:${n}`,
      },
      rng,
      params,
      errors,
    );
  }
  // Zerlegen und zusammensetzen: 4 Z 7 E = ?, 47 = ? Z 7 E, 47 = 4 Z ? E
  const variant = rng.int(0, 2);
  const terms: Term[][] = [
    [tens, 'Z', ones, 'E', '=', '?'],
    [n, '=', '?', 'Z', ones, 'E'],
    [n, '=', tens, 'Z', '?', 'E'],
  ];
  const answer = [n, tens, ones][variant]!;
  const errors = clean(
    variant === 0
      ? [
          ...(swapped !== undefined ? [{ value: swapped, errorTag: 'digits_swapped' }] : []),
          { value: tens + ones, errorTag: 'added_digits' },
          { value: n + 10, errorTag: 'tens_off' },
        ]
      : [
          { value: variant === 1 ? ones : tens, errorTag: 'digits_swapped' },
          { value: variant === 1 ? n - ones : n - tens * 10, errorTag: 'place_value' },
          { value: answer + 1, errorTag: 'ones_off' },
        ],
    answer,
  );
  return numberTask(
    {
      id,
      family: PLACE_VALUE_100,
      level,
      prompt: { terms: terms[variant]! },
      answer,
      hints: [
        { key: 'hint.place.1' },
        { key: 'hint.place.2', params: p, visual },
        { key: 'hint.place.3', params: p, visual },
      ],
      strategyId: 'place_split',
      dedupeKey: `place:split:${variant}:${n}`,
    },
    rng,
    params,
    errors,
  );
};

// ---------------------------------------------------------------------------
// Blitzblick

/** Punktefelder für den Blitzblick: Reihen gleicher Länge (2 × 3, 3 × 3, 2 × 5 …). */
const DOT_FIELDS: Readonly<Record<number, [number, number]>> = {
  4: [2, 2],
  6: [2, 3],
  8: [2, 4],
  9: [3, 3],
  10: [2, 5],
};

export const quickCount: Generator = (level, rng, id, params): Task => {
  const shape = choice(params, 'shape', ['tenframe', 'tensones'] as const);
  let n = rng.int(num(params, 'min'), num(params, 'max'));
  // Stufe 1: manchmal Punktefeld statt Zehnerfeld (andere Struktur, gleiche Idee)
  const field =
    shape === 'tenframe' && params.level.dots === 1 && rng.chance(0.4)
      ? rng.pick(Object.keys(DOT_FIELDS).map(Number))
      : undefined;
  if (field !== undefined) n = field;
  const visual: Visual =
    field !== undefined
      ? { type: 'dots', rows: DOT_FIELDS[field]![0], cols: DOT_FIELDS[field]![1], noLabel: true }
      : shape === 'tenframe'
        ? { type: 'tenframe', first: n, second: 0, op: '+' }
        : { type: 'tensones', tens: Math.floor(n / 10), ones: n % 10 };
  const errors = clean(
    [
      { value: n + 1, errorTag: 'ones_off' },
      { value: n - 1, errorTag: 'ones_off' },
      ...(n > 10
        ? [
            { value: n + 10, errorTag: 'tens_off' },
            { value: n - 10, errorTag: 'tens_off' },
          ]
        : []),
      { value: n + 2, errorTag: 'ones_off' },
    ],
    n,
  );
  const hint1 =
    field !== undefined
      ? 'hint.quick.1.dots'
      : shape === 'tenframe'
        ? 'hint.quick.1.five'
        : 'hint.quick.1.ten';
  const p = { n, tens: Math.floor(n / 10), ones: n % 10 };
  return numberTask(
    {
      id,
      family: QUICK_COUNT,
      level,
      prompt: { terms: ['?'], textKey: 'task.prompt.quickCount' },
      display: { visual, flashMs: num(params, 'flashMs') },
      answer: n,
      hints: [
        { key: hint1 },
        { key: 'hint.quick.2', visual },
        { key: shape === 'tenframe' ? 'hint.quick.3' : 'hint.place.3', params: p, visual },
      ],
      strategyId: 'quick_count',
      dedupeKey: `quick:${visual.type}:${n}`,
    },
    rng,
    params,
    errors,
  );
};

// ---------------------------------------------------------------------------
// Vergleichen und ordnen

const COMPARE_SYMBOLS = ['<', '>', '='] as const;
type CompareSymbol = (typeof COMPARE_SYMBOLS)[number];
const symbolOf = (a: number, b: number): CompareSymbol => (a < b ? '<' : a > b ? '>' : '=');

/** Zwei Zahlen, die sich leicht verwechseln lassen: Zahlendreher oder gleiche Zehner. */
function closePair(rng: Rng): [number, number] {
  let a = rng.int(12, 98);
  if (a % 10 === 0 || a % 11 === 0) a++;
  const swapped = swapDigits(a);
  if (swapped !== undefined && swapped >= 10 && rng.chance(0.5)) return [a, swapped];
  let b = Math.floor(a / 10) * 10 + rng.int(0, 9);
  if (b === a) b = a + (a % 10 === 9 ? -1 : 1);
  return rng.chance(0.5) ? [a, b] : [b, a];
}

function symbolOptions(answer: CompareSymbol, rng: Rng): TaskOption[] {
  return rng.shuffle(
    COMPARE_SYMBOLS.map((s) =>
      s === answer ? { value: s } : { value: s, errorTag: 'compare_symbol' },
    ),
  );
}

export const compare100: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['symbol', 'mixed', 'order'] as const);
  if (mode === 'order') {
    const count = num(params, 'count');
    const set = new Set<number>();
    const [a, b] = closePair(rng);
    set.add(a).add(b);
    while (set.size < count) set.add(rng.int(10, 99));
    const numbers = rng.shuffle([...set]);
    const up = rng.chance(0.5);
    const sorted = [...numbers].sort((x, y) => (up ? x - y : y - x));
    return {
      id,
      family: COMPARE_100,
      level,
      kind: 'order',
      prompt: { terms: [], textKey: up ? 'task.prompt.orderUp' : 'task.prompt.orderDown' },
      answer: sorted,
      options: numbers.map((n) => ({ value: String(n) })),
      hints: [
        { key: 'hint.compare.1' },
        { key: up ? 'hint.order.2.up' : 'hint.order.2.down', params: { first: sorted[0]! } },
        { key: 'hint.order.3', params: { list: sorted.join(up ? ' < ' : ' > ') } },
      ],
      strategyId: 'order_100',
      dedupeKey: `order:${up}:${[...numbers].sort().join(',')}`,
    };
  }
  let left: Term[];
  let right: Term[];
  let a: number;
  let b: number;
  if (mode === 'symbol') {
    [a, b] = closePair(rng);
    left = [a];
    right = [b];
  } else {
    // eine Seite als Zehner und Einer oder als Summe, die andere als Zahl; oft gleich viel
    const n = rng.int(21, 98);
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const other = rng.pick([n, n, swapDigits(n) ?? n + 10, n + 1, n - 10]);
    const form = rng.int(0, 1);
    left = form === 0 ? [tens, 'Z', ones, 'E'] : [tens * 10, '+', ones];
    right = [other];
    a = n;
    b = other;
    if (rng.chance(0.5)) {
      [left, right] = [right, left];
      [a, b] = [b, a];
    }
  }
  const answer = symbolOf(a, b);
  return {
    id,
    family: COMPARE_100,
    level,
    kind: 'choice',
    prompt: { terms: [...left, '?', ...right], textKey: 'task.prompt.compareSymbol' },
    answer,
    options: symbolOptions(answer, rng),
    hints: [
      { key: 'hint.compare.1' },
      { key: mode === 'symbol' ? 'hint.compare.2' : 'hint.compare.2.mixed', params: { a, b } },
      { key: 'hint.compare.3', params: { a, b, symbol: answer } },
    ],
    strategyId: 'compare_100',
    dedupeKey: `compare:${[...left, answer, ...right].join(' ')}`,
  };
};
