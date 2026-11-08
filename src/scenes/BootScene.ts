import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';
import { createAnimalAnimations } from '../ui/AnimalSprite';
import {
  ANIMAL_ART,
  ANIMATIONS,
  AREA_ART,
  areaBackground,
  EXPRESSIONS,
  taskBackground,
} from '../ui/animals';
import { AnimalIcon, Tex } from '../ui/theme';

const DATA = ['strings.de', 'hints.de'] as const;

const IMAGES: Record<string, string> = {
  [Tex.starFull]: 'img/ui/ui_stern_voll_96.png',
  [Tex.starEmpty]: 'img/ui/ui_stern_leer_96.png',
  [Tex.hint]: 'img/ui/ui_hinweis_gluehbirne_96.png',
  [Tex.correct]: 'img/ui/ui_richtig_haken_96.png',
  [Tex.tryAgain]: 'img/ui/ui_nochmal_wolke_96.png',
  [Tex.ten]: 'img/math/mathe_zehner_48x480.png',
  [Tex.one]: 'img/math/mathe_einer_64.png',
  [Tex.map]: 'img/map/karte_hintergrund_1024x768.png',
  ...Object.fromEntries(
    [Tex.menuStart, Tex.menuProfile, Tex.menuAdults, Tex.menuRoundEnd].map((key) => [
      key,
      `img/menus/${key}_1024x768.png`,
    ]),
  ),
  [Tex.mapLock]: 'img/map/karte_schloss_128.png',
  [Tex.mapSign]: 'img/map/karte_schild_128.png',
  ...Object.fromEntries(Object.values(AnimalIcon).map((key) => [key, `img/map/${key}_128.png`])),
  ...Object.fromEntries(
    [
      Tex.speaker,
      Tex.back,
      Tex.next,
      Tex.mapIcon,
      Tex.backspace,
      Tex.aidTens,
      Tex.aidLine,
      Tex.aidHundred,
    ].map((key) => [key, `img/ui/${key}_96.png`]),
  ),
  ...Object.fromEntries(
    AREA_ART.flatMap((area) => [
      [areaBackground(area), `img/areas/${areaBackground(area)}_1024x768.png`],
      [taskBackground(area), `img/areas/${taskBackground(area)}_1024x768.png`],
    ]),
  ),
  ...Object.fromEntries(
    Object.values(ANIMAL_ART).flatMap((art) =>
      EXPRESSIONS.map((e) => [`${art.prefix}_${e}`, `img/animals/${art.prefix}_${e}_512.png`]),
    ),
  ),
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
    for (const art of Object.values(ANIMAL_ART)) {
      for (const animation of ANIMATIONS) {
        const key = `${art.prefix}_${animation}`;
        this.load.atlas(key, `img/animals/${key}_sheet.png`, `img/animals/${key}_sheet.json`);
      }
    }
  }

  create(): void {
    this.services.i18n.load('de', ...DATA.map((key) => this.cache.json.get(key)));
    createAnimalAnimations(this);
    const { save } = this.services;
    this.scene.start(save.activeProfile ? SceneKey.Menu : SceneKey.Profile);
  }
}
