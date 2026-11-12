import Phaser from 'phaser';
import { dashPiece, drawPiece, slotPos } from './math/Pieces';
import { Color, reducedMotion } from './theme';
import { lies, sameLie, slotCenter } from '../logic/pieces';
import type { ComposeInfo, Piece, PieceSlot } from '../types/task';

export type ComposeInputOptions = {
  info: ComposeInfo;
  /** Mitte des Umrisses */
  outline: { x: number; y: number };
  /** Mitte der Ablage */
  tray: { x: number; y: number };
  unit?: number;
  /** Teil passt nicht: 'rotation' (richtige Form, falsch gedreht) oder 'wrong' */
  onWrong: (value: 'rotation' | 'wrong') => void;
  onDone: () => void;
};

type PieceObject = {
  piece: Piece;
  view: Phaser.GameObjects.Container;
  graphics: Phaser.GameObjects.Graphics;
  home: [number, number];
  placed: boolean;
  dragged: boolean;
};

/**
 * Formen legen: Teile liegen unten in der Ablage und werden in den Umriss gezogen. Nahe am
 * passenden Platz rastet ein Teil ein; sonst gleitet es zurück. Ohne Ziehen: Teil antippen
 * (wählen), noch einmal antippen dreht es um 90°, dann den Platz im Umriss antippen.
 */
