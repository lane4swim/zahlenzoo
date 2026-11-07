import Phaser from 'phaser';
import { Color, reducedMotion, Stroke } from './theme';

/**
 * Platzhalter-Pinguin, gezeichnet nach der Stilvorgabe (Kontur 4 px, Kindchenschema,
 * Standlinie unten). Wird in Phase 3 durch die Grafik aus dem Grafik-Paket ersetzt.
 * Reagiert freundlich: freut sich bei richtigen Antworten, denkt nach bei Fehlern,
 * wird nie traurig.
 */
export class Penguin extends Phaser.GameObjects.Container {
  private readonly figure: Phaser.GameObjects.Container;
  private readonly bubble: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const g = scene.add.graphics();
    const k = Color.kontur;
    // Schatten
    g.fillStyle(k, 0.14);
    g.fillEllipse(0, 0, 150, 26);
    // Füße
    g.fillStyle(Color.orange, 1);
    g.lineStyle(Stroke.outline, k, 1);
    for (const fx of [-28, 28]) {
      g.fillEllipse(fx, -8, 44, 20);
      g.strokeEllipse(fx, -8, 44, 20);
    }
    // Körper
    g.fillStyle(Color.pinguinGefieder, 1);
    g.fillEllipse(0, -100, 150, 190);
    g.strokeEllipse(0, -100, 150, 190);
    // Bauch
    g.fillStyle(Color.papier, 1);
    g.fillEllipse(0, -80, 100, 140);
    g.lineStyle(Stroke.inner, k, 1);
    g.strokeEllipse(0, -80, 100, 140);
    // Kopf
    g.fillStyle(Color.pinguinGefieder, 1);
    g.lineStyle(Stroke.outline, k, 1);
    g.fillCircle(0, -200, 64);
    g.strokeCircle(0, -200, 64);
    g.fillStyle(Color.papier, 1);
    g.fillEllipse(0, -190, 92, 70);
    // Augen mit zwei Glanzlichtern
    for (const ex of [-20, 20]) {
      g.fillStyle(k, 1);
      g.fillCircle(ex, -200, 10);
      g.fillStyle(Color.weiss, 1);
      g.fillCircle(ex - 3, -204, 4);
      g.fillCircle(ex + 3, -196, 2);
    }
    // Wangen
    g.fillStyle(Color.rosa, 0.7);
    g.fillCircle(-32, -180, 8);
    g.fillCircle(32, -180, 8);
    // Schnabel
    g.fillStyle(Color.orange, 1);
    g.lineStyle(Stroke.inner, k, 1);
    g.fillTriangle(-12, -184, 12, -184, 0, -168);
    g.strokeTriangle(-12, -184, 12, -184, 0, -168);
    // Flügel
    g.fillStyle(Color.pinguinGefieder, 1);
    g.lineStyle(Stroke.outline, k, 1);
    g.fillEllipse(-74, -100, 30, 100);
    g.strokeEllipse(-74, -100, 30, 100);
    g.fillEllipse(74, -100, 30, 100);
    g.strokeEllipse(74, -100, 30, 100);

    this.figure = scene.add.container(0, 0, [g]);
    this.bubble = scene.add.graphics();
    this.add([this.figure, this.bubble]);
    scene.add.existing(this);
  }

  /** Hüpft vor Freude. */
  cheer(): void {
    this.bubble.clear();
    if (reducedMotion()) return;
    this.scene.tweens.add({
      targets: this.figure,
      y: -40,
      duration: 180,
      yoyo: true,
      repeat: 1,
      ease: 'Sine.easeOut',
    });
  }

  /** Neigt den Kopf und zeigt eine Denkblase. */
  think(): void {
    const b = this.bubble;
    b.clear();
    b.fillStyle(Color.weiss, 1);
    b.lineStyle(Stroke.inner, Color.kontur, 1);
    for (const [cx, cy, r] of [
      [62, -262, 7],
      [80, -284, 11],
      [108, -312, 20],
    ] as const) {
      b.fillCircle(cx, cy, r);
      b.strokeCircle(cx, cy, r);
    }
    if (reducedMotion()) return;
    this.scene.tweens.add({
      targets: this.figure,
      angle: 6,
      duration: 220,
      yoyo: true,
      ease: 'Sine.easeInOut',
    });
  }

  idle(): void {
    this.bubble.clear();
    this.figure.setAngle(0).setY(0);
  }
}
