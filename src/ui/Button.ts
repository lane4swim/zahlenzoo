import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Layout, Stroke } from './theme';

export type ButtonOptions = {
  x: number;
  y: number;
  label: string;
  onPress: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
};

const EDGE = 8;
const RADIUS = 20;

/** Taste mit sichtbarer Unterkante (Stilvorgabe, Regel 4). Löst beim Loslassen aus. */
export class Button extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, options: ButtonOptions) {
    super(scene, options.x, options.y);
    const width = Math.max(options.width ?? 240, Layout.minTouch);
    const height = Math.max(options.height ?? Layout.minTouch, Layout.minTouch);

    const edge = scene.add.graphics();
    edge.fillStyle(Color.kartenSchatten, 1);
    edge.lineStyle(Stroke.outline, Color.kontur, 1);
    edge.fillRoundedRect(-width / 2, -height / 2 + EDGE, width, height - EDGE, RADIUS);
    edge.strokeRoundedRect(-width / 2, -height / 2 + EDGE, width, height - EDGE, RADIUS);

    const top = scene.add.graphics();
    top.fillStyle(Color.papier, 1);
    top.lineStyle(Stroke.outline, Color.kontur, 1);
    top.fillRoundedRect(-width / 2, -height / 2, width, height - EDGE, RADIUS);
    top.strokeRoundedRect(-width / 2, -height / 2, width, height - EDGE, RADIUS);

    const text = scene.add
      .text(0, -EDGE / 2, options.label, {
        fontFamily: FontFamily.text,
        fontSize: `${options.fontSize ?? FontSize.text}px`,
        color: CssColor.text,
      })
      .setOrigin(0.5);

    this.face = scene.add.container(0, 0, [top, text]);
    this.add([edge, this.face]);
    this.setSize(width, height);
    this.setInteractive({ useHandCursor: true });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.press(true));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.press(false));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      this.press(false);
      options.onPress();
    });

    scene.add.existing(this);
  }

  private press(down: boolean): void {
    this.face.y = down ? EDGE / 2 : 0;
  }
}
