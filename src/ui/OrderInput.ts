import Phaser from 'phaser';
import { Button } from './Button';
import { Color, CssColor, FontFamily, FontSize, Layout, Stroke } from './theme';
import type { TaskOption } from '../types/task';

const CARD_W = 170;
const CARD_H = 120;

/**
 * Ordnen ohne Ziehen: Das Kind tippt die Zahlen der Reihe nach an; jede Karte bekommt ihre
 * Platznummer. Erneutes Antippen nimmt eine Karte (und alle danach) wieder heraus. Sind alle
 * Karten angetippt, wird die Reihenfolge abgegeben, z. B. „12,27,45,71“.
 */
export class OrderInput extends Phaser.GameObjects.Container {
  private readonly cards = new Map<string, Button>();
  private readonly badges = new Map<string, Phaser.GameObjects.Container>();
  private order: string[] = [];
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly options: readonly TaskOption[],
    private readonly onSubmit: (value: string) => void,
  ) {
    super(scene, x, y);
    const step = CARD_W + Layout.gap + 8;
    options.forEach((option, i) => {
      const card = new Button(scene, {
        x: (i - (options.length - 1) / 2) * step,
        y: 0,
        width: CARD_W,
        height: CARD_H,
        label: option.value,
        fontSize: FontSize.digits,
        onPress: () => this.tap(option.value),
      });
      this.cards.set(option.value, card);
      this.add(card);
    });
    scene.add.existing(this);
  }

  private tap(value: string): void {
    if (!this.enabled) return;
    const at = this.order.indexOf(value);
    this.order = at >= 0 ? this.order.slice(0, at) : [...this.order, value];
    this.redraw();
    if (this.order.length === this.options.length) this.onSubmit(this.order.join(','));
  }

  /** Platznummern oben links auf den angetippten Karten. */
  private redraw(): void {
    for (const b of this.badges.values()) b.destroy();
    this.badges.clear();
    this.order.forEach((value, i) => {
      const card = this.cards.get(value);
      if (!card) return;
      const g = this.scene.add.graphics();
      g.fillStyle(Color.sonne, 1);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.fillCircle(0, 0, 20);
      g.strokeCircle(0, 0, 20);
      const t = this.scene.add
        .text(0, 0, String(i + 1), {
          fontFamily: FontFamily.text,
          fontSize: `${FontSize.small}px`,
          color: CssColor.text,
        })
        .setOrigin(0.5);
      const badge = this.scene.add.container(card.x - CARD_W / 2 + 18, -CARD_H / 2 + 14, [g, t]);
      this.add(badge);
      this.badges.set(value, badge);
    });
    for (const [value, card] of this.cards) {
      card.setFill(this.order.includes(value) ? Color.grasHell : Color.papier);
    }
  }

  /** Nach einer falschen Reihenfolge von vorn beginnen. */
  clear(): this {
    this.order = [];
    this.redraw();
    return this;
  }

  /** Zeigt eine Reihenfolge (z. B. die Lösung). */
  showOrder(values: readonly string[]): this {
    this.order = [...values];
    this.redraw();
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const c of this.cards.values()) c.setLocked(locked);
    return this;
  }
}
