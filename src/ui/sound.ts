import type Phaser from 'phaser';
import type { Sfx } from '../logic/audio';
import { GameEvent } from '../types/events';

/**
 * UI-Bausteine kennen den Audio-Dienst nicht; sie melden einen Effekt an ihre Szene, die
 * BaseScene spielt ihn ab (Lautstärke aus den Einstellungen des Profils).
 */
export function uiSound(scene: Phaser.Scene, name: Sfx): void {
  scene.events.emit(GameEvent.UiSound, name);
}
