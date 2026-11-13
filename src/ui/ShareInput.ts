import Phaser from 'phaser';
import { Button } from './Button';
import { uiSound } from './sound';
import { Color, CssColor, FontFamily, FontSize, reducedMotion, Stroke } from './theme';
import type { ShareInfo } from '../types/task';

export type ShareInputOptions = {
  info: ShareInfo;
  x: number;
  /** obere Kante des Vorrats, Mitte der Teller- oder Korbreihe, Mitte der Tastenreihe */
  pileY: number;
  groupsY: number;
  keysY: number;
  labels: { each: string; fill: string; reset: string; ok: string };
  onSubmit: (value: string) => void;
};

const ITEM = 40;
const GROUP_H = 100;

/**
 * Verteilen und Aufteilen zum Selbermachen (Division als Handlung, Klasse 2).
 * Verteilen: Teller antippen legt eins darauf; „Eins für jeden“ gibt jedem Teller eins.
 * Aufteilen: „Korb füllen“ legt so viele in einen neuen Korb, wie hineingehören.
 * Ist alles verteilt, gibt „OK“ ab: beim Verteilen die Anzahl je Teller („4,4,4“), beim
 * Aufteilen die Anzahl Körbe.
 */
export class ShareInput extends Phaser.GameObjects.Container {
  private pile = 0;
  /** Anzahl je Teller oder Korb */
  private groups: number[] = [];
  private readonly pileLayer: Phaser.GameObjects.Container;
  private readonly groupLayer: Phaser.GameObjects.Container;
  private readonly buttons: Button[] = [];
  private readonly plateZones: Phaser.GameObjects.Zone[] = [];
  private enabled = true;

  constructor(
    scene: Phaser.Scene,
    private readonly options: ShareInputOptions,
  ) {
    super(scene, 0, 0);
    const { info, x, keysY, labels } = options;
    this.pileLayer = scene.add.container(0, 0);
    this.groupLayer = scene.add.container(0, 0);
    this.add([this.pileLayer, this.groupLayer]);
    const left = new Button(scene, {
      x: x - 250,
      y: keysY,
      width: 230,
      label: info.mode === 'share' ? labels.each : labels.fill,
      fontSize: FontSize.small,
      sound: null,
      onPress: () => (info.mode === 'share' ? this.dealRound() : this.fillBasket()),
    });
    const reset = new Button(scene, {
      x,
      y: keysY,
      width: 200,
      label: labels.reset,
      fontSize: FontSize.small,
      sound: 'erase',
      onPress: () => this.clear(),
    });
    const ok = new Button(scene, {
      x: x + 240,
      y: keysY,
      width: 200,
      label: labels.ok,
      fill: Color.grasHell,
      onPress: () => this.submit(),
    });
    this.buttons.push(left, reset, ok);
    this.add(this.buttons);
    this.clear();
    scene.add.existing(this);
  }

  private get groupCount(): number {
    const { info } = this.options;
    return info.mode === 'share' ? info.groups : Math.ceil(info.total / info.size);
  }

  /** Verteilen: ein Ding auf Teller i. */
  private give(i: number): void {
    if (!this.enabled || this.pile <= 0 || this.options.info.mode !== 'share') return;
    this.pile--;
    this.groups[i] = (this.groups[i] ?? 0) + 1;
    uiSound(this.scene, 'drop');
    this.redraw(i);
  }

  /** Verteilen: jedem Teller eins, solange der Vorrat reicht. */
  private dealRound(): void {
    if (!this.enabled || this.pile <= 0) return;
    for (let i = 0; i < this.groups.length && this.pile > 0; i++) {
      this.pile--;
      this.groups[i] = (this.groups[i] ?? 0) + 1;
    }
    uiSound(this.scene, 'drop');
    this.redraw();
  }

  /** Aufteilen: einen neuen Korb füllen (mit dem, was übrig ist, wenn es nicht reicht). */
  private fillBasket(): void {
    const { info } = this.options;
    if (!this.enabled || this.pile <= 0 || info.mode !== 'measure') return;
    const n = Math.min(info.size, this.pile);
    this.pile -= n;
    this.groups.push(n);
    uiSound(this.scene, 'drop');
    this.redraw(this.groups.length - 1);
  }

  private submit(): void {
    if (!this.enabled) return;
    if (this.pile > 0) {
      // Erst alles verteilen: kurz den Vorrat anstupsen statt einer Rückmeldung als Fehler
      this.nudgePile();
      return;
    }
    const { info } = this.options;
    this.options.onSubmit(
      info.mode === 'share' ? this.groups.join(',') : String(this.groups.length),
    );
  }

