import Phaser from 'phaser';
import { CssColor, FontFamily, FontSize } from './theme';

/**
 * Bereich für Hinweise, Lob und Darstellungen zwischen Aufgabe und Eingabe.
 * Zeigt links ein Symbol (Glühbirne, Wolke, Haken), daneben den Text und darunter
 * eine Darstellung.
 */
export class HintPanel extends Phaser.GameObjects.Container {
  private readonly icon: Phaser.GameObjects.Image;
  private readonly text: Phaser.GameObjects.Text;
  private visual?: Phaser.GameObjects.GameObject;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly panelWidth: number,
  ) {
    super(scene, x, y);
    this.icon = scene.add
      .image(-panelWidth / 2 + 32, 18, '__DEFAULT')
      .setScale(0.6)
      .setVisible(false);
    this.text = scene.add
      .text(-panelWidth / 2 + 72, 0, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
        wordWrap: { width: panelWidth - 80 },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    this.add([this.icon, this.text]);
    scene.add.existing(this);
  }

  get message(): string {
    return this.text.text;
  }

  /** Unterkante des Hinweistexts in Szenenkoordinaten (für Bilder darunter). */
  get textBottom(): number {
    return this.text.text === '' || !this.text.visible
      ? this.y + (this.icon.visible ? 40 : 0)
      : this.y + this.text.y + this.text.height;
  }

  /**
   * Klasse 1: Text nicht zeigen (er wird vorgelesen); Symbol und Darstellung bleiben.
   * `message` liefert den Text weiter für das Vorlesen.
   */
  setTextHidden(hidden: boolean): void {
    this.text.setVisible(!hidden);
  }

  /** Text mit Symbol; die Darstellung wird ersetzt (undefined entfernt sie). */
  show(message: string, icon?: string, visual?: Phaser.GameObjects.GameObject): void {
    this.text.setText(message);
    this.text.x = icon ? -this.panelWidth / 2 + 72 : -this.panelWidth / 2;
    if (icon) this.icon.setTexture(icon).setVisible(true);
    else this.icon.setVisible(false);
    this.setVisual(visual);
  }

  setVisual(visual?: Phaser.GameObjects.GameObject): void {
    this.visual?.destroy();
    this.visual = visual;
  }

  clear(): void {
    this.show('');
  }
}
