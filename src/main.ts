import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import '@fontsource/fredoka/latin-600.css';
import Phaser from 'phaser';
import { AreaScene } from './scenes/AreaScene';
import { BootScene } from './scenes/BootScene';
import { MapScene } from './scenes/MapScene';
import { MenuScene } from './scenes/MenuScene';
import { ParentScene } from './scenes/ParentScene';
import { ProfileCreateScene } from './scenes/ProfileCreateScene';
import { ProfileScene } from './scenes/ProfileScene';
import { RoundEndScene } from './scenes/RoundEndScene';
import { SettingsScene } from './scenes/SettingsScene';
import { TaskScene } from './scenes/TaskScene';
import { ZooScene } from './scenes/ZooScene';
import { createServices } from './services/services';
import { CssColor } from './ui/theme';

/** Basisauflösung im Querformat (Spezifikation, Abschnitt 1 und 3). */
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

/** Phaser zeichnet Text sofort; Schriften deshalb vor dem Start laden. */
async function loadFonts(): Promise<void> {
  try {
    await Promise.all([
      document.fonts.load('28px Andika'),
      document.fonts.load('bold 28px Andika'),
      document.fonts.load('600 56px Fredoka'),
    ]);
  } catch {
    // Ohne Schrift weiter mit der Systemschrift.
  }
}

async function start(): Promise<void> {
  await loadFonts();
  const services = createServices();
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: CssColor.papier,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    dom: { createContainer: true },
    input: { activePointers: 1 },
    scene: [
      new BootScene(services),
      new ProfileScene(services),
      new ProfileCreateScene(services),
      new MenuScene(services),
      new MapScene(services),
      new AreaScene(services),
      new TaskScene(services),
      new RoundEndScene(services),
      new ParentScene(services),
      new SettingsScene(services),
      new ZooScene(services),
    ],
  };
  new Phaser.Game(config);
}

void start();
