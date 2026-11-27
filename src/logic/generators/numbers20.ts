import { choice, num, share } from '../params';
import type { Rng } from '../rng';
import { numberLine } from './represent';
import { PETTING_ICONS, rowPoints, withAnswer } from './streichelzoo';
import type {
  Generator,
  Hint,
  Task,
  TaskOption,
  Term,
  TypicalError,
  Visual,
} from '../../types/task';

/**
 * Meerschweinchen im Streichelzoo (Klasse 1, docs/streichelzoo-klasse-1.md, Abschnitt 4):
 * Zahlen bis 20 (`numbers_20`) und Mehr oder weniger (`compare_20`).
 */
export const NUMBERS_20 = 'numbers_20';
export const COMPARE_20 = 'compare_20';

// ---------------------------------------------------------------------------
// Zahlen bis 20

/** Ordnungszahlen: In einer Reihe von 5 Tieren hat eines ein Häkchen. Das wievielte? */
function ordinal(level: Task['level'], rng: Rng, id: string): Task {
  const k = rng.int(1, 5);
  const icon = rng.pick(PETTING_ICONS);
  const visual: Visual = { type: 'count', icon, points: rowPoints(5), marked: [k - 1] };
  const errors: TypicalError[] = [
    // von rechts gezählt
    ...(k !== 3 ? [{ value: 6 - k, errorTag: 'ordinal_side' }] : []),
    { value: k + 1, errorTag: 'ordinal_off' },
    { value: k - 1, errorTag: 'ordinal_off' },
  ];
  const wrong = errors.filter((e) => e.value >= 1 && e.value <= 5 && e.value !== k).slice(0, 2);
  const card = (value: number, errorTag?: string): TaskOption => ({
    value: String(value),
    label: { key: 'ordinal.short', params: { n: value } },
    ...(errorTag ? { errorTag } : {}),
  });
  return {
    id,
    family: NUMBERS_20,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: 'task.prompt.ordinal' },
    display: { visual },
    answer: k,
    options: rng.shuffle([card(k), ...wrong.map((e) => card(e.value, e.errorTag))]),
    hints: [
      { key: 'hint.ordinal.1' },
      { key: 'hint.ordinal.2', visual },
      { key: 'hint.ordinal.3', params: { n: k }, visual },
    ],
    strategyId: 'ordinal',
    typicalErrors: wrong,
    dedupeKey: `ordinal:${k}`,
  };
}

/** Zahlwort hören (vorgelesen) und die Ziffer antippen oder eintippen. */
function hear(
  level: Task['level'],
  rng: Rng,
  id: string,
  params: Parameters<Generator>[3],
  min: number,
  max: number,
): Task {
  const n = rng.int(min, max);
  const swapped = n >= 11 && n <= 19 ? (n % 10) * 10 + 1 : undefined;
  const errors: TypicalError[] = [
    // 6 und 9 sehen sich ähnlich (gedreht)
    ...(n === 6 ? [{ value: 9, errorTag: 'mirror_digit' }] : []),
    ...(n === 9 ? [{ value: 6, errorTag: 'mirror_digit' }] : []),
    // „zwölf“ hört man als Zwei und Eins: 21 statt 12
    ...(swapped !== undefined && swapped !== n ? [{ value: swapped, errorTag: 'teen_swap' }] : []),
    { value: n + 1, errorTag: 'off_by_one' },
    { value: n - 1, errorTag: 'off_by_one' },
    ...(n > 10 ? [{ value: n - 10, errorTag: 'teen_ten' }] : []),
  ];
  return withAnswer(
    {
      id,
      family: NUMBERS_20,
      level,
      prompt: {
        terms: ['?'],
        textKey: 'task.prompt.hearNumber',
        textParams: { word: `@num.${n}` },
      },
      answer: n,
      hints: [
        { key: n > 10 ? 'hint.hear.1.teen' : 'hint.hear.1' },
        { key: 'hint.hear.2', visual: { type: 'tenframe', first: n, second: 0, op: '+' } },
        { key: 'hint.hear.3', params: { n, word: `@num.${n}` } },
      ],
      strategyId: 'hear_number',
      dedupeKey: `hear:${n}`,
    },
    errors,
    rng,
    // Zahlwort hören und die Zahl antippen: immer mit Karten
    { ...params, kinds: { ...params.kinds, choice: 1 } },
    30,
  );
}

