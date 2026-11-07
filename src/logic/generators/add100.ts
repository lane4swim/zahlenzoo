import { additionHints, additionStrategy } from '../strategy';
import { additionOptions } from '../options';
import type { Rng } from '../rng';
import type { Generator, MathInfo, Task, TaskKind, TaskLevel, Term } from '../../types/task';

export const ADD_100 = 'add_100';
const MAX = 100;

/** Anteile der Eingabeformen je Aufgabe. */
const KIND_WEIGHTS: ReadonlyArray<[TaskKind, number]> = [
  ['number-input', 0.5],
  ['choice', 0.3],
  ['gap', 0.2],
];

function pickKind(rng: Rng): TaskKind {
  let r = rng.next();
  for (const [kind, weight] of KIND_WEIGHTS) {
    if (r < weight) return kind;
    r -= weight;
  }
  return 'number-input';
}

const hasCarry = (a: number, b: number) => (a % 10) + (b % 10) >= 10;

/** Zahlenpaar a + b passend zur Stufe (Spezifikation, Abschnitt 6). */
function operands(level: TaskLevel, rng: Rng): [number, number] {
  switch (level) {
    case 0:
    case 1: {
      // Zehner plus Zehner (40 + 20) oder Zehner plus Einer ohne Übergang (34 + 5).
      if (rng.chance(0.3)) {
        const aTens = rng.int(1, 8);
        return [aTens * 10, rng.int(1, 10 - aTens) * 10];
      }
      const aOnes = rng.int(0, 8);
      return [rng.int(1, 9) * 10 + aOnes, rng.int(1, 9 - aOnes)];
    }
    case 2: {
      // zweistellig plus einstellig mit Übergang über den Zehner (38 + 7).
      const aOnes = rng.int(2, 9);
      const a = rng.int(1, 8) * 10 + aOnes;
      return [a, rng.int(11 - aOnes, 9)];
    }
    case 3: {
      // zweistellig plus zweistellig (47 + 26), meist mit Übergang.
      for (;;) {
        const a = rng.int(11, 88);
        if (a % 10 === 0 || MAX - a < 11) continue;
        const b = rng.int(11, MAX - a);
        if (b % 10 === 0) continue;
        if (!hasCarry(a, b) && rng.chance(0.7)) continue;
        return [a, b];
      }
    }
  }
}

export const add100: Generator = (level, rng, id): Task => {
  const [a, b] = operands(level, rng);
  const kind = pickKind(rng);
  const result = a + b;
  const missing = kind === 'gap' ? 'b' : 'result';
  const math: MathInfo = { op: '+', a, b, result, missing, carry: hasCarry(a, b) };
  const terms: Term[] = missing === 'b' ? [a, '+', '?', '=', result] : [a, '+', b, '=', '?'];
  const answer = missing === 'b' ? b : result;
  const task: Task = {
    id,
    family: ADD_100,
    level,
    kind,
    prompt: { terms },
    answer,
    hints: additionHints(math),
    strategyId: additionStrategy(math).id,
    math,
    // Tauschaufgaben (3 + 5, 5 + 3) zählen als gleich.
    dedupeKey:
      missing === 'b' ? `add_gap:${a}:${result}` : `add:${Math.min(a, b)}:${Math.max(a, b)}`,
  };
  if (kind === 'choice') task.options = additionOptions(math, rng);
  return task;
};
