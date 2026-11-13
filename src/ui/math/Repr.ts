import Phaser from 'phaser';
import { TenFrame } from './TenFrame';
import { TensOnes } from './TensOnes';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../theme';
import type { MatchCard } from '../../types/task';

/**
 * Eine Zahl in einer Darstellung, passend in w × h (Mitte 0, 0): Ziffern, Zahlwort,
 * Zehnerstangen mit Einerwürfeln oder Zehnerfeld.
 */
export function reprView(
  scene: Phaser.Scene,
  card: MatchCard,
  w: number,
  h: number,
  wordOf: (n: number) => string,
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  if (card.repr === 'digits' || card.repr === 'word') {
    const digits = card.repr === 'digits';
    const text = scene.add
      .text(0, 0, digits ? String(card.n) : wordOf(card.n), {
        fontFamily: FontFamily.text,
        fontSize: `${digits ? FontSize.digits : FontSize.text}px`,
        color: CssColor.text,
      })
      .setOrigin(0.5);
    // Lange Zahlwörter (siebenundneunzig) verkleinern statt umbrechen.
    if (text.width > w - 20) text.setScale((w - 20) / text.width);
    c.add(text);
    return c;
  }
  if (card.repr === 'tensones') {
    const tens = Math.floor(card.n / 10);
    const ones = card.n % 10;
    const blocks = TensOnes.blocks(scene, 0, 0, tens, ones);
    const width = tens * 18 + (ones > 0 ? 24 + Math.ceil(ones / 5) * 26 : 0);
    // Stangen reichen von −75 bis 75; Einer stehen unten bündig
    const scale = Math.min((w - 16) / Math.max(width, 40), (h - 12) / 150, 0.75);
    blocks.setScale(scale);
    c.add(blocks);
    return c;
  }
  // Über 10: zwei Zehnerfelder übereinander, damit sie groß genug bleiben.
  const parts = card.n > 10 ? [10, card.n - 10] : [card.n];
  const gap = 10;
  const height = parts.length * 72 + (parts.length - 1) * gap;
  const scale = Math.min((w - 16) / 180, (h - 12) / height, 1);
  parts.forEach((count, i) => {
    // Das Zehnerfeld liegt von −36 bis 36 um seine Mitte
    const frame = new TenFrame(
      scene,
      0,
      (-height / 2 + 36 + i * (72 + gap)) * scale,
      count,
      0,
      '+',
    );
    frame.setScale(scale);
    c.add(frame);
  });
  return c;
}

/** Lösungsbild: Paare aus Zahl und Darstellung nebeneinander, verbunden mit einem Strich. */
export class ReprPairs extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    pairs: ReadonlyArray<readonly [MatchCard, MatchCard]>,
    wordOf: (n: number) => string,
  ) {
    super(scene, x, y);
    const cw = 150;
    const ch = 96;
    const step = Math.min(340, 680 / pairs.length);
    const vertical = pairs.length > 1;
    pairs.forEach(([a, b], i) => {
      const px = vertical ? (i - (pairs.length - 1) / 2) * step : 0;
      const g = scene.add.graphics();
      const box = (bx: number, by: number) => {
        g.fillStyle(Color.papier, 1);
        g.lineStyle(Stroke.inner, Color.kontur, 1);
        g.fillRoundedRect(bx - cw / 2, by - ch / 2, cw, ch, 14);
        g.strokeRoundedRect(bx - cw / 2, by - ch / 2, cw, ch, 14);
      };
      const ay = vertical ? -ch / 2 - 10 : 0;
      const by = vertical ? ch / 2 + 10 : 0;
      const ax = vertical ? px : -cw / 2 - 20;
      const bx = vertical ? px : cw / 2 + 20;
      box(ax, ay);
      box(bx, by);
      g.lineStyle(Stroke.outline, Color.gras, 1);
      if (vertical) g.lineBetween(px, ay + ch / 2, px, by - ch / 2);
      else g.lineBetween(ax + cw / 2, 0, bx - cw / 2, 0);
      this.add(g);
      const va = reprView(scene, a, cw, ch, wordOf).setPosition(ax, ay);
      const vb = reprView(scene, b, cw, ch, wordOf).setPosition(bx, by);
      this.add([va, vb]);
    });
    if (vertical && 680 / pairs.length < cw + 10) this.setScale((680 / pairs.length - 10) / cw);
    scene.add.existing(this);
  }
}
