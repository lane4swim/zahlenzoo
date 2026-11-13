import { swapDigits, uniqueErrors } from '../options';
import { choice, num, share } from '../params';
import type { Rng } from '../rng';
import type {
  Generator,
  Hint,
  LineSpec,
  MatchCard,
  ReprKind,
  Task,
  TypicalError,
} from '../../types/task';

/**
 * Affenwald: Darstellungen wechseln (KE 3 und 5, Aufgabenform `match_repr`) und Zahlenstrahl
 * (Spezifikation 6, Eingabeform `number-line`).
 */
export const MATCH_REPR = 'match_repr';
export const NUMBER_LINE = 'number_line';

// ---------------------------------------------------------------------------
// Paare verbinden

const REPRS = ['digits', 'word', 'tensones', 'tenframe'] as const;

/**
 * Zahlen für eine Zuordnung: nah beieinander, damit genaues Hinsehen nötig ist; ab Stufe 2
 * gehört ein Zahlendreher dazu (36 und 63), der typische Fehler beim Lesen.
 */
export function matchNumbers(rng: Rng, min: number, max: number, count: number): number[] {
  const picked = new Set<number>();
  const first = rng.int(min, max);
  picked.add(first);
  const swapped = swapDigits(first);
  if (max > 20 && swapped !== undefined && swapped >= min && swapped <= max) picked.add(swapped);
  let guard = 0;
  while (picked.size < count && guard++ < 200) {
    // meist ein Nachbar (± 1, ± 10), sonst eine beliebige Zahl im Bereich
    const base = rng.pick([...picked]);
    const n = rng.chance(0.6) ? base + rng.pick([-10, -1, 1, 10]) : rng.int(min, max);
    if (n >= min && n <= max) picked.add(n);
  }
  return rng.shuffle([...picked]);
}

export const matchRepr: Generator = (level, rng, id, params): Task => {
  const count = num(params, 'pairs');
  const top = choice(params, 'top', REPRS);
  const bottomKind = choice(params, 'bottom', [...REPRS, 'mixed'] as const);
  const numbers = matchNumbers(rng, num(params, 'min'), num(params, 'max'), count);
  const topCards: MatchCard[] = numbers.map((n) => ({ n, repr: top }));
  const bottomRepr = (): ReprKind =>
    bottomKind === 'mixed' ? rng.pick(['digits', 'tensones'] as const) : bottomKind;
  const bottomCards = rng.shuffle(numbers.map((n): MatchCard => ({ n, repr: bottomRepr() })));
  const answer = topCards.map((c) => bottomCards.findIndex((b) => b.n === c.n));
  const first = topCards[0]!;
  const tens = Math.floor(first.n / 10);
  const ones = first.n % 10;
  const shown = new Set<ReprKind>([top, ...bottomCards.map((c) => c.repr)]);
  const firstKey = shown.has('word')
    ? 'hint.match.word.1'
    : shown.has('tenframe')
      ? 'hint.match.tenframe.1'
      : 'hint.match.tensones.1';
  const hints: [Hint, Hint, Hint] = [
    { key: firstKey },
    {
      key: 'hint.match.2',
      params: { n: first.n, tens, ones },
      visual: { type: 'repr', pairs: [[first, bottomCards[answer[0]!]!]] },
    },
    {
      key: 'hint.match.3',
      visual: {
        type: 'repr',
        pairs: topCards.map((c, i): [MatchCard, MatchCard] => [c, bottomCards[answer[i]!]!]),
      },
    },
  ];
  return {
    id,
    family: MATCH_REPR,
    level,
    kind: 'match',
    prompt: { terms: [], textKey: 'task.prompt.match' },
    answer,
    match: { top: topCards, bottom: bottomCards },
    hints,
    strategyId: shown.has('word') ? 'read_number_word' : 'place_count',
    dedupeKey: `match:${[...numbers].sort((a, b) => a - b).join(',')}`,
  };
};

// ---------------------------------------------------------------------------
// Zahlenstrahl

