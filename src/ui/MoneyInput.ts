import Phaser from 'phaser';
import { claimKeys } from './focus';
import { Button } from './Button';
import { Color, CssColor, FontFamily, FontSize, Layout, Stroke, Tex } from './theme';
import { moneyLabel } from '../logic/generators/moneyLay';
import type { MoneyInfo } from '../types/task';

/** Texturschlüssel für einen Wert in Cent (Münzen und Scheine, stilisiert). */
export function moneyTexture(cents: number): string {
  if (cents >= 500) return `geld_schein_${cents / 100}`;
  if (cents === 200) return 'geld_muenze_euro2';
  if (cents === 100) return 'geld_muenze_euro1';
  if (cents >= 10) return 'geld_muenze_gold';
  return 'geld_muenze_kupfer';
}

/** Alle Bilder für Münzen und Scheine mit Pfad (für das Laden im BootScene). */
export const MONEY_IMAGES: Record<string, string> = {
  geld_muenze_kupfer: 'img/money/geld_muenze_kupfer_128.png',
  geld_muenze_gold: 'img/money/geld_muenze_gold_128.png',
  geld_muenze_euro1: 'img/money/geld_muenze_euro1_128.png',
  geld_muenze_euro2: 'img/money/geld_muenze_euro2_128.png',
  ...Object.fromEntries(
    [5, 10, 20, 50].map((v) => [`geld_schein_${v}`, `img/money/geld_schein_${v}_240x128.png`]),
  ),
};

export type MoneyInputOptions = {
  /** Mitte der Eingabe (Leiste und Tasten) */
  x: number;
  y: number;
  /** Zahlteller: Mitte und Größe */
  plate: { x: number; y: number; width: number; height: number };
  money: MoneyInfo;
  okLabel: string;
  onSubmit: (value: string) => void;
};

const KEY = 96;
const COIN = 72;
const NOTE_W = 132;

/**
 * Eingabe „Geld legen“: Das Kind tippt Münzen und Scheine in der Leiste an und legt sie so
 * auf den Zahlteller; Antippen auf dem Teller legt sie zurück. Die Summe wird nicht
 * angezeigt, das Zählen ist die Aufgabe. OK gibt den Betrag in der Einheit der Aufgabe ab.
 * Auf Laptops auch mit Rücktaste (letztes Stück zurück) und Eingabe (OK) bedienbar.
 */
export class MoneyInput extends Phaser.GameObjects.Container {
  private readonly tray: Button[] = [];
  private readonly plateItems: Phaser.GameObjects.Container;
  private readonly plateZone: { x: number; y: number; width: number; height: number };
  private items: number[] = [];
  private enabled = true;
  private readonly onKey = (event: KeyboardEvent) => this.handleKey(event);

