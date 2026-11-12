import Phaser from 'phaser';
import { Button } from './Button';
import { drawSolid } from './math/Solids';
import { Color, FontSize } from './theme';
import type { SolidSpec } from '../types/task';

export type SelectInputOptions = {
  items: readonly SolidSpec[];
  /** Mitte der Kartenfläche (zwei Reihen) */
  area: { x: number; y: number };
  /** Mitte der OK-Taste */
  keys: { x: number; y: number };
  okLabel: string;
  onSubmit: (value: string) => void;
};

const CARD_W = 150;
const CARD_H = 112;

/**
 * Mehrfachauswahl: Dinge auf Karten (zwei Reihen) antippen, angetippte werden grün; „OK“
 * gibt die Nummern ab, z. B. „0,3,4“.
 */
export class SelectInput extends Phaser.GameObjects.Container {
  private readonly cards: Button[] = [];
  private readonly picked = new Set<number>();
  private readonly ok: Button;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    private readonly options: SelectInputOptions,
  ) {
    super(scene, 0, 0);
    const n = options.items.length;
    const perRow = Math.ceil(n / 2);
    options.items.forEach((spec, i) => {
      const row = Math.floor(i / perRow);
      const inRow = row === 0 ? perRow : n - perRow;
      const col = i - row * perRow;
      const card = new Button(scene, {
        x: options.area.x + (col - (inRow - 1) / 2) * (CARD_W + 16),
        y: options.area.y + (row - 0.5) * (CARD_H + 14),
        width: CARD_W,
        height: CARD_H,
        label: '',
        onPress: () => this.toggle(i),
      });
      const g = scene.add.graphics({ x: 0, y: -4 });
      drawSolid(g, spec, 84);
      card.add(g);
      this.cards.push(card);
    });
    this.ok = new Button(scene, {
      x: options.keys.x,
      y: options.keys.y,
      width: 220,
      label: options.okLabel,
      fontSize: FontSize.text,
      fill: Color.grasHell,
      onPress: () => this.submit(),
    });
    this.add([...this.cards, this.ok]);
    scene.add.existing(this);
  }

  private toggle(i: number): void {
    if (!this.enabled) return;
    if (this.picked.has(i)) this.picked.delete(i);
    else this.picked.add(i);
    this.cards[i]?.setFill(this.picked.has(i) ? Color.grasHell : Color.papier);
  }

  private submit(): void {
    if (!this.enabled) return;
    this.options.onSubmit([...this.picked].sort((a, b) => a - b).join(','));
  }

  /** Lösung: richtige Karten gelb, die anderen blass. */
  showSolution(indices: readonly number[]): this {
    this.cards.forEach((card, i) => {
      if (indices.includes(i)) card.setEnabled(true).setFill(Color.sonne);
      else card.setEnabled(false);
    });
    this.ok.setVisible(false);
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const c of this.cards) c.setLocked(locked);
    this.ok.setLocked(locked);
    return this;
  }
}
