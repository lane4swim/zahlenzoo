import Phaser from 'phaser';
import { Color, Stroke } from '../theme';

const CELL = 36;
const GAP = 14;

/**
 * Zwei Zehnerfelder (5 × 2) für Zahlen bis 20 (Spezifikation: Kraft der 5 und der 10).
 * `first` Plättchen sind orange gefüllt. Bei „+“ kommen `second` Plättchen als blaue
 * Ringe dazu, bei „−“ werden die letzten `second` durchgestrichen (Form statt nur Farbe).
 */
export class TenFrame extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    first: number,
    second: number,
    op: '+' | '-',
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    const frames = first + (op === '+' ? second : 0) > 10 || first > 10 ? 2 : 1;
    const frameW = 5 * CELL;
    const total = frames * frameW + (frames - 1) * GAP;
    const left = -total / 2;
    const top = -CELL;
    const cellPos = (i: number) => {
      const frame = Math.floor(i / 10);
      const k = i % 10;
      return {
        x: left + frame * (frameW + GAP) + (k % 5) * CELL + CELL / 2,
        y: top + Math.floor(k / 5) * CELL + CELL / 2,
      };
    };
    for (let f = 0; f < frames; f++) {
      const fx = left + f * (frameW + GAP);
      g.fillStyle(Color.papier, 1);
      g.fillRect(fx, top, frameW, 2 * CELL);
      g.lineStyle(1.5, Color.kontur, 0.6);
      for (let c = 1; c < 5; c++) g.lineBetween(fx + c * CELL, top, fx + c * CELL, top + 2 * CELL);
      g.lineBetween(fx, top + CELL, fx + frameW, top + CELL);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.strokeRect(fx, top, frameW, 2 * CELL);
    }
    const r = CELL / 2 - 4;
    const removedFrom = op === '-' ? first - second : Infinity;
    for (let i = 0; i < first; i++) {
      const p = cellPos(i);
      g.fillStyle(Color.orange, 1);
      g.lineStyle(2, Color.kontur, 1);
      g.fillCircle(p.x, p.y, r);
      g.strokeCircle(p.x, p.y, r);
      if (i >= removedFrom) {
        g.lineStyle(3, Color.kontur, 1);
        g.lineBetween(p.x - r, p.y + r, p.x + r, p.y - r);
      }
    }
    if (op === '+') {
      for (let i = first; i < first + second; i++) {
        const p = cellPos(i);
        g.fillStyle(Color.wasser, 1);
        g.fillCircle(p.x, p.y, r);
        g.fillStyle(Color.papier, 1);
        g.fillCircle(p.x, p.y, r - 4);
        g.lineStyle(2, Color.kontur, 1);
        g.strokeCircle(p.x, p.y, r);
      }
    }
    this.add(g);
    scene.add.existing(this);
  }
}
