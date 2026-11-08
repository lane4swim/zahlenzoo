import { describe, expect, it } from 'vitest';
import templates from '../src/data/word-templates.de.json';
import { check } from '../src/logic/check';
import { storyAddSub } from '../src/logic/generators/storyAddSub';
import { storyMultDiv } from '../src/logic/generators/storyMultDiv';
import { createRng } from '../src/logic/rng';
import { I18n } from '../src/services/i18n';
import type { Generator, Task, TaskLevel } from '../src/types/task';
import { CONTENT, paramsOf } from './helpers/content';

const SEEDS = 1000;
const i18n = new I18n();
i18n.load('de', templates);

function forAllSeeds(gen: Generator, family: string, level: TaskLevel, fn: (t: Task) => void) {
  const P = paramsOf(family);
  for (let seed = 0; seed < SEEDS; seed++) fn(gen(level, createRng(seed), `t${seed}`, P(level)));
}

/** Rechnet die Geschichte nach ihrer Rechenart aus. */
function solve(task: Task): number {
  const op = CONTENT.stories.find((s) => s.id === task.prompt.story!.id)!.op;
  const v = task.prompt.story!.params as Record<string, number>;
  switch (op) {
    case 'add':
      return v.a! + v.b!;
    case 'sub':
      return v.a! - v.b!;
    case 'mult':
      return v.groups! * v.each!;
    case 'share':
      return v.total! / v.groups!;
    case 'measure':
      return v.total! / v.size!;
  }
}

describe('Sachaufgaben', () => {
  it.each([
    ['story_addsub', storyAddSub, 1, 20],
    ['story_addsub', storyAddSub, 2, 100],
    ['story_addsub', storyAddSub, 3, 100],
    ['story_multdiv', storyMultDiv, 1, 100],
    ['story_multdiv', storyMultDiv, 2, 100],
    ['story_multdiv', storyMultDiv, 3, 100],
  ] as const)(
    '%s Stufe %i: richtige Lösung, Zahlen bis %i, vollständiger Text',
    (family, gen, level, max) => {
      forAllSeeds(gen, family, level, (task) => {
        expect(task.kind).toBe('word');
        expect(task.answer).toBe(solve(task));
        expect(Number.isInteger(task.answer)).toBe(true);
        expect(task.answer as number).toBeGreaterThanOrEqual(1);
        for (const v of Object.values(task.prompt.story!.params)) {
          expect(v as number).toBeGreaterThanOrEqual(2);
          expect(v as number).toBeLessThanOrEqual(max);
        }
        const text = i18n.t(`story.${task.prompt.story!.id}`, task.prompt.story!.params);
        expect(text).not.toMatch(/\{\w+\}/);
        expect(i18n.has(`story.${task.prompt.story!.id}.unit`)).toBe(true);
        expect(task.family).toBe(family);
      });
    },
  );

  it('hält Übergang und Rechenart der Stufen ein', () => {
    const carry = (t: Task) => t.math!.carry;
    forAllSeeds(storyAddSub, 'story_addsub', 2, (t) => expect(carry(t)).toBe(false));
    forAllSeeds(storyAddSub, 'story_addsub', 3, (t) => expect(carry(t)).toBe(true));
    const ops = new Set<string>();
    forAllSeeds(storyMultDiv, 'story_multdiv', 3, (t) => ops.add(t.strategyId!));
    expect([...ops].sort()).toEqual(['story_measure', 'story_share']);
  });

  it('zeigt ein Bild, das zur Geschichte passt', () => {
    forAllSeeds(storyAddSub, 'story_addsub', 1, (t) => {
      const p = t.prompt.picture!;
      const v = t.prompt.story!.params as Record<string, number>;
      if (t.strategyId === 'story_sub') expect(p).toMatchObject({ groups: [v.a], crossed: v.b });
      else expect(p.groups).toEqual([v.a, v.b]);
    });
    forAllSeeds(storyMultDiv, 'story_multdiv', 1, (t) => {
      const v = t.prompt.story!.params as Record<string, number>;
      expect(t.prompt.picture!.groups).toEqual(Array(v.groups).fill(v.each));
    });
  });

  it('erkennt die falsche Rechenart als typischen Fehler', () => {
    forAllSeeds(storyAddSub, 'story_addsub', 1, (t) => {
      const v = t.prompt.story!.params as Record<string, number>;
      const wrong = t.strategyId === 'story_sub' ? v.a! + v.b! : v.a! - v.b!;
      if (wrong < 0 || wrong === t.answer) return;
      expect(check(t, wrong).errorTag).toBe('wrong_operation');
    });
  });

  it('liefert gültige Antwortkarten', () => {
    forAllSeeds(storyMultDiv, 'story_multdiv', 2, (t) => {
      if (!t.options) return;
      const values = t.options.map((o) => Number(o.value));
      expect(new Set(values).size).toBe(4);
      expect(values).toContain(t.answer);
    });
  });
});

describe('Vorlagen', () => {
  const placeholders: Record<string, string[]> = {
    add: ['a', 'b'],
    sub: ['a', 'b'],
    mult: ['groups', 'each'],
    share: ['total', 'groups'],
    measure: ['total', 'size'],
  };

  it('haben mindestens 30 Vorlagen mit Text, Einheit und genau den passenden Platzhaltern', () => {
    expect(CONTENT.stories.length).toBeGreaterThanOrEqual(30);
    for (const s of CONTENT.stories) {
      const text = (templates as Record<string, string>)[`story.${s.id}`];
      expect(text, s.id).toBeDefined();
      expect((templates as Record<string, string>)[`story.${s.id}.unit`], s.id).toBeDefined();
      const used = [...text!.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(used, s.id).toEqual([...placeholders[s.op]!].sort());
    }
  });

  it('verweisen auf vorhandene Bilder', () => {
    const images = Object.keys(import.meta.glob('../public/assets/img/**/*.png'));
    for (const s of CONTENT.stories) {
      const found = images.some(
        (p) => p.endsWith(`/${s.icon}_256.png`) || p.endsWith(`/${s.icon}_128.png`),
      );
      expect(found, s.icon).toBe(true);
    }
  });
});
