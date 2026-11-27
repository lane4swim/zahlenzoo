import Phaser from 'phaser';
import { Color, Stroke } from '../theme';

const SIZE = 110;

/** Lage der Augen (in Dritteln der Seite) für 1 bis 6 wie auf einem Spielwürfel. */
const PIPS: Readonly<Record<number, Array<[number, number]>>> = {
  1: [[0, 0]],
  2: [
    [-1, -1],
    [1, 1],
  ],
  3: [
    [-1, -1],
    [0, 0],
    [1, 1],
  ],
  4: [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ],
  5: [
    [-1, -1],
    [1, -1],
    [0, 0],
    [-1, 1],
    [1, 1],
  ],
  6: [
    [-1, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [1, 1],
  ],
};

/** Würfelbild (Blitzblick, Klasse 1): bekannte Muster statt Abzählen. */
export class DiceFace extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, n: number) {
    super(scene, x, y);
    const pips = PIPS[n];
    if (!pips) throw new RangeError(`DiceFace: ${n} Augen gibt es nicht`);
    const g = scene.add.graphics();
    g.fillStyle(Color.papier, 1);
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.fillRoundedRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE, 18);
    g.strokeRoundedRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE, 18);
    const step = SIZE / 3.4;
    g.fillStyle(Color.kontur, 1);
    for (const [cx, cy] of pips) g.fillCircle(cx * step, cy * step, 10);
    this.add([scene.add.zone(0, 0, SIZE, SIZE), g]);
    scene.add.existing(this);
  }
}
