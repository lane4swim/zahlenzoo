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
 * Giraffenhof: Längen (KE Größen und Messen; ohne Brüche nach Klärung mit der Lehrkraft).
 * - measure_length: am Lineal ablesen; ab Stufe 2 beginnt der Gegenstand nicht bei 0;
 *   Stufe 3 den Unterschied zweier Längen bestimmen
 * - compare_length: gleiche Einheit, m gegen cm, drei Längen
 * - anchor_sizes: Stützpunktvorstellungen (Einheit wählen, passende Länge, länger als 1 m)
 * - length_convert: m und cm umwandeln und mit Längen rechnen
 */
export const MEASURE_LENGTH = 'measure_length';
export const COMPARE_LENGTH = 'compare_length';
export const ANCHOR_SIZES = 'anchor_sizes';
export const LENGTH_CONVERT = 'length_convert';

const RULER_MAX = 15;

function clean(errors: readonly TypicalError[], answer: number, max = 999): TypicalError[] {
  return errors.filter(
    (e, i) =>
      e.value > 0 &&
      e.value <= max &&
      e.value !== answer &&
      errors.findIndex((f) => f.value === e.value) === i,
  );
}

function withInput(
  base: Omit<Task, 'kind'>,
  answer: number,
  errors: TypicalError[],
  rng: Rng,
  share: number,
): Task {
  const cards = errors.length >= 2 && rng.chance(share);
  const lastIsGap =
    base.prompt.terms.length <= 2 ||
    base.prompt.terms.at(-1) === '?' ||
    base.prompt.terms.at(-2) === '?';
  return {
    ...base,
    kind: cards ? 'choice' : lastIsGap ? 'number-input' : 'gap',
    typicalErrors: errors,
    ...(cards ? { options: optionsFromErrors(answer, errors, rng) } : {}),
  };
}

// ---------------------------------------------------------------------------
// Messen

const LOOKS = ['pencil', 'worm', 'feather'] as const;

export const measureLength: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['zero', 'offset', 'difference'] as const);
  const share = kindShare(params, 'choice');
  if (mode === 'difference') {
    const a = rng.int(6, 14);
    const b = rng.int(3, a - 2);
    const p = { a, b, answer: a - b };
    return withInput(
      {
        id,
        family: MEASURE_LENGTH,
        level,
        prompt: { terms: ['?', 'cm'], textKey: 'task.prompt.measure.difference' },
        display: {
          visual: {
            type: 'ruler',
            max: RULER_MAX,
            items: [
              { from: 0, to: b, look: 'worm' },
              { from: 0, to: a, look: 'pencil' },
            ],
          },
        },
        answer: a - b,
        hints: [
          { key: 'hint.measure.difference.1' },
          { key: 'hint.measure.difference.2', params: p },
          { key: 'hint.measure.difference.3', params: p },
        ],
        strategyId: 'measure_difference',
        dedupeKey: `measure:diff:${a}:${b}`,
      },
      a - b,
      clean(
        [
          { value: a, errorTag: 'gave_length' },
          { value: a + b, errorTag: 'added' },
          { value: a - b + 1, errorTag: 'ones_off' },
        ],
        a - b,
      ),
      rng,
      share,
    );
  }
  const look = rng.pick(LOOKS);
  const n = rng.int(3, mode === 'zero' ? RULER_MAX - 1 : 10);
  const from = mode === 'zero' ? 0 : rng.int(1, RULER_MAX - n);
  const to = from + n;
  const p = { from, to, n };
  return withInput(
    {
      id,
      family: MEASURE_LENGTH,
      level,
      prompt: { terms: ['?', 'cm'], textKey: `task.prompt.measure.${look}` },
      display: { visual: { type: 'ruler', max: RULER_MAX, items: [{ from, to, look }] } },
      answer: n,
      hints:
        mode === 'zero'
          ? [
              { key: 'hint.measure.zero.1', params: p },
              { key: 'hint.measure.zero.2', params: p },
              { key: 'hint.measure.zero.3', params: p },
            ]
          : [
              { key: 'hint.measure.offset.1', params: p },
              { key: 'hint.measure.offset.2', params: p },
              { key: 'hint.measure.offset.3', params: p },
            ],
      strategyId: mode === 'zero' ? 'measure_zero' : 'measure_offset',
      dedupeKey: `measure:${mode}:${look}:${from}:${to}`,
    },
    n,
    clean(
      [
        // nicht bei 0 angelegt: das Ende abgelesen, oder Striche statt Abstände gezählt
        ...(from > 0 ? [{ value: to, errorTag: 'ruler_end' }] : []),
        { value: n + 1, errorTag: 'ruler_count_marks' },
        { value: n - 1, errorTag: 'ones_off' },
      ],
      n,
      RULER_MAX,
    ),
    rng,
    share,
  );
};

