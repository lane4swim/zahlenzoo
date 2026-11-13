import Phaser from 'phaser';
import { claimKeys } from './focus';
import { Button } from './Button';
import { uiSound } from './sound';
import { Color, FontSize, Layout, Tex } from './theme';

export type NumpadOptions = {
  x: number;
  y: number;
  okLabel: string;
  maxDigits?: number;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
};

const KEY = 96;

/**
 * Ziffernblock im Spiel (0 bis 9, Löschen, OK), zwei Reihen à sechs Tasten.
 * Auf Laptops zusätzlich mit Zifferntasten, Rücktaste und Eingabe bedienbar.
 */
export class Numpad extends Phaser.GameObjects.Container {
  private value = '';
  private enabled = true;
  private readonly maxDigits: number;
  private readonly buttons: Button[] = [];
  private readonly onKey = (event: KeyboardEvent) => this.handleKey(event);

  constructor(
    scene: Phaser.Scene,
    private readonly options: NumpadOptions,
  ) {
    super(scene, options.x, options.y);
    this.maxDigits = options.maxDigits ?? 3;
    const step = KEY + Layout.gap;
    const keys: Array<string> = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'del', 'ok'];
    keys.forEach((key, i) => {
      const col = i % 6;
      const row = Math.floor(i / 6);
      const x = (col - 2.5) * step;
      const y = (row - 0.5) * step;
      const common = {
        x,
        y,
        width: KEY,
        height: KEY,
        // Ziffern und Löschen klingen in press(), auch beim Tippen auf der Tastatur
        sound: null,
        onPress: () => this.press(key),
      };
      const button =
        key === 'del'
          ? new Button(scene, { ...common, icon: Tex.backspace, iconScale: 0.8 })
          : key === 'ok'
            ? new Button(scene, { ...common, label: options.okLabel, fill: Color.grasHell })
            : new Button(scene, { ...common, label: key, fontSize: FontSize.digits });
      this.buttons.push(button);
    });
    this.add(this.buttons);
    scene.add.existing(this);
    scene.input.keyboard?.on('keydown', this.onKey);
    // Diese Tasten gehören der Eingabe, nicht der allgemeinen Tastaturbedienung.
    this.once(Phaser.GameObjects.Events.DESTROY, claimKeys(scene, ['enter']));
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input.keyboard?.off('keydown', this.onKey);
    });
  }

  private handleKey(event: KeyboardEvent): void {
    if (/^[0-9]$/.test(event.key)) this.press(event.key);
    else if (event.key === 'Backspace' || event.key === 'Delete') this.press('del');
    else if (event.key === 'Enter') this.press('ok');
  }

  private press(key: string): void {
    if (!this.enabled) return;
    if (key !== 'ok') uiSound(this.scene, key === 'del' ? 'erase' : 'digit');
    if (key === 'del') {
      this.setValue(this.value.slice(0, -1));
    } else if (key === 'ok') {
      if (this.value !== '') this.options.onSubmit(this.value);
    } else if (this.value.length < this.maxDigits) {
      this.setValue(this.value === '0' ? key : this.value + key);
    }
  }

  setValue(value: string): this {
    this.value = value;
    this.options.onChange(value);
    return this;
  }

  clear(): this {
    return this.setValue('');
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of this.buttons) b.setLocked(locked);
    return this;
  }
}
