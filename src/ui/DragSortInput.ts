import Phaser from 'phaser';
import { Button } from './Button';
import { Color, CssColor, FontFamily, FontSize, reducedMotion } from './theme';

export type SortItem = { value: string; label: string };

export type DragSortInputOptions = {
  items: readonly SortItem[];
  x: number;
  y: number;
  /** Beschriftung unter dem linken und rechten Ende, z. B. „kürzeste“ und „längste“ */
  ends?: [string, string];
  okLabel: string;
  onSubmit: (value: string) => void;
};

const CARD_H = 112;
const GAP = 16;
/** So weit unter oder über der Reihe darf eine Karte losgelassen werden. */
const DROP_BAND = 130;

/**
 * Ziehen und Ordnen (Spezifikation 6, `drag-sort`): Karten in der Reihe an ihren Platz ziehen;
 * die anderen rücken mit, losgelassen rastet die Karte ein. Fällt sie weit neben der Reihe,
 * gleitet sie sanft an ihren alten Platz zurück. Ohne Ziehen: eine Karte antippen, dann eine
 * zweite – beide tauschen die Plätze (auch mit der Tastatur). „OK“ gibt die Reihenfolge ab.
 */
export class DragSortInput extends Phaser.GameObjects.Container {
  private readonly cards = new Map<string, Button>();
  private order: string[];
  private readonly cardW: number;
  private selected?: string;
  private enabled = true;
  private dragged = false;
  private before: string[] = [];
  private readonly ok: Button;

  constructor(
    scene: Phaser.Scene,
    private readonly options: DragSortInputOptions,
  ) {
    super(scene, options.x, options.y);
    const n = options.items.length;
    this.cardW = Math.min(190, Math.floor((760 - (n - 1) * GAP) / n));
    this.order = options.items.map((i) => i.value);
    for (const item of options.items) {
      const short = item.label.length <= 4;
      const card = new Button(scene, {
        x: 0,
        y: 0,
        width: this.cardW,
        height: CARD_H,
        label: item.label,
        fontSize: short ? FontSize.digits : FontSize.small,
        wrapWidth: this.cardW - 20,
        onPress: () => this.tap(item.value),
      });
      scene.input.setDraggable(card);
      card.on('dragstart', () => this.dragStart(item.value));
      card.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) =>
        this.dragMove(item.value, x, y),
      );
      card.on('dragend', () => this.dragEnd(item.value));
      this.cards.set(item.value, card);
      this.add(card);
    }
    if (options.ends) {
      const style = {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.small}px`,
        color: CssColor.text,
      };
      const half = this.rowWidth() / 2;
      this.add([
        scene.add.text(-half, -CARD_H / 2 - 12, `← ${options.ends[0]}`, style).setOrigin(0, 1),
        scene.add.text(half, -CARD_H / 2 - 12, `${options.ends[1]} →`, style).setOrigin(1, 1),
      ]);
    }
    this.ok = new Button(scene, {
      x: 0,
      y: CARD_H / 2 + 62,
      width: 200,
      label: options.okLabel,
      fill: Color.grasHell,
      onPress: () => this.submit(),
    });
    this.add(this.ok);
    this.layout(false);
    scene.add.existing(this);
  }

  private rowWidth(): number {
    return this.order.length * this.cardW + (this.order.length - 1) * GAP;
  }

  private slotX(i: number): number {
    return -this.rowWidth() / 2 + this.cardW / 2 + i * (this.cardW + GAP);
  }

  /** Karten an ihre Plätze; die gezogene Karte bleibt beim Finger. */
  private layout(animate: boolean, except?: string): void {
    this.order.forEach((value, i) => {
      const card = this.cards.get(value);
      if (!card || value === except) return;
      if (animate && !reducedMotion()) {
        this.scene.tweens.killTweensOf(card);
        this.scene.tweens.add({
          targets: card,
          x: this.slotX(i),
          y: 0,
          duration: 200,
          ease: 'Sine.easeOut',
        });
      } else card.setPosition(this.slotX(i), 0);
    });
  }

  private tap(value: string): void {
    if (!this.enabled) return;
    if (this.dragged) {
      this.dragged = false;
      return;
    }
    if (this.selected === undefined) {
      this.selected = value;
    } else if (this.selected === value) {
      this.selected = undefined;
    } else {
      const a = this.order.indexOf(this.selected);
      const b = this.order.indexOf(value);
      [this.order[a], this.order[b]] = [value, this.selected];
      this.selected = undefined;
      this.layout(true);
    }
    this.paint();
  }

  private paint(): void {
    for (const [value, card] of this.cards) {
      card.setFill(value === this.selected ? Color.sonne : Color.papier);
    }
  }

  private dragStart(value: string): void {
    if (!this.enabled) return;
    this.dragged = false;
    this.before = [...this.order];
    const card = this.cards.get(value);
    if (card) this.bringToTop(card);
  }

  private dragMove(value: string, x: number, y: number): void {
    if (!this.enabled) return;
    const card = this.cards.get(value);
    if (!card) return;
    if (!this.dragged && Math.hypot(x - card.x, y - card.y) < 8) return;
    if (!this.dragged) {
      this.dragged = true;
      this.selected = undefined;
      this.paint();
    }
    card.setPosition(x, y);
    // Platz aus der Position: die anderen Karten rücken mit
    const slot = Phaser.Math.Clamp(
      Math.round((x + this.rowWidth() / 2 - this.cardW / 2) / (this.cardW + GAP)),
      0,
      this.order.length - 1,
    );
    const from = this.order.indexOf(value);
    if (slot !== from) {
      this.order.splice(from, 1);
      this.order.splice(slot, 0, value);
      this.layout(true, value);
    }
  }

  private dragEnd(value: string): void {
    if (!this.enabled || !this.dragged) return;
    const card = this.cards.get(value);
    // weit neben der Reihe losgelassen: alles sanft zurück wie vorher
    if (card && Math.abs(card.y) > DROP_BAND) this.order = [...this.before];
    this.layout(true);
  }

  private submit(): void {
    if (!this.enabled) return;
    this.options.onSubmit(this.order.join(','));
  }

  /** Zeigt eine Reihenfolge (die Lösung) und blendet „OK“ aus. */
  showOrder(values: readonly string[]): this {
    this.order = [...values];
    this.selected = undefined;
    this.layout(true);
    for (const card of this.cards.values()) card.setFill(Color.grasHell);
    this.ok.setVisible(false);
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const c of this.cards.values()) c.setLocked(locked);
    this.ok.setLocked(locked);
    if (this.scene.input) {
      for (const c of this.cards.values()) if (c.input) c.input.draggable = !locked;
    }
    return this;
  }
}