/** Nächste beschriftete Zahl links und rechts von n. */
function between(n: number, spec: LineSpec): [number, number] {
  const lo = Math.floor((n - spec.min) / spec.labels) * spec.labels + spec.min;
  return [lo === n && n > spec.min ? lo - spec.labels : lo, Math.min(spec.max, lo + spec.labels)];
}

/** Zielzahl: im Raster des Strahls, nicht auf einer beschrifteten Zahl (sonst nur Ablesen). */
function target(rng: Rng, spec: LineSpec, grid: number): number {
  for (let i = 0; i < 50; i++) {
    const n = spec.min + rng.int(1, Math.floor((spec.max - spec.min) / grid) - 1) * grid;
    if ((n - spec.min) % spec.labels !== 0) return n;
  }
  return spec.min + grid;
}

export const numberLine: Generator = (level, rng, id, params): Task => {
  const full: LineSpec = {
    min: num(params, 'min'),
    max: num(params, 'max'),
    ticks: num(params, 'ticks'),
    labels: num(params, 'labels'),
  };
  const snap = num(params, 'snap');
  const tolerance = num(params, 'tolerance');
  const read = rng.chance(share(params, 'readShare'));

  if (read) {
    // Ablesen: Pfeil auf eine Zahl; auf Stufe 3 ein vergrößerter Ausschnitt (z. B. 40 bis 60).
    const zoom = params.level['zoom'];
    let spec = full;
    if (typeof zoom === 'number') {
      const from = rng.int(1, Math.floor((full.max - zoom) / 10)) * 10;
      spec = { min: from, max: from + zoom, ticks: 1, labels: 5 };
    }
    const n = target(rng, spec, spec.ticks);
    const [lo] = between(n, spec);
    const errors: TypicalError[] = uniqueErrors(
      [
        { value: n + spec.ticks, errorTag: 'line_tick' },
        { value: n - spec.ticks, errorTag: 'line_tick' },
        { value: n + 10, errorTag: 'line_tens' },
        { value: n - 10, errorTag: 'line_tens' },
      ].filter((e) => e.value >= spec.min && e.value <= spec.max),
      n,
    );
    return {
      id,
      family: NUMBER_LINE,
      level,
      kind: 'number-input',
      prompt: { terms: ['?'], textKey: 'task.prompt.lineRead' },
      answer: n,
      display: { visual: { type: 'line', ...spec, arrow: n } },
      typicalErrors: errors,
      hints: [
        { key: 'hint.line.read.1' },
        {
          key: 'hint.line.read.2',
          params: { lo, step: spec.ticks },
          visual: { type: 'line', ...spec, arrow: n, marks: [lo] },
        },
        { key: 'hint.line.read.3', params: { n }, visual: { type: 'line', ...spec, marks: [n] } },
      ],
      strategyId: 'number_line',
      dedupeKey: `line:read:${spec.min}:${n}`,
    };
  }

  // Marker setzen
  const n = target(rng, full, snap);
  const [lo, hi] = between(n, full);
  const mid = (lo + hi) / 2;
  return {
    id,
    family: NUMBER_LINE,
    level,
    kind: 'number-line',
    prompt: {
      terms: [],
      textKey: tolerance > 0 ? 'task.prompt.linePlaceAbout' : 'task.prompt.linePlace',
      textParams: { n },
    },
    answer: n,
    line: { ...full, snap, tolerance },
    hints: [
      { key: 'hint.line.place.1', params: { n, lo, hi } },
      {
        key: Number.isInteger(mid) && mid !== n ? 'hint.line.place.2' : 'hint.line.place.2.short',
        params: { n, lo, hi, mid },
        visual: { type: 'line', ...full, marks: Number.isInteger(mid) ? [lo, mid, hi] : [lo, hi] },
      },
      { key: 'hint.line.place.3', params: { n }, visual: { type: 'line', ...full, arrow: n } },
    ],
    strategyId: 'number_line',
    dedupeKey: `line:place:${n}`,
  };
};
