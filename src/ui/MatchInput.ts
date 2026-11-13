import Phaser from 'phaser';
import { Button } from './Button';
import { reprView } from './math/Repr';
import { Color, Stroke } from './theme';
import type { MatchCard, MatchInfo } from '../types/task';

export type MatchInputOptions = {
  info: MatchInfo;
  /** Mitte der oberen und der unteren Kartenreihe */
  x: number;
  topY: number;
  bottomY: number;
  wordOf: (n: number) => string;
  onSubmit: (value: string) => void;
};

const TOP_H = 96;
const BOTTOM_H = 140;

/**
 * Paare verbinden (Spezifikation 6, `match_pairs`): eine Karte oben antippen, dann die passende
 * unten (oder umgekehrt); ein Strich verbindet beide. Antippen einer verbundenen Karte löst das
 * Paar wieder. Sind alle Karten verbunden, wird abgegeben, z. B. „2,0,1“: zu jeder oberen Karte
 * die Nummer der unteren.
 */
export class MatchInput extends Phaser.GameObjects.Container {
  private readonly top: Button[] = [];
  private readonly bottom: Button[] = [];
  private readonly lines: Phaser.GameObjects.Graphics;
  /** obere Karte → untere Karte */
  private pairs = new Map<number, number>();
  private selected?: { row: 'top' | 'bottom'; index: number };
  private enabled = true;
  private hinted = new Map<number, number>();
  private readonly cardW: number;

  constructor(
    scene: Phaser.Scene,
    private readonly options: MatchInputOptions,
  ) {
    super(scene, 0, 0);
    const n = options.info.top.length;
    this.cardW = n >= 4 ? 156 : 190;
    const step = this.cardW + 24;
    this.lines = scene.add.graphics();
    this.add(this.lines);
    const make = (row: 'top' | 'bottom', card: MatchCard, i: number) => {
      const h = row === 'top' ? TOP_H : BOTTOM_H;
      const button = new Button(scene, {
        x: options.x + (i - (n - 1) / 2) * step,
        y: row === 'top' ? options.topY : options.bottomY,
        width: this.cardW,
        height: h,
        onPress: () => this.tap(row, i),
      });
      const view = reprView(scene, card, this.cardW, h - 8, options.wordOf);
      view.y = -4;
      button.add(view);
      this.add(button);
      return button;
    };
    options.info.top.forEach((c, i) => this.top.push(make('top', c, i)));
    options.info.bottom.forEach((c, i) => this.bottom.push(make('bottom', c, i)));
    scene.add.existing(this);
  }

  private tap(row: 'top' | 'bottom', index: number): void {
    if (!this.enabled) return;
    const partnerOf = (r: 'top' | 'bottom', i: number) =>
      r === 'top' ? this.pairs.get(i) : [...this.pairs].find(([, b]) => b === i)?.[0];
    // Verbundene Karte antippen: Paar lösen und diese Karte wählen
    const partner = partnerOf(row, index);
    if (partner !== undefined) {
      this.pairs.delete(row === 'top' ? index : partner);
    }
    const sel = this.selected;
    if (sel && sel.row !== row) {
      const t = row === 'top' ? index : sel.index;
      const b = row === 'bottom' ? index : sel.index;
      // die andere Karte darf nur in einem Paar stecken
      const old = partnerOf('bottom', b);
      if (old !== undefined) this.pairs.delete(old);
      this.pairs.set(t, b);
      this.selected = undefined;
    } else if (sel && sel.row === row && sel.index === index) {
      this.selected = undefined;
    } else {
      this.selected = { row, index };
    }
    this.redraw();
    if (this.pairs.size === this.top.length) {
      this.options.onSubmit(this.top.map((_, i) => this.pairs.get(i)).join(','));
    }
  }

  private redraw(): void {
    const g = this.lines;
    g.clear();
    const draw = (pairs: Map<number, number>, color: number) => {
      for (const [t, b] of pairs) {
        const a = this.top[t]!;
        const z = this.bottom[b]!;
        const y1 = a.y + TOP_H / 2;
        const y2 = z.y - BOTTOM_H / 2;
        g.lineStyle(Stroke.outline + 6, Color.kontur, 1);
        g.lineBetween(a.x, y1, z.x, y2);
        g.lineStyle(Stroke.outline, color, 1);
        g.lineBetween(a.x, y1, z.x, y2);
      }
    };
    draw(this.hinted, Color.grauWarm);
    draw(this.pairs, Color.wasser);
    const paired = (row: 'top' | 'bottom', i: number) =>
      row === 'top' ? this.pairs.has(i) : [...this.pairs.values()].includes(i);
    for (const [row, list] of [
      ['top', this.top],
      ['bottom', this.bottom],
    ] as const) {
      list.forEach((b, i) => {
        const chosen = this.selected?.row === row && this.selected.index === i;
        b.setFill(chosen ? Color.sonne : paired(row, i) ? Color.himmel : Color.papier);
      });
    }
  }

  /** Hinweis: ein Paar mit grauem Strich vorzeigen. */
  showPair(top: number, bottom: number): this {
    this.hinted.set(top, bottom);
    this.redraw();
    return this;
  }

  /** Nach einer falschen Zuordnung: Paare lösen, neu verbinden. */
  clear(): this {
    this.pairs.clear();
    this.selected = undefined;
    this.redraw();
    return this;
  }

  /** Lösung: alle Paare verbunden, Karten grün. */
  showSolution(answer: readonly number[]): this {
    this.hinted.clear();
    this.pairs = new Map(answer.map((b, t) => [t, b]));
    this.selected = undefined;
    this.redraw();
    for (const b of [...this.top, ...this.bottom]) b.setFill(Color.grasHell);
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of [...this.top, ...this.bottom]) b.setLocked(locked);
    return this;
  }
}