/** Zahlenreihe bis 20 mit einer Lücke: Vorgänger, Nachfolger oder Zahl dazwischen. */
function row(level: Task['level'], rng: Rng, id: string, params: Parameters<Generator>[3]): Task {
  const length = 4;
  const start = rng.int(0, 20 - length + 1);
  const numbers = Array.from({ length }, (_, i) => start + i);
  const missing = rng.int(0, length - 1);
  const answer = numbers[missing]!;
  const terms: Term[] = [];
  numbers.forEach((n, i) => {
    if (i > 0) terms.push(',');
    terms.push(i === missing ? '?' : n);
  });
  const before = numbers[missing - 1];
  const after = numbers[missing + 1];
  return withAnswer(
    {
      id,
      family: NUMBERS_20,
      level,
      prompt: { terms, textKey: 'task.prompt.row20' },
      answer,
      hints: [
        {
          key: before !== undefined ? 'hint.row20.1.after' : 'hint.row20.1.before',
          params: { n: before ?? after! },
        },
        {
          key: 'hint.row20.2',
          params: { from: numbers[0]!, to: numbers[length - 1]! },
          visual: { type: 'line', min: 0, max: 20, ticks: 1, labels: 5, marks: [answer] },
        },
        { key: 'hint.row20.3', params: { n: answer } },
      ],
      strategyId: 'row_20',
      dedupeKey: `row20:${start}:${missing}`,
    },
    [
      // Nachbar auf der falschen Seite: die Zahl davor statt danach
      ...(before !== undefined ? [{ value: before - 1, errorTag: 'neighbor_wrong_side' }] : []),
      ...(after !== undefined ? [{ value: after + 1, errorTag: 'neighbor_wrong_side' }] : []),
      { value: answer + 2, errorTag: 'off_by_one' },
      { value: answer + 10, errorTag: 'teen_ten' },
    ],
    rng,
    params,
  );
}

/**
 * Stufe 1: Zahlwort hören und die Zahl bis 10 wählen; Ordnungszahlen bis 5.
 * Stufe 2: Zahlenreihe bis 20 (Vorgänger, Nachfolger, Lücke).
 * Stufe 3: Zahlenstrahl 0 bis 20 (wie im Affenwald, Stufe 1) und Zahlwörter 11 bis 20
 * (zwölf, nicht einundzwanzig).
 */
export const numbers20: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['hear', 'row', 'line'] as const);
  if (mode === 'hear') {
    if (rng.chance(share(params, 'ordinalShare'))) return ordinal(level, rng, id);
    return hear(level, rng, id, params, 1, 10);
  }
  if (mode === 'row') return row(level, rng, id, params);
  if (rng.chance(share(params, 'lineShare'))) {
    return { ...numberLine(level, rng, id, params), family: NUMBERS_20 };
  }
  return hear(level, rng, id, params, 11, 20);
};

// ---------------------------------------------------------------------------
// Mehr oder weniger

const STEP = 56;

/**
 * Zwei Reihen untereinander, links bündig wie beim Paare bilden: oben `a` Dinge, unten `b`.
 * Was keinen Partner hat, ist der Unterschied.
 */
export function pairPoints(a: number, b: number): Array<[number, number]> {
  const width = (Math.max(a, b) - 1) * STEP;
  const rowOf = (n: number, y: number) =>
    Array.from({ length: n }, (_, i): [number, number] => [Math.round(-width / 2 + i * STEP), y]);
  return [...rowOf(a, -34), ...rowOf(b, 34)];
}

const pairVisual = (a: number, b: number, iconA: string, iconB: string): Visual => ({
  type: 'count',
  icon: iconA,
  points: pairPoints(a, b),
  icons: [...Array<string>(a).fill(iconA), ...Array<string>(b).fill(iconB)],
});

/** Zwei verschiedene Tiere, damit die Größe der Bilder nicht über „mehr“ entscheidet. */
function twoIcons(rng: Rng): [string, string] {
  const [x, y] = rng.shuffle([...PETTING_ICONS]);
  return [x!, y!];
}

