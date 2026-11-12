import Phaser from 'phaser';
import { Button } from './Button';
import { Color, CssColor, FontFamily, FontSize, Stroke } from './theme';
import type { StrategyWay } from '../logic/strategies';

export type StrategyPanelOptions = {
  title: string;
  /** Wege mit Beschriftung und Rechenweg; „anders“ ohne Rechenweg */
  ways: Array<{ way: StrategyWay; name: string; path?: string }>;
  thanks: string;
  showOtherLabel: string;
  nextLabel: string;
  onPick: (way: StrategyWay) => void;
  onDone: () => void;
};

/**
 * „Wie hast du gerechnet?“ als Fenster über der Aufgabe. Jede Wahl ist richtig; danach
 * zeigt „Anderen Weg ansehen“ die Aufgabe auf einem anderen Weg, „Weiter“ schließt.
 */
export class StrategyPanel extends Phaser.GameObjects.Container {
  private readonly cards: Button[] = [];
  private readonly message: Phaser.GameObjects.Text;
  private readonly after: Button[] = [];
  private others: Array<{ name: string; path: string }> = [];

  constructor(
    scene: Phaser.Scene,
    private readonly options: StrategyPanelOptions,
  ) {
    super(scene, 0, 0);
    const { width, height } = scene.scale;
    const cx = width / 2;
    const shade = scene.add.rectangle(cx, height / 2, width, height, Color.kontur, 0.35);
    shade.setInteractive();
    const panelH = 150 + options.ways.length * 104 + 40;
    const top = Math.max(40, (height - panelH) / 2);
    const panel = scene.add.graphics();
    panel.fillStyle(Color.papier, 1);
    panel.lineStyle(Stroke.outline, Color.kontur, 1);
    panel.fillRoundedRect(cx - 380, top, 760, panelH, 28);
    panel.strokeRoundedRect(cx - 380, top, 760, panelH, 28);
    const title = scene.add
      .text(cx, top + 48, options.title, {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text + 4}px`,
        color: CssColor.text,
      })
      .setOrigin(0.5);
    this.message = scene.add
      .text(cx, top + 110, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
        align: 'center',
        wordWrap: { width: 660 },
        lineSpacing: 6,
      })
      .setOrigin(0.5, 0);
    this.add([shade, panel, title, this.message]);

    options.ways.forEach((w, i) => {
      const card = new Button(scene, {
        x: cx,
        y: top + 140 + i * 104,
        width: 680,
        height: 96,
        label: w.path ? `${w.name}: ${w.path}` : w.name,
        fontSize: FontSize.small,
        wrapWidth: 640,
        onPress: () => this.pick(w.way),
      });
      this.cards.push(card);
      this.add(card);
    });

    const buttonY = top + panelH - 70;
    const other = new Button(scene, {
      x: cx - 140,
      y: buttonY,
      width: 330,
      label: options.showOtherLabel,
      onPress: () => this.showOther(),
    });
    const next = new Button(scene, {
      x: cx + 200,
      y: buttonY,
      width: 220,
      label: options.nextLabel,
      fill: Color.grasHell,
      onPress: () => options.onDone(),
    });
    this.after.push(other, next);
    for (const b of this.after) b.setVisible(false);
    this.add(this.after);
    scene.add.existing(this);
    this.setDepth(100);
  }

  private pick(way: StrategyWay): void {
    this.options.onPick(way);
    for (const c of this.cards) c.setVisible(false);
    this.others = this.options.ways
      .filter((w) => w.way !== way && w.path)
      .map((w) => ({ name: w.name, path: w.path! }));
    this.message.setText(this.options.thanks);
    this.after[0]!.setVisible(this.others.length > 0);
    this.after[1]!.setVisible(true);
  }

  /** Zeigt nacheinander die anderen Wege für dieselbe Aufgabe. */
  private showOther(): void {
    const next = this.others.shift();
    if (!next) return;
    this.message.setText(`${next.name}:\n${next.path}`);
    if (this.others.length === 0) this.after[0]!.setVisible(false);
  }
}
