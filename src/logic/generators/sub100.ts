import { optionsFromErrors, typicalErrors, uniqueErrors } from '../options';
import { kindShare, share } from '../params';
import type { Rng } from '../rng';
import { subtractionHints, subtractionStrategy } from '../strategy';
import type { FamilyParams } from '../../types/content';
import type { Generator, MathInfo, Task, TaskKind, TaskLevel, Term } from '../../types/task';

/**
 * Pinguinfelsen: Subtraktion bis 100 (Spezifikation, Abschnitt 5; KE: sub_100).
 * Stufe 1: Zehner minus Zehner (70 − 30) und Einer abziehen ohne Übergang (47 − 5).
 * Stufe 2: zweistellig minus einstellig mit Übergang über den Zehner (43 − 7).
 * Stufe 3: zweistellig minus zweistellig (73 − 26), meist mit Übergang.
 * Lückenaufgaben: a − ? = c (Ergänzen).
 */
export const SUB_100 = 'sub_100';

const KINDS: readonly TaskKind[] = ['number-input', 'choice', 'gap'];
const borrow = (a: number, b: number) => a % 10 < b % 10;

function pickKind(rng: Rng, params: FamilyParams): TaskKind {
  const total = KINDS.reduce((sum, k) => sum + kindShare(params, k), 0) || 1;
  let r = rng.next() * total;
  for (const kind of KINDS) {
    r -= kindShare(params, kind);
    if (r < 0) return kind;
  }
  return 'number-input';
}

/** Zahlenpaar a − b passend zur Stufe; Ergebnis mindestens 1. */
function operands(level: TaskLevel, rng: Rng, params: FamilyParams): [number, number] {
  switch (level) {
    case 0:
    case 1: {
      if (rng.chance(share(params, 'tensMinusTensShare'))) {
        const aTens = rng.int(2, 10);
        return [aTens * 10, rng.int(1, aTens - 1) * 10];
      }
      const aOnes = rng.int(1, 9);
      return [rng.int(1, 9) * 10 + aOnes, rng.int(1, aOnes)];
    }
    case 2: {
      // Übergang über den Zehner: Einer von a kleiner als b (43 − 7).
      const aOnes = rng.int(0, 7);
      const a = rng.int(2, 9) * 10 + aOnes;
      return [a, rng.int(aOnes + 1, 9)];
    }
    case 3: {
      for (;;) {
        const a = rng.int(31, 99);
        const b = rng.int(11, a - 11);
        if (a % 10 === 0 || b % 10 === 0) continue;
        if (!borrow(a, b) && rng.chance(share(params, 'borrowPreference'))) continue;
        return [a, b];
      }
    }
  }
}

export const sub100: Generator = (level, rng, id, params): Task => {
  const [a, b] = operands(level, rng, params);
  const kind = pickKind(rng, params);
  const result = a - b;
  const missing = kind === 'gap' ? 'b' : 'result';
  const math: MathInfo = { op: '-', a, b, result, missing, carry: borrow(a, b) };
  const terms: Term[] = missing === 'b' ? [a, '-', '?', '=', result] : [a, '-', b, '=', '?'];
  const answer = missing === 'b' ? b : result;
  const errors = uniqueErrors(typicalErrors(math), answer);
  const task: Task = {
    id,
    family: SUB_100,
    level,
    kind,
    prompt: { terms },
    answer,
    hints: subtractionHints(math),
    strategyId: subtractionStrategy(math).id,
    math,
    typicalErrors: errors,
    dedupeKey: missing === 'b' ? `sub_gap:${a}:${result}` : `sub:${a}:${b}`,
  };
  if (kind === 'choice') task.options = optionsFromErrors(answer, errors, rng);
  return task;
};
