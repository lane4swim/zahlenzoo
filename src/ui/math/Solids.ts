import Phaser from 'phaser';
import { Color, Stroke } from '../theme';
import type { SolidKind, SolidSpec } from '../../types/task';

const V = (x: number, y: number) => new Phaser.Math.Vector2(x, y);

/** Grundfarbe je Körper; Gegenstände haben eigene Farben. */
const PLAIN: Record<SolidKind, number> = {
  cube: Color.wasser,
  cuboid: Color.gras,
  sphere: Color.rosa,
  cylinder: Color.sonne,
  cone: Color.orange,
  pyramid: Color.erde,
};
const OBJECT: Record<SolidKind, number> = {
  cube: Color.weiss, // Spielwürfel
  cuboid: Color.rosa, // Geschenk
  sphere: Color.wasser, // Ball
  cylinder: Color.grauWarm, // Dose
  cone: Color.sonne, // Partyhut
  pyramid: Color.orange, // Zelt
};

function shade(c: number, f: number): number {
  const r = Math.round(((c >> 16) & 255) * f);
  const g = Math.round(((c >> 8) & 255) * f);
  const b = Math.round((c & 255) * f);
  return (Math.min(255, r) << 16) | (Math.min(255, g) << 8) | Math.min(255, b);
}

function poly(g: Phaser.GameObjects.Graphics, pts: Array<[number, number]>, fill: number): void {
  const v = pts.map(([x, y]) => V(x, y));
  g.fillStyle(fill, 1);
  g.fillPoints(v, true);
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  g.strokePoints(v, true);
}

/** Kasten in Schrägbild: Vorderfläche w × h, Tiefe d nach rechts oben; Mitte (0, 0). */
function box(
  g: Phaser.GameObjects.Graphics,
  w: number,
  h: number,
  d: number,
  fill: number,
): [number, number] {
  const x0 = -(w + d * 0.7) / 2;
  const y0 = -(h - d * 0.5) / 2 + d * 0.5;
  const dx = d * 0.7;
  const dy = -d * 0.5;
  poly(
    g,
    [
      [x0, y0],
      [x0 + w, y0],
      [x0 + w, y0 + h],
      [x0, y0 + h],
    ],
    fill,
  );
  poly(
    g,
    [
      [x0, y0],
      [x0 + dx, y0 + dy],
      [x0 + w + dx, y0 + dy],
      [x0 + w, y0],
    ],
    shade(fill, 1.12),
  );
  poly(
    g,
    [
      [x0 + w, y0],
      [x0 + w + dx, y0 + dy],
      [x0 + w + dx, y0 + h + dy],
      [x0 + w, y0 + h],
    ],
    shade(fill, 0.82),
  );
  return [x0, y0];
}