  private nudgePile(): void {
    uiSound(this.scene, 'tap');
    if (reducedMotion()) return;
    this.scene.tweens.add({ targets: this.pileLayer, x: 8, duration: 60, yoyo: true, repeat: 2 });
  }

  /** Neu beginnen: alles zurück in den Vorrat. */
  clear(): this {
    const { info } = this.options;
    this.pile = info.total;
    this.groups = info.mode === 'share' ? Array.from({ length: info.groups }, () => 0) : [];
    this.redraw();
    return this;
  }

  /** Lösung: gerecht verteilt bzw. alle Körbe gefüllt. */
  showSolution(): this {
    const { info } = this.options;
    this.pile = 0;
    this.groups =
      info.mode === 'share'
        ? Array.from({ length: info.groups }, () => info.total / info.groups)
        : Array.from({ length: info.total / info.size }, () => info.size);
    this.redraw();
    for (const b of this.buttons) b.setVisible(false);
    return this;
  }

  private redraw(pop?: number): void {
    const { info, x, pileY, groupsY } = this.options;
    const scene = this.scene;
    this.pileLayer.removeAll(true);
    this.groupLayer.removeAll(true);

    // Vorrat: Dinge in Reihen zu zehn (Kraft der 10)
    const perRow = 10;
    for (let i = 0; i < this.pile; i++) {
      const col = i % perRow;
      const row = Math.floor(i / perRow);
      const ix = x - ((Math.min(this.pile, perRow) - 1) * (ITEM + 4)) / 2 + col * (ITEM + 4);
      this.pileLayer.add(
        scene.add
          .image(ix, pileY + ITEM / 2 + row * (ITEM + 4), info.icon)
          .setDisplaySize(ITEM, ITEM),
      );
    }

    // Teller (Verteilen) oder Körbe (Aufteilen)
    const count = Math.max(this.groupCount, 1);
    const w = Math.min(170, Math.floor(700 / count) - 12);
    const step = w + 12;
    for (let i = 0; i < count; i++) {
      const n = this.groups[i];
      const gx = x + (i - (count - 1) / 2) * step;
      const g = scene.add.graphics();
      // Körbe erscheinen erst beim Füllen (sonst verriete die Zahl der Plätze die Lösung)
      if (info.mode === 'measure' && n === undefined) continue;
      g.lineStyle(Stroke.outline, Color.kontur, 1);
      g.fillStyle(info.mode === 'share' ? Color.papier : Color.erde, 1);
      if (info.mode === 'share') {
        g.fillEllipse(gx, groupsY, w, GROUP_H);
        g.strokeEllipse(gx, groupsY, w, GROUP_H);
      } else {
        g.fillRoundedRect(gx - w / 2, groupsY - GROUP_H / 2, w, GROUP_H, 18);
        g.strokeRoundedRect(gx - w / 2, groupsY - GROUP_H / 2, w, GROUP_H, 18);
      }
      this.groupLayer.add(g);
      const items = n ?? 0;
      // Dinge im Teller: Reihen zu höchstens drei, kleiner bei vielen
      const size = items > 6 ? 24 : 30;
      const cols = Math.min(3, Math.max(1, Math.floor((w - 16) / (size + 2))));
      for (let k = 0; k < items; k++) {
        const c = k % cols;
        const r = Math.floor(k / cols);
        const rows = Math.ceil(items / cols);
        const img = scene.add
          .image(
            gx + (c - (Math.min(items, cols) - 1) / 2) * (size + 2),
            groupsY - 14 + (r - (rows - 1) / 2) * (size + 2),
            info.icon,
          )
          .setDisplaySize(size, size);
        this.groupLayer.add(img);
      }
      {
        this.groupLayer.add(
          scene.add
            .text(gx, groupsY + GROUP_H / 2 - 30, String(items), {
              fontFamily: FontFamily.text,
              fontSize: `${FontSize.small}px`,
              color: CssColor.text,
            })
            .setOrigin(0.5, 0),
        );
      }
      // Tippflächen der Teller einmal anlegen: Neu anlegen während eines Tipps verwirrt die Eingabe
      if (info.mode === 'share' && !this.plateZones[i]) {
        const zone = scene.add
          .zone(gx, groupsY, w, GROUP_H)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => this.give(i));
        this.plateZones[i] = zone;
        this.add(zone);
      }
      if (pop === i && !reducedMotion()) {
        g.setScale(1);
        scene.tweens.add({ targets: g, alpha: { from: 0.6, to: 1 }, duration: 160 });
      }
    }
  }

  setLocked(locked: boolean): this {
    this.enabled = !locked;
    for (const b of this.buttons) b.setLocked(locked);
    for (const z of this.plateZones) {
      if (locked) z.disableInteractive();
      else z.setInteractive({ useHandCursor: true });
    }
    return this;
  }
}
