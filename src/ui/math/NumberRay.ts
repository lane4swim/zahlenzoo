import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';
import type { LineSpec } from '../../types/task';

/** Pfeil von oben auf eine Stelle des Strahls (Spitze bei y = tip). */
export function drawPointer(g: Phaser.GameObjects.Graphics, x: number, tip: number, fill: number) {
  g.fillStyle(fill, 1);
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  const pts = [
    new Phaser.Math.Vector2(x, tip),
    new Phaser.Math.Vector2(x - 16, tip - 22),
    new Phaser.Math.Vector2(x - 7, tip - 22),
    new Phaser.Math.Vector2(x - 7, tip - 48),
    new Phaser.Math.Vector2(x + 7, tip - 48),
    new Phaser.Math.Vector2(x + 7, tip - 22),
    new Phaser.Math.Vector2(x + 16, tip - 22),
  ];
  g.fillPoints(pts, true);
  g.strokePoints(pts, true);
}

/**
 * Zahlenstrahl (Spezifikation 6): Striche in festen Abständen, Zahlen an den langen Strichen,
 * Fünfer etwas länger als Einer. marks: hervorgehobene Zahlen unter dem Strahl;
 * arrow: Pfeil von oben auf eine Zahl.
 */
export class NumberRay extends Phaser.GameObjects.Container {
  private readonly marksLayer: Phaser.GameObjects.Container;
  private readonly pointer: Phaser.GameObjects.Graphics;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly rayWidth: number,
    readonly spec: LineSpec,
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    this.add(g);
    const left = -rayWidth / 2;
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.lineBetween(left - 14, 0, rayWidth / 2 + 24, 0);
    // Pfeilspitze rechts: Der Strahl geht weiter.
    g.fillStyle(Color.kontur, 1);
    g.fillTriangle(rayWidth / 2 + 36, 0, rayWidth / 2 + 20, -9, rayWidth / 2 + 20, 9);
    const { min, max, ticks, labels } = spec;
    for (let v = min; v <= max; v += ticks) {
      const px = this.xOf(v);
      const big = (v - min) % labels === 0;
      const five = !big && v % 5 === 0 && ticks < 5;
      const h = big ? 18 : five ? 12 : 7;
      g.lineStyle(big ? Stroke.outline : Stroke.inner, Color.kontur, 1);
      g.lineBetween(px, -h, px, h);
      if (big) {
        this.add(
          scene.add
            .text(px, 26, String(v), {
              fontFamily: FontFamily.text,
              fontSize: `${FontSize.small}px`,
              color: CssColor.text,
            })
            .setOrigin(0.5, 0),
        );
      }
    }
    this.marksLayer = scene.add.container(0, 0);
    this.pointer = scene.add.graphics();
    this.add([this.marksLayer, this.pointer]);
    this.setMarks(spec.marks ?? [], spec.arrow);
    scene.add.existing(this);
  }

  /** Position einer Zahl (lokal). */
  xOf(value: number): number {
    const { min, max } = this.spec;
    return -this.rayWidth / 2 + ((value - min) / (max - min)) * this.rayWidth;
  }

  /** Zahl an einer lokalen Position, gerundet auf das Raster `snap`. */
  valueAt(localX: number, snap: number): number {
    const { min, max } = this.spec;
    const raw = min + ((localX + this.rayWidth / 2) / this.rayWidth) * (max - min);
    return Phaser.Math.Clamp(Math.round(raw / snap) * snap, min, max);
  }

  /** Hervorgehobene Zahlen (gelber Punkt, Zahl darunter) und ein Pfeil. */
  setMarks(marks: readonly number[], arrow?: number): this {
    this.marksLayer.removeAll(true);
    const g = this.scene.add.graphics();
    this.marksLayer.add(g);
    for (const m of marks) {
      const px = this.xOf(m);
      g.fillStyle(Color.sonne, 1);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.fillCircle(px, 0, 9);
      g.strokeCircle(px, 0, 9);
      // beschriftete Zahlen stehen schon unter dem Strahl
      if ((m - this.spec.min) % this.spec.labels === 0) continue;
      this.marksLayer.add(
        this.scene.add
          .text(px, 26, String(m), {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.small}px`,
            color: CssColor.kontur,
            fontStyle: 'bold',
          })
          .setOrigin(0.5, 0),
      );
    }
    this.pointer.clear();
    if (arrow !== undefined) drawPointer(this.pointer, this.xOf(arrow), -10, Color.wasser);
    return this;
  }
}