// ---------------------------------------------------------------------------
// Vergleichen

type Len = { cm: number; label: NonNullable<TaskOption['label']> };

const cmLen = (n: number): Len => ({ cm: n, label: { key: 'length.cm', params: { n } } });
const mLen = (n: number): Len => ({ cm: 100 * n, label: { key: 'length.m', params: { n } } });
const mcmLen = (cm: number): Len =>
  cm % 100 === 0
    ? mLen(cm / 100)
    : { cm, label: { key: 'length.mcm', params: { m: Math.floor(cm / 100), c: cm % 100 } } };

const ref = (l: Len) =>
  `@${l.label.key}|${Object.entries(l.label.params ?? {})
    .map(([k, v]) => `${k}=${v}`)
    .join('|')}`;

export const compareLength: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['same', 'mixed', 'three'] as const);
  let shown: Len[];
  if (mode === 'same') {
    const a = rng.int(12, 98);
    let b = swapDigits(a) ?? rng.int(10, 99);
    if (b === a || rng.chance(0.4)) {
      do b = rng.int(10, 99);
      while (b === a);
    }
    shown = [cmLen(a), cmLen(b)];
  } else if (mode === 'mixed') {
    const m = rng.int(1, 4);
    const off = 10 * rng.pick([-5, -3, -2, -1, 1, 2, 3, 5]);
    const cm = Math.max(10, 100 * m + off);
    shown = rng.shuffle([mLen(m), cmLen(cm)]);
  } else {
    const set = new Set<number>();
    while (set.size < 3) set.add(10 * rng.int(5, 35));
    shown = [...set].map((cm) => (rng.chance(0.5) ? cmLen(cm) : mcmLen(cm)));
  }
  const shortest = mode === 'three' && rng.chance(0.5);
  const answer = shown.reduce((best, l) =>
    shortest ? (l.cm < best.cm ? l : best) : l.cm > best.cm ? l : best,
  );
  const errorTag = mode === 'same' ? 'compare_digits' : 'length_units';
  const which = mode === 'three' ? (shortest ? 'shortest' : 'longest') : 'longer';
  const list: TextParams = Object.fromEntries(
    shown.flatMap((l, i) => [
      [`d${i}`, ref(l)],
      [`m${i}`, l.cm],
    ]),
  );
  const hints: [Hint, Hint, Hint] = [
    { key: mode === 'same' ? 'hint.compare_length.digits.1' : 'hint.compare_length.units.1' },
    mode === 'same'
      ? { key: 'hint.compare_length.2.same' }
      : { key: `hint.compare_length.2.${shown.length}`, params: list },
    { key: `hint.compare_length.3.${which}`, params: { answer: ref(answer) } },
  ];
  return {
    id,
    family: COMPARE_LENGTH,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: `task.prompt.length.${which}` },
    answer: String(answer.cm),
    options: rng.shuffle(
      shown.map((l) => ({
        value: String(l.cm),
        label: l.label,
        ...(l === answer ? {} : { errorTag }),
      })),
    ),
    hints,
    strategyId: COMPARE_LENGTH,
    dedupeKey: `cmplen:${which}:${shown
      .map((l) => l.cm)
      .sort((a, b) => a - b)
      .join('|')}`,
  };
};

// ---------------------------------------------------------------------------
// Stützpunktvorstellungen

