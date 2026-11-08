import { describe, expect, it } from 'vitest';
import hints from '../public/assets/data/hints.de.json';
import strings from '../public/assets/data/strings.de.json';
import { add100 } from '../src/logic/generators/add100';
import { neighbors100 } from '../src/logic/generators/neighbors100';
import { typicalErrors } from '../src/logic/options';
import { createRng } from '../src/logic/rng';
import { I18n } from '../src/services/i18n';
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
  i18n.load('de', strings, hints);

  it('enthalten alle Hinweise, die der Generator verwendet, ohne offene Platzhalter', () => {
    for (let seed = 0; seed < 500; seed++) {
      for (const level of [1, 2, 3] as const) {
        for (const task of [
          add100(level, createRng(seed), 'x'),
          neighbors100(level, createRng(seed), 'y'),
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

  it('enthalten Namen für alle Tierbilder', () => {
    for (const avatar of AVATARS) expect(i18n.has(`avatar.${avatar}`)).toBe(true);
  });
});
