import Phaser from 'phaser';
import { Button } from './Button';
import { Color, FontSize, Layout } from './theme';
import type { TaskOption } from '../types/task';

const CARD_W = 180;
const CARD_H = 120;

/** 3 bis 4 Antwortkarten zum Antippen. Falsch gewählte Karten werden gesperrt. */
export class AnswerCards extends Phaser.GameObjects.Container {
  private readonly cards = new Map<string, Button>();

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    options: readonly TaskOption[],
    onPick: (value: string) => void,
  ) {
    super(scene, x, y);
    const step = CARD_W + Layout.gap + 8;
    options.forEach((option, i) => {
      const card = new Button(scene, {
        x: (i - (options.length - 1) / 2) * step,
        y: 0,
        width: CARD_W,
        height: CARD_H,
        label: option.value,
        fontSize: FontSize.digits,
        onPress: () => onPick(option.value),
      });
      this.cards.set(option.value, card);
      this.add(card);
    });
    scene.add.existing(this);
  }

  /** Sperrt eine falsche Karte; sie wird blasser und reagiert nicht mehr. */
  markWrong(value: string): void {
    this.cards.get(value)?.setEnabled(false);
  }

  markCorrect(value: string): void {
    this.cards.get(value)?.setFill(Color.grasHell);
  }

  setLocked(locked: boolean): void {
    for (const card of this.cards.values()) card.setLocked(locked);
  }
}
