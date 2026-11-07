import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';

/** Basisauflösung im Querformat (Spezifikation, Abschnitt 1 und 3). */
export const GAME_WIDTH = 1024;
export const GAME_HEIGHT = 768;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#fff8ec',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 1,
  },
  scene: [BootScene],
};

new Phaser.Game(config);
