import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Stroke } from './theme';
import type { Term } from '../types/task';

const BOX_W = 120;
const BOX_H = 80;
const GAP = 18;

/** Rechnung mit Kästchen für die gesuchte Zahl, Ziffern in 48 px. */
export class Expression extends Phaser.GameObjects.Container {
  private readonly box: Phaser.GameObjects.Graphics;
  private readonly boxText: Phaser.GameObjects.Text;
  private boxLeft = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, terms: readonly Term[]) {
    super(scene, x, y);
    const style = {
      fontFamily: FontFamily.text,
      fontSize: `${FontSize.digits + 8}px`,
      color: CssColor.text,
    };
    const parts: Array<{ width: number; obj: Phaser.GameObjects.GameObject & { x: number } }> = [];
    this.box = scene.add.graphics();
    this.boxText = scene.add.text(0, 0, '', style).setOrigin(0.5);
    for (const term of terms) {
      if (term === '?') {
        parts.push({ width: BOX_W, obj: this.box });
      } else {
        const label = term === '-' ? '−' : String(term);
        const text = scene.add.text(0, 0, label, style).setOrigin(0.5);
        parts.push({ width: text.width, obj: text });
      }
    }
    const total = parts.reduce((s, p) => s + p.width, 0) + GAP * (parts.length - 1);
    let cursor = -total / 2;
    for (const part of parts) {
      // Das Kästchen wird an der Stelle von boxText gezeichnet; die Grafik selbst bleibt bei 0.
      if (part.obj === this.box) this.boxText.x = cursor + BOX_W / 2;
      else part.obj.x = cursor + part.width / 2;
      cursor += part.width + GAP;
    }
    this.boxLeft = this.boxText.x - BOX_W / 2;
    this.drawBox(Color.papier);
    // Ohne Lücke (z. B. beim Überschlagen) gibt es kein Antwortkästchen.
    const hasGap = terms.includes('?');
    this.box.setVisible(hasGap);
    this.boxText.setVisible(hasGap);
    this.add([...parts.map((p) => p.obj), this.boxText]);
    scene.add.existing(this);
  }

  private drawBox(fill: number): void {
    // Längere Antworten (z. B. „6 Rest 5“) verbreitern das Kästchen nach rechts;
    // die linke Kante bleibt, damit nichts davor überdeckt wird.
    const width = Math.max(BOX_W, this.boxText.width + 28);
    const x = this.boxLeft;
    this.boxText.x = x + width / 2;
    this.box.clear();
    this.box.fillStyle(fill, 1);
    this.box.lineStyle(Stroke.outline, Color.kontur, 1);
    this.box.fillRoundedRect(x, -BOX_H / 2, width, BOX_H, 14);
    this.box.strokeRoundedRect(x, -BOX_H / 2, width, BOX_H, 14);
  }

  setAnswer(value: string, state: 'input' | 'correct' | 'solution' = 'input'): void {
    this.boxText.setText(value === '' ? '?' : value);
    this.boxText.setAlpha(value === '' ? 0.35 : 1);
    this.drawBox(
      state === 'correct' ? Color.grasHell : state === 'solution' ? Color.sonne : Color.papier,
    );
  }

  /** Rechte Kante, um daneben ein Symbol zu setzen. */
  get rightEdge(): number {
    const bounds = this.getBounds();
    return bounds.right;
  }
}