/** Gegenstände mit typischer Länge; Texte unter anchor.<id>.* in strings.de.json. */
export const ANCHORS = [
  { id: 'fingernagel', value: 1, unit: 'cm' },
  { id: 'bueroklammer', value: 3, unit: 'cm' },
  { id: 'bleistift', value: 15, unit: 'cm' },
  { id: 'lineal', value: 30, unit: 'cm' },
  { id: 'schuh', value: 20, unit: 'cm' },
  { id: 'schritt', value: 50, unit: 'cm' },
  { id: 'tuer', value: 2, unit: 'm' },
  { id: 'giraffe', value: 5, unit: 'm' },
  { id: 'elefant', value: 3, unit: 'm' },
  { id: 'bus', value: 12, unit: 'm' },
  { id: 'klassenzimmer', value: 8, unit: 'm' },
  { id: 'bett', value: 2, unit: 'm' },
] as const;
type Anchor = (typeof ANCHORS)[number];
const anchorCm = (a: Anchor) => (a.unit === 'm' ? a.value * 100 : a.value);

export const anchorSizes: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['unit', 'value', 'longer'] as const);
  const base = { id, family: ANCHOR_SIZES, level, strategyId: ANCHOR_SIZES };
  if (mode === 'longer') {
    // Was ist länger als 1 m? Genau ein Gegenstand ist länger.
    const longer = rng.pick(ANCHORS.filter((a) => anchorCm(a) > 100));
    const shorter = rng.shuffle(ANCHORS.filter((a) => anchorCm(a) < 100)).slice(0, 2);
    const options: TaskOption[] = rng.shuffle([
      { value: longer.id, label: { key: `anchor.${longer.id}.name` } },
      ...shorter.map((a) => ({
        value: a.id,
        errorTag: 'anchor_size',
        label: { key: `anchor.${a.id}.name` },
      })),
    ]);
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.anchor.longer' },
      answer: longer.id,
      options,
      hints: [
        { key: 'hint.anchor.longer.1' },
        { key: 'hint.anchor.longer.2' },
        { key: 'hint.anchor.3', params: { fact: `@anchor.${longer.id}.fact` } },
      ],
      dedupeKey: `anchor:longer:${longer.id}:${shorter
        .map((a) => a.id)
        .sort()
        .join(',')}`,
    };
  }
  const a = rng.pick(ANCHORS);
  const hints: [Hint, Hint, Hint] = [
    { key: 'hint.anchor.1' },
    { key: a.unit === 'm' ? 'hint.anchor.2.m' : 'hint.anchor.2.cm' },
    { key: 'hint.anchor.3', params: { fact: `@anchor.${a.id}.fact` } },
  ];
  if (mode === 'unit') {
    const other = a.unit === 'cm' ? 'm' : 'cm';
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [], textKey: `anchor.${a.id}.unit` },
      answer: a.unit,
      options: rng.shuffle([
        { value: a.unit, label: { key: `unit.${a.unit}` } },
        { value: other, errorTag: 'unit_wrong', label: { key: `unit.${other}` } },
      ]),
      hints,
      dedupeKey: `anchor:unit:${a.id}`,
    };
  }
  // passende Länge: richtig, Einheit vertauscht, zehnmal so groß oder klein
  const right = { value: a.value, unit: a.unit };
  const wrong = [
    { value: a.value, unit: a.unit === 'cm' ? 'm' : 'cm', errorTag: 'unit_wrong' },
    { value: a.value * 10, unit: a.unit, errorTag: 'anchor_size' },
  ];
  const opt = (v: { value: number; unit: string }) => `${v.value}${v.unit}`;
  return {
    ...base,
    kind: 'choice',
    prompt: { terms: [], textKey: `anchor.${a.id}.how` },
    answer: opt(right),
    options: rng.shuffle([
      {
        value: opt(right),
        label: { key: `length.about.${right.unit}`, params: { n: right.value } },
      },
      ...wrong.map((w) => ({
        value: opt(w),
        errorTag: w.errorTag,
        label: { key: `length.about.${w.unit}`, params: { n: w.value } },
      })),
    ]),
    hints,
    dedupeKey: `anchor:value:${a.id}`,
  };
};

// ---------------------------------------------------------------------------
// Umwandeln

