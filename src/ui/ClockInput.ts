import Phaser from 'phaser';
import { claimKeys } from './focus';
import { Button } from './Button';
import { ClockFace } from './math/ClockFace';
import { Color, CssColor, FontFamily, FontSize, Layout } from './theme';
import { analog, HALF_DAY } from '../logic/clock';

export type ClockInputOptions = {
  /** Mitte der Tastenreihe */
  x: number;
  y: number;
  /** Mitte und Radius der Uhr */
  clock: { x: number; y: number; radius: number };
  /** Schrittweite des langen Zeigers in Minuten */
  step: number;
  okLabel: string;
  hourLabel: string;
  minuteLabel: string;
  onSubmit: (value: string) => void;
};

const KEY = 96;

/**
 * Eingabe „Zeiger einstellen“: Das Kind zieht die Zeiger oder nutzt die Tasten
 * (Stunde − und +, Minuten − und +). Wie bei einer echten Uhr rückt der Stundenzeiger mit,
 * wenn der lange Zeiger über die 12 geht. Auf Laptops auch mit Pfeiltasten
 * (links/rechts: Minuten, oben/unten: Stunde) und Eingabe (OK) bedienbar.
 * Abgegeben wird die Zeit als „h:mm“ mit h von 1 bis 12.
 */
export class ClockInput extends Phaser.GameObjects.Container {
  readonly face: ClockFace;
  private readonly buttons: Button[] = [];
  private enabled = true;
  private dragging: 'hour' | 'minute' | undefined;
  private readonly onKey = (event: KeyboardEvent) => this.handleKey(event);

  constructor(
    scene: Phaser.Scene,
    private readonly options: ClockInputOptions,
  ) {
    super(scene, 0, 0);
    const { clock } = options;
    // Start bei 12 Uhr: beide Zeiger oben
    this.face = new ClockFace(scene, clock.x, clock.y, clock.radius, 0);
    this.add(this.face);

    const step = KEY + Layout.gap;
    const groups: Array<[string, number, number]> = [
      [options.hourLabel, -2.6, 60],
      [options.minuteLabel, -0.4, options.step],
    ];
    for (const [label, at, minutes] of groups) {
      const cx = options.x + at * step;
      this.add(
        scene.add
          .text(cx, options.y - KEY / 2 - 22, label, {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.small}px`,
            color: CssColor.text,
          })
          .setOrigin(0.5),
      );
      for (const [dx, sign] of [
        [-0.5, -1],
        [0.5, 1],
      ] as const) {
        this.buttons.push(
          new Button(scene, {
            x: cx + dx * step,
            y: options.y,
            width: KEY,
            height: KEY,
            label: sign < 0 ? '−' : '+',
            fontSize: FontSize.digits,
            sound: 'clock',
            onPress: () => this.change(sign * minutes),
          }),
        );
      }
    }
    this.buttons.push(
      new Button(scene, {
        x: options.x + 2.4 * step,
        y: options.y,
        width: KEY + 60,
        height: KEY,
        label: options.okLabel,
        fill: Color.grasHell,
        onPress: () => this.submit(),
      }),
    );
    this.add(this.buttons);

    // Zeiger ziehen: Der Zeiger, dessen Richtung am nächsten liegt, folgt dem Finger.
    const r = clock.radius;
    const hit = scene.add.zone(clock.x, clock.y, 2 * r, 2 * r).setInteractive({
      hitArea: new Phaser.Geom.Circle(r, r, r),
      hitAreaCallback: Phaser.Geom.Circle.Contains,
      useHandCursor: true,
    });
    this.add(hit);
    hit.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (p: Phaser.Input.Pointer) =>
      this.startDrag(p),
    );
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    scene.add.existing(this);
    scene.input.keyboard?.on('keydown', this.onKey);
    // Diese Tasten gehören der Eingabe, nicht der allgemeinen Tastaturbedienung.
    this.once(Phaser.GameObjects.Events.DESTROY, claimKeys(scene, ['arrows', 'enter']));
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      scene.input.keyboard?.off('keydown', this.onKey);
      scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
      scene.input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    });
  }

  /** Eingestellte Zeit (Minuten, 0 bis 719). */
  get time(): number {
    return this.face.time;
  }

  /** Winkel des Fingers in Stunden auf dem Zifferblatt (0 bis 12, 12 oben). */
  private angleHours(p: Phaser.Input.Pointer): number {
    const { x, y } = this.options.clock;
    const a = Math.atan2(p.x - x, -(p.y - y));
    return ((((a / (Math.PI * 2)) * 12) % 12) + 12) % 12;
  }

  private startDrag(p: Phaser.Input.Pointer): void {
    if (!this.enabled) return;
    const at = this.angleHours(p);
    const t = this.time;
    const hourAt = (((t / 60) % 12) + 12) % 12;
    const minuteAt = ((t % 60) / 60) * 12;
    const dist = (a: number, b: number) => Math.min(Math.abs(a - b), 12 - Math.abs(a - b));
    // Außerhalb des kurzen Zeigers kann nur der lange gemeint sein; innen der näher liegende.
    const { x, y, radius } = this.options.clock;
    const outer = Math.hypot(p.x - x, p.y - y) > radius * 0.55;
    this.dragging = outer || dist(at, minuteAt) < dist(at, hourAt) ? 'minute' : 'hour';
    this.onMove(p);
  }

  private onMove(p: Phaser.Input.Pointer): void {
    if (!this.dragging || !this.enabled || !p.isDown) return;
    const at = this.angleHours(p);
    const t = this.time;
    const hour = Math.floor(t / 60);
    const minute = t % 60;
    if (this.dragging === 'minute') {
      const step = this.options.step;
      let m = Math.round((at / 12) * (60 / step)) * step;
      if (m === 60) m = 0;
      // über die 12 gedreht: Stunde weiter oder zurück
      let h = hour;
      if (minute >= 45 && m < 15) h++;
      else if (minute < 15 && m >= 45) h--;
      this.setTime(h * 60 + m);
    } else {
      // Der Stundenzeiger steht bei h + m/60; gewählt wird die Stunde, deren Lage am besten passt.
      const h = Math.round(at - minute / 60);
      this.setTime(h * 60 + minute);
    }
  }

  private onUp(): void {
    this.dragging = undefined;
  }

  private handleKey(event: KeyboardEvent): void {
    if (!this.enabled) return;
    if (event.key === 'ArrowRight') this.change(this.options.step);
    else if (event.key === 'ArrowLeft') this.change(-this.options.step);
    else if (event.key === 'ArrowUp') this.change(60);
    else if (event.key === 'ArrowDown') this.change(-60);
    else if (event.key === 'Enter') this.submit();
  }

  private change(minutes: number): void {
    if (!this.enabled) return;
    this.setTime(this.time + minutes);
  }

  setTime(time: number): this {
    this.face.setTime(((time % HALF_DAY) + HALF_DAY) % HALF_DAY);
    return this;
  }

  private submit(): void {
    if (!this.enabled) return;
    this.options.onSubmit(analog(this.time));
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    if (locked) this.dragging = undefined;
    for (const b of this.buttons) b.setLocked(locked);
    return this;
  }

  /** Blendet die Tasten aus; die Uhr bleibt stehen (z. B. mit dem Lösungsweg). */
  setButtonsVisible(visible: boolean): this {
    for (const b of this.buttons) b.setVisible(visible);
    for (const o of this.list) if (o instanceof Phaser.GameObjects.Text) o.setVisible(visible);
    return this;
  }
}
