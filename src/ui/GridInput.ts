import Phaser from 'phaser';
import { Button } from './Button';
import { CellFigures } from './math/Shapes';
import { drawArrow, GridBoard } from './math/GridBoard';
import { Color, FontSize, Layout, Tex } from './theme';
import { cellsKey, parseCells, stonesOf, walk, type Move } from '../logic/grid';
import type { Cell, GridInfo } from '../types/task';

export type GridInputOptions = {
  info: GridInfo;
  /** Mitte des Spielfelds; mit Vorlage stehen Vorlage und Spielfeld nebeneinander */
  board: { x: number; y: number; maxSize?: number };
  /** Mitte der Tastenreihe */
  keys: { x: number; y: number };
  okLabel: string;
  clearLabel: string;
  onSubmit: (value: string) => void;
};

const KEY = 96;
const ARROWS: Move[] = ['l', 'u', 'd', 'r'];
const KEYMAP: Record<string, Move> = {
  ArrowLeft: 'l',
  ArrowUp: 'u',
  ArrowDown: 'd',
  ArrowRight: 'r',
};

/**
 * Eingabe auf einem Raster. Kästchen malen: antippen schaltet ein Kästchen an oder aus,
 * „OK“ gibt ab. Feld wählen: ein Antippen gibt ab. Weg legen: Pfeiltasten (auch auf der
 * Tastatur), die Figur läuft mit; „OK“ gibt ab.
 */
export class GridInput extends Phaser.GameObjects.Container {
  readonly board: GridBoard;
  private cells: Cell[] = [];
  private moves = '';
  private enabled = true;
  private readonly buttons: Button[] = [];
  private readonly onKey = (event: KeyboardEvent) => this.handleKey(event);

  constructor(
    scene: Phaser.Scene,
    private readonly options: GridInputOptions,
  ) {
    super(scene, 0, 0);
    const { info } = options;
    let bx = options.board.x;
    if (info.model) {
      const figure = new CellFigures(
        scene,
        options.board.x - 170,
        options.board.y,
        [info.model],
        undefined,
        true,
      );
      this.add(figure);
      bx = options.board.x + 170;
    }
    this.board = new GridBoard(
      scene,
      bx,
      options.board.y,
      info.board,
      options.board.maxSize ?? (info.model ? 220 : undefined),
    );
    this.add(this.board);

    if (info.mode !== 'path') {
      const zone = scene.add
        .zone(
          bx,
          options.board.y,
          info.board.cols * this.board.cell,
          info.board.rows * this.board.cell,
        )
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.tap(p.worldX, p.worldY));
      this.add(zone);
    }

    const { x, y } = options.keys;
    const step = KEY + Layout.gap;
    if (info.mode === 'cells') {
      this.buttons.push(
        new Button(scene, {
          x: x - (step + 40) / 2 - 20,
          y,
          width: 200,
          height: KEY,
          label: options.clearLabel,
          fontSize: FontSize.text,
          onPress: () => this.clear(),
        }),
        new Button(scene, {
          x: x + (step + 40) / 2 + 20,
          y,
          width: 200,
          height: KEY,
          label: options.okLabel,
          fontSize: FontSize.text,
          fill: Color.grasHell,
          onPress: () => this.submit(),
        }),
      );
    } else if (info.mode === 'path') {
      ARROWS.forEach((move, i) => {
        this.buttons.push(
          new Button(scene, {
            x: x + (i - 2.5) * step,
            y,
            width: KEY,
            height: KEY,
            drawIcon: (g) => drawArrow(g, move, 46),
            onPress: () => this.step(move),
          }),
        );
      });
      this.buttons.push(
        new Button(scene, {
          x: x + 1.5 * step,
          y,
          width: KEY,
          height: KEY,
          icon: Tex.backspace,
          onPress: () => this.back(),
        }),
        new Button(scene, {
          x: x + 2.5 * step,
          y,
          width: KEY,
          height: KEY,
          label: options.okLabel,
          fontSize: FontSize.text,
          fill: Color.grasHell,
          onPress: () => this.submit(),
        }),
      );
      scene.input.keyboard?.on('keydown', this.onKey);
      this.once(Phaser.GameObjects.Events.DESTROY, () =>
        scene.input.keyboard?.off('keydown', this.onKey),
      );
    }
    this.add(this.buttons);
    scene.add.existing(this);
  }

  private tap(wx: number, wy: number): void {
    if (!this.enabled) return;
    const cell = this.board.cellAt(wx, wy);
    if (!cell) return;
    const { info } = this.options;
    if (info.mode === 'pick') {
      this.board.mark(cell);
      this.options.onSubmit(cellsKey([cell]));
      return;
    }
    const given = new Set((info.board.given ?? []).map(([c, r]) => `${c}:${r}`));
    if (given.has(`${cell[0]}:${cell[1]}`)) return;
    const at = this.cells.findIndex(([c, r]) => c === cell[0] && r === cell[1]);
    this.cells = at >= 0 ? this.cells.filter((_, i) => i !== at) : [...this.cells, cell];
    this.board.setCells(this.cells);
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.enabled) return;
    const move = KEYMAP[event.key];
    if (move) this.step(move);
    else if (event.key === 'Backspace') this.back();
    else if (event.key === 'Enter') this.submit();
  }

  private step(move: Move): void {
    if (!this.enabled || this.moves.length >= 16) return;
    this.moves += move;
    this.drawPath();
  }

  private back(): void {
    if (!this.enabled) return;
    this.moves = this.moves.slice(0, -1);
    this.drawPath();
  }

  private drawPath(color?: number): void {
    const { board } = this.options.info;
    const start = board.start?.cell ?? [0, 0];
    const run = walk(start, this.moves, board.cols, board.rows, stonesOf(this.options.info));
    this.board.setPath(run.cells, color);
  }

  private submit(): void {
    if (!this.enabled) return;
    const { mode } = this.options.info;
    if (mode === 'path') this.options.onSubmit(this.moves);
    else this.options.onSubmit(cellsKey(this.cells));
  }

  /** Nach einem Fehler: Feld wählen beginnt neu; Gemaltes und Wege bleiben zum Verbessern. */
  clear(): this {
    if (this.options.info.mode === 'pick') this.board.mark(undefined);
    if (this.options.info.mode === 'cells') {
      this.cells = [];
      this.board.setCells([]);
    }
    return this;
  }

  /** Zeigt die Lösung (Kästchen gelb, Feld markiert oder Weg). */
  showSolution(answer: string): this {
    const { mode } = this.options.info;
    if (mode === 'path') {
      this.moves = answer;
      this.drawPath(Color.sonne);
    } else if (mode === 'pick') {
      this.board.mark(parseCells(answer)?.[0], Color.gras);
    } else {
      this.cells = parseCells(answer) ?? [];
      this.board.setCells(this.cells, Color.sonne);
    }
    return this;
  }

  setButtonsVisible(visible: boolean): this {
    for (const b of this.buttons) b.setVisible(visible);
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of this.buttons) b.setLocked(locked);
    return this;
  }
}
