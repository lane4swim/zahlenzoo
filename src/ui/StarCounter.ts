import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke, Tex } from './theme';

/** Sterne zum Einlösen: Schild mit Stern und Zahl (oben rechts auf Karte und im Zoo-Laden). */
export class StarCounter extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, stars: number) {
    super(scene, x, y);
    const label = scene.add
      .text(18, 0, String(stars), {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
      })
      .setOrigin(0, 0.5);
    const w = 76 + label.width;
    const plate = scene.add.graphics();
    plate.fillStyle(Color.papier, 1);
    plate.lineStyle(Stroke.inner + 0.5, Color.kontur, 1);
    plate.fillRoundedRect(-w / 2, -28, w, 56, 18);
    plate.strokeRoundedRect(-w / 2, -28, w, 56, 18);
    const star = scene.add.image(-w / 2 + 30, 0, Tex.starFull).setScale(0.42);
    label.x = -w / 2 + 56;
    this.add([plate, star, label]);
    scene.add.existing(this);
  }
}
