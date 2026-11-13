import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';

const W = 220;
const FLOOR = 50;
const ROOF = 70;

/**
 * Zahlenhaus (Zerlegen): Im Dach steht die Zahl, in jedem Stockwerk zwei Zahlen, die zusammen
 * die Dachzahl ergeben. null ist die gesuchte Zahl („?“ auf gelbem Feld).
 */
export class NumberHouse extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    top: number,
    floors: ReadonlyArray<readonly [number | null, number | null]>,
  ) {
    super(scene, x, y);
    const height = ROOF + floors.length * FLOOR;
    const y0 = -height / 2;
    const g = scene.add.graphics();
    this.add(g);
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.fillStyle(Color.orange, 1);
    g.fillTriangle(-W / 2 - 14, y0 + ROOF, 0, y0, W / 2 + 14, y0 + ROOF);
    g.strokeTriangle(-W / 2 - 14, y0 + ROOF, 0, y0, W / 2 + 14, y0 + ROOF);
    const text = (tx: number, ty: number, value: string) =>
      this.add(
        scene.add
          .text(tx, ty, value, {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.text}px`,
            color: CssColor.text,
          })
          .setOrigin(0.5),
      );
    text(0, y0 + ROOF * 0.62, String(top));
    floors.forEach((floor, i) => {
      const fy = y0 + ROOF + i * FLOOR;
      floor.forEach((v, k) => {
        const fx = -W / 2 + k * (W / 2);
        g.fillStyle(v === null ? Color.sonne : Color.papier, 1);
        g.fillRect(fx, fy, W / 2, FLOOR);
        g.lineStyle(Stroke.inner, Color.kontur, 1);
        g.strokeRect(fx, fy, W / 2, FLOOR);
        text(fx + W / 4, fy + FLOOR / 2, v === null ? '?' : String(v));
      });
    });
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.strokeRect(-W / 2, y0 + ROOF, W, floors.length * FLOOR);
    scene.add.existing(this);
  }
}
