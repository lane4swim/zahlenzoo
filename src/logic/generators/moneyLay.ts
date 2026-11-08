import { num, nums } from '../params';
import type { Generator, Task, TextParams, TypicalError } from '../../types/task';

/**
 * Zoo-Kasse: Geldbeträge legen (KE: Geldbeträge, Einheiten ct und €; ganzzahlig).
 * Stufe 1: Euro bis 20 mit 1 €, 2 €, 5 €, 10 €. Stufe 2: Euro bis 100 mit allen Scheinen
 * bis 50 €. Stufe 3: Cent bis 100 ct mit Cent-Münzen und 1 € (100 ct = 1 €).
 * Einheit, Bereich und angebotene Münzen und Scheine stehen in families.json.
 */
export const MONEY_LAY = 'money_lay';

/** Geschütztes Leerzeichen: Betrag und Einheit bleiben in einer Zeile. */
const NBSP = '\u00a0';

/** Wert in Cent als Text: „50 ct“, „2 €“, „10 €“. */
export function moneyLabel(cents: number): string {
  return cents >= 100 ? `${cents / 100}${NBSP}€` : `${cents}${NBSP}ct`;
}

/** Betrag in der Einheit der Aufgabe als Text. */
export function amountLabel(amount: number, unit: 'euro' | 'cent'): string {
  return unit === 'euro' ? `${amount}${NBSP}€` : `${amount}${NBSP}ct`;
}

/** Mit möglichst wenigen Münzen und Scheinen: immer den größten passenden Wert. */
export function fewestCoins(totalCents: number, denominations: readonly number[]): number[] {
  const sorted = [...denominations].sort((a, b) => b - a);
  const result: number[] = [];
  let rest = totalCents;
  for (const d of sorted) {
    while (rest >= d) {
      result.push(d);
      rest -= d;
    }
  }
  if (rest !== 0) throw new Error(`${totalCents} ct lässt sich nicht legen`);
  return result;
}

export const moneyLay: Generator = (level, rng, id, params): Task => {
  const unitParam = params.level.unit;
  const unit = unitParam === 'cent' ? 'cent' : 'euro';
  const amount = rng.int(num(params, 'min'), num(params, 'max'));
  const denominations = nums(params, 'denominations');
  const cents = unit === 'euro' ? amount * 100 : amount;
  const coins = fewestCoins(cents, denominations);
  const label = amountLabel(amount, unit);
  const hintParams: TextParams = {
    amount: label,
    first: moneyLabel(coins[0]!),
    coins: coins.map(moneyLabel).join(' + '),
  };
  // Jeder andere Betrag ist entweder zu viel oder zu wenig; die Rückmeldung sagt, was.
  const errors: TypicalError[] = [];
  for (let d = 1; d <= Math.max(amount, 20); d++) {
    errors.push({ value: amount + d, errorTag: 'too_much' });
    if (amount - d > 0) errors.push({ value: amount - d, errorTag: 'too_little' });
  }
  return {
    id,
    family: MONEY_LAY,
    level,
    kind: 'money',
    prompt: { terms: [], textKey: 'task.prompt.lay', textParams: { amount: label } },
    answer: amount,
    hints: [
      { key: 'hint.money_lay.1', params: hintParams },
      { key: 'hint.money_lay.2', params: hintParams },
      { key: 'hint.money_lay.3', params: hintParams },
    ],
    strategyId: MONEY_LAY,
    money: { amount, unit, denominations: [...denominations].sort((a, b) => a - b) },
    typicalErrors: errors,
    dedupeKey: `money:${unit}:${amount}`,
  };
};
