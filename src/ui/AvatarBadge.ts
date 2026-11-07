import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from './theme';
import type { Avatar } from '../types/save';

/** Platzhalter für die Profil-Tierbilder: Kreis in Tierfarbe mit Anfangsbuchstaben. */
const AVATAR_COLOR: Record<Avatar, number> = {
  monkey: 0xb9794a,
  penguin: Color.wasser,
  elephant: Color.grauWarm,
  parrot: Color.gras,
  owl: Color.erde,
  butterfly: Color.rosa,
  giraffe: Color.sonne,
  meerkat: Color.orange,
};

export function drawAvatar(
  scene: Phaser.Scene,
  x: number,
  y: number,
  avatar: Avatar,
  name: string,
  radius = 36,
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(AVATAR_COLOR[avatar], 1);
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  g.fillCircle(0, 0, radius);
  g.strokeCircle(0, 0, radius);
  const letter = scene.add
    .text(0, 0, name.charAt(0).toUpperCase(), {
      fontFamily: FontFamily.title,
      fontSize: `${Math.round(radius * 1.1)}px`,
      color: CssColor.kontur,
    })
    .setOrigin(0.5);
  return scene.add.container(x, y, [g, letter]);
}