export const lengthConvert: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['whole', 'mixed', 'calc'] as const);
  const share = kindShare(params, 'choice');
  const base = { id, family: LENGTH_CONVERT, level, strategyId: LENGTH_CONVERT };
  let terms: Term[];
  let answer: number;
  let errors: TypicalError[];
  let hints: [Hint, Hint, Hint];
  let key: string;
  if (mode === 'whole') {
    const m = rng.int(1, 9);
    const toCm = rng.chance(0.6);
    terms = toCm ? [m, 'm', '=', '?', 'cm'] : [100 * m, 'cm', '=', '?', 'm'];
    answer = toCm ? 100 * m : m;
    errors = toCm
      ? [
          { value: 10 * m, errorTag: 'hundred_cm' },
          { value: 1000 * m, errorTag: 'hundred_cm' },
        ]
      : [
          { value: 10 * m, errorTag: 'hundred_cm' },
          { value: 100 * m, errorTag: 'hundred_cm' },
        ];
    const p = { m, cm: 100 * m };
    hints = [
      { key: 'hint.length_convert.1' },
      {
        key: toCm ? 'hint.length_convert.whole.2.toCm' : 'hint.length_convert.whole.2.toM',
        params: p,
      },
      { key: 'hint.length_convert.whole.3', params: p },
    ];
    key = `whole:${toCm}:${m}`;
  } else if (mode === 'mixed') {
    const m = rng.int(1, 9);
    const c = rng.chance(0.5) ? 10 * rng.int(1, 9) : rng.int(1, 99);
    const total = 100 * m + c;
    const toCm = rng.chance(0.5);
    terms = toCm ? [m, 'm', c, 'cm', '=', '?', 'cm'] : [total, 'cm', '=', m, 'm', '?', 'cm'];
    answer = toCm ? total : c;
    errors = toCm
      ? [
          ...(c < 10 ? [{ value: Number(`${m}${c}`), errorTag: 'zero_place_cm' }] : []),
          { value: 10 * m + c, errorTag: 'hundred_cm' },
          { value: m + c, errorTag: 'added_units' },
        ]
      : [
          { value: total, errorTag: 'hundred_cm' },
          { value: c + 100, errorTag: 'hundred_cm' },
          { value: c + 10, errorTag: 'tens_off' },
        ];
    const p = { m, c, total, mcm: 100 * m };
    hints = [
      { key: 'hint.length_convert.1' },
      { key: 'hint.length_convert.mixed.2', params: p },
      { key: 'hint.length_convert.mixed.3', params: p },
    ];
    key = `mixed:${toCm}:${total}`;
  } else {
    // Rechnen mit Längen bis 2 m: 1 m − 40 cm = ? cm, 60 cm + 70 cm = 1 m ? cm
    const minus = rng.chance(0.5);
    if (minus) {
      const m = rng.int(1, 2);
      const c = 10 * rng.int(1, 9);
      terms = [m, 'm', '-', c, 'cm', '=', '?', 'cm'];
      answer = 100 * m - c;
      errors = [
        { value: 100 * m + c, errorTag: 'wrong_operation' },
        { value: answer + 10, errorTag: 'tens_off' },
        { value: answer - 10, errorTag: 'tens_off' },
      ];
      const p = { m, c, mcm: 100 * m, answer };
      hints = [
        { key: 'hint.length_convert.1' },
        { key: 'hint.length_convert.calc.2.minus', params: p },
        { key: 'hint.length_convert.calc.3.minus', params: p },
      ];
      key = `calc:-:${m}:${c}`;
    } else {
      const a = 10 * rng.int(3, 9);
      let b = 10 * rng.int(2, 9);
      if (a + b <= 100) b = 110 - a;
      const sum = a + b;
      terms = [a, 'cm', '+', b, 'cm', '=', 1, 'm', '?', 'cm'];
      answer = sum - 100;
      errors = [
        { value: sum, errorTag: 'hundred_cm' },
        { value: answer + 10, errorTag: 'tens_off' },
        { value: answer + 1, errorTag: 'ones_off' },
      ];
      const p = { a, b, sum, answer };
      hints = [
        { key: 'hint.length_convert.1' },
        { key: 'hint.length_convert.calc.2.plus', params: p },
        { key: 'hint.length_convert.calc.3.plus', params: p },
      ];
      key = `calc:+:${a}:${b}`;
    }
  }
  return withInput(
    { ...base, prompt: { terms }, answer, hints, dedupeKey: `lconv:${key}` },
    answer,
    clean(errors, answer),
    rng,
    share,
  );
};
