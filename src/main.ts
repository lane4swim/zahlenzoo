import Phaser from 'phaser';
import { AreaScene } from './scenes/AreaScene';
import { BootScene } from './scenes/BootScene';
import { MapScene } from './scenes/MapScene';
import { MenuScene } from './scenes/MenuScene';
import { ParentScene } from './scenes/ParentScene';
import { RoundEndScene } from './scenes/RoundEndScene';
import { SettingsScene } from './scenes/SettingsScene';
import { TaskScene } from './scenes/TaskScene';
import { createServices } from './services/services';
import { CssColor } from './ui/theme';

/** Basisauflösung im Querformat (Spezifikation, Abschnitt 1 und 3). */
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

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
  input: {
    activePointers: 1,
  },
  scene: [
    new BootScene(services),
    new MenuScene(services),
    new MapScene(services),
    new AreaScene(services),
    new TaskScene(services),
    new RoundEndScene(services),
    new ParentScene(services),
    new SettingsScene(services),
  ],
};

new Phaser.Game(config);
