import Phaser from 'phaser';
import { Button } from './Button';
import { BuildingView, drawPlan, planNumbers, PlanView } from './math/Cubes';
import { Color, CssColor, FontFamily, FontSize, Layout } from './theme';
import { MAX_HEIGHT, SIZE } from '../logic/cubes';
import type { BuildInfo, Heights } from '../types/task';

export type BuildInputOptions = {
  info: BuildInfo;
  /** Mitte der Vorlage (Bauplan oder Gebäude) */
  target: { x: number; y: number };
  /** Mitte des Rasters zum Antippen */
  grid: { x: number; y: number };
  /** Mitte des mitwachsenden Gebäudes (nur beim Bauen) */
  model: { x: number; y: number };
  keys: { x: number; y: number };
  okLabel: string;
  clearLabel: string;
  frontLabel: string;
  onSubmit: (value: string) => void;
};

const CELL = 62;

/**
 * Würfelgebäude bauen oder Bauplan schreiben: Antippen eines Feldes legt einen Würfel mehr
 * darauf (nach 3 wieder 0). Beim Bauen wächst das Gebäude daneben mit. „OK“ gibt die Höhen ab.
 */
export class BuildInput extends Phaser.GameObjects.Container {
  private heights: Heights = Array(SIZE * SIZE).fill(0) as Heights;
  private readonly plan: Phaser.GameObjects.Graphics;
  private numbers: Phaser.GameObjects.Text[] = [];
  private readonly model?: BuildingView;
  private readonly buttons: Button[];
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    private readonly options: BuildInputOptions,
  ) {
    super(scene, 0, 0);
    const { info } = options;
    const target =
      info.mode === 'build'
        ? new PlanView(
            scene,
            options.target.x,
            options.target.y,
            info.target,
            48,
            options.frontLabel,
          )
        : new BuildingView(scene, options.target.x, options.target.y + 40, info.target, 34, {
            front: options.frontLabel,
            right: '',
          });
    this.add(target);
    this.plan = scene.add.graphics();
    this.add(this.plan);
    if (info.mode === 'build') {
      this.model = new BuildingView(scene, options.model.x, options.model.y + 40, this.heights, 30);
      this.add(this.model);
    }
    const { x, y } = options.grid;
    const zone = scene.add
      .zone(x, y, SIZE * CELL, SIZE * CELL)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const c = Math.floor((p.worldX - (x - (SIZE * CELL) / 2)) / CELL);
      const r = Math.floor((p.worldY - (y - (SIZE * CELL) / 2)) / CELL);
      if (c >= 0 && r >= 0 && c < SIZE && r < SIZE) this.tap(r * SIZE + c);
    });
    this.add(zone);
    this.add(
      scene.add
        .text(x, y + (SIZE * CELL) / 2 + 18, options.frontLabel, {
          fontFamily: FontFamily.text,
          fontSize: '20px',
          color: CssColor.text,
        })
        .setOrigin(0.5),
    );
    const k = options.keys;
    this.buttons = [
      new Button(scene, {
        x: k.x - 110 - Layout.gap / 2,
        y: k.y,
        width: 200,
        label: options.clearLabel,
        fontSize: FontSize.text,
        onPress: () => this.clear(),
      }),
      new Button(scene, {
        x: k.x + 110 + Layout.gap / 2,
        y: k.y,
        width: 200,
        label: options.okLabel,
        fontSize: FontSize.text,
        fill: Color.grasHell,
        onPress: () => this.enabled && this.options.onSubmit(this.heights.join(',')),
      }),
    ];
    this.add(this.buttons);
    this.redraw();
    scene.add.existing(this);
  }

  private tap(i: number): void {
    if (!this.enabled) return;
    this.heights[i] = ((this.heights[i] ?? 0) + 1) % (MAX_HEIGHT + 1);
    this.redraw();
  }

  private redraw(): void {
    const { x, y } = this.options.grid;
    this.plan.clear();
    drawPlan(this.plan, this.heights, CELL, x, y);
    for (const t of this.numbers) t.destroy();
    this.numbers = planNumbers(this.scene, this.heights, CELL, x, y, FontSize.digits - 8);
    this.add(this.numbers);
    this.model?.setHeights(this.heights);
  }

  clear(): this {
    this.heights = Array(SIZE * SIZE).fill(0) as Heights;
    this.redraw();
    return this;
  }

  showSolution(target: Heights): this {
    this.heights = [...target];
    this.redraw();
    for (const b of this.buttons) b.setVisible(false);
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of this.buttons) b.setLocked(locked);
    return this;
  }
}
