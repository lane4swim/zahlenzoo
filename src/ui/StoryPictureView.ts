import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from './theme';
import type { StoryPicture } from '../types/task';

const SMALL = 38;
const BIG = 44;

/**
 * Bild zu einer Sachaufgabe. Kleine Anzahlen werden einzeln gezeigt (in Fünferreihen,
 * Gruppen nebeneinander), große als Bild mit Anzahl („× 47“). Weggenommene Dinge sind
 * durchgestrichen (Form statt nur Farbe).
 */
export class StoryPictureView extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, picture: StoryPicture, maxWidth: number) {
    super(scene, x, y);
    const total = picture.groups.reduce((s, n) => s + n, 0);
    const small = total <= 30 && picture.groups.length <= 6 && picture.groups.every((n) => n <= 15);
    const parts = small ? this.smallGroups(picture) : this.bigGroups(picture);
    const width = parts.reduce((s, p) => s + p.width, 0) + (parts.length - 1) * 28;
    if (small && width > maxWidth) {
      this.removeAll(true);
      this.place(this.bigGroups(picture));
    } else {
      this.place(parts);
    }
    scene.add.existing(this);
  }

  private icon(key: string, size: number, x: number, y: number, crossed = false) {
    const img = this.scene.add.image(x, y, key).setDisplaySize(size, size);
    const objects: Phaser.GameObjects.GameObject[] = [img];
    if (crossed) {
      const g = this.scene.add.graphics();
      g.lineStyle(Stroke.outline, Color.kontur, 1);
      g.lineBetween(x - size / 2, y + size / 2, x + size / 2, y - size / 2);
      objects.push(g);
    }
    return objects;
  }

  /** Einzelne Dinge in Fünferreihen je Gruppe. */
  private smallGroups(p: StoryPicture) {
    return p.groups.map((count, gi) => {
      const cols = Math.min(5, count);
      const rows = Math.ceil(count / 5);
      const step = SMALL + 6;
      const container = this.scene.add.container(0, 0);
      const crossedFrom =
        p.crossed !== undefined && gi === p.groups.length - 1 ? count - p.crossed : Infinity;
      for (let i = 0; i < count; i++) {
        const cx = (i % 5) * step - ((cols - 1) * step) / 2;
        const cy = Math.floor(i / 5) * step - ((rows - 1) * step) / 2;
        container.add(this.icon(p.icon, SMALL, cx, cy, i >= crossedFrom));
      }
      return { container, width: cols * step, offset: (cols * step) / 2 };
    });
  }

  /** Große Anzahlen: Bild mit „× n“; viele gleiche Gruppen als „k ×“ vor einer Gruppe. */
  private bigGroups(p: StoryPicture) {
    const label = (text: string) =>
      this.scene.add
        .text(0, 0, text, { fontFamily: FontFamily.text, fontSize: '28px', color: CssColor.text })
        .setOrigin(0, 0.5);
    const box = (count: number, crossed = false) => {
      const container = this.scene.add.container(0, 0);
      const t = label(`× ${count}`).setX(BIG / 2 + 8);
      container.add([...this.icon(p.icon, BIG, 0, 0, crossed), t]);
      return { container, width: BIG + 16 + t.width, offset: BIG / 2 };
    };
    const same = p.groups.length > 1 && p.groups.every((n) => n === p.groups[0]);
    if (same && p.groups.length > 3) {
      const times = label(`${p.groups.length} ×`);
      const lead = this.scene.add.container(0, 0, [times]);
      const b = box(p.groups[0]!);
      return [{ container: lead, width: times.width, offset: 0 }, b];
    }
    const parts = p.groups.map((n) => box(n));
    if (p.crossed !== undefined) parts.push(box(p.crossed, true));
    return parts;
  }

  /** Teile nebeneinander, zusammen mittig; offset: Abstand vom linken Rand zum Ursprung. */
  private place(
    parts: Array<{ container: Phaser.GameObjects.Container; width: number; offset: number }>,
  ) {
    const width = parts.reduce((s, p) => s + p.width, 0) + (parts.length - 1) * 28;
    let x = -width / 2;
    for (const part of parts) {
      part.container.setX(x + part.offset);
      this.add(part.container);
      x += part.width + 28;
    }
  }
}
