import { optionsFromErrors, typicalErrors, uniqueErrors } from '../options';
import { kindShare, share } from '../params';
import { houseFloors, optionalShare } from './variants';
import {
  additionHints,
  additionStrategy,
  subtractionHints,
  subtractionStrategy,
} from '../strategy';
import type {
  Generator,
  Hint,
  MathInfo,
  Task,
  TaskKind,
  TextParams,
  Visual,
} from '../../types/task';

/**
 * Pinguinfelsen „Stufe 0“: Einspluseins bis 20 (Spezifikation, Abschnitt 5;
 * KE: plus_facts_20, kleines Einspluseins automatisiert abrufen, Umkehrungen ableiten).
 * Stufe 1: Plus bis 10, Zerlegungen der 10 als Lücke (6 + ? = 10).
 * Stufe 2: Plus bis 20 ohne Übergang (12 + 5, 10 + 7).
 * Stufe 3: mit Zehnerübergang (8 + 5) und Umkehraufgaben (13 − 5).
 * Hinweisbild ist das Zehnerfeld (Kraft der 5 und der 10).
 */
export const PLUS_FACTS_20 = 'plus_facts_20';

const tenframe = (first: number, second: number, op: '+' | '-'): Visual => ({
  type: 'tenframe',
  first,
  second,
  op,
});

/** Hinweise mit Zehnerfeld statt Rechenstrich; der erste Satz passt zur Aufgabe. */
function factHints(m: MathInfo, firstKey: string | undefined): [Hint, Hint, Hint] {
  const base = m.op === '+' ? additionHints(m) : subtractionHints(m);
  // Hinweis 2 zeigt die Aufgabe (beim Ergänzen nur die Startzahl), Hinweis 3 die Lösung.
  const visual = tenframe(m.a, m.missing === 'b' ? 0 : m.b, m.op);
  const solved = tenframe(m.a, m.b, m.op);
  const params: TextParams = { ...(base[0].params ?? {}) };
  return [
    firstKey ? { key: firstKey, params } : base[0],
    {
      key:
        m.missing === 'b'
          ? 'hint.tenframe_fill.2'
          : m.op === '+'
            ? 'hint.tenframe_plus.2'
            : 'hint.tenframe_minus.2',
      params,
      visual,
    },
    { ...base[2], visual: solved },
  ];
}

export const plusFacts20: Generator = (level, rng, id, params): Task => {
  let math: MathInfo;
  let firstKey: string | undefined;
  let house: Visual | undefined;
  let inverseOf: string | undefined;
  let kind: TaskKind = rng.chance(kindShare(params, 'choice')) ? 'choice' : 'number-input';

  if (level <= 1) {
    if (rng.chance(optionalShare(params, 'houseShare'))) {
      // Zahlenhaus: Zerlegungen einer Zahl bis 10, ein Stockwerk mit Lücke
      const top = rng.int(5, 10);
      const a = rng.int(1, top - 1);
      math = { op: '+', a, b: top - a, result: top, missing: 'b', carry: false };
      firstKey = 'hint.facts_house.1';
      house = { type: 'house', top, ...houseFloors(top, a, rng) };
      kind = 'gap';
    } else if (rng.chance(share(params, 'toTenShare'))) {
      // Zerlegen der 10: 6 + ? = 10
      const a = rng.int(1, 9);
      math = { op: '+', a, b: 10 - a, result: 10, missing: 'b', carry: false };
      firstKey = 'hint.facts_decompose.1';
      if (kind !== 'choice') kind = 'gap';
    } else {
      const a = rng.int(1, 9);
      const b = rng.int(1, 10 - a);
      math = { op: '+', a, b, result: a + b, missing: 'result', carry: false };
      firstKey = 'hint.facts_10.1';
    }
  } else if (level === 2) {
    const aOnes = rng.int(0, 8);
    const b = rng.int(1, 9 - aOnes);
    const a = 10 + aOnes;
    math = { op: '+', a, b, result: a + b, missing: 'result', carry: false };
    firstKey = 'hint.facts_20.1';
  } else {
    // Zehnerübergang: a + b > 10 mit einstelligen Zahlen, oder die Umkehraufgabe
    const a = rng.int(2, 9);
    const b = rng.int(11 - a, 9);
    if (rng.chance(share(params, 'inverseShare'))) {
      // Umkehraufgabe: Die Plusaufgabe ist bekannt, die Minusaufgabe wird daraus abgeleitet.
      math = { op: '-', a: a + b, b, result: a, missing: 'result', carry: true };
      inverseOf = `${a} + ${b} = ${a + b}`;
    } else {
      math = { op: '+', a, b, result: a + b, missing: 'result', carry: true };
    }
  }

  const answer = math.missing === 'b' ? math.b : math.result;
  const terms =
    math.missing === 'b'
      ? ([math.a, math.op, '?', '=', math.result] as Task['prompt']['terms'])
      : ([math.a, math.op, math.b, '=', '?'] as Task['prompt']['terms']);
  const errors = uniqueErrors(typicalErrors(math), answer);
  const strategy = (math.op === '+' ? additionStrategy(math) : subtractionStrategy(math)).id;
  const task: Task = {
    id,
    family: PLUS_FACTS_20,
    level,
    kind,
    prompt: {
      terms,
      ...(inverseOf ? { textKey: 'task.prompt.inverse', textParams: { known: inverseOf } } : {}),
    },
    answer,
    hints: factHints(math, firstKey),
    strategyId: firstKey ? firstKey.replace(/^hint\.|\.1$/g, '') : strategy,
    math,
    typicalErrors: errors,
    ...(house ? { display: { visual: house } } : {}),
    dedupeKey: house
      ? `pf_house:${math.a}:${math.result}`
      : math.op === '-'
        ? `pf_sub:${math.a}:${math.b}`
        : math.missing === 'b'
          ? `pf_gap:${math.a}:${math.result}`
          : `pf:${Math.min(math.a, math.b)}:${Math.max(math.a, math.b)}`,
  };
  if (kind === 'choice') task.options = optionsFromErrors(answer, errors, rng);
  return task;
};
