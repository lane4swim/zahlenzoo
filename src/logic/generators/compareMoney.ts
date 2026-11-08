import { num, share } from '../params';
import type { Rng } from '../rng';
import type { Generator, Hint, Task, TaskOption } from '../../types/task';

/**
 * Zoo-Kasse: Geldbeträge vergleichen (KE: compare_money).
 * Stufe 1: zwei Beträge in derselben Einheit, oft mit vertauschten Ziffern (45 € oder 54 €).
 * Stufe 2: zwei Beträge in verschiedenen Schreibweisen (1 € 50 ct oder 105 ct).
 * Stufe 3: drei Beträge; entweder „Was ist am meisten?“ oder „Was ist gleich viel?“.
 * Anzahl, Schreibweise und Anteil der Gleich-viel-Fragen stehen in families.json.
 */
export const COMPARE_MONEY = 'compare_money';

const NBSP = ' ';

/** Betrag in Cent als Text in Cent („105 ct“). */
export const centLabel = (cents: number): string => `${cents}${NBSP}ct`;

/** Betrag in Cent als Text mit Euro und Cent („1 € 50 ct“, „3 €“). */
export function euroCentLabel(cents: number): string {
  const euro = Math.floor(cents / 100);
  const cent = cents % 100;
  if (euro === 0) return centLabel(cent);
  return cent === 0 ? `${euro}${NBSP}€` : `${euro}${NBSP}€ ${cent}${NBSP}ct`;
}

type Shown = { cents: number; label: string };

function swapDigits(n: number): number {
  return Number(String(n).split('').reverse().join(''));
}

/** Stufe 1: zwei Beträge gleicher Einheit, oft mit vertauschten Ziffern. */
function sameUnit(rng: Rng, max: number): Shown[] {
  const euro = rng.chance(0.5);
  let a = rng.int(12, max);
  let b = swapDigits(a);
  if (a % 10 === 0 || a % 11 === 0 || b > max || rng.chance(0.4)) {
    do b = rng.int(10, max);
    while (b === a);
  }
  if (a === b) a = a + 1;
  const make = (v: number) =>
    euro ? { cents: v * 100, label: `${v}${NBSP}€` } : { cents: v, label: centLabel(v) };
  return [make(a), make(b)];
}

/** Ein Betrag mit Euro und Cent; der andere in Cent, so dass die Ziffern täuschen. */
function mixedPair(rng: Rng, maxEuro: number): Shown[] {
  const euro = rng.int(1, maxEuro);
  const cent = 10 * rng.int(1, 9);
  const a = euro * 100 + cent;
  // z. B. 1 € 50 ct gegen 105 ct (Ziffern ähnlich) oder einen nahen Betrag
  const tricky = euro * 100 + cent / 10;
  const b = rng.chance(0.5) && tricky !== a ? tricky : a + 10 * rng.pick([-3, -2, -1, 1, 2, 3]);
  return [
    { cents: a, label: euroCentLabel(a) },
    { cents: b, label: centLabel(b) },
  ];
}

/** Hinweis 2: alle Beträge in Cent. */
const inCent = (shown: readonly Shown[]): string =>
  shown
    .map((s) => (s.label === centLabel(s.cents) ? s.label : `${s.label} = ${centLabel(s.cents)}`))
    .join(', ');

function task(
  level: Task['level'],
  id: string,
  rng: Rng,
  textKey: string,
  textParams: Record<string, string>,
  shown: Shown[],
  answer: Shown,
  errorTag: string,
  hint1: string,
  hint3: string,
): Task {
  const options: TaskOption[] = rng.shuffle(
    shown.map((s) => (s === answer ? { value: s.label } : { value: s.label, errorTag })),
  );
  const hints: [Hint, Hint, Hint] = [
    { key: hint1 },
    { key: 'hint.compare_money.2', params: { list: inCent(shown) } },
    { key: hint3, params: { ...textParams, answer: answer.label, cents: centLabel(answer.cents) } },
  ];
  return {
    id,
    family: COMPARE_MONEY,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey, textParams },
    answer: answer.label,
    options,
    hints,
    strategyId: COMPARE_MONEY,
    dedupeKey: `compare:${textKey}:${shown
      .map((s) => s.label)
      .sort()
      .join('|')}`,
  };
}

export const compareMoney: Generator = (level, rng, id, params): Task => {
  const count = num(params, 'options');
  const maxEuro = num(params, 'maxEuro');
  const mixed = num(params, 'mixed') === 1;

  if (mixed && count >= 3 && rng.chance(share(params, 'equalShare'))) {
    // Gleich viel: 2 € 5 ct = 205 ct; Fehler: 25 ct (Null fehlt), 250 ct (Stellen verrutscht)
    const euro = rng.int(1, maxEuro);
    const cent = rng.chance(0.5) ? rng.int(1, 9) : 10 * rng.int(1, 9);
    const target = euro * 100 + cent;
    const candidates = [
      Number(`${euro}${cent}`),
      cent < 10 ? euro * 100 + cent * 10 : euro * 100 + cent / 10,
      euro * 10 + cent,
      target + 100,
    ].filter((v, i, all) => v !== target && v > 0 && all.indexOf(v) === i);
    const wrong = rng.shuffle(candidates).slice(0, count - 1);
    const answer = { cents: target, label: centLabel(target) };
    const shown = [answer, ...wrong.map((v) => ({ cents: v, label: centLabel(v) }))];
    return task(
      level,
      id,
      rng,
      'task.prompt.sameAmount',
      { amount: euroCentLabel(target) },
      shown,
      answer,
      'hundred_cent',
      'hint.compare_money.1',
      'hint.compare_money.same.3',
    );
  }

  let shown: Shown[];
  if (!mixed) {
    shown = sameUnit(rng, num(params, 'max'));
  } else {
    shown = mixedPair(rng, maxEuro);
    while (shown.length < count) {
      const v = 10 * rng.int(10, maxEuro * 10 + 9);
      if (shown.some((s) => s.cents === v)) continue;
      shown.push(
        rng.chance(0.5) ? { cents: v, label: centLabel(v) } : { cents: v, label: euroCentLabel(v) },
      );
    }
  }
  const answer = shown.reduce((best, s) => (s.cents > best.cents ? s : best));
  return task(
    level,
    id,
    rng,
    count > 2 ? 'task.prompt.mostMoney' : 'task.prompt.moreMoney',
    {},
    shown,
    answer,
    mixed ? 'compare_units' : 'compare_digits',
    mixed ? 'hint.compare_money.1' : 'hint.compare_money.digits.1',
    'hint.compare_money.more.3',
  );
};
