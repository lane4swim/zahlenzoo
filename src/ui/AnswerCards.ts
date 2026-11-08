import Phaser from 'phaser';
import { Button } from './Button';
import { Color, FontSize, Layout } from './theme';
import type { TaskOption } from '../types/task';

const CARD_W = 180;
const CARD_H = 120;
/** Karten mit Sätzen (z. B. Fragen) stehen untereinander und sind breit. */
const LIST_W = 640;
const LIST_H = 96;
/** Ab dieser Länge wird eine Beschriftung als Satz behandelt. */
const SENTENCE = 18;
/** Bis zu dieser Länge stehen Zahlen in großer Schrift auf der Karte. */
const SHORT = 4;

/**
 * 2 bis 4 Antwortkarten zum Antippen. Falsch gewählte Karten werden gesperrt.
 * Kurze Werte stehen groß nebeneinander; Beträge und Wörter in Textgröße auf breiteren
 * Karten; Sätze untereinander auf breiten Karten (die letzte Karte endet auf Höhe der
 * unteren Eingabereihe).
 */
export class AnswerCards extends Phaser.GameObjects.Container {
  private readonly cards = new Map<string, Button>();
  private readonly sentences: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: readonly TaskOption[],
    onPick: (value: string) => void,
    labelOf: (option: TaskOption) => string = (o) => o.value,
  ) {
    super(scene, x, y);
    const labels = options.map(labelOf);
    const longest = Math.max(...labels.map((l) => l.length));
    this.sentences = longest > SENTENCE;
    const short = longest <= SHORT;
    const cardW = this.sentences ? LIST_W : short ? CARD_W : Math.max(CARD_W, 24 + longest * 15);
    const step = this.sentences ? LIST_H + 8 : cardW + Layout.gap + 8;
    options.forEach((option, i) => {
      const card = new Button(scene, {
        x: this.sentences ? 0 : (i - (options.length - 1) / 2) * step,
        y: this.sentences ? (i - (options.length - 1)) * step + LIST_H / 2 + 8 : 0,
        width: cardW,
        height: this.sentences ? LIST_H : CARD_H,
        label: labels[i] ?? option.value,
        fontSize: short ? FontSize.digits : this.sentences ? FontSize.small : FontSize.text,
        ...(this.sentences ? { wrapWidth: LIST_W - 40 } : {}),
        onPress: () => onPick(option.value),
      });
      this.cards.set(option.value, card);
      this.add(card);
    });
    scene.add.existing(this);
  }

  /** Sätze stehen untereinander; dann braucht die Liste mehr Platz nach oben. */
  get isList(): boolean {
    return this.sentences;
  }

  /** Sperrt eine falsche Karte; sie wird blasser und reagiert nicht mehr. */
  markWrong(value: string): void {
    this.cards.get(value)?.setEnabled(false);
  }

  markCorrect(value: string): void {
    this.cards.get(value)?.setFill(Color.grasHell);
  }

  /**
   * Lösung zeigen, wenn es kein Antwortkästchen gibt: nur die richtige Karte bleibt,
   * hervorgehoben und mittig auf Höhe `y` (relativ zur Kartenreihe).
   */
  showSolution(value: string, y: number): void {
    for (const [v, card] of this.cards) {
      if (v !== value) {
        card.setVisible(false);
        continue;
      }
      card.setEnabled(true).setLocked(true).setFill(Color.sonne);
      card.setPosition(0, y);
    }
  }

  setLocked(locked: boolean): void {
    for (const card of this.cards.values()) card.setLocked(locked);
  }
}
