import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';

export const CM = 40;

type Item = { from: number; to: number; look: 'pencil' | 'worm' | 'feather' };

/**
 * Lineal in Zentimetern (0 bis max) mit Gegenständen darüber. Mitte bei (0, 0); das Lineal
 * liegt unten, die Gegenstände stehen darüber, ihre Enden genau über den Strichen.
 */
export class Ruler extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, max: number, items: readonly Item[]) {
    super(scene, x, y);
    const width = max * CM;
    const left = -width / 2;
    const g = scene.add.graphics();
    // Lineal
    const top = 20;
    g.fillStyle(Color.sonne, 1);
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.fillRoundedRect(left - 14, top, width + 28, 62, 8);
    g.strokeRoundedRect(left - 14, top, width + 28, 62, 8);
    for (let mm = 0; mm <= max * 10; mm++) {
      const px = left + (mm * CM) / 10;
      const len = mm % 10 === 0 ? 22 : mm % 5 === 0 ? 14 : 8;
      g.lineStyle(mm % 10 === 0 ? 2.5 : 1.2, Color.kontur, 1);
      g.lineBetween(px, top, px, top + len);
    }
    const parts: Phaser.GameObjects.GameObject[] = [g];
    for (let cm = 0; cm <= max; cm++) {
      parts.push(
        scene.add
          .text(left + cm * CM, top + 40, String(cm), {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.small - 4}px`,
            color: CssColor.text,
          })
          .setOrigin(0.5),
      );
    }
    // Gegenstände übereinander, der erste unten
    items.forEach((item, i) => {
      const y0 = top - 26 - i * 44;
      const x0 = left + item.from * CM;
      const x1 = left + item.to * CM;
      const o = scene.add.graphics();
      if (item.look === 'pencil') {
        o.fillStyle(Color.wasser, 1);
        o.lineStyle(Stroke.inner, Color.kontur, 1);
        o.fillRect(x0, y0 - 12, x1 - x0 - 26, 24);
        o.strokeRect(x0, y0 - 12, x1 - x0 - 26, 24);
        o.fillStyle(Color.erde, 1);
        o.fillTriangle(x1 - 26, y0 - 12, x1 - 26, y0 + 12, x1, y0);
        o.strokeTriangle(x1 - 26, y0 - 12, x1 - 26, y0 + 12, x1, y0);
        o.fillStyle(Color.rosa, 1);
        o.fillRect(x0, y0 - 12, 10, 24);
        o.strokeRect(x0, y0 - 12, 10, 24);
      } else if (item.look === 'worm') {
        o.fillStyle(Color.rosa, 1);
        o.lineStyle(Stroke.inner, Color.kontur, 1);
        o.fillRoundedRect(x0, y0 - 11, x1 - x0, 22, 11);
        o.strokeRoundedRect(x0, y0 - 11, x1 - x0, 22, 11);
        o.fillStyle(Color.kontur, 1);
        o.fillCircle(x1 - 9, y0 - 3, 2.5);
      } else {
        o.fillStyle(Color.gras, 1);
        o.lineStyle(Stroke.inner, Color.kontur, 1);
        o.fillEllipse((x0 + x1) / 2, y0, x1 - x0, 22);
        o.strokeEllipse((x0 + x1) / 2, y0, x1 - x0, 22);
        o.lineBetween(x0 + 2, y0, x1 - 2, y0);
      }
      // Hilfslinien vom Gegenstand zum Lineal
      o.lineStyle(1.5, Color.kontur, 0.35);
      o.lineBetween(x0, y0 + 12, x0, top);
      o.lineBetween(x1, y0 + 12, x1, top);
      parts.push(o);
    });
    this.add(parts);
    const h = 110 + items.length * 44;
    this.add(scene.add.zone(0, top + 62 - h / 2, width + 40, h));
    scene.add.existing(this);
  }
}
