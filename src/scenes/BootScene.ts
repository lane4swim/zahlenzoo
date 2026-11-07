import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';

const STRINGS_KEY = 'strings.de';

/** Lädt Texte (später auch Grafiken, Audio und Inhalte) und startet das Menü. */
export class BootScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Boot, services);
  }

  preload(): void {
    // Pfade relativ zu `base` aus vite.config.ts (GitHub Pages: /zahlenzoo/).
    this.load.setPath(import.meta.env.BASE_URL);
    this.load.json(STRINGS_KEY, 'assets/data/strings.de.json');
  }

  create(): void {
    this.services.i18n.load('de', this.cache.json.get(STRINGS_KEY));
    this.scene.start(SceneKey.Menu);
  }
}
