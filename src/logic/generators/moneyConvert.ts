import { kindShare, num } from '../params';
import type { Rng } from '../rng';
import type { Generator, Hint, Task, TaskOption, Term, TypicalError } from '../../types/task';

/**
 * Zoo-Kasse: Einheiten ct und € umwandeln (KE: money_convert, 1 € = 100 ct).
 * Stufe 1: volle Euro in Cent und zurück („3 € = ? ct“). Stufe 2: Euro und volle
 * Zehner-Cent („2 € 30 ct = ? ct“, „230 ct = 2 € ? ct“). Stufe 3: beliebige Cent, auch
 * mit Null an der Zehnerstelle („2 € 5 ct = 205 ct“). Bereich und Schrittweite der Cent
 * stehen in families.json (maxEuro, centStep; centStep 0 = nur volle Euro).
 */
export const MONEY_CONVERT = 'money_convert';

type Direction = 'toCent' | 'toEuro' | 'toRestCent';

/** Cent-Anteil: Vielfache von step zwischen step und 99 (step 0: kein Cent-Anteil). */
function centPart(rng: Rng, step: number): number {
  if (step <= 0) return 0;
  return step * rng.int(1, Math.floor(99 / step));
}

/** Antwortkarten: Lösung und drei verschiedene typische Fehler (alle größer als 0). */
function cards(answer: number, errors: readonly TypicalError[], rng: Rng): TaskOption[] {
  const seen = new Set([answer]);
  const wrong: TaskOption[] = [];
  for (const e of errors) {
    if (wrong.length === 3 || e.value <= 0 || seen.has(e.value)) continue;
    seen.add(e.value);
    wrong.push({ value: String(e.value), errorTag: e.errorTag });
  }
  for (let d = 1; wrong.length < 3; d++) {
    if (!seen.has(answer + d)) {
      seen.add(answer + d);
      wrong.push({ value: String(answer + d), errorTag: 'other' });
    }
  }
  return rng.shuffle([{ value: String(answer) }, ...wrong]);
}

export const moneyConvert: Generator = (level, rng, id, params): Task => {
  const euro = rng.int(1, num(params, 'maxEuro'));
  const cent = centPart(rng, num(params, 'centStep'));
  const total = euro * 100 + cent;
  // Ohne Cent-Anteil gibt es keine Frage nach dem Rest.
  const directions: Direction[] =
    cent > 0 ? ['toCent', 'toEuro', 'toRestCent'] : ['toCent', 'toEuro'];
  const direction = rng.pick(directions);

  const mixed: Term[] = cent > 0 ? [euro, '€', cent, 'ct'] : [euro, '€'];
  let terms: Term[];
  let answer: number;
  let errors: TypicalError[];
  if (direction === 'toCent') {
    terms = [...mixed, '=', '?', 'ct'];
    answer = total;
    errors = [
      // 2 € 5 ct als 25 ct: die Null an der Zehnerstelle fehlt
      ...(cent > 0 && cent < 10
        ? [{ value: Number(`${euro}${cent}`), errorTag: 'zero_place' }]
        : []),
      { value: euro * 10 + cent, errorTag: 'hundred_cent' },
      { value: euro * 1000 + cent, errorTag: 'hundred_cent' },
      { value: euro + cent, errorTag: 'added_units' },
      { value: total + 100, errorTag: 'euro_off' },
      { value: total - 100, errorTag: 'euro_off' },
    ];
  } else if (direction === 'toEuro') {
    terms = cent > 0 ? [total, 'ct', '=', '?', '€', cent, 'ct'] : [total, 'ct', '=', '?', '€'];
    answer = euro;
    errors = [
      { value: euro * 10 + Math.floor(cent / 10), errorTag: 'hundred_cent' },
      { value: total, errorTag: 'hundred_cent' },
      { value: euro + 1, errorTag: 'euro_off' },
      { value: euro - 1, errorTag: 'euro_off' },
    ];
  } else {
    terms = [total, 'ct', '=', euro, '€', '?', 'ct'];
    answer = cent;
    errors = [
      { value: total, errorTag: 'hundred_cent' },
      { value: cent + 100, errorTag: 'euro_off' },
      { value: cent + 10, errorTag: 'tens_off' },
      ...(cent > 10 ? [{ value: cent - 10, errorTag: 'tens_off' }] : []),
    ];
  }
  errors = errors.filter((e) => e.value > 0 && e.value !== answer);

  const hintParams = { euro, cent, total, euroCents: euro * 100 };
  const key = (stage: number) =>
    direction === 'toCent'
      ? `hint.money_convert.toCent${cent > 0 ? '' : 'Full'}.${stage}`
      : `hint.money_convert.toEuro${cent > 0 ? '' : 'Full'}.${stage}`;
  const hints: [Hint, Hint, Hint] = [
    { key: 'hint.money_convert.1' },
    { key: key(2), params: hintParams },
    { key: key(3), params: hintParams },
  ];
  const choice = rng.chance(kindShare(params, 'choice'));
  return {
    id,
    family: MONEY_CONVERT,
    level,
    kind: choice ? 'choice' : 'number-input',
    prompt: { terms },
    answer,
    ...(choice ? { options: cards(answer, errors, rng) } : {}),
    hints,
    strategyId: MONEY_CONVERT,
    typicalErrors: errors,
    dedupeKey: `convert:${direction}:${total}`,
  };
};
