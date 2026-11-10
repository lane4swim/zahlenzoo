import { describe, expect, it } from 'vitest';
import hints from '../src/data/hints.de.json';
import strings from '../src/data/strings.de.json';
import numberWords from '../src/data/numbers.de.json';
import templates from '../src/data/word-templates.de.json';
import { add100 } from '../src/logic/generators/add100';
import { multTable } from '../src/logic/generators/multTable';
import { neighbors100 } from '../src/logic/generators/neighbors100';
import { plusFacts20 } from '../src/logic/generators/plusFacts20';
import { sub100 } from '../src/logic/generators/sub100';
import { typicalErrors } from '../src/logic/options';
import { createRng } from '../src/logic/rng';
import { I18n } from '../src/services/i18n';
import { GENERATORS } from '../src/logic/generators';
import type { TaskLevel } from '../src/types/task';
import { CONTENT, paramsOf } from './helpers/content';
import { AVATARS } from '../src/types/save';

describe('I18n', () => {
  it('übersetzt Schlüssel und setzt Platzhalter ein', () => {
    const i18n = new I18n();
    i18n.load('de', { 'task.progress': 'Aufgabe {current} von {total}' });
    expect(i18n.t('task.progress', { current: 2, total: 8 })).toBe('Aufgabe 2 von 8');
  });

  it('lässt unbekannte Platzhalter stehen und gibt fehlende Schlüssel zurück', () => {
    const i18n = new I18n();
    i18n.load('de', { greet: 'Hallo {name}' });
    expect(i18n.t('greet')).toBe('Hallo {name}');
    expect(i18n.t('greet', { other: 1 })).toBe('Hallo {name}');
    expect(i18n.t('fehlt.noch')).toBe('fehlt.noch');
    expect(i18n.has('greet')).toBe(true);
    expect(i18n.has('fehlt.noch')).toBe(false);
  });

  it('führt mehrere Dateien zusammen', () => {
    const i18n = new I18n();
    i18n.load('de', { a: '1', b: '2' }, { b: '3' });
    expect(i18n.t('a')).toBe('1');
    expect(i18n.t('b')).toBe('3');
  });

  it('lehnt ungültige Textdateien ab', () => {
    const i18n = new I18n();
    expect(() => i18n.load('de', [])).toThrow(TypeError);
    expect(() => i18n.load('de', null)).toThrow(TypeError);
    expect(() => i18n.load('de', { a: 1 })).toThrow(TypeError);
  });
});

describe('Textdateien', () => {
  const i18n = new I18n();
  i18n.load('de', strings, hints, templates, numberWords);

  it('enthalten alle Hinweise, die der Generator verwendet, ohne offene Platzhalter', () => {
    for (let seed = 0; seed < 500; seed++) {
      for (const level of [1, 2, 3] as const) {
        for (const task of [
          add100(level, createRng(seed), 'x', paramsOf('add_100')(level)),
          neighbors100(level, createRng(seed), 'y', paramsOf('neighbors_100')(level)),
          multTable(level, createRng(seed), 'z', paramsOf('mult_table')(level)),
          sub100(level, createRng(seed), 's', paramsOf('sub_100')(level)),
          plusFacts20(level, createRng(seed), 'p', paramsOf('plus_facts_20')(level)),
        ]) {
          for (const hint of task.hints) {
            expect(i18n.has(hint.key), hint.key).toBe(true);
            expect(i18n.t(hint.key, hint.params)).not.toMatch(/\{\w+\}/);
          }
          if (task.prompt.textKey) expect(i18n.has(task.prompt.textKey)).toBe(true);
          if (task.strategyId) expect(i18n.has(`strategy.${task.strategyId}`)).toBe(true);
          const errors = task.typicalErrors ?? typicalErrors(task.math!);
          for (const e of errors) {
            expect(i18n.has(`error.${e.errorTag}`), e.errorTag).toBe(true);
          }
        }
      }
    }
  });

  it('enthalten für alle Familien Fragen, Antworten, Hinweise und Fehler ohne offene Platzhalter', () => {
    // „@schlüssel“ wird wie im Spiel mit denselben Werten gefüllt.
    const resolved = (params: Readonly<Record<string, string | number>> | undefined) =>
      Object.fromEntries(
        Object.entries(params ?? {}).map(([k, v]) => [
          k,
          typeof v === 'string' && v.startsWith('@')
            ? i18n.t(
                v.slice(1).split('|')[0]!,
                v.includes('|')
                  ? Object.fromEntries(
                      v
                        .split('|')
                        .slice(1)
                        .map((pair) => pair.split('=') as [string, string]),
                    )
                  : params,
              )
            : v,
        ]),
      );
    const open = /\{\w+\}/;
    for (const family of Object.keys(CONTENT.families)) {
      for (const level of [1, 2, 3] as TaskLevel[]) {
        const params = paramsOf(family)(level);
        for (let seed = 0; seed < 200; seed++) {
          const task = GENERATORS[family]!(level, createRng(seed), 't', params);
          const where = `${family} ${level} ${seed}`;
          const own = task.prompt.textParams ?? {};
          if (task.prompt.textKey) {
            expect(i18n.has(task.prompt.textKey), where).toBe(true);
            expect(i18n.t(task.prompt.textKey, resolved(own)), where).not.toMatch(open);
          }
          if (task.prompt.instructionKey) {
            expect(i18n.has(task.prompt.instructionKey), where).toBe(true);
          }
          for (const hint of task.hints) {
            expect(i18n.has(hint.key), `${where} ${hint.key}`).toBe(true);
            const text = i18n.t(hint.key, { unit: '€', ...resolved(hint.params) });
            expect(text, `${where} ${hint.key}`).not.toMatch(open);
            expect(text, `${where} ${hint.key}`).not.toMatch(/situation\./);
          }
          for (const o of task.options ?? []) {
            if (o.label) {
              expect(i18n.has(o.label.key), `${where} ${o.label.key}`).toBe(true);
              expect(i18n.t(o.label.key, resolved(o.label.params)), where).not.toMatch(open);
            }
            if (o.errorTag && o.errorTag !== 'other') {
              expect(i18n.has(`error.${o.errorTag}`), `${where} ${o.errorTag}`).toBe(true);
            }
          }
          for (const e of task.typicalErrors ?? []) {
            expect(i18n.has(`error.${e.errorTag}`), `${where} ${e.errorTag}`).toBe(true);
          }
          if (task.strategyId) expect(i18n.has(`strategy.${task.strategyId}`), where).toBe(true);
        }
      }
    }
  });

  it('enthalten Namen für alle Tierbilder', () => {
    for (const avatar of AVATARS) expect(i18n.has(`avatar.${avatar}`)).toBe(true);
  });
});
