import type { Rng } from './rng';
import type { Rules } from '../types/content';
import type { Profile } from '../types/save';
import type { MathInfo, Task } from '../types/task';

/**
 * „Wie hast du gerechnet?“ (strategy_pick, Spezifikation 6, Ausarbeitung vom 11.11.2026):
 * Nach einer richtig gelösten Plus- oder Minusaufgabe mit Zehnerübergang wählt das Kind
 * seinen Rechenweg. Jede Wahl ist richtig; gezählt wird nur, welche Wege es nutzt.
 */
export const STRATEGY_WAYS = ['places', 'steps', 'helper', 'other'] as const;
export type StrategyWay = (typeof STRATEGY_WAYS)[number];

const MINUS = '−';
const step = (x: number, op: '+' | '-', y: number) =>
  `${x} ${op === '+' ? '+' : MINUS} ${y} = ${op === '+' ? x + y : x - y}`;

/**
 * Der Rechenweg je Strategie für diese Aufgabe als Schrittfolge; fehlt ein Weg, passt er
 * nicht gut (z. B. stellenweise bei Minus mit Zehnerübergang).
 */
export function strategyPaths(m: MathInfo): Partial<Record<StrategyWay, string>> {
  const { op, a, b } = m;
  const T = Math.floor(b / 10) * 10;
  const O = b % 10;
  const paths: Partial<Record<StrategyWay, string>> = {};
  if (op === '+' && T > 0) {
    // Zehner extra, Einer extra
    const A = Math.floor(a / 10) * 10;
    const tens = A + T;
    const ones = (a % 10) + O;
    paths.places = [step(A, '+', T), step(a % 10, '+', O), step(tens, '+', ones)].join(', ');
  }
  if (T > 0) {
    // erst die Zehner, dann die Einer
    const mid = op === '+' ? a + T : a - T;
    paths.steps = [step(a, op, T), step(mid, op, O)].join(', ');
  } else {
    // einstellig: erst bis zum Zehner, dann weiter
    const toTen = op === '+' ? 10 - (a % 10) : a % 10;
    const mid = op === '+' ? a + toTen : a - toTen;
    if (toTen > 0 && toTen < O)
      paths.steps = [step(a, op, toTen), step(mid, op, O - toTen)].join(', ');
  }
  if (O >= 7) {
    // mit glattem Zehner rechnen und ausgleichen
    const up = T + 10;
    const mid = op === '+' ? a + up : a - up;
    const back = up - b;
    paths.helper = [step(a, op, up), step(mid, op === '+' ? '-' : '+', back)].join(', ');
  }
  return paths;
}

/** Fragen? Nur bei passenden Familien, mit Zehnerübergang, höchstens maxPerRound je Runde. */
export function shouldAskStrategy(
  task: Task,
  rules: Pick<Rules, 'strategyPick'>,
  askedThisRound: number,
  rng: Rng,
): boolean {
  const { families, chance, maxPerRound } = rules.strategyPick;
  const m = task.math;
  if (!m || !m.carry || m.missing !== 'result' || !families.includes(task.family)) return false;
  if (askedThisRound >= maxPerRound) return false;
  return rng.chance(chance);
}

/** Zählt die gewählte Strategie im Profil (nichts wird bewertet). */
export function recordStrategy(profile: Profile, family: string, way: StrategyWay): Profile {
  const use = profile.strategyUse ?? {};
  const forFamily = use[family] ?? {};
  return {
    ...profile,
    strategyUse: { ...use, [family]: { ...forFamily, [way]: (forFamily[way] ?? 0) + 1 } },
  };
}
