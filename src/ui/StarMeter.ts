import Phaser from 'phaser';
import { reducedMotion, Tex } from './theme';

/** Drei Sterne, gefüllte und leere (Form statt nur Farbe). */
export class StarMeter extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, filled: number, scale = 1.2) {
    super(scene, x, y);
    const step = 130 * scale;
    for (let i = 0; i < 3; i++) {
      const star = scene.add
        .image((i - 1) * step, i === 1 ? -20 : 0, i < filled ? Tex.starFull : Tex.starEmpty)
        .setScale(scale);
      this.add(star);
      if (i < filled && !reducedMotion()) {
        star.setScale(0);
        scene.tweens.add({
          targets: star,
          scale,
          delay: 300 + i * 350,
          duration: 400,
          ease: 'Back.easeOut',
        });
      }
    }
    scene.add.existing(this);
  }
}
