import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';

const ARC_H = 46;
const LABEL = { fontFamily: FontFamily.text, fontSize: `${FontSize.text}px`, color: CssColor.text };

/**
 * Rechenstrich: Startzahl, Sprünge als Bögen mit "+20", "+6" oder rückwärts "−20", "−6"
 * (dann beginnt der Strich rechts und die Sprünge gehen nach links).
 * Zwischen- und Endwerte lassen sich als "?" verdecken (Hinweisstufe 2).
 * Ohne Sprünge zeigt er nur den leeren Strich mit der Startzahl.
 */
export class NumberLine extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    start: number,
    jumps: readonly number[],
    hideResults = false,
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    const objects: Phaser.GameObjects.GameObject[] = [g];
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.lineBetween(-width / 2, 0, width / 2, 0);

    const total = jumps.reduce((s, j) => s + j, 0);
    // Sprunglängen proportional, aber jeder Sprung mindestens 90 px breit.
    const minW = 90;
    // Rückwärts (Subtraktion): Start rechts, Sprünge nach links.
    const dir = total < 0 ? -1 : 1;
    const raw = jumps.map((j) => (total !== 0 ? j / total : 0) * (width - 80));
    const widths = raw.map((w) => Math.max(minW, w));
    const scale =
      jumps.length > 0 ? Math.min(1, (width - 80) / widths.reduce((s, w) => s + w, 0)) : 1;
    let px = dir * (-width / 2 + 40);
    let value = start;
    const mark = (pxAt: number, label: string, emphasize: boolean) => {
      g.lineStyle(Stroke.outline, Color.kontur, 1);
      g.lineBetween(pxAt, -12, pxAt, 12);
      const text = scene.add.text(pxAt, 34, label, LABEL).setOrigin(0.5);
      if (emphasize) text.setColor(CssColor.kontur).setFontStyle('bold');
      objects.push(text);
    };
    mark(px, String(start), true);
    jumps.forEach((jump, i) => {
      const w = (widths[i] ?? minW) * scale * dir;
      // Bogen als halbe Ellipse mit fester Höhe, damit lange Sprünge nicht zu hoch werden.
      const points: Phaser.Math.Vector2[] = [];
      for (let k = 0; k <= 24; k++) {
        const t = Math.PI + (k / 24) * Math.PI;
        points.push(
          new Phaser.Math.Vector2(px + w / 2 + (w / 2) * Math.cos(t), ARC_H * Math.sin(t)),
        );
      }
      g.lineStyle(Stroke.outline, Color.wasser, 1);
      g.strokePoints(points);
      objects.push(
        scene.add
          .text(px + w / 2, -ARC_H - 22, jump < 0 ? `−${-jump}` : `+${jump}`, {
            ...LABEL,
            color: CssColor.kontur,
          })
          .setOrigin(0.5),
      );
      px += w;
      value += jump;
      mark(px, hideResults ? '?' : String(value), i === jumps.length - 1);
    });
    this.add(objects);
    scene.add.existing(this);
  }
}