export class ComposeInput extends Phaser.GameObjects.Container {
  private readonly unit: number;
  private readonly pieces: PieceObject[] = [];
  private readonly filled = new Set<number>();
  private selected?: PieceObject;
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    private readonly options: ComposeInputOptions,
  ) {
    super(scene, 0, 0);
    const { info, outline } = options;
    this.unit = options.unit ?? 84;
    const u = this.unit;
    const g = scene.add.graphics();
    for (const slot of info.slots) {
      const [px, py] = slotPos(slot, info.cols, info.rows, u);
      dashPiece(g, slot, u, outline.x + px, outline.y + py);
    }
    this.add(g);
    const zone = scene.add
      .zone(outline.x, outline.y, info.cols * u + 40, info.rows * u + 40)
      .setInteractive();
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.selected && this.enabled) this.tryPlace(this.selected, p.worldX, p.worldY);
    });
    this.add(zone);

    // Ablage: Teile nebeneinander, Rechtecke brauchen zwei Felder
    const widths = info.pieces.map((p) => (p.kind === 'rect' && p.rot % 2 === 0 ? 2 : 1) * u);
    const gap = 34;
    const total = widths.reduce((a, b) => a + b, 0) + gap * (widths.length - 1);
    let left = options.tray.x - total / 2;
    info.pieces.forEach((piece, i) => {
      const w = widths[i]!;
      const home: [number, number] = [left + w / 2, options.tray.y];
      left += w + gap;
      this.pieces.push(this.makePiece({ ...piece }, home));
    });
    scene.add.existing(this);
  }

  private makePiece(piece: Piece, home: [number, number]): PieceObject {
    const scene = this.scene;
    const graphics = scene.add.graphics();
    const view = scene.add.container(home[0], home[1], [graphics]);
    const obj: PieceObject = { piece, view, graphics, home, placed: false, dragged: false };
    this.redraw(obj);
    view.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    });
    this.setHit(obj);
    scene.input.setDraggable(view);
    view.on('pointerdown', () => {
      obj.dragged = false;
    });
    view.on('drag', (_p: Phaser.Input.Pointer, x: number, y: number) => {
      if (!this.enabled || obj.placed) return;
      if (Math.hypot(x - obj.home[0], y - obj.home[1]) > 8 || obj.dragged) {
        obj.dragged = true;
        view.setPosition(x, y);
        this.bringToTop(view);
      }
    });
    view.on('dragend', () => {
      if (!this.enabled || obj.placed) return;
      if (obj.dragged) this.tryPlace(obj, view.x, view.y);
      else this.tapPiece(obj);
    });
    this.add(view);
    return obj;
  }

  private setHit(obj: PieceObject): void {
    const u = this.unit;
    const long = obj.piece.kind === 'rect';
    const w = (long && obj.piece.rot % 2 === 0 ? 2 * u : u) + 24;
    const h = (long && obj.piece.rot % 2 === 1 ? 2 * u : u) + 24;
    const area = obj.view.input?.hitArea as Phaser.Geom.Rectangle | undefined;
    area?.setTo(-w / 2, -h / 2, w, h);
  }

  private redraw(obj: PieceObject): void {
    obj.graphics.clear();
    if (this.selected === obj) {
      obj.graphics.lineStyle(10, Color.sonne, 1);
      const u = this.unit;
      const long = obj.piece.kind === 'rect';
      const w = (long && obj.piece.rot % 2 === 0 ? 2 * u : u) + 14;
      const h = (long && obj.piece.rot % 2 === 1 ? 2 * u : u) + 14;
      obj.graphics.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    }
    drawPiece(obj.graphics, obj.piece, this.unit);
  }

  private tapPiece(obj: PieceObject): void {
    const before = this.selected;
    if (before === obj) {
      if (lies(obj.piece.kind) > 1) {
        obj.piece.rot = (obj.piece.rot + 1) % 4;
        this.setHit(obj);
      }
    } else {
      this.selected = obj;
      if (before) this.redraw(before);
    }
    this.redraw(obj);
  }

  /** Legt ein Teil an die Stelle (Weltkoordinaten), wenn ein freier passender Platz nahe ist. */
  private tryPlace(obj: PieceObject, wx: number, wy: number): void {
    const { info, outline } = this.options;
    const u = this.unit;
    const ux = (wx - outline.x) / u + info.cols / 2;
    const uy = (wy - outline.y) / u + info.rows / 2;
    const near = info.slots
      .map((slot, i) => ({ slot, i, d: dist(slotCenter(slot), [ux, uy]) }))
      .filter((s) => !this.filled.has(s.i) && s.slot.kind === obj.piece.kind && s.d < 0.7)
      .sort((a, b) => a.d - b.d);
    const fit = near.find((s) => sameLie(s.slot.kind, s.slot.rot, obj.piece.rot));
    if (fit) {
      this.place(obj, fit.i, fit.slot);
      if (this.filled.size === info.slots.length) this.options.onDone();
      return;
    }
    const inside = ux > -0.3 && uy > -0.3 && ux < info.cols + 0.3 && uy < info.rows + 0.3;
    this.goHome(obj);
    if (near.length > 0) this.options.onWrong('rotation');
    else if (inside) this.options.onWrong('wrong');
  }

  private place(obj: PieceObject, index: number, slot: PieceSlot): void {
    const { info, outline } = this.options;
    const [px, py] = slotPos(slot, info.cols, info.rows, this.unit);
    obj.placed = true;
    obj.piece.rot = slot.rot;
    this.filled.add(index);
    if (this.selected === obj) this.selected = undefined;
    this.redraw(obj);
    obj.view.disableInteractive();
    this.move(obj.view, outline.x + px, outline.y + py);
  }

  private goHome(obj: PieceObject): void {
    this.move(obj.view, obj.home[0], obj.home[1]);
  }

  private move(view: Phaser.GameObjects.Container, x: number, y: number): void {
    if (reducedMotion()) {
      view.setPosition(x, y);
      return;
    }
    this.scene.tweens.add({ targets: view, x, y, duration: 220, ease: 'Sine.easeOut' });
  }

  /** Lösung: Alle fehlenden Teile legen sich selbst. */
  placeAll(): this {
    this.options.info.slots.forEach((slot, i) => {
      if (this.filled.has(i)) return;
      const obj = this.pieces.find((p) => !p.placed && p.piece.kind === slot.kind);
      if (obj) this.place(obj, i, slot);
    });
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    return this;
  }
}

function dist(a: readonly [number, number], b: readonly [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
