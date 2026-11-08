import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from '../theme';

/**
 * Analoge Uhr (Mathe-Darstellung): Zifferblatt mit 12 Zahlen und Minutenstrichen,
 * kurzer dicker Stundenzeiger, langer schlanker Minutenzeiger in anderer Farbe.
 * Zeit in Minuten seit 0:00; der Stundenzeiger rückt mit den Minuten weiter.
 */
export class ClockFace extends Phaser.GameObjects.Container {
  private readonly hands: Phaser.GameObjects.Graphics;
  private minutes = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly radius: number,
    time: number,
  ) {
    super(scene, x, y);
    const r = radius;
    const face = scene.add.graphics();
    face.fillStyle(Color.kartenSchatten, 1);
    face.fillCircle(0, 8, r);
    face.fillStyle(Color.papier, 1);
    face.lineStyle(Stroke.outline, Color.kontur, 1);
    face.fillCircle(0, 0, r);
    face.strokeCircle(0, 0, r);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const long = i % 5 === 0;
      const inner = r * (long ? 0.86 : 0.91);
      face.lineStyle(long ? Stroke.inner + 0.5 : 1.5, Color.kontur, long ? 1 : 0.6);
      face.lineBetween(
        Math.sin(a) * inner,
        -Math.cos(a) * inner,
        Math.sin(a) * r * 0.95,
        -Math.cos(a) * r * 0.95,
      );
    }
    const parts: Phaser.GameObjects.GameObject[] = [face];
    for (let n = 1; n <= 12; n++) {
      const a = (n / 12) * Math.PI * 2;
      parts.push(
        scene.add
          .text(Math.sin(a) * r * 0.7, -Math.cos(a) * r * 0.7, String(n), {
            fontFamily: FontFamily.text,
            fontSize: `${Math.round(r * 0.22)}px`,
            color: CssColor.text,
          })
          .setOrigin(0.5),
      );
    }
    this.hands = scene.add.graphics();
    parts.push(this.hands);
    this.add(parts);
    // Fläche für getBounds (Grafiken allein haben keine Größe)
    this.add(scene.add.zone(0, 0, 2 * r, 2 * r));
    this.setTime(time);
    scene.add.existing(this);
  }

  get time(): number {
    return this.minutes;
  }

  setTime(time: number): this {
    this.minutes = time;
    const r = this.radius;
    const m = ((time % 60) + 60) % 60;
    const h = (Math.floor(time / 60) % 12) + m / 60;
    const g = this.hands;
    g.clear();
    this.hand(g, (h / 12) * Math.PI * 2, r * 0.5, 14, Color.kontur, Color.orange);
    this.hand(g, (m / 60) * Math.PI * 2, r * 0.8, 8, Color.kontur, Color.wasser);
    g.fillStyle(Color.kontur, 1);
    g.fillCircle(0, 0, 9);
    return this;
  }

  /** Zeiger als abgerundetes Band mit Kontur (Form und Farbe unterscheiden die Zeiger). */
  private hand(
    g: Phaser.GameObjects.Graphics,
    angle: number,
    length: number,
    width: number,
    outline: number,
    fill: number,
  ): void {
    const tx = Math.sin(angle) * length;
    const ty = -Math.cos(angle) * length;
    g.lineStyle(width + Stroke.outline * 2, outline, 1);
    g.lineBetween(0, 0, tx, ty);
    g.fillStyle(outline, 1);
    g.fillCircle(tx, ty, width / 2 + Stroke.outline);
    g.lineStyle(width, fill, 1);
    g.lineBetween(0, 0, tx, ty);
    g.fillStyle(fill, 1);
    g.fillCircle(tx, ty, width / 2);
  }
}
