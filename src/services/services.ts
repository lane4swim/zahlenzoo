import { I18n } from './i18n';

/**
 * Dienste, die alle Szenen gemeinsam nutzen. Sie werden in `main.ts` einmal
 * erzeugt und den Szenen im Konstruktor übergeben; globale Variablen gibt es nicht.
 * Spielstand, Audio und Inhalte kommen in Phase 2 und 3 hinzu.
 */
export type Services = {
  i18n: I18n;
};

export function createServices(): Services {
  return { i18n: new I18n() };
}
