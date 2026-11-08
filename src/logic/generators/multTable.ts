import { optionsFromErrors, swapDigits } from '../options';
import { kindShare, nums, share } from '../params';
import type { Rng } from '../rng';
import type { FamilyParams } from '../../types/content';
import type {
  Generator,
  Hint,
  Task,
  TaskKind,
  TaskLevel,
  Term,
  TextParams,
  TypicalError,
  Visual,
} from '../../types/task';

/**
 * Elefantenwiese: Einmaleins in Klasse 2 (Spezifikation, Abschnitt 6; KE: mult_core,
 * mult_derive, double_half, Division als Verteilen).
 * Stufe 1: Kernaufgaben (Reihen aus families.json, Start 1, 2, 5, 10); Verdoppeln und Halbieren.
 * Stufe 2: Ableiten aus Kernaufgaben (3 · 4 = 2 · 4 + 4, 9 · 6 = 10 · 6 − 6).
 * Stufe 3: Umkehren und Ergänzen (? · 5 = 35) und Verteilen (20 : 5).
 * Alle Ergebnisse liegen im Zahlenraum bis 100.
 */
export const MULT_TABLE = 'mult_table';

type Variant = {
  terms: Term[];
  answer: number;
  strategyId: string;
  textKey?: string;
  hints: [Hint, Hint, Hint];
  errors: TypicalError[];
  dedupeKey: string;
  gap?: boolean;
};

const dots = (rows: number, cols: number, split?: number): Visual =>
  split === undefined ? { type: 'dots', rows, cols } : { type: 'dots', rows, cols, split };

/** Reihe n: die ersten Vielfachen als Text, z. B. „5, 10, 15“. */
const rowStart = (n: number) => [n, 2 * n, 3 * n].join(', ');

/** Typische Fehler bei a · b. */
function productErrors(a: number, b: number): TypicalError[] {
  const p = a * b;
  const errors: TypicalError[] = [
    { value: p + a, errorTag: 'row_off' },
    { value: p - a, errorTag: 'row_off' },
    { value: a + b, errorTag: 'added' },
  ];
  const swapped = swapDigits(p);
  if (swapped !== undefined) errors.push({ value: swapped, errorTag: 'digits_swapped' });
  errors.push({ value: p + 10, errorTag: 'tens_off' }, { value: p - 10, errorTag: 'tens_off' });
  return errors;
}

/** a · b mit a als Reihe; die Reihenfolge der Faktoren wechselt (Tauschaufgaben). */
function product(
  row: number,
  k: number,
  rng: Rng,
  strategyId: string,
  hint1: Hint,
  hint3: Hint,
  split?: number,
  rows = row,
): Variant {
  // Punktefeld: `rows` Reihen mit je k Punkten (bei 9 · k zehn Reihen, eine fällt weg)
  const visual = dots(rows, k, split);
  const swap = rng.chance(0.5);
  const [x, y] = swap ? [k, row] : [row, k];
  return {
    terms: [x, '·', y, '=', '?'],
    answer: row * k,
    strategyId,
    hints: [
      hint1,
      {
        key:
          split === undefined
            ? 'hint.dots.2'
            : rows > row
              ? 'hint.dots_minus.2'
              : 'hint.dots_split.2',
        params: { rows: row, cols: k },
        visual,
      },
      { ...hint3, visual },
    ],
    errors: productErrors(row, k),
    dedupeKey: `mul:${Math.min(row, k)}:${Math.max(row, k)}`,
  };
}

