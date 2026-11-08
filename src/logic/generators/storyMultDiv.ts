import { nums, share } from '../params';
import type { Rng } from '../rng';
import { repeated, storyTask } from './story';
import type { FamilyParams } from '../../types/content';
import type { Generator, Task, TaskLevel } from '../../types/task';

/**
 * Elefantenwiese: einschrittige Sachaufgaben zu Mal und Geteilt (KE: story_multdiv;
 * Division als Verteilen und Aufteilen). Stufe 1: gleich große Gruppen (Malnehmen).
 * Stufe 2: Verteilen, gemischt mit Malnehmen. Stufe 3: Aufteilen, gemischt mit Verteilen.
 * Alle Zahlen bis 100; Reihen und Teiler aus families.json.
 */
export const STORY_MULTDIV = 'story_multdiv';

const upTo = (factor: number) => Math.min(10, Math.floor(100 / factor));

function mult(level: TaskLevel, rng: Rng, id: string, params: FamilyParams): Task {
  const each = rng.pick(nums(params, 'rows'));
  const groups = rng.int(2, upTo(each));
  const result = groups * each;
  return storyTask(
    {
      family: STORY_MULTDIV,
      level,
      id,
      op: 'mult',
      values: { groups, each },
      answer: result,
      equation: `${groups} · ${each} = ?`,
      picture: { groups: repeated(groups, each) },
      errors: [
        { value: groups + each, errorTag: 'added' },
        { value: result + each, errorTag: 'row_off' },
        { value: result - each, errorTag: 'row_off' },
      ],
    },
    rng,
    params,
  );
}

function shareTask(level: TaskLevel, rng: Rng, id: string, params: FamilyParams): Task {
  const groups = rng.pick(nums(params, 'divisors'));
  const each = rng.int(2, upTo(groups));
  const total = groups * each;
  return storyTask(
    {
      family: STORY_MULTDIV,
      level,
      id,
      op: 'share',
      values: { total, groups },
      answer: each,
      equation: `${total} : ${groups} = ?`,
      picture: { groups: [total] },
      errors: [
        { value: total - groups, errorTag: 'subtracted' },
        { value: total, errorTag: 'gave_total' },
        { value: each + 1, errorTag: 'row_off' },
        { value: each - 1, errorTag: 'row_off' },
      ],
    },
    rng,
    params,
  );
}

function measure(level: TaskLevel, rng: Rng, id: string, params: FamilyParams): Task {
  const size = rng.pick(nums(params, 'sizes'));
  const count = rng.int(2, upTo(size));
  const total = size * count;
  return storyTask(
    {
      family: STORY_MULTDIV,
      level,
      id,
      op: 'measure',
      values: { total, size },
      answer: count,
      equation: `${total} : ${size} = ?`,
      picture: { groups: [total] },
      errors: [
        { value: total - size, errorTag: 'subtracted' },
        { value: total, errorTag: 'gave_total' },
        { value: count + 1, errorTag: 'row_off' },
        { value: count - 1, errorTag: 'row_off' },
      ],
    },
    rng,
    params,
  );
}

export const storyMultDiv: Generator = (level, rng, id, params): Task => {
  if (level <= 1) return mult(level, rng, id, params);
  if (level === 2) {
    return rng.chance(share(params, 'shareShare'))
      ? shareTask(level, rng, id, params)
      : mult(level, rng, id, params);
  }
  return rng.chance(share(params, 'measureShare'))
    ? measure(level, rng, id, params)
    : shareTask(level, rng, id, params);
};
