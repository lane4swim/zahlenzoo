import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';
import { Tex } from '../ui/theme';

const DATA = ['strings.de', 'hints.de'] as const;

const IMAGES: Record<string, string> = {
  [Tex.starFull]: 'img/ui/ui_stern_voll_96.png',
  [Tex.starEmpty]: 'img/ui/ui_stern_leer_96.png',
  [Tex.hint]: 'img/ui/ui_hinweis_gluehbirne_96.png',
  [Tex.correct]: 'img/ui/ui_richtig_haken_96.png',
  [Tex.tryAgain]: 'img/ui/ui_nochmal_wolke_96.png',
  [Tex.ten]: 'img/math/mathe_zehner_48x480.png',
  [Tex.one]: 'img/math/mathe_einer_64.png',
};

/** Lädt Texte und Grafiken und startet mit der Profilauswahl oder dem Menü. */
export class BootScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Boot, services);
  }

  preload(): void {
    // Pfade relativ zu `base` aus vite.config.ts (GitHub Pages: /zahlenzoo/).
    this.load.setPath(`${import.meta.env.BASE_URL}assets/`);
    for (const key of DATA) this.load.json(key, `data/${key}.json`);
    for (const [key, file] of Object.entries(IMAGES)) this.load.image(key, file);
  }

  create(): void {
    this.services.i18n.load('de', ...DATA.map((key) => this.cache.json.get(key)));
    const { save } = this.services;
    this.scene.start(save.activeProfile ? SceneKey.Menu : SceneKey.Profile);
  }
}
