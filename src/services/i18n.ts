import type { TextParams } from '../types/task';

export type Strings = Readonly<Record<string, string>>;
export type TranslateParams = TextParams;

/**
 * Texte aus JSON (`src/data/*.de.json`). Platzhalter im Text: `{name}`.
 * Fehlende Schlüssel erscheinen als Schlüssel, damit sie beim Testen auffallen.
 */
export class I18n {
  private strings: Record<string, string> = {};
  private currentLocale = 'de';

  get locale(): string {
    return this.currentLocale;
  }

  /** Ersetzt alle Texte durch die übergebenen Dateien (spätere überschreiben frühere). */
  load(locale: string, ...files: unknown[]): void {
    const merged: Record<string, string> = {};
    for (const file of files) Object.assign(merged, parseStrings(file));
    this.strings = merged;
    this.currentLocale = locale;
  }

  has(key: string): boolean {
    return Object.hasOwn(this.strings, key);
  }

  keys(): string[] {
    return Object.keys(this.strings);
  }

  t(key: string, params?: TranslateParams): string {
    const text = this.strings[key];
    if (text === undefined) return key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (match, name: string) => {
      const value = params[name];
      return value === undefined ? match : String(value);
    });
  }
}

function parseStrings(data: unknown): Strings {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new TypeError('Texte müssen ein JSON-Objekt sein');
  }
  for (const [key, value] of Object.entries(data)) {
    if (typeof value !== 'string') throw new TypeError(`Text "${key}" ist kein String`);
  }
  return { ...(data as Record<string, string>) };
}
