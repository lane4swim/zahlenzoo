import Phaser from 'phaser';
import { Color, CssColor, FontFamily, FontSize, Layout, Stroke } from './theme';

export type ButtonOptions = {
  x: number;
  y: number;
  label?: string;
  onPress: () => void;
  width?: number;
  height?: number;
  fontSize?: number;
  /** Bild (Texturschlüssel) über oder statt der Beschriftung */
  icon?: string;
  iconScale?: number;
  /** selbst gezeichnetes Symbol, Mittelpunkt (0, 0) */
  drawIcon?: (g: Phaser.GameObjects.Graphics) => void;
  fill?: number;
  /** Beschriftung unten statt mittig, z. B. wenn ein Bild darüber eingefügt wird */
  labelBottom?: boolean;
  /** Lange Beschriftungen umbrechen (Breite in Pixeln) */
  wrapWidth?: number;
};

const EDGE = 8;
const RADIUS = 20;

/** Taste mit sichtbarer Unterkante (Stilvorgabe, Regel 4). Löst beim Loslassen aus. */
export class Button extends Phaser.GameObjects.Container {
  private readonly face: Phaser.GameObjects.Container;
  private readonly top: Phaser.GameObjects.Graphics;
  private readonly label?: Phaser.GameObjects.Text;
  private readonly btnW: number;
  private readonly btnH: number;
  private fill: number;
  private enabled = true;
  private pressed = false;

  constructor(scene: Phaser.Scene, options: ButtonOptions) {
    super(scene, options.x, options.y);
    this.btnW = Math.max(options.width ?? 240, Layout.minTouch);
    this.btnH = Math.max(options.height ?? Layout.minTouch, Layout.minTouch);
    this.fill = options.fill ?? Color.papier;
    const w = this.btnW;
    const h = this.btnH;

    const edge = scene.add.graphics();
    edge.fillStyle(Color.kartenSchatten, 1);
    edge.lineStyle(Stroke.outline, Color.kontur, 1);
    edge.fillRoundedRect(-w / 2, -h / 2 + EDGE, w, h - EDGE, RADIUS);
    edge.strokeRoundedRect(-w / 2, -h / 2 + EDGE, w, h - EDGE, RADIUS);

    this.top = scene.add.graphics();
    this.drawTop();
    const parts: Phaser.GameObjects.GameObject[] = [this.top];

    const hasLabel = options.label !== undefined && options.label !== '';
    const iconY = hasLabel ? -h / 2 + 34 : -EDGE / 2;
    if (options.icon) {
      parts.push(scene.add.image(0, iconY, options.icon).setScale(options.iconScale ?? 0.6));
    }
    if (options.drawIcon) {
      const g = scene.add.graphics({ x: 0, y: iconY });
      options.drawIcon(g);
      parts.push(g);
    }
    if (hasLabel) {
      const withIcon =
        options.icon !== undefined ||
        options.drawIcon !== undefined ||
        options.labelBottom === true;
      this.label = scene.add
        .text(0, withIcon ? h / 2 - EDGE - 24 : -EDGE / 2, options.label ?? '', {
          fontFamily: FontFamily.text,
          fontSize: `${options.fontSize ?? (withIcon ? FontSize.small - 4 : FontSize.text)}px`,
          color: CssColor.text,
          align: 'center',
          ...(options.wrapWidth ? { wordWrap: { width: options.wrapWidth } } : {}),
        })
        .setOrigin(0.5);
      parts.push(this.label);
    }

    this.face = scene.add.container(0, 0, parts);
    this.add([edge, this.face]);
    this.setSize(w, h);
    this.setInteractive({ useHandCursor: true });

    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.press(true));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.press(false));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      if (!this.pressed || !this.enabled) return;
      this.press(false);
      options.onPress();
    });

    scene.add.existing(this);
  }

  private drawTop(): void {
    const w = this.btnW;
    const h = this.btnH;
    this.top.clear();
    this.top.fillStyle(this.fill, 1);
    this.top.lineStyle(Stroke.outline, Color.kontur, 1);
    this.top.fillRoundedRect(-w / 2, -h / 2, w, h - EDGE, RADIUS);
    this.top.strokeRoundedRect(-w / 2, -h / 2, w, h - EDGE, RADIUS);
  }

  private press(down: boolean): void {
    this.pressed = down && this.enabled;
    this.face.y = this.pressed ? EDGE / 2 : 0;
  }

  setLabel(label: string): this {
    this.label?.setText(label);
    return this;
  }

  setFill(fill: number): this {
    this.fill = fill;
    this.drawTop();
    return this;
  }

  /** Reagiert vorübergehend nicht, ohne das Aussehen zu ändern (z. B. während einer Rückmeldung). */
  setLocked(locked: boolean): this {
    if (locked) this.disableInteractive();
    else if (this.enabled) this.setInteractive({ useHandCursor: true });
    return this;
  }

  /** Gesperrte Tasten sind blasser und reagieren nicht. */
  setEnabled(enabled: boolean): this {
    this.enabled = enabled;
    this.setAlpha(enabled ? 1 : 0.45);
    if (enabled) this.setInteractive({ useHandCursor: true });
    else this.disableInteractive();
    return this;
  }
}
