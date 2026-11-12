import Phaser from 'phaser';
import { drawFocusRing, registerFocusable, shownInScene, type Focusable } from './focus';
import { Color, CssColor, FontFamily, reducedMotion, Stroke, Tex } from './theme';

export type AreaMarkerOptions = {
  x: number;
  y: number;
  name: string;
  /** Texturschlüssel des Symbols (Tier, Schloss oder Schild) */
  icon: string;
  /** Text auf dem Schild, z. B. „bald“ */
  signText?: string;
  stars?: number;
  /** offen: wippt leicht und lädt zum Antippen ein */
  inviting?: boolean;
  dimmed?: boolean;
  /** Gehege fertig: grünes Namensschild und Rosette neben dem Tier */
  done?: boolean;
  onPress: () => void;
};

/** Rosette für fertige Gehege (Bild des Abzeichens „Gehege geschafft“). */
export const DONE_TEXTURE = 'abzeichen_gehege_fertig';

const HIT_W = 170;
const HIT_H = 190;

/** Gehege-Markierung auf der Zoo-Karte: Symbol, Namensschild, Sterne. */
export class AreaMarker extends Phaser.GameObjects.Container implements Focusable {
  private readonly figure: Phaser.GameObjects.Container;
  private ring?: Phaser.GameObjects.Graphics;
  private readonly onPress: () => void;

  constructor(scene: Phaser.Scene, options: AreaMarkerOptions) {
    super(scene, options.x, options.y);
    const icon = scene.add.image(0, -18, options.icon);
    const parts: Phaser.GameObjects.GameObject[] = [icon];
    if (options.signText) {
      parts.push(
        scene.add
          .text(0, -28, options.signText, {
            fontFamily: FontFamily.text,
            fontSize: '26px',
            color: CssColor.kontur,
          })
          .setOrigin(0.5),
      );
    }
    this.figure = scene.add.container(0, 0, parts);

    const label = scene.add
      .text(0, 0, options.name, {
        fontFamily: FontFamily.text,
        fontSize: '22px',
        color: CssColor.text,
      })
      .setOrigin(0, 0.5);
    const hasStars = options.stars !== undefined;
    const starW = hasStars ? 58 : 0;
    const plateW = label.width + 28 + starW;
    const plateY = 66;
    label.setPosition(-plateW / 2 + 14, plateY);
    const plate = scene.add.graphics();
    plate.fillStyle(options.done ? Color.grasHell : Color.papier, 1);
    plate.lineStyle(Stroke.inner + 0.5, Color.kontur, 1);
    plate.fillRoundedRect(-plateW / 2, plateY - 20, plateW, 40, 14);
    plate.strokeRoundedRect(-plateW / 2, plateY - 20, plateW, 40, 14);
    const plateParts: Phaser.GameObjects.GameObject[] = [plate, label];
    if (hasStars) {
      const sx = plateW / 2 - starW + 10;
      plateParts.push(scene.add.image(sx + 8, plateY, Tex.starFull).setScale(0.28));
      plateParts.push(
        scene.add
          .text(sx + 24, plateY, String(options.stars), {
            fontFamily: FontFamily.text,
            fontSize: '22px',
            color: CssColor.text,
          })
          .setOrigin(0, 0.5),
      );
    }

    this.add([this.figure, ...plateParts]);
    if (options.done && scene.textures.exists(DONE_TEXTURE)) {
      this.add(scene.add.image(58, -62, DONE_TEXTURE).setScale(0.24));
    }
    if (options.dimmed) this.setAlpha(0.8);
    this.setSize(HIT_W, HIT_H);
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.figure.setScale(0.94));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => this.figure.setScale(1));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      this.figure.setScale(1);
      options.onPress();
    });

    if (options.inviting && !reducedMotion()) {
      scene.tweens.add({
        targets: icon,
        y: icon.y - 6,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: (options.x * 7) % 600,
      });
    }
    this.onPress = options.onPress;
    // Tastaturbedienung: Gehege lassen sich wie Knöpfe mit Tab und Pfeiltasten wählen.
    this.once(Phaser.GameObjects.Events.DESTROY, registerFocusable(scene, this));
    scene.add.existing(this);
  }

  canFocus(): boolean {
    return this.input?.enabled === true && shownInScene(this);
  }

  activate(): void {
    this.onPress();
  }

  setFocused(focused: boolean): void {
    if (focused) {
      this.ring ??= this.scene.add.graphics();
      drawFocusRing(this.ring, HIT_W - 20, HIT_H - 10, 30);
      this.ring.setPosition(0, 4);
      this.add(this.ring);
      this.ring.setVisible(true);
    } else {
      this.ring?.setVisible(false);
    }
  }

  focusPoint(): { x: number; y: number } {
    const m = this.getWorldTransformMatrix();
    return { x: m.tx, y: m.ty };
  }
}