/** Zeichnet einen Körper oder Gegenstand, Mitte (0, 0), Größe s (Breite etwa s). */
export function drawSolid(g: Phaser.GameObjects.Graphics, spec: SolidSpec, s: number): void {
  const obj = spec.look === 'object';
  const fill = obj ? OBJECT[spec.kind] : PLAIN[spec.kind];
  g.lineStyle(Stroke.inner, Color.kontur, 1);
  switch (spec.kind) {
    case 'cube': {
      const w = s * 0.62;
      const [x0, y0] = box(g, w, w, w * 0.6, fill);
      if (obj) {
        g.fillStyle(Color.kontur, 1);
        for (const [a, b] of [
          [0.25, 0.25],
          [0.5, 0.5],
          [0.75, 0.75],
          [0.25, 0.75],
          [0.75, 0.25],
        ] as const)
          g.fillCircle(x0 + a * w, y0 + b * w, s * 0.045);
      }
      return;
    }
    case 'cuboid': {
      const w = s * 0.8;
      const h = s * 0.42;
      const [x0, y0] = box(g, w, h, s * 0.36, fill);
      if (obj) {
        g.fillStyle(Color.sonne, 1);
        g.lineStyle(1.5, Color.kontur, 1);
        g.fillRect(x0 + w / 2 - 6, y0, 12, h);
        g.strokeRect(x0 + w / 2 - 6, y0, 12, h);
      }
      return;
    }
    case 'sphere': {
      const r = s * 0.4;
      g.fillStyle(fill, 1);
      g.fillCircle(0, 0, r);
      if (obj) {
        g.lineStyle(4, Color.weiss, 1);
        g.beginPath();
        g.arc(0, r * 1.6, r * 1.85, Math.PI * 1.33, Math.PI * 1.67);
        g.strokePath();
        g.beginPath();
        g.arc(0, -r * 1.6, r * 1.85, Math.PI * 0.33, Math.PI * 0.67);
        g.strokePath();
      } else {
        g.fillStyle(Color.weiss, 0.6);
        g.fillCircle(-r * 0.35, -r * 0.35, r * 0.22);
      }
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.strokeCircle(0, 0, r);
      return;
    }
    case 'cylinder': {
      const w = s * 0.5;
      const h = s * 0.62;
      const e = w * 0.32;
      g.fillStyle(fill, 1);
      g.fillRect(-w / 2, -h / 2, w, h);
      g.fillEllipse(0, h / 2, w, e);
      if (obj) {
        g.fillStyle(Color.rosa, 1);
        g.fillRect(-w / 2, -h * 0.15, w, h * 0.35);
      }
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.lineBetween(-w / 2, -h / 2, -w / 2, h / 2);
      g.lineBetween(w / 2, -h / 2, w / 2, h / 2);
      // untere Rundung: halbe Ellipse
      const arc: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI;
        arc.push(V((Math.cos(a) * w) / 2, h / 2 + (Math.sin(a) * e) / 2));
      }
      g.strokePoints(arc, false);
      g.fillStyle(shade(fill, 1.12), 1);
      g.fillEllipse(0, -h / 2, w, e);
      g.strokeEllipse(0, -h / 2, w, e);
      return;
    }
    case 'cone': {
      const w = s * 0.56;
      const h = s * 0.72;
      const e = w * 0.3;
      g.fillStyle(fill, 1);
      g.fillEllipse(0, h / 2, w, e);
      g.fillTriangle(0, -h / 2, -w / 2, h / 2, w / 2, h / 2);
      if (obj) {
        g.lineStyle(4, Color.rosa, 1);
        g.lineBetween(-w * 0.18, -h * 0.05, w * 0.18, -h * 0.05);
        g.lineBetween(-w * 0.34, h * 0.25, w * 0.34, h * 0.25);
        g.fillStyle(Color.rosa, 1);
        g.fillCircle(0, -h / 2, 6);
      }
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.lineBetween(0, -h / 2, -w / 2, h / 2);
      g.lineBetween(0, -h / 2, w / 2, h / 2);
      g.strokeEllipse(0, h / 2, w, e);
      return;
    }
    case 'pyramid': {
      const w = s * 0.62;
      const d = w * 0.5;
      const apex: [number, number] = [w * 0.1, -s * 0.38];
      const fl: [number, number] = [-w / 2, s * 0.3];
      const fr: [number, number] = [w / 2, s * 0.3];
      const br: [number, number] = [w / 2 + d * 0.6, s * 0.3 - d * 0.5];
      poly(g, [apex, fl, fr], fill);
      poly(g, [apex, fr, br], shade(fill, 0.82));
      if (obj) {
        // Zelteingang
        g.fillStyle(Color.kontur, 0.8);
        g.fillTriangle(apex[0] * 0.6 - 2, s * 0.02, -w * 0.14, s * 0.3, w * 0.14, s * 0.3);
      }
      return;
    }
  }
}

/** Körper nebeneinander (Bild zur Aufgabe). */
export class SolidRow extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, items: readonly SolidSpec[], size = 150) {
    super(scene, x, y);
    const step = Math.min(size * 1.1, 640 / items.length);
    items.forEach((spec, i) => {
      const g = scene.add.graphics({ x: (i - (items.length - 1) / 2) * step, y: 0 });
      drawSolid(g, spec, Math.min(size, step * 0.9));
      this.add(g);
    });
    this.add(scene.add.zone(0, 0, items.length * step, size * 1.1));
    scene.add.existing(this);
  }
}
