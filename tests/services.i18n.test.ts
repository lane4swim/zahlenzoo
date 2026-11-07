import { describe, expect, it } from 'vitest';
import strings from '../public/assets/data/strings.de.json';
import { I18n } from '../src/services/i18n';

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

  it('lehnt ungültige Textdateien ab', () => {
    const i18n = new I18n();
    expect(() => i18n.load('de', [])).toThrow(TypeError);
    expect(() => i18n.load('de', null)).toThrow(TypeError);
    expect(() => i18n.load('de', { a: 1 })).toThrow(TypeError);
  });

  it('lädt strings.de.json mit allen Texten als String', () => {
    const i18n = new I18n();
    i18n.load('de', strings);
    expect(i18n.locale).toBe('de');
    expect(i18n.t('app.title')).toBe('Zahlen-Zoo');
  });
});
