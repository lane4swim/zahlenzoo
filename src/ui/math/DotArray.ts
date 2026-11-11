import Phaser from 'phaser';
import { Color, CssColor, FontFamily, Stroke } from '../theme';

const SPACING = 15;
const RADIUS = 5.5;

/**
 * Punktefeld für Mal- und Geteiltaufgaben: `rows` Reihen mit je `cols` Punkten.
 * Die ersten `split` Reihen sind orange (z. B. die Kernaufgabe), die übrigen blau;
 * Form statt nur Farbe: blaue Punkte sind Ringe.
 */
export class DotArray extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    rows: number,
    cols: number,
    split?: number,
    /** Beschriftung „Reihen · Spalten“ (beim Blitzblick weggelassen, sie verriete die Anzahl) */
    label = true,
  ) {
    super(scene, x, y);
    const g = scene.add.graphics();
    const w = cols * SPACING;
    const h = rows * SPACING;
    g.fillStyle(Color.papier, 1);
    g.lineStyle(Stroke.inner, Color.kontur, 1);
    g.fillRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 10);
    g.strokeRoundedRect(-w / 2 - 10, -h / 2 - 10, w + 20, h + 20, 10);
    for (let r = 0; r < rows; r++) {
      const orange = split === undefined || r < split;
      for (let c = 0; c < cols; c++) {
        const px = -w / 2 + SPACING / 2 + c * SPACING;
        const py = -h / 2 + SPACING / 2 + r * SPACING;
        g.lineStyle(2, Color.kontur, 1);
        if (orange) {
          g.fillStyle(Color.orange, 1);
          g.fillCircle(px, py, RADIUS);
        } else {
          g.fillStyle(Color.wasser, 1);
          g.fillCircle(px, py, RADIUS);
          g.fillStyle(Color.papier, 1);
          g.fillCircle(px, py, RADIUS - 3);
        }
        g.strokeCircle(px, py, RADIUS);
      }
    }
    this.add(g);
    // Fläche für getBounds (Grafiken allein haben keine verlässliche Größe)
    this.add(scene.add.zone(0, 0, w + 20, h + 20));
    if (label)
      this.add(
        scene.add
          .text(w / 2 + 18, 0, `${rows} · ${cols}`, {
            fontFamily: FontFamily.text,
            fontSize: '22px',
            color: CssColor.kontur,
          })
          .setOrigin(0, 0.5),
      );
    scene.add.existing(this);
  }
}
