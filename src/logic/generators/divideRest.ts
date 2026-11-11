import { optionsFromErrors } from '../options';
import { choice, kindShare, nums, share } from '../params';
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
 * Elefantenwiese: Teilen mit Rest im kleinen Einmaleins (Klärung mit der Lehrkraft vom
 * 11.11.2026: Division in Klasse 2 auch mit Rest).
 * Stufe 1: 17 : 5 = ? mit Antwortkarten „3 Rest 2“ (Teiler 2, 5, 10).
 * Stufe 2: Quotient oder Rest selbst eintippen (17 : 5 = 3 R ?), alle Reihen.
 * Stufe 3: Sachaufgaben, die den Rest deuten: Wie viele werden voll? Wie viele bleiben
 *          übrig? Wie viele braucht man, damit alle Platz haben (aufrunden)?
 */
export const DIVIDE_REST = 'divide_rest';

/** Sachsituationen für Stufe 3; Texte unter divrest.<id>.<frage> in strings.de.json. */
export const REST_STORIES = ['banane', 'fisch', 'boot', 'ei', 'apfel'] as const;
const ASKS = ['full', 'left', 'need'] as const;
type Ask = (typeof ASKS)[number];

type Division = { n: number; d: number; q: number; r: number };

/** n = q · d + r mit q von 1 bis 10, n höchstens 100; selten ohne Rest. */
function division(rng: Rng, divisors: readonly number[], noRestShare: number): Division {
  for (;;) {
    const d = rng.pick(divisors);
    const q = rng.int(1, 10);
    const r = rng.chance(noRestShare) ? 0 : rng.int(1, d - 1);
    const n = q * d + r;
    if (n <= 100 && n > d) return { n, d, q, r };
  }
}

/** Rechenstrich: q Sprünge um d, dann der Rest. */
function jumps({ d, q, r }: Division, withRest: boolean): number[] {
  return [...Array.from({ length: q }, () => d), ...(withRest && r > 0 ? [r] : [])];
}

function hints(div: Division, ask?: Ask): [Hint, Hint, Hint] {
  const p: TextParams = { ...div, qd: div.q * div.d, answer: ask === 'need' ? div.q + 1 : 0 };
  const three = ask
    ? `hint.divrest.3.${ask}`
    : div.r > 0
      ? 'hint.divrest.3'
      : 'hint.divrest.3.none';
  return [
    { key: 'hint.divrest.1', params: p },
    {
      key: 'hint.divrest.2',
      params: p,
      visual: { type: 'jumps', start: 0, jumps: jumps(div, false), hideResults: false },
    },
    { key: three, params: p, visual: { type: 'jumps', start: 0, jumps: jumps(div, true) } },
  ];
}

const label = (q: number, r: number): TaskOption['label'] => ({
  key: 'divrest.result',
  params: { q, r },
});

export const divideRest: Generator = (level, rng, id, params): Task => {
  const mode = choice(params, 'mode', ['cards', 'gap', 'story'] as const);
  const div = division(rng, nums(params, 'divisors'), share(params, 'noRestShare'));
  const { n, d, q, r } = div;
  const base = { id, family: DIVIDE_REST, level, strategyId: DIVIDE_REST };

  if (mode === 'cards') {
    // Antwortkarten: richtig, Rest zu groß (eine Gruppe zu wenig), Rest vergessen, vertauscht
    const wrong: Array<{ q: number; r: number; errorTag: string }> = [
      ...(q > 1 ? [{ q: q - 1, r: r + d, errorTag: 'rest_too_big' }] : []),
      ...(r > 0 ? [{ q, r: 0, errorTag: 'rest_missing' }] : []),
      ...(r !== q ? [{ q: r, r: q, errorTag: 'rest_swapped' }] : []),
      { q: q + 1, r, errorTag: 'row_off' },
    ];
    const seen = new Set([`${q},${r}`]);
    const unique = wrong.filter((w) => !seen.has(`${w.q},${w.r}`) && seen.add(`${w.q},${w.r}`));
    const options: TaskOption[] = rng.shuffle([
      { value: `${q},${r}`, label: label(q, r) },
      ...unique.slice(0, 3).map((w) => ({
        value: `${w.q},${w.r}`,
        errorTag: w.errorTag,
        label: label(w.q, w.r),
      })),
    ]);
    return {
      ...base,
      kind: 'choice',
      prompt: { terms: [n, ':', d, '=', '?'], textKey: 'task.prompt.divideRest' },
      answer: [q, r],
      options,
      hints: hints(div),
      dedupeKey: `divrest:${n}:${d}`,
    };
  }

  if (mode === 'gap') {
    // Eine Zahl fehlt: der Quotient oder der Rest
    const askRest = rng.chance(0.5);
    const terms: Term[] = askRest ? [n, ':', d, '=', q, 'R', '?'] : [n, ':', d, '=', '?', 'R', r];
    const answer = askRest ? r : q;
    const errors: TypicalError[] = askRest
      ? [
          { value: r + d, errorTag: 'rest_too_big' },
          { value: d - r, errorTag: 'rest_counted_wrong' },
          { value: n - q, errorTag: 'subtracted' },
        ]
      : [
          { value: q - 1, errorTag: 'row_off' },
          { value: q + 1, errorTag: 'row_off' },
          { value: n - r, errorTag: 'gave_total' },
        ];
    const clean = errors.filter(
      (e, i) =>
        e.value >= 0 && e.value !== answer && errors.findIndex((f) => f.value === e.value) === i,
    );
    const cards = rng.chance(kindShare(params, 'choice'));
    return {
      ...base,
      kind: cards ? 'choice' : 'gap',
      prompt: { terms },
      answer,
      ...(cards ? { options: optionsFromErrors(answer, clean, rng) } : {}),
      hints: hints(div),
      typicalErrors: clean,
      dedupeKey: `divrest:${askRest ? 'r' : 'q'}:${n}:${d}`,
    };
  }

  // Sachaufgabe: Was bedeutet der Rest? (immer mit Rest, sonst gibt es nichts zu deuten)
  const withRest: Division = r > 0 ? div : { ...div, n: n + 1, r: 1 };
  const story = rng.pick(REST_STORIES);
  const ask = rng.pick(ASKS);
  const answer = ask === 'full' ? withRest.q : ask === 'left' ? withRest.r : withRest.q + 1;
  const errors: TypicalError[] =
    ask === 'full'
      ? [
          { value: withRest.q + 1, errorTag: 'rest_rounded' },
          { value: withRest.r, errorTag: 'rest_swapped' },
        ]
      : ask === 'left'
        ? [
            { value: withRest.q, errorTag: 'rest_swapped' },
            { value: withRest.d - withRest.r, errorTag: 'rest_counted_wrong' },
          ]
        : [
            { value: withRest.q, errorTag: 'rest_need_more' },
            { value: withRest.q + 2, errorTag: 'row_off' },
          ];
  const clean = errors.filter(
    (e, i) =>
      e.value >= 0 && e.value !== answer && errors.findIndex((f) => f.value === e.value) === i,
  );
  return {
    ...base,
    kind: 'number-input',
    prompt: {
      terms: ['?'],
      textKey: `divrest.${story}.${ask}`,
      textParams: { n: withRest.n, d: withRest.d },
    },
    answer,
    hints: hints(withRest, ask),
    strategyId: `divide_rest_${ask}`,
    typicalErrors: clean,
    dedupeKey: `divrest:story:${story}:${ask}:${withRest.n}:${withRest.d}`,
  };
};
