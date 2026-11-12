import Phaser from 'phaser';
import type { Services } from '../services/services';
import type { GameContent } from '../types/content';
import { Button, type ButtonOptions } from '../ui/Button';
import { announce } from '../ui/a11y';
import { FocusManager } from '../ui/focus';
import {
  applyDisplay,
  Color,
  CssColor,
  displaySettings,
  FontFamily,
  FontSize,
  Layout,
} from '../ui/theme';

type Listener = (...args: never[]) => void;

/**
 * Basis aller Szenen. Räumt beim Verlassen Ereignisse, Tweens und Zeitgeber auf,
 * damit Tablets bei langen Sitzungen nicht langsamer werden (Spezifikation, Abschnitt 4).
 *
 * Unterklassen überschreiben `onInit` statt `init`.
 */
export abstract class BaseScene<TData extends object = object> extends Phaser.Scene {
  private cleanups: Array<() => void> = [];

  constructor(
    key: string,
    protected readonly services: Services,
  ) {
    super(key);
  }

  init(data: TData): void {
    this.cleanups = [];
    // Anzeige-Einstellungen des aktiven Profils (Schrift, Kontrast, Bewegung) gelten ab hier.
    applyDisplay(this.services.save.activeProfile?.settings);
    // Tastaturbedienung: Tab, Pfeiltasten, Leertaste und Eingabe für alle Knöpfe der Szene.
    new FocusManager(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.onInit(data);
  }

  protected onInit(_data: TData): void {}

  /** Meldet einen Listener an, der beim Verlassen der Szene sicher entfernt wird. */
  protected listen<F extends Listener>(
    emitter: Phaser.Events.EventEmitter,
    event: string,
    fn: F,
  ): void {
    emitter.on(event, fn, this);
    this.cleanups.push(() => emitter.off(event, fn, this));
  }

  /** Geprüfte Inhalte (Bereiche, Familien, Tiere, Startwerte). */
  protected get content(): GameContent {
    return this.services.content.get();
  }

  protected t(key: string, params?: Readonly<Record<string, string | number>>): string {
    return this.services.i18n.t(key, params);
  }

  /** Hintergrundbild über die ganze Fläche (1024 × 768). */
  protected addBackground(key: string): Phaser.GameObjects.Image {
    const image = this.add.image(0, 0, key).setOrigin(0);
    // Hoher Kontrast: Hintergrund aufhellen, damit Text und Knöpfe klar hervortreten.
    if (displaySettings().highContrast) {
      this.add.rectangle(0, 0, this.scale.width, this.scale.height, Color.weiss, 0.45).setOrigin(0);
    }
    return image;
  }

  protected addButton(options: ButtonOptions): Button {
    return new Button(this, options);
  }

  protected addTitle(text: string, y = 120): Phaser.GameObjects.Text {
    // Bildschirmleser erfahren, auf welcher Seite das Spiel gerade ist.
    announce(text);
    return this.add
      .text(this.scale.width / 2, y, text, {
        fontFamily: FontFamily.title,
        fontSize: `${FontSize.title}px`,
        color: CssColor.kontur,
      })
      .setOrigin(0.5);
  }

  protected addText(x: number, y: number, text: string): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
        align: 'center',
      })
      .setOrigin(0.5);
  }

  /** Zurück-Knopf oben links. */
  protected addBackButton(onPress: () => void, label = this.t('common.back')): Button {
    const width = 180;
    return this.addButton({
      x: Layout.margin + width / 2,
      y: Layout.margin + Layout.minTouch / 2,
      width,
      label,
      onPress,
    });
  }

  private cleanup(): void {
    for (const fn of this.cleanups) fn();
    this.cleanups = [];
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
