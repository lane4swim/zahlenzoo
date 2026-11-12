import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from './theme';
import type { Avatar } from '../types/save';

/** Profilbild: das runde Tierbild der Zoo-Karte (gleiches Tier wie im Gehege). */
const AVATAR_ICON: Record<Avatar, string> = {
  monkey: 'karte_affe',
  penguin: 'karte_pinguin',
  elephant: 'karte_elefant',
  parrot: 'karte_papagei',
  owl: 'karte_eule',
  butterfly: 'karte_schmetterling',
  giraffe: 'karte_giraffe',
  meerkat: 'karte_erdmaennchen',
};

/** Ersatz, falls das Bild fehlt: Kreis in Tierfarbe mit Anfangsbuchstaben. */
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
  const icon = AVATAR_ICON[avatar];
  if (scene.textures.exists(icon)) {
    const image = scene.add.image(0, 0, icon).setDisplaySize(radius * 2.3, radius * 2.3);
    return scene.add.container(x, y, [image]);
  }
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