  constructor(
    scene: Phaser.Scene,
    private readonly options: MoneyInputOptions,
  ) {
    super(scene, 0, 0);
    const { plate, money } = options;
    this.plateZone = plate;

    const g = scene.add.graphics();
    g.fillStyle(Color.papier, 0.85);
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.fillRoundedRect(
      plate.x - plate.width / 2,
      plate.y - plate.height / 2,
      plate.width,
      plate.height,
      28,
    );
    g.strokeRoundedRect(
      plate.x - plate.width / 2,
      plate.y - plate.height / 2,
      plate.width,
      plate.height,
      28,
    );
    this.plateItems = scene.add.container(0, 0);
    this.add([g, this.plateItems]);

    const step = KEY + Layout.gap;
    const values = money.denominations;
    const rowY = options.y - step / 2;
    values.forEach((cents, i) => {
      const note = cents >= 500;
      const button = new Button(scene, {
        x: options.x + (i - (values.length - 1) / 2) * step,
        y: rowY,
        width: KEY,
        height: KEY,
        label: moneyLabel(cents),
        icon: moneyTexture(cents),
        iconScale: note ? 0.34 : 0.4,
        onPress: () => this.place(cents),
      });
      this.tray.push(button);
    });
    const back = new Button(scene, {
      x: options.x - 110,
      y: options.y + step / 2,
      width: KEY + 40,
      height: KEY,
      icon: Tex.backspace,
      iconScale: 0.8,
      onPress: () => this.takeBack(this.items.length - 1),
    });
    const ok = new Button(scene, {
      x: options.x + 110,
      y: options.y + step / 2,
      width: KEY + 40,
      height: KEY,
      label: options.okLabel,
      fill: Color.grasHell,
      onPress: () => this.submit(),
    });
    this.tray.push(back, ok);
    this.add(this.tray);
    scene.add.existing(this);
    scene.input.keyboard?.on('keydown', this.onKey);
    // Diese Tasten gehören der Eingabe, nicht der allgemeinen Tastaturbedienung.
    this.once(Phaser.GameObjects.Events.DESTROY, claimKeys(scene, ['enter']));
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input.keyboard?.off('keydown', this.onKey);
    });
  }

  /** Gelegte Stücke in Cent, in der Reihenfolge des Legens. */
  get placed(): readonly number[] {
    return this.items;
  }

  /** Summe in der Einheit der Aufgabe (Euro oder Cent). */
  get total(): number {
    const cents = this.items.reduce((sum, c) => sum + c, 0);
    return this.options.money.unit === 'euro' ? cents / 100 : cents;
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.enabled) return;
    if (event.key === 'Backspace' || event.key === 'Delete') this.takeBack(this.items.length - 1);
    else if (event.key === 'Enter') this.submit();
  }

  private place(cents: number): void {
    if (!this.enabled || this.items.length >= 30) return;
    this.items.push(cents);
    this.layout();
  }

  private takeBack(index: number): void {
    if (!this.enabled || index < 0 || index >= this.items.length) return;
    this.items.splice(index, 1);
    this.layout();
  }

  private submit(): void {
    if (!this.enabled || this.items.length === 0) return;
    this.options.onSubmit(String(this.total));
  }

  /** Legt genau diese Stücke auf den Teller (z. B. den Lösungsweg). */
  setItems(items: readonly number[]): this {
    this.items = [...items];
    this.layout();
    return this;
  }

  clear(): this {
    return this.setItems([]);
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of this.tray) b.setLocked(locked);
    this.layout();
    return this;
  }

  /** Blendet Leiste und Tasten aus, der Teller bleibt stehen. */
  setTrayVisible(visible: boolean): this {
    for (const b of this.tray) b.setVisible(visible);
    return this;
  }

  /** Rechte obere Ecke des Tellers (für das Haken-Symbol). */
  get feedbackAnchor(): { x: number; y: number } {
    const p = this.plateZone;
    return { x: p.x + p.width / 2 - 44, y: p.y - p.height / 2 + 44 };
  }

  /**
   * Ordnet die Stücke zeilenweise auf dem Teller an; passen sie nicht, werden sie kleiner.
   * Scheine zuerst, dann Münzen, jeweils absteigend, damit sich das Zählen leichter liest.
   */
  private layout(): void {
    this.plateItems.removeAll(true);
    const p = this.plateZone;
    const order = this.items.map((cents, index) => ({ cents, index }));
    order.sort((a, b) => b.cents - a.cents || a.index - b.index);
    const gap = 10;
    const pad = 20;
    let scale = 1;
    let rows: Array<typeof order> = [];
    for (; scale > 0.4; scale -= 0.1) {
      rows = this.flow(order, (p.width - 2 * pad) / scale, gap);
      const height = rows.length * (COIN + gap) - gap;
      if (height * scale <= p.height - 2 * pad) break;
    }
    const rowH = (COIN + gap) * scale;
    const top = p.y - (rows.length * rowH - gap * scale) / 2 + (COIN * scale) / 2;
    rows.forEach((row, r) => {
      const widths = row.map((it) => this.pieceWidth(it.cents) * scale);
      const total = widths.reduce((s, w) => s + w, 0) + gap * scale * (row.length - 1);
      let x = p.x - total / 2;
      row.forEach((it, i) => {
        const w = widths[i] ?? 0;
        this.plateItems.add(this.item(it.cents, it.index, x + w / 2, top + r * rowH, scale));
        x += w + gap * scale;
      });
    });
  }

  private flow<T extends { cents: number }>(order: T[], width: number, gap: number): T[][] {
    const rows: T[][] = [];
    let row: T[] = [];
    let used = 0;
    for (const it of order) {
      const w = this.pieceWidth(it.cents);
      if (row.length > 0 && used + gap + w > width) {
        rows.push(row);
        row = [];
        used = 0;
      }
      used += (row.length > 0 ? gap : 0) + w;
      row.push(it);
    }
    if (row.length > 0) rows.push(row);
    return rows;
  }

  private pieceWidth(cents: number): number {
    return cents >= 500 ? NOTE_W : COIN;
  }

  private item(cents: number, index: number, x: number, y: number, scale: number) {
    const note = cents >= 500;
    const image = this.scene.add
      .image(0, 0, moneyTexture(cents))
      .setDisplaySize(note ? NOTE_W : COIN, note ? (NOTE_W * 128) / 240 : COIN);
    const label = this.scene.add
      .text(0, 0, moneyLabel(cents), {
        fontFamily: FontFamily.text,
        fontSize: `${note ? FontSize.small : FontSize.small - 6}px`,
        color: CssColor.text,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const piece = this.scene.add.container(x, y, [image, label]).setScale(scale);
    piece.setSize(note ? NOTE_W : COIN, COIN);
    if (this.enabled) {
      piece.setInteractive({ useHandCursor: true });
      piece.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => this.takeBack(index));
    }
    return piece;
  }
}