/** Stufe 1: Zwei Karten mit Tiergruppen; das Kind tippt die Gruppe mit mehr (weniger) Tieren. */
function groups(level: Task['level'], rng: Rng, id: string, params: Parameters<Generator>[3]) {
  const a = rng.int(2, 10);
  let b = rng.int(2, 10);
  while (b === a) b = rng.int(2, 10);
  const less = rng.chance(share(params, 'lessShare'));
  const [iconA, iconB] = twoIcons(rng);
  const answer = (less ? a < b : a > b) ? 'left' : 'right';
  const options: TaskOption[] = [
    { value: 'left', group: { icon: iconA, n: a } },
    { value: 'right', group: { icon: iconB, n: b } },
  ].map((o) => (o.value === answer ? o : { ...o, errorTag: 'compare_count' }));
  const visual = pairVisual(a, b, iconA, iconB);
  return {
    id,
    family: COMPARE_20,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: less ? 'task.prompt.groupsLess' : 'task.prompt.groupsMore' },
    answer,
    options,
    hints: [
      { key: 'hint.groups.1' },
      { key: 'hint.groups.2', visual },
      {
        key: less ? 'hint.groups.3.less' : 'hint.groups.3.more',
        params: { a, b, n: less ? Math.min(a, b) : Math.max(a, b) },
        visual,
      },
    ] as [Hint, Hint, Hint],
    strategyId: 'compare_groups',
    dedupeKey: `groups:${less}:${a}:${b}`,
  } satisfies Task;
}

const symbolOf = (a: number, b: number) => (a < b ? '<' : a > b ? '>' : '=');

/** Zeichen <, > oder = zwischen zwei Zahlen (Stufe 2 bis 10, Stufe 3 bis 20). */
function symbol(level: Task['level'], rng: Rng, id: string, params: Parameters<Generator>[3]) {
  const max = num(params, 'max');
  const a = rng.int(1, max);
  const b = rng.chance(share(params, 'equalShare')) ? a : rng.int(1, max);
  const answer = symbolOf(a, b);
  const [iconA, iconB] = twoIcons(rng);
  const small = Math.max(a, b) <= 10;
  return {
    id,
    family: COMPARE_20,
    level,
    kind: 'choice',
    prompt: { terms: [a, '?', b], textKey: 'task.prompt.compareSymbol' },
    answer,
    options: rng.shuffle(
      (['<', '>', '='] as const).map((s) =>
        s === answer ? { value: s } : { value: s, errorTag: 'compare_symbol' },
      ),
    ),
    hints: [
      { key: 'hint.symbol20.1' },
      small
        ? { key: 'hint.symbol20.2', params: { a, b }, visual: pairVisual(a, b, iconA, iconB) }
        : {
            key: 'hint.symbol20.2.line',
            params: { a, b },
            visual: { type: 'line', min: 0, max: 20, ticks: 1, labels: 5, marks: [a, b] },
          },
      { key: 'hint.compare.3', params: { a, b, symbol: answer } },
    ] as [Hint, Hint, Hint],
    strategyId: 'compare_symbol_20',
    dedupeKey: `sym20:${a}:${b}`,
  } satisfies Task;
}

/** Wie viele mehr? Zwei Reihen untereinander; der Unterschied ist, was keinen Partner hat. */
function difference(level: Task['level'], rng: Rng, id: string, params: Parameters<Generator>[3]) {
  const a = rng.int(3, 10);
  const b = rng.int(1, a - 1);
  const [iconA, iconB] = twoIcons(rng);
  const visual = pairVisual(a, b, iconA, iconB);
  return withAnswer(
    {
      id,
      family: COMPARE_20,
      level,
      prompt: { terms: ['?'], textKey: 'task.prompt.difference' },
      display: { visual },
      answer: a - b,
      hints: [
        { key: 'hint.difference.1' },
        { key: 'hint.difference.2', params: { a, b }, visual },
        { key: 'hint.difference.3', params: { a, b, n: a - b }, visual },
      ],
      strategyId: 'compare_difference',
      dedupeKey: `diff:${a}:${b}`,
    },
    [
      { value: a + b, errorTag: 'difference_total' },
      { value: a, errorTag: 'operand_echo' },
      { value: a - b + 1, errorTag: 'off_by_one' },
      { value: a - b - 1, errorTag: 'off_by_one' },
    ],
    rng,
    params,
  );
}

/**
 * Stufe 1: Mengen ohne Zahlen vergleichen (Gruppen auf den Karten). Stufe 2: Zeichen
 * <, >, = bis 10. Stufe 3: Zeichen bis 20 und „Wie viele mehr?“ (Paare bilden).
 */
export const compare20: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['groups', 'symbol', 'mixed'] as const);
  if (mode === 'groups') return groups(level, rng, id, params);
  if (mode === 'symbol') return symbol(level, rng, id, params);
  return rng.chance(share(params, 'differenceShare'))
    ? difference(level, rng, id, params)
    : symbol(level, rng, id, params);
};