function core(rng: Rng, fp: FamilyParams): Variant {
  const r = rng.next();
  const doubleShare = share(fp, 'doubleShare');
  if (r < doubleShare) {
    // Verdoppeln
    const n = rng.chance(0.5) ? rng.int(2, 10) : rng.int(11, 50);
    const params: TextParams = { n, result: 2 * n, tens: Math.floor(n / 10) * 10, ones: n % 10 };
    return {
      terms: [2, '·', n, '=', '?'],
      answer: 2 * n,
      strategyId: 'double',
      textKey: 'task.prompt.double',
      hints: [
        { key: n >= 10 && n % 10 !== 0 ? 'hint.double_split.1' : 'hint.double.1', params },
        { key: 'hint.double.2', params, visual: { type: 'hundred', marked: [n] } },
        { key: 'hint.double.3', params },
      ],
      errors: [
        { value: n + 2, errorTag: 'added' },
        { value: 2 * n + 1, errorTag: 'ones_off' },
        { value: 2 * n - 1, errorTag: 'ones_off' },
        { value: 2 * n + 10, errorTag: 'tens_off' },
        { value: 2 * n - 10, errorTag: 'tens_off' },
      ],
      dedupeKey: `dbl:${n}`,
    };
  }
  if (r < doubleShare + share(fp, 'halfShare')) {
    // Halbieren
    const half = rng.chance(0.5) ? rng.int(2, 10) : rng.int(11, 50);
    const n = 2 * half;
    const params: TextParams = { n, half };
    return {
      terms: [n, ':', 2, '=', '?'],
      answer: half,
      strategyId: 'half',
      textKey: 'task.prompt.half',
      hints: [
        { key: 'hint.half.1', params },
        half <= 10
          ? { key: 'hint.dots.2', params: { rows: 2, cols: half }, visual: dots(2, half) }
          : { key: 'hint.half.2', params, visual: { type: 'hundred', marked: [half, n] } },
        { key: 'hint.half.3', params },
      ],
      errors: [
        { value: n * 2, errorTag: 'doubled' },
        { value: n - 2, errorTag: 'subtracted' },
        { value: half + 1, errorTag: 'ones_off' },
        { value: half - 1, errorTag: 'ones_off' },
      ],
      dedupeKey: `half:${n}`,
    };
  }
  const row = rng.pick(nums(fp, 'rows'));
  const k = rng.int(1, 10);
  const params: TextParams = { row, k, result: row * k, seq: rowStart(row) };
  return product(
    row,
    k,
    rng,
    `mult_core_${row}`,
    {
      key: row === 10 ? 'hint.mult_10.1' : row === 1 ? 'hint.mult_1.1' : 'hint.mult_core.1',
      params,
    },
    { key: 'hint.mult.3', params: { steps: `${k} · ${row} = ${row * k}`, result: row * k } },
  );
}

/** Ableitung einer Nicht-Kernreihe aus einer Kernaufgabe. */
const DERIVE: Record<number, { from: number; extra: number; key: string }> = {
  3: { from: 2, extra: 1, key: 'plus' }, // 3 · k = 2 · k + k
  4: { from: 2, extra: 2, key: 'double' }, // 4 · k = 2 · k verdoppelt
  6: { from: 5, extra: 1, key: 'plus' }, // 6 · k = 5 · k + k
  7: { from: 5, extra: 2, key: 'plus' }, // 7 · k = 5 · k + 2 · k
  8: { from: 4, extra: 4, key: 'double' }, // 8 · k = 4 · k verdoppelt
  9: { from: 10, extra: -1, key: 'minus' }, // 9 · k = 10 · k − k
};

function derive(rng: Rng, fp: FamilyParams): Variant {
  const row = rng.pick(nums(fp, 'rows'));
  if (!DERIVE[row]) throw new Error(`mult_table Stufe 2: keine Ableitung für die ${row}er-Reihe`);
  const maxK = Math.min(10, Math.floor(100 / row));
  const k = rng.int(2, maxK);
  const d = DERIVE[row] as { from: number; extra: number; key: string };
  const base = d.from * k;
  const result = row * k;
  let steps: string;
  if (d.key === 'double') steps = `${d.from} · ${k} = ${base}; ${base} + ${base} = ${result}`;
  else if (d.extra < 0) steps = `10 · ${k} = ${base}; ${base} − ${k} = ${result}`;
  else steps = `${d.from} · ${k} = ${base}; ${base} + ${result - base} = ${result}`;
  const params: TextParams = { row, k, from: d.from, base, result };
  // Punktefeld: Kernaufgabe in Orange, der Rest in Blau; bei 9 · k zehn Reihen, die blaue fällt weg
  const split = d.extra < 0 ? row : d.key === 'double' ? row / 2 : d.from;
  return product(
    row,
    k,
    rng,
    `mult_derive_${d.key}`,
    { key: `hint.mult_derive_${d.key}.1`, params },
    { key: 'hint.mult.3', params: { steps, result } },
    split,
    d.extra < 0 ? 10 : row,
  );
}

