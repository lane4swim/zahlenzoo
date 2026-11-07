export type Strings = Readonly<Record<string, string>>;
export type TranslateParams = Readonly<Record<string, string | number>>;

/**
 * Oberflächentexte aus JSON (`public/assets/data/strings.<locale>.json`).
 * Platzhalter im Text: `{name}`. Fehlende Schlüssel erscheinen als Schlüssel,
 * damit sie beim Testen auffallen.
 */
export class I18n {
  private strings: Strings = {};
  private currentLocale = 'de';

  get locale(): string {
    return this.currentLocale;
  }

  load(locale: string, strings: unknown): void {
    this.strings = parseStrings(strings);
    this.currentLocale = locale;
  }

  has(key: string): boolean {
    return Object.hasOwn(this.strings, key);
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
