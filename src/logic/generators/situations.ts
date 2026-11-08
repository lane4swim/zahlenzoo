import { num } from '../params';
import type { Rng } from '../rng';
import type { FamilyParams, SituationTemplate } from '../../types/content';
import type { Generator, Hint, Task, TaskOption, TextParams } from '../../types/task';

/**
 * Zoo-Kasse: Sachsituationen ohne Rechnung (KE: Fragen zu Sachsituationen, Näherungswert).
 * Texte stehen in word-templates.de.json unter `situation.<id>`; die Vorlagen mit Stufen,
 * Zahlenbereichen und festen Antworten in situations.json.
 */
export const QUESTION_PICK = 'question_pick';
export const EXACT_OR_ESTIMATE = 'exact_or_estimate';

/** Falsche Fragen: passt nicht zur Situation, fehlende Angabe, steht schon im Text. */
export const QUESTION_DISTRACTORS = ['absurd', 'missing', 'given'] as const;
export type QuestionDistractor = (typeof QUESTION_DISTRACTORS)[number];

/** Falsche Fragen je Stufe (Stufe 3 nutzt Situationen mit überflüssigen Angaben). */
const DISTRACTORS_BY_LEVEL: Record<number, QuestionDistractor[]> = {
  1: ['absurd', 'missing'],
  2: ['missing', 'given'],
  3: ['missing', 'given'],
};

function templatesFor(params: FamilyParams, level: number): readonly SituationTemplate[] {
  const list = (params.situations ?? []).filter((s) => s.levels.includes(Math.max(1, level)));
  if (list.length === 0) throw new Error(`Keine Sachsituationen für Stufe ${level}`);
  return list;
}

function values(template: SituationTemplate, rng: Rng): TextParams {
  return Object.fromEntries(
    Object.entries(template.params).map(([k, [from, to]]) => [k, rng.int(from, to)]),
  );
}

/** Passende Frage zur Sachsituation wählen (KE: Fragen stellen; Auswahl statt Freitext). */
export const questionPick: Generator = (level, rng, id, params): Task => {
  const template = rng.pick(templatesFor(params, level));
  const p = values(template, rng);
  const base = `situation.${template.id}`;
  const wrong = DISTRACTORS_BY_LEVEL[Math.max(1, level)] ?? DISTRACTORS_BY_LEVEL[1]!;
  const options: TaskOption[] = rng.shuffle([
    { value: 'right', label: { key: `${base}.right`, params: p } },
    ...wrong.map((d) => ({
      value: d,
      errorTag: `question_${d}`,
      label: { key: `${base}.${d}`, params: p },
    })),
  ]);
  const hints: [Hint, Hint, Hint] = [
    { key: 'hint.question_pick.1' },
    { key: 'hint.question_pick.2' },
    { key: 'hint.question_pick.3', params: { question: `@${base}.right` } },
  ];
  return {
    id,
    family: QUESTION_PICK,
    level,
    kind: 'choice',
    prompt: { terms: [], textKey: base, textParams: p, instructionKey: 'task.prompt.pickQuestion' },
    answer: 'right',
    options,
    hints,
    strategyId: QUESTION_PICK,
    dedupeKey: `question:${template.id}`,
  };
};

const EXACT = 'exact';
const ESTIMATE = 'estimate';

/** Überschlag (Stufe 3): Preise nahe an vollen Zehnern, deutlich unter oder über dem Geld. */
function roughSum(
  rng: Rng,
  count: number,
  maxBudget: number,
): { prices: number[]; rounded: number[]; budget: number } {
  for (;;) {
    const rounded = Array.from({ length: count }, () => 10 * rng.int(1, 4));
    const prices = rounded.map((r) => r + rng.pick([-2, -1, 1, 2]));
    const sum = prices.reduce((s, v) => s + v, 0);
    const roundSum = rounded.reduce((s, v) => s + v, 0);
    const budget = roundSum + 10 * rng.pick([-1, 1]);
    // genug Abstand, damit der Überschlag sicher entscheidet
    if (budget <= maxBudget && budget > 0 && Math.abs(sum - budget) >= 4) {
      return { prices, rounded, budget };
    }
  }
}

/** Genau rechnen oder reicht ein Überschlag? (KE: Näherungswert genügt) */
export const exactOrEstimate: Generator = (level, rng, id, params): Task => {
  if (level >= 3) {
    const { prices, rounded, budget } = roughSum(
      rng,
      num(params, 'items'),
      num(params, 'maxBudget'),
    );
    const enough = prices.reduce((s, v) => s + v, 0) <= budget;
    const euro = (v: number) => `${v}\u00a0€`;
    const list = prices.map(euro).join(', ');
    const p: TextParams = {
      budget: euro(budget),
      prices: list,
      rounded: rounded.map(euro).join(' + '),
      roughSum: euro(rounded.reduce((s, v) => s + v, 0)),
    };
    const answer = enough ? 'yes' : 'no';
    const options: TaskOption[] = [
      {
        value: 'yes',
        label: { key: 'option.enough.yes' },
        ...(enough ? {} : { errorTag: 'estimate_wrong' }),
      },
      {
        value: 'no',
        label: { key: 'option.enough.no' },
        ...(enough ? { errorTag: 'estimate_wrong' } : {}),
      },
    ];
    return {
      id,
      family: EXACT_OR_ESTIMATE,
      level,
      kind: 'choice',
      prompt: { terms: [], textKey: 'task.prompt.enoughMoney', textParams: p },
      answer,
      options,
      hints: [
        { key: 'hint.exact_or_estimate.rough.1' },
        { key: 'hint.exact_or_estimate.rough.2', params: p },
        { key: `hint.exact_or_estimate.rough.3.${answer}`, params: p },
      ],
      strategyId: 'estimate_sum',
      dedupeKey: `rough:${[...prices].sort().join('+')}:${budget}`,
    };
  }
  const template = rng.pick(templatesFor(params, level));
  const p = values(template, rng);
  const answer = template.answer === ESTIMATE ? ESTIMATE : EXACT;
  const options: TaskOption[] = [EXACT, ESTIMATE].map((v) => ({
    value: v,
    label: { key: `option.${v}` },
    ...(v === answer ? {} : { errorTag: `need_${answer}` }),
  }));
  return {
    id,
    family: EXACT_OR_ESTIMATE,
    level,
    kind: 'choice',
    prompt: {
      terms: [],
      textKey: `situation.${template.id}`,
      textParams: p,
      instructionKey: 'task.prompt.exactOrEstimate',
    },
    answer,
    options,
    hints: [
      { key: 'hint.exact_or_estimate.1' },
      { key: `hint.exact_or_estimate.2.${answer}` },
      { key: `situation.${template.id}.why`, params: p },
    ],
    strategyId: EXACT_OR_ESTIMATE,
    dedupeKey: `situation:${template.id}`,
  };
};
