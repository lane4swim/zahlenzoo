import { AudioService } from './audio';
import { I18n } from './i18n';
import { SaveService, type KeyValueStore } from './save';

/**
 * Dienste, die alle Szenen gemeinsam nutzen. Sie werden in `main.ts` einmal
 * erzeugt und den Szenen im Konstruktor übergeben; globale Variablen gibt es nicht.
 */
export type Services = {
  i18n: I18n;
  save: SaveService;
  audio: AudioService;
};

function browserStore(): KeyValueStore | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export function createServices(store: KeyValueStore | undefined = browserStore()): Services {
  return { i18n: new I18n(), save: new SaveService(store), audio: new AudioService() };
}
