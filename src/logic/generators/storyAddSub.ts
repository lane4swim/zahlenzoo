import { num, share } from '../params';
import type { Rng } from '../rng';
import { storyTask } from './story';
import type { FamilyParams } from '../../types/content';
import type { Generator, Task, TaskLevel, TypicalError } from '../../types/task';

/**
 * Pinguinfelsen: einschrittige Sachaufgaben zu Plus und Minus (KE: story_addsub).
 * Stufe 1: Zahlen bis 20. Stufe 2: bis 100 ohne Zehnerübergang. Stufe 3: bis 100 mit
 * Zehnerübergang. Anteil der Minusaufgaben und Zahlenraum aus families.json.
 */
export const STORY_ADDSUB = 'story_addsub';

/** crossing: 1 = mit Übergang, 0 = ohne, fehlt = beliebig */
function crossing(params: FamilyParams): number | undefined {
  const value = params.level.crossing;
  return typeof value === 'number' ? value : undefined;
}

function addition(rng: Rng, max: number, cross: number | undefined): [number, number] {
  for (;;) {
    const a = rng.int(2, max - 2);
    const b = rng.int(2, max - a);
    const carry = (a % 10) + (b % 10) >= 10;
    if (cross === undefined || carry === (cross === 1)) return [a, b];
  }
}

function subtraction(rng: Rng, max: number, cross: number | undefined): [number, number] {
  for (;;) {
    const a = rng.int(4, max);
    const b = rng.int(2, a - 1);
    const borrow = a % 10 < b % 10;
    if (cross === undefined || borrow === (cross === 1)) return [a, b];
  }
}

const near = (answer: number): TypicalError[] => [
  { value: answer + 1, errorTag: 'ones_off' },
  { value: answer - 1, errorTag: 'ones_off' },
  { value: answer + 10, errorTag: 'tens_off' },
  { value: answer - 10, errorTag: 'tens_off' },
];

export const storyAddSub: Generator = (
  level: TaskLevel,
  rng: Rng,
  id: string,
  params: FamilyParams,
): Task => {
  const max = num(params, 'max');
  const cross = crossing(params);
  if (rng.chance(share(params, 'subShare'))) {
    const [a, b] = subtraction(rng, max, cross);
    const result = a - b;
    const borrow = a % 10 < b % 10;
    return storyTask(
      {
        family: STORY_ADDSUB,
        level,
        id,
        op: 'sub',
        values: { a, b },
        answer: result,
        equation: `${a} − ${b} = ?`,
        picture: { groups: [a], crossed: b },
        errors: [
          { value: a + b, errorTag: 'wrong_operation' },
          ...(borrow ? [{ value: result + 10, errorTag: 'borrow_forgotten' }] : []),
          ...near(result),
        ],
        math: { op: '-', a, b, result, missing: 'result', carry: borrow },
      },
      rng,
      params,
    );
  }
  const [a, b] = addition(rng, max, cross);
  const result = a + b;
  const carry = (a % 10) + (b % 10) >= 10;
  return storyTask(
    {
      family: STORY_ADDSUB,
      level,
      id,
      op: 'add',
      values: { a, b },
      answer: result,
      equation: `${a} + ${b} = ?`,
      picture: { groups: [a, b] },
      errors: [
        { value: a - b, errorTag: 'wrong_operation' },
        ...(carry ? [{ value: result - 10, errorTag: 'carry_forgotten' }] : []),
        ...near(result),
      ],
      math: { op: '+', a, b, result, missing: 'result', carry },
    },
    rng,
    params,
  );
};
