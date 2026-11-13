import { optionsFromErrors, uniqueErrors } from '../options';
import { choice, kindShare, num, nums } from '../params';
import type { Rng } from '../rng';
import type { Generator, Hint, Task, TaskOption, TextParams, TypicalError } from '../../types/task';

/**
 * Elefantenwiese: Verteilen und Aufteilen (Division als Operationsverständnis, Klärung 5 mit
 * der Lehrkraft: verstehen, nicht automatisieren).
 * Stufe 1, Handeln: Dinge gerecht auf Teller verteilen oder immer gleich viele in Körbe legen.
 * Stufe 2, Bild: Die Dinge sind schon verteilt; die passende Geteiltaufgabe ausrechnen.
 * Stufe 3, Zeichen: Welche Rechnung passt zur Geschichte? Geteiltaufgaben aus Malaufgaben.
 */
export const DIVIDE_SHARE = 'divide_share';

/** Dinge zum Verteilen: Bild und Name in der Mehrzahl (Textschlüssel). */
const THINGS = [
  { icon: 'objekt_banane', name: 'thing.bananas' },
  { icon: 'objekt_fisch', name: 'thing.fish' },
  { icon: 'objekt_eimer', name: 'thing.buckets' },
] as const;

type Mode = 'share' | 'measure';

function numbers(rng: Rng, divisors: number[], maxEach: number, maxTotal: number) {
  const divisor = rng.pick(divisors);
  const quotient = rng.int(2, Math.min(maxEach, Math.floor(maxTotal / divisor)));
  return { divisor, quotient, total: divisor * quotient };
}

function divErrors(total: number, divisor: number, quotient: number): TypicalError[] {
  return uniqueErrors(
    [
      { value: total - divisor, errorTag: 'subtracted' },
      { value: quotient + 1, errorTag: 'row_off' },
      { value: quotient - 1, errorTag: 'row_off' },
      { value: total, errorTag: 'div_total' },
    ].filter((e) => e.value > 0),
    quotient,
  );
}

function hints(
  mode: Mode,
  total: number,
  divisor: number,
  quotient: number,
  picture = false,
): [Hint, Hint, Hint] {
  const p = { total, divisor, quotient };
  return [
    { key: picture ? `hint.divshare.picture.${mode}.1` : `hint.divshare.${mode}.1`, params: p },
    {
      key: `hint.divshare.${mode}.2`,
      params: p,
      // Verteilen: je Teller eine Reihe; Aufteilen: je Korb eine Reihe
      visual:
        mode === 'share'
          ? { type: 'dots', rows: divisor, cols: quotient, noLabel: true }
          : { type: 'dots', rows: quotient, cols: divisor, noLabel: true },
    },
    { key: `hint.divshare.${mode}.3`, params: p },
  ];
}

export const divideShare: Generator = (level, rng, id, params): Task => {
  const stage = choice(params, 'stage', ['act', 'picture', 'symbol'] as const);
  const mode: Mode = rng.chance(0.5) ? 'share' : 'measure';
  const thing = rng.pick(THINGS);
  const divisors = nums(params, 'divisors');
  const maxEach = num(params, 'maxEach');
  const { divisor, quotient, total } = numbers(rng, divisors, maxEach, num(params, 'maxTotal'));
  const things = `@${thing.name}`;
  const base = {
    id,
    family: DIVIDE_SHARE,
    level,
    strategyId: mode === 'share' ? 'divide_share' : 'divide_measure',
  };
  // Verteilen: divisor Teller, Antwort je Teller; Aufteilen: divisor je Korb, Antwort Körbe
  const textParams: TextParams =
    mode === 'share' ? { total, groups: divisor, things } : { total, size: divisor, things };

  if (stage === 'act') {
    return {
      ...base,
      kind: 'number-input',
      prompt: {
        terms: [total, ':', divisor, '=', '?'],
        textKey: `task.prompt.${mode}.act`,
        textParams,
      },
      answer: quotient,
      share:
        mode === 'share'
          ? { mode, total, groups: divisor, icon: thing.icon }
          : { mode, total, size: divisor, icon: thing.icon },
      hints: hints(mode, total, divisor, quotient),
      dedupeKey: `divshare:act:${mode}:${total}:${divisor}`,
    };
  }

  if (stage === 'picture') {
    const errors = divErrors(total, divisor, quotient);
    const cards = rng.chance(kindShare(params, 'choice'));
    return {
      ...base,
      kind: cards ? 'choice' : 'number-input',
      prompt: {
        terms: [total, ':', divisor, '=', '?'],
        textKey: `task.prompt.${mode}.picture`,
        textParams,
        picture: {
          icon: thing.icon,
          groups: Array.from({ length: mode === 'share' ? divisor : quotient }, () =>
            mode === 'share' ? quotient : divisor,
          ),
        },
      },
      answer: quotient,
      typicalErrors: errors,
      ...(cards ? { options: optionsFromErrors(quotient, errors, rng) } : {}),
      hints: hints(mode, total, divisor, quotient, true),
      dedupeKey: `divshare:pic:${mode}:${total}:${divisor}`,
    };
  }

  // Stufe 3: Umkehraufgabe aus dem Einmaleins oder passende Rechnung zur Geschichte
  if (rng.chance(0.5)) {
    const errors = divErrors(total, divisor, quotient);
    return {
      ...base,
      strategyId: 'divide_inverse',
      kind: 'number-input',
      prompt: {
        terms: [total, ':', divisor, '=', '?'],
        textKey: 'task.prompt.divFamily',
        textParams: { known: `${quotient} · ${divisor} = ${total}` },
      },
      answer: quotient,
      typicalErrors: errors,
      hints: [
        { key: 'hint.divfamily.1', params: { total, divisor } },
        {
          key: 'hint.divfamily.2',
          params: { total, divisor, quotient },
          visual: { type: 'dots', rows: quotient, cols: divisor },
        },
        { key: 'hint.divfamily.3', params: { total, divisor, quotient } },
      ],
      dedupeKey: `divshare:family:${total}:${divisor}`,
    };
  }
  const MINUS = '−';
  const right = `${total} : ${divisor}`;
  const options: TaskOption[] = rng.shuffle([
    { value: right },
    { value: `${total} : ${quotient}`, errorTag: 'div_swapped' },
    { value: `${total} ${MINUS} ${divisor}`, errorTag: 'subtracted_op' },
    { value: `${total} + ${divisor}`, errorTag: 'added_op' },
  ]);
  return {
    ...base,
    kind: 'choice',
    prompt: { terms: [], textKey: `task.prompt.${mode}.which`, textParams },
    answer: right,
    options: quotient === divisor ? options.filter((o) => o.errorTag !== 'div_swapped') : options,
    hints: [
      { key: `hint.divshare.which.${mode}.1`, params: { total, divisor } },
      { key: `hint.divshare.${mode}.1`, params: { total, divisor, quotient } },
      { key: 'hint.divshare.which.3', params: { right, quotient } },
    ],
    dedupeKey: `divshare:which:${mode}:${total}:${divisor}`,
  };
};
