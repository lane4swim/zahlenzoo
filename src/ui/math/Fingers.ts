import Phaser from 'phaser';
import { Color, Stroke } from '../theme';

const PALM = { w: 76, h: 66 };
const FINGER = { w: 15, long: 58, short: 14 };
const GAP = 84;

/**
 * Fingerbild (Klasse 1): zwei Hände, zuerst eine volle Hand (Kraft der 5), dann der Rest.
 * Gezählt wird wie üblich ab dem Daumen, dann Zeigefinger, Mittelfinger, Ringfinger,
 * kleiner Finger. Gestreckte Finger sind lang, eingeklappte nur kurz zu sehen.
 */
export class Fingers extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, n: number) {
    super(scene, x, y);
    if (n < 0 || n > 10) throw new RangeError(`Fingers: ${n} liegt nicht zwischen 0 und 10`);
    const g = scene.add.graphics();
    const width = 2 * PALM.w + GAP;
    // linke Hand zuerst voll, Daumen jeweils zur Mitte
    this.hand(g, -width / 2 + PALM.w / 2, Math.min(n, 5), 1);
    this.hand(g, width / 2 - PALM.w / 2, Math.max(0, n - 5), -1);
    this.add([scene.add.zone(0, 0, width, PALM.h + FINGER.long), g]);
    scene.add.existing(this);
  }

  /** Hand mit `up` gestreckten Fingern; side 1: Daumen rechts, −1: Daumen links. */
  private hand(g: Phaser.GameObjects.Graphics, cx: number, up: number, side: 1 | -1): void {
    const top = -PALM.h / 2 + FINGER.long / 2;
    const drawFinger = (fx: number, fy: number, w: number, h: number, angle = 0) => {
      // Finger als abgerundetes Rechteck; der Daumen leicht schräg (als Polygon gezeichnet)
      if (angle === 0) {
        g.fillStyle(Color.ohrRosa, 1);
        g.lineStyle(Stroke.inner, Color.kontur, 1);
        g.fillRoundedRect(fx - w / 2, fy - h, w, h + 10, w / 2);
        g.strokeRoundedRect(fx - w / 2, fy - h, w, h + 10, w / 2);
        return;
      }
      const r = Phaser.Math.DegToRad(angle);
      const pts = [
        [-w / 2, 10],
        [w / 2, 10],
        [w / 2, -h],
        [-w / 2, -h],
      ].map(
        ([px, py]) =>
          new Phaser.Math.Vector2(
            fx + px! * Math.cos(r) - py! * Math.sin(r),
            fy + px! * Math.sin(r) + py! * Math.cos(r),
          ),
      );
      g.fillStyle(Color.ohrRosa, 1);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.fillPoints(pts, true);
      g.strokePoints(pts, true);
    };
    // Daumen (zur Mitte hin, schräg); eingeklappt liegt er hinter der Handfläche
    if (up >= 1) {
      drawFinger(cx + side * (PALM.w / 2 - 8), top + PALM.h * 0.6, FINGER.w + 3, 60, side * 55);
    }
    // vier Finger vom kleinen Finger (außen) bis zum Zeigefinger (neben dem Daumen):
    // Finger i ist gestreckt, wenn mindestens 5 − i Finger gezeigt werden.
    [0, 1, 2, 3].forEach((i) => {
      const fx = cx - side * (PALM.w / 2 - 10 - i * 18);
      drawFinger(fx, top, FINGER.w, up >= 5 - i ? FINGER.long : FINGER.short);
    });
    g.fillStyle(Color.ohrRosa, 1);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.fillRoundedRect(cx - PALM.w / 2, top, PALM.w, PALM.h, 22);
    g.strokeRoundedRect(cx - PALM.w / 2, top, PALM.w, PALM.h, 22);
  }
}