function inverse(rng: Rng, fp: FamilyParams): Variant {
  const divisors = nums(fp, 'divisors');
  if (rng.chance(share(fp, 'shareShare'))) {
    // Verteilen: n : k
    const k = rng.pick(divisors);
    const q = rng.int(2, Math.min(10, Math.floor(100 / k)));
    const n = k * q;
    const params: TextParams = { n, k, q };
    return {
      terms: [n, ':', k, '=', '?'],
      answer: q,
      strategyId: 'divide_share',
      textKey: 'task.prompt.share',
      hints: [
        { key: 'hint.divide.1', params },
        { key: 'hint.divide.2', params, visual: dots(k, q) },
        { key: 'hint.divide.3', params },
      ],
      errors: [
        { value: n - k, errorTag: 'subtracted' },
        { value: q + 1, errorTag: 'row_off' },
        { value: q - 1, errorTag: 'row_off' },
        { value: n * k, errorTag: 'multiplied' },
      ],
      dedupeKey: `div:${n}:${k}`,
    };
  }
  // Ergänzen: ? · b = c
  const b = rng.pick(divisors);
  const a = rng.int(2, Math.min(10, Math.floor(100 / b)));
  const c = a * b;
  const params: TextParams = { a, b, c };
  return {
    terms: ['?', '·', b, '=', c],
    answer: a,
    strategyId: 'mult_inverse',
    hints: [
      { key: 'hint.mult_inverse.1', params: { ...params, seq: rowStart(b) } },
      { key: 'hint.mult_inverse.2', params, visual: dots(a, b) },
      { key: 'hint.mult_inverse.3', params },
    ],
    errors: [
      { value: c - b, errorTag: 'subtracted' },
      { value: a + 1, errorTag: 'row_off' },
      { value: a - 1, errorTag: 'row_off' },
      { value: c, errorTag: 'gave_total' },
    ],
    dedupeKey: `mgap:${b}:${c}`,
    gap: true,
  };
}

function variant(level: TaskLevel, rng: Rng, params: FamilyParams): Variant {
  if (level <= 1) return core(rng, params);
  if (level === 2) return derive(rng, params);
  return inverse(rng, params);
}

export const multTable: Generator = (level, rng, id, params): Task => {
  const v = variant(level, rng, params);
  // Je Wert nur der erste Fehler, nur Werte im Zahlenraum und verschieden von der Lösung.
  const errors = v.errors.filter(
    (e, i) =>
      e.value >= 0 &&
      e.value <= 100 &&
      e.value !== v.answer &&
      v.errors.findIndex((f) => f.value === e.value) === i,
  );
  const kind: TaskKind = rng.chance(kindShare(params, 'choice'))
    ? 'choice'
    : v.gap
      ? 'gap'
      : 'number-input';
  const task: Task = {
    id,
    family: MULT_TABLE,
    level,
    kind,
    prompt: v.textKey ? { terms: v.terms, textKey: v.textKey } : { terms: v.terms },
    answer: v.answer,
    hints: v.hints,
    strategyId: v.strategyId,
    typicalErrors: errors,
    dedupeKey: v.dedupeKey,
  };
  if (kind === 'choice') task.options = optionsFromErrors(v.answer, errors, rng);
  return task;
};
