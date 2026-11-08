import { describe, expect, it } from 'vitest';
import hints from '../src/data/hints.de.json';
import strings from '../src/data/strings.de.json';
import templates from '../src/data/word-templates.de.json';
import { check } from '../src/logic/check';
import { amountLabel, fewestCoins, moneyLabel, moneyLay } from '../src/logic/generators/moneyLay';
import { storyAddSubFor } from '../src/logic/generators/storyAddSub';
import { createRng } from '../src/logic/rng';
import { I18n } from '../src/services/i18n';
import type { Task, TaskLevel } from '../src/types/task';
import { CONTENT, paramsOf } from './helpers/content';

const SEEDS = 500;
const CONTENT_TEXTS = { ...strings, ...hints };

function tasks(family: string, gen: typeof moneyLay, level: TaskLevel): Task[] {
  const P = paramsOf(family);
  return Array.from({ length: SEEDS }, (_, seed) =>
    gen(level, createRng(seed), `t${seed}`, P(level)),
  );
}

describe('Geld legen', () => {
  it('beschriftet Münzen, Scheine und Beträge', () => {
    expect(moneyLabel(1)).toBe('1\u00a0ct');
    expect(moneyLabel(50)).toBe('50\u00a0ct');
    expect(moneyLabel(200)).toBe('2\u00a0€');
    expect(moneyLabel(5000)).toBe('50\u00a0€');
    expect(amountLabel(37, 'euro')).toBe('37\u00a0€');
    expect(amountLabel(37, 'cent')).toBe('37\u00a0ct');
  });

  it('legt Beträge mit möglichst wenigen Stücken', () => {
    expect(fewestCoins(8700, [100, 200, 500, 1000, 2000, 5000])).toEqual([
      5000, 2000, 1000, 500, 200,
    ]);
    expect(fewestCoins(99, [1, 2, 5, 10, 20, 50, 100])).toEqual([50, 20, 20, 5, 2, 2]);
    expect(() => fewestCoins(3, [2])).toThrow();
  });

  it.each([
    [1, 'euro', 3, 20, 1000],
    [2, 'euro', 21, 100, 5000],
    [3, 'cent', 3, 100, 100],
  ] as const)('Stufe %i: %s von %i bis %i, größtes Stück %i', (level, unit, min, max, largest) => {
    for (const t of tasks('money_lay', moneyLay, level)) {
      expect(t.kind).toBe('money');
      expect(t.money!.unit).toBe(unit);
      expect(t.answer).toBe(t.money!.amount);
      expect(t.money!.amount).toBeGreaterThanOrEqual(min);
      expect(t.money!.amount).toBeLessThanOrEqual(max);
      expect(Math.max(...t.money!.denominations)).toBe(largest);
      const cents = unit === 'euro' ? t.money!.amount * 100 : t.money!.amount;
      const coins = fewestCoins(cents, t.money!.denominations);
      expect(coins.reduce((s, c) => s + c, 0)).toBe(cents);
      expect(t.hints).toHaveLength(3);
      expect(check(t, String(t.answer)).correct).toBe(true);
    }
  });

  it('erkennt zu viel und zu wenig', () => {
    const t = tasks('money_lay', moneyLay, 1)[0]!;
    expect(check(t, String((t.answer as number) + 1)).errorTag).toBe('too_much');
    expect(check(t, String((t.answer as number) - 1)).errorTag).toBe('too_little');
    for (const u of tasks('money_lay', moneyLay, 2)) {
      const a = u.answer as number;
      expect(check(u, String(a + 3)).errorTag).toBe('too_much');
      if (a > 3) expect(check(u, String(a - 3)).errorTag).toBe('too_little');
    }
  });

  it('hat Texte für Frage und Hinweise ohne offene Platzhalter', () => {
    const i18n = new I18n();
    i18n.load('de', CONTENT_TEXTS);
    for (const t of tasks('money_lay', moneyLay, 2).slice(0, 20)) {
      expect(i18n.t(t.prompt.textKey!, t.prompt.textParams)).toMatch(/^Lege \d+\u00a0€\.$/);
      for (const h of t.hints) expect(i18n.t(h.key, h.params)).not.toMatch(/\{\w+\}/);
    }
  });
});

describe('Rechnen mit Geld', () => {
  const gen = storyAddSubFor('money_calc');
  const i18n = new I18n();
  i18n.load('de', templates);

  it.each([
    [1, 20],
    [2, 100],
    [3, 100],
  ] as const)('Stufe %i: Geldgeschichten bis %i €', (level, max) => {
    const ids = new Set<string>();
    for (const t of tasks('money_calc', gen, level)) {
      const story = CONTENT.stories.find((s) => s.id === t.prompt.story!.id)!;
      expect(story.family).toBe('money_calc');
      expect(t.family).toBe('money_calc');
      expect(t.prompt.picture).toBeUndefined();
      expect(i18n.t(`story.${story.id}.unit`)).toBe('€');
      expect(t.answer as number).toBeLessThanOrEqual(max);
      ids.add(story.id);
    }
    expect(ids.size).toBeGreaterThanOrEqual(5);
  });
});
