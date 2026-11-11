import Phaser from 'phaser';
import { CssColor, FontFamily, FontSize, Tex } from '../theme';

const TEN_SCALE = 0.25; // 48 × 480 → 12 × 120
const ONE_SCALE = 0.3; // 64 → 19

/**
 * Zehnerstangen und Einerwürfel für eine oder mehrere Zahlen nebeneinander.
 * Mit `blocks` statt Zahlen: genau so viele Zehner und Einer, ohne Zahl darunter
 * (Aufgabenbild zum Zählen; mehr als 9 Einer zum Umbündeln).
 */
export class TensOnes extends Phaser.GameObjects.Container {
  static blocks(
    scene: Phaser.Scene,
    x: number,
    y: number,
    tens: number,
    ones: number,
  ): Phaser.GameObjects.Container {
    const c = scene.add.container(x, y);
    const tenW = 18;
    const onesCols = Math.ceil(ones / 5);
    const width = tens * tenW + (ones > 0 ? 24 + onesCols * 26 : 0);
    const left = -width / 2;
    for (let t = 0; t < tens; t++) {
      c.add(scene.add.image(left + t * tenW + 7, 0, Tex.ten).setScale(0.3));
    }
    for (let o = 0; o < ones; o++) {
      const col = Math.floor(o / 5);
      const row = o % 5;
      c.add(
        scene.add.image(left + tens * tenW + 24 + col * 26, 58 - row * 26, Tex.one).setScale(0.36),
      );
    }
    // Fläche für getBounds (Bilder allein liefern beim Verschieben verlässliche Grenzen)
    c.add(scene.add.zone(0, 0, Math.max(width, 20), 150));
    return c;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, numbers: readonly number[]) {
    super(scene, x, y);
    const groupW = 230;
    numbers.forEach((n, gi) => {
      const gx = (gi - (numbers.length - 1) / 2) * groupW;
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      const tenW = 14;
      const tensW = tens * tenW;
      const onesCols = Math.ceil(ones / 5);
      const startX = gx - (tensW + onesCols * 22 + 10) / 2;
      for (let t = 0; t < tens; t++) {
        this.add(scene.add.image(startX + t * tenW + 6, 0, Tex.ten).setScale(TEN_SCALE));
      }
      for (let o = 0; o < ones; o++) {
        const col = Math.floor(o / 5);
        const row = o % 5;
        this.add(
          scene.add
            .image(startX + tensW + 18 + col * 22, 48 - row * 22, Tex.one)
            .setScale(ONE_SCALE),
        );
      }
      this.add(
        scene.add
          .text(gx, 90, String(n), {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.text}px`,
            color: CssColor.text,
          })
          .setOrigin(0.5),
      );
    });
    scene.add.existing(this);
  }
}
