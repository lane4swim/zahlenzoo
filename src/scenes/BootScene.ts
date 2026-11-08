import { BaseScene } from './BaseScene';
import { RAW_CONTENT, TEXTS_DE } from '../data';
import type { Services } from '../services/services';
import type { GameContent } from '../types/content';
import { SceneKey } from '../types/scenes';
import { createAnimalAnimations } from '../ui/AnimalSprite';
import {
  ANIMATIONS,
  areaBackground,
  EXPRESSIONS,
  playableAreas,
  taskBackground,
} from '../ui/animals';
import { Tex } from '../ui/theme';

/** Hängt die Build-Kennung an, damit nach einem Update keine alten Grafiken aus dem Cache kommen. */
const versioned = (path: string) => `${path}?v=${__BUILD_ID__}`;

/** Bilder, die nicht von den Inhalten abhängen. */
const IMAGES: Record<string, string> = {
  [Tex.starFull]: 'img/ui/ui_stern_voll_96.png',
  [Tex.starEmpty]: 'img/ui/ui_stern_leer_96.png',
  [Tex.hint]: 'img/ui/ui_hinweis_gluehbirne_96.png',
  [Tex.correct]: 'img/ui/ui_richtig_haken_96.png',
  [Tex.tryAgain]: 'img/ui/ui_nochmal_wolke_96.png',
  [Tex.ten]: 'img/math/mathe_zehner_48x480.png',
  [Tex.one]: 'img/math/mathe_einer_64.png',
  [Tex.map]: 'img/map/karte_hintergrund_1024x768.png',
  [Tex.mapLock]: 'img/map/karte_schloss_128.png',
  [Tex.mapSign]: 'img/map/karte_schild_128.png',
  ...Object.fromEntries(
    ['objekt_fisch', 'objekt_eimer', 'objekt_banane', 'objekt_futternapf'].map((key) => [
      key,
      `img/objects/${key}_256.png`,
    ]),
  ),
  ...Object.fromEntries(
    [Tex.menuStart, Tex.menuProfile, Tex.menuAdults, Tex.menuRoundEnd].map((key) => [
      key,
      `img/menus/${key}_1024x768.png`,
    ]),
  ),
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
};

/**
 * Prüft Texte und Inhalte (gebaut mit dem Programm, siehe src/data) und lädt dann die
 * Grafiken: feste Bilder, Kartensymbole aller Tiere, Tiere und Hintergründe der
 * spielbaren Bereiche. Fehlerhafte Inhalte werden angezeigt statt einer leeren Seite.
 */
export class BootScene extends BaseScene {
  private error?: string;

  constructor(services: Services) {
    super(SceneKey.Boot, services);
  }

  preload(): void {
    try {
      this.services.i18n.load('de', ...TEXTS_DE);
      this.services.content.load(RAW_CONTENT);
    } catch (error) {
      this.error = error instanceof Error ? error.message : String(error);
      return;
    }
    // Pfade relativ zu `base` aus vite.config.ts (GitHub Pages: /zahlenzoo/).
    this.load.setPath(`${import.meta.env.BASE_URL}assets/`);
    for (const [key, file] of Object.entries(IMAGES)) this.load.image(key, versioned(file));
    this.queueContentAssets(this.content);
  }

  create(): void {
    if (this.error) {
      this.showError(this.error);
      return;
    }
    const content = this.content;
    const arts = playableAreas(content)
      .map((a) => content.animals[a.animal])
      .filter((a) => a !== undefined);
    createAnimalAnimations(this, arts);
    const { save } = this.services;
    this.scene.start(save.activeProfile ? SceneKey.Menu : SceneKey.Profile);
  }

  private showError(message: string): void {
    this.addTitle('Inhalte fehlerhaft', 200);
    this.addText(this.scale.width / 2, 360, message).setWordWrapWidth(860);
  }

  private queueContentAssets(content: GameContent): void {
    for (const animal of Object.values(content.animals)) {
      this.load.image(animal.icon, versioned(`img/map/${animal.icon}_128.png`));
    }
    for (const area of playableAreas(content)) {
      for (const key of [areaBackground(area.id), taskBackground(area.id)]) {
        this.load.image(key, versioned(`img/areas/${key}_1024x768.png`));
      }
      const art = content.animals[area.animal];
      if (!art) continue;
      for (const animation of ANIMATIONS) {
        const key = `${art.prefix}_${animation}`;
        this.load.atlas(
          key,
          versioned(`img/animals/${key}_sheet.png`),
          versioned(`img/animals/${key}_sheet.json`),
        );
      }
      for (const e of EXPRESSIONS) {
        this.load.image(`${art.prefix}_${e}`, versioned(`img/animals/${art.prefix}_${e}_512.png`));
      }
    }
  }
}
