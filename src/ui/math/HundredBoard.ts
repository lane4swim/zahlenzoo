import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from '../theme';

const CELL = 22;

/** Hundertertafel 1 bis 100; markierte Zahlen sind gefüllt, umrandet und rechts beschriftet. */
export class HundredBoard extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, marked: readonly number[]) {
    super(scene, x, y);
    const g = scene.add.graphics();
    this.add(g);
    const left = -5 * CELL;
    const top = -5 * CELL;
    for (let n = 1; n <= 100; n++) {
      const col = (n - 1) % 10;
      const row = Math.floor((n - 1) / 10);
      const isMarked = marked.includes(n);
      g.fillStyle(isMarked ? Color.orange : col < 5 ? Color.papier : Color.himmel, 1);
      g.fillRect(left + col * CELL, top + row * CELL, CELL, CELL);
      g.lineStyle(isMarked ? Stroke.outline : 1, Color.kontur, isMarked ? 1 : 0.5);
      g.strokeRect(left + col * CELL, top + row * CELL, CELL, CELL);
      if (isMarked) {
        this.add(
          scene.add
            .text(left + 10 * CELL + 12, top + row * CELL + CELL / 2, String(n), {
              fontFamily: FontFamily.text,
              fontSize: '20px',
              color: CssColor.kontur,
            })
            .setOrigin(0, 0.5),
        );
      }
    }
    scene.add.existing(this);
  }
}
