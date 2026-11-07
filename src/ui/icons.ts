import type Phaser from 'phaser';
import { Color, Stroke } from './theme';

/** Selbst gezeichnete Symbole (Mittelpunkt 0, 0), wo die Stilprobe noch keine Grafik hat. */

export function drawSpeaker(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(Color.wasser, 1);
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  g.beginPath();
  g.moveTo(-18, -8);
  g.lineTo(-6, -8);
  g.lineTo(6, -18);
  g.lineTo(6, 18);
  g.lineTo(-6, 8);
  g.lineTo(-18, 8);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  g.beginPath();
  g.arc(8, 0, 12, -0.8, 0.8);
  g.strokePath();
  g.beginPath();
  g.arc(8, 0, 22, -0.8, 0.8);
  g.strokePath();
}

export function drawBackspace(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(Color.orange, 1);
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  g.beginPath();
  g.moveTo(-26, 0);
  g.lineTo(-10, -18);
  g.lineTo(24, -18);
  g.lineTo(24, 18);
  g.lineTo(-10, 18);
  g.closePath();
  g.fillPath();
  g.strokePath();
  g.lineBetween(-2, -8, 14, 8);
  g.lineBetween(14, -8, -2, 8);
}

export function drawTensOnesIcon(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  g.fillStyle(Color.wasser, 1);
  for (const x of [-20, -8]) {
    g.fillRect(x, -22, 9, 44);
    g.strokeRect(x, -22, 9, 44);
  }
  g.fillStyle(Color.orange, 1);
  for (const [x, y] of [
    [8, 4],
    [20, 4],
    [8, 14],
  ] as const) {
    g.fillRect(x - 4, y - 4, 9, 9);
    g.strokeRect(x - 4, y - 4, 9, 9);
  }
}

export function drawNumberLineIcon(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(Stroke.outline, Color.kontur, 1);
  g.lineBetween(-28, 14, 28, 14);
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  g.beginPath();
  g.arc(-8, 14, 18, Math.PI, 0);
  g.strokePath();
  g.beginPath();
  g.arc(20, 14, 8, Math.PI, 0);
  g.strokePath();
}

export function drawHundredBoardIcon(g: Phaser.GameObjects.Graphics): void {
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  const size = 9;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      g.fillStyle(r === 2 && c === 3 ? Color.orange : Color.papier, 1);
      g.fillRect(-22 + c * size, -22 + r * size, size, size);
      g.strokeRect(-22 + c * size, -22 + r * size, size, size);
    }
  }
}
