import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from '../theme';

/** Hundertertafel 1 bis 100; markierte Zahlen sind gefüllt, umrandet und rechts beschriftet. */
export class HundredBoard extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    marked: readonly number[],
    private readonly cell = 18,
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    this.add(g);
    const CELL = this.cell;
    const left = -5 * CELL;
    const top = -5 * CELL;
    // Tafel mit Rand, dann alle Felder, zuletzt die markierten (dicker Rand oben auf).
    g.fillStyle(Color.papier, 1);
    g.fillRect(left - 3, top - 3, 10 * CELL + 6, 10 * CELL + 6);
    const cellAt = (n: number) => ({
      x: left + ((n - 1) % 10) * CELL,
      y: top + Math.floor((n - 1) / 10) * CELL,
    });
    for (let n = 1; n <= 100; n++) {
      const { x: cx, y: cy } = cellAt(n);
      g.fillStyle((n - 1) % 10 < 5 ? Color.papier : Color.himmel, 1);
      g.fillRect(cx, cy, CELL, CELL);
      g.lineStyle(1, Color.kontur, 0.5);
      g.strokeRect(cx, cy, CELL, CELL);
    }
    for (const n of marked) {
      if (n < 1 || n > 100) continue;
      const { x: cx, y: cy } = cellAt(n);
      g.fillStyle(Color.orange, 1);
      g.fillRect(cx, cy, CELL, CELL);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.strokeRect(cx, cy, CELL, CELL);
    }
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.strokeRect(left - 3, top - 3, 10 * CELL + 6, 10 * CELL + 6);
    // Beschriftung rechts neben der Tafel, je Zeile eine (mehrere Zahlen mit Komma).
    const rows = new Map<number, number[]>();
    for (const n of [...marked].sort((a, b) => a - b)) {
      if (n < 1 || n > 100) continue;
      const row = Math.floor((n - 1) / 10);
      rows.set(row, [...(rows.get(row) ?? []), n]);
    }
    for (const [row, numbers] of rows) {
      this.add(
        scene.add
          .text(left + 10 * CELL + 12, top + row * CELL + CELL / 2, numbers.join(', '), {
            fontFamily: FontFamily.text,
            fontSize: '20px',
            color: CssColor.kontur,
          })
          .setOrigin(0, 0.5),
      );
    }
    scene.add.existing(this);
  }
}
