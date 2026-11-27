import Phaser from 'phaser';
import { Tex } from '../theme';

const ICON = 52;
const CHECK = 30;

/**
 * Dinge zum Zählen (Klasse 1). Jedes Ding lässt sich antippen und bekommt dann ein Häkchen;
 * nochmal antippen nimmt es wieder weg. So zählt das Kind jedes Ding genau einmal.
 */
export class CountField extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    icon: string,
    points: ReadonlyArray<readonly [number, number]>,
    icons?: readonly string[],
    marked: readonly number[] = [],
  ) {
    super(scene, x, y);
    const xs = points.map((p) => p[0]);
    const ys = points.map((p) => p[1]);
    const w = Math.max(...xs) - Math.min(...xs) + ICON;
    const h = Math.max(...ys) - Math.min(...ys) + ICON;
    this.add(scene.add.zone(0, 0, w, h));
    points.forEach(([px, py], i) => {
      const img = scene.add.image(px, py, icons?.[i] ?? icon).setDisplaySize(ICON, ICON);
      const check = scene.add
        .image(px + ICON / 3, py - ICON / 3, Tex.correct)
        .setDisplaySize(CHECK, CHECK)
        .setVisible(marked.includes(i));
      if (marked.includes(i)) img.setAlpha(0.7);
      img.setInteractive({ useHandCursor: true });
      img.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        check.setVisible(!check.visible);
        img.setAlpha(check.visible ? 0.7 : 1);
      });
      this.add([img, check]);
    });
    scene.add.existing(this);
  }
}
