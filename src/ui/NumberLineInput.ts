import Phaser from 'phaser';
import { Button } from './Button';
import { claimKeys } from './focus';
import { drawPointer, NumberRay } from './math/NumberRay';
import { Color, FontSize, Layout } from './theme';
import type { LineInfo } from '../types/task';

export type NumberLineInputOptions = {
  info: LineInfo;
  /** Mitte des Strahls */
  line: { x: number; y: number; width: number };
  /** Mitte der Tastenreihe */
  keys: { x: number; y: number };
  okLabel: string;
  onSubmit: (value: string) => void;
};

const KEY = 96;

/**
 * Marker auf dem Zahlenstrahl setzen (Spezifikation 6, `number-line`): auf den Strahl tippen
 * oder den Pfeil ziehen; die Pfeiltasten (auch auf der Tastatur) schieben ihn um einen
 * Rasterschritt, „OK“ gibt ab. Der Pfeil zeigt keine Zahl, sonst wäre nur Probieren nötig.
 */
export class NumberLineInput extends Phaser.GameObjects.Container {
  readonly ray: NumberRay;
  private readonly marker: Phaser.GameObjects.Container;
  private readonly buttons: Button[] = [];
  private value?: number;
  private enabled = true;
  private readonly onKey = (event: KeyboardEvent) => this.handleKey(event);

  constructor(
    scene: Phaser.Scene,
    private readonly options: NumberLineInputOptions,
  ) {
    super(scene, 0, 0);
    const { info, line } = options;
    this.ray = new NumberRay(scene, line.x, line.y, line.width, info);
    this.add(this.ray);

    const g = scene.add.graphics();
    drawPointer(g, 0, -10, Color.orange);
    this.marker = scene.add.container(line.x, line.y, [g]).setVisible(false);
    // großzügige Griff-Fläche über dem Pfeil
    this.marker.setSize(64, 90);
    this.marker.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(0, -45, 64, 90),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      draggable: true,
      useHandCursor: true,
    });
    this.marker.on('drag', (p: Phaser.Input.Pointer) => this.placeAt(p.worldX));
    this.add(this.marker);

    // Antippen des Strahls setzt den Pfeil dorthin.
    const zone = scene.add
      .zone(line.x, line.y, line.width + 40, 120)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => this.placeAt(p.worldX));
    // mit dem Finger auf dem Strahl entlangfahren
    zone.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.isDown) this.placeAt(p.worldX);
    });
    this.addAt(zone, 0);

    const { x, y } = options.keys;
    const step = KEY + Layout.gap;
    const arrow = (dir: -1 | 1) =>
      new Button(scene, {
        x: x + (dir < 0 ? -1.5 : -0.5) * step - 40,
        y,
        width: KEY,
        height: KEY,
        drawIcon: (gr) => {
          gr.fillStyle(Color.kontur, 1);
          gr.fillTriangle(dir * 18, 0, -dir * 14, -20, -dir * 14, 20);
        },
        onPress: () => this.nudge(dir),
      });
    this.buttons.push(
      arrow(-1),
      arrow(1),
      new Button(scene, {
        x: x + step,
        y,
        width: 200,
        height: KEY,
        label: options.okLabel,
        fontSize: FontSize.text,
        fill: Color.grasHell,
        onPress: () => this.submit(),
      }),
    );
    this.add(this.buttons);
    scene.input.keyboard?.on('keydown', this.onKey);
    this.once(Phaser.GameObjects.Events.DESTROY, claimKeys(scene, ['enter']));
    this.once(Phaser.GameObjects.Events.DESTROY, () =>
      scene.input.keyboard?.off('keydown', this.onKey),
    );
    scene.add.existing(this);
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.enabled) return;
    if (event.key === 'Enter') this.submit();
  }

  private placeAt(worldX: number): void {
    if (!this.enabled) return;
    this.setValue(this.ray.valueAt(worldX - this.ray.x, this.options.info.snap));
  }

  private nudge(dir: -1 | 1): void {
    if (!this.enabled) return;
    const { min, max, snap } = this.options.info;
    const start = this.value ?? Math.round((min + max) / 2 / snap) * snap;
    this.setValue(this.value === undefined ? start : start + dir * snap);
  }

  private setValue(v: number): void {
    const { min, max } = this.options.info;
    this.value = Phaser.Math.Clamp(v, min, max);
    this.marker.setVisible(true);
    this.marker.x = this.ray.x + this.ray.xOf(this.value);
  }

  private submit(): void {
    if (!this.enabled || this.value === undefined) return;
    this.options.onSubmit(String(this.value));
  }

  /** Hinweis oder Lösung: Zahlen markieren, Pfeil auf eine Zahl. */
  showMarks(marks: readonly number[], arrow?: number): this {
    this.ray.setMarks(marks, arrow);
    return this;
  }

  /** Lösung: richtiger Pfeil, eigener Pfeil verschwindet, Tasten machen Platz. */
  showSolution(answer: number): this {
    this.marker.setVisible(false);
    this.ray.setMarks([answer], answer);
    for (const b of this.buttons) b.setVisible(false);
    return this;
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of this.buttons) b.setLocked(locked);
    return this;
  }
}
