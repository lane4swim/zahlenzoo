import Phaser from 'phaser';
import { Color, Stroke } from './theme';

const RADIUS = 12;
const SPACING = 36;

/**
 * Rundenfortschritt als Punkte: erledigte Aufgaben gefüllt, offene als Ring.
 * Die Bedeutung liegt in der Form, nicht nur in der Farbe.
 */
export class ProgressDots extends Phaser.GameObjects.Graphics {
  constructor(
    scene: Phaser.Scene,
    private readonly centerX: number,
    private readonly centerY: number,
  ) {
    super(scene);
    scene.add.existing(this);
  }

  setProgress(done: number, total: number): this {
    this.clear();
    const startX = this.centerX - ((total - 1) * SPACING) / 2;
    for (let i = 0; i < total; i++) {
      const x = startX + i * SPACING;
      if (i < done) {
        this.fillStyle(Color.stern, 1);
        this.fillCircle(x, this.centerY, RADIUS);
      }
      this.lineStyle(Stroke.outline, Color.kontur, 1);
      this.strokeCircle(x, this.centerY, RADIUS);
    }
    return this;
  }
}
