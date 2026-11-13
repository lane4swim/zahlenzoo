import Phaser from 'phaser';
import { nextIndex, readingOrder } from '../logic/focusOrder';
import { Color } from './theme';

/**
 * Tastaturbedienung für Laptops (Spezifikation 9): Tab und Umschalt+Tab gehen der Reihe nach
 * durch alle bedienbaren Elemente, die Pfeiltasten springen in die gedrückte Richtung,
 * Leertaste und Eingabe drücken das gewählte Element. Der Fokus erscheint erst, wenn eine dieser
 * Tasten benutzt wird; wer tippt, sieht nichts davon.
 *
 * Eingaben, die Tasten selbst brauchen (Ziffernblock: Eingabe; Uhr und Pfeil-Weg: Pfeiltasten),
 * melden das mit claimKeys an; dann bleiben diese Tasten bei ihnen.
 */
export interface Focusable {
  /** sichtbar, aktiv und bedienbar */
  canFocus(): boolean;
  activate(): void;
  setFocused(focused: boolean): void;
  /** Mitte in Weltkoordinaten */
  focusPoint(): { x: number; y: number };
}

type Claim = 'arrows' | 'enter';

const registry = new WeakMap<Phaser.Scene, Set<Focusable>>();
const claims = new WeakMap<Phaser.Scene, Map<Claim, number>>();

export function registerFocusable(scene: Phaser.Scene, item: Focusable): () => void {
  let set = registry.get(scene);
  if (!set) {
    set = new Set();
    registry.set(scene, set);
  }
  set.add(item);
  return () => set.delete(item);
}

/** Eine Eingabe übernimmt Tasten (solange sie besteht); gibt die Freigabe zurück. */
export function claimKeys(scene: Phaser.Scene, keys: Claim[]): () => void {
  let map = claims.get(scene);
  if (!map) {
    map = new Map();
    claims.set(scene, map);
  }
  const m = map;
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return () => {
    for (const k of keys) m.set(k, Math.max(0, (m.get(k) ?? 1) - 1));
  };
}

const claimed = (scene: Phaser.Scene, key: Claim) => (claims.get(scene)?.get(key) ?? 0) > 0;

/** Sichtbar heißt: das Objekt und alle seine Eltern sind sichtbar. */
export function shownInScene(obj: Phaser.GameObjects.GameObject): boolean {
  let o: Phaser.GameObjects.GameObject | null = obj;
  while (o) {
    const v = o as unknown as { visible?: boolean; active?: boolean };
    if (v.visible === false || v.active === false) return false;
    o = o.parentContainer;
  }
  return true;
}

/** Fokusrahmen: dunkle Kontur mit gelbem Rand, gut sichtbar auf allen Hintergründen. */
export function drawFocusRing(g: Phaser.GameObjects.Graphics, w: number, h: number, r = 22): void {
  g.clear();
  g.lineStyle(10, Color.kontur, 1);
  g.strokeRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, r + 6);
  g.lineStyle(5, Color.sonne, 1);
  g.strokeRoundedRect(-w / 2 - 8, -h / 2 - 8, w + 16, h + 16, r + 6);
}

/** Fokus-Verwaltung einer Szene; BaseScene legt sie beim Start an. */
export class FocusManager {
  private focused?: Focusable;
  private readonly onKey = (event: KeyboardEvent) => this.handle(event);

  constructor(private readonly scene: Phaser.Scene) {
    scene.input.keyboard?.on('keydown', this.onKey);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard?.off('keydown', this.onKey);
      this.focused = undefined;
    });
  }

  private items(): Array<{ item: Focusable; x: number; y: number }> {
    const set = registry.get(this.scene) ?? new Set();
    return readingOrder(
      [...set].filter((i) => i.canFocus()).map((item) => ({ item, ...item.focusPoint() })),
    );
  }

  private handle(event: KeyboardEvent): void {
    const key = event.key;
    const move =
      key === 'Tab'
        ? event.shiftKey
          ? 'prev'
          : 'next'
        : !claimed(this.scene, 'arrows')
          ? ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const)[
              key as 'ArrowLeft'
            ]
          : undefined;
    if (move) {
      event.preventDefault();
      const list = this.items();
      const current = this.focused ? list.findIndex((l) => l.item === this.focused) : -1;
      const next = nextIndex(list, current, move);
      this.setFocus(list[next]?.item);
      return;
    }
    const press = key === ' ' || (key === 'Enter' && !claimed(this.scene, 'enter'));
    if (press && this.focused) {
      event.preventDefault();
      if (this.focused.canFocus()) this.focused.activate();
      else this.setFocus(undefined);
    } else if (key === 'Escape') {
      this.setFocus(undefined);
    }
  }

  private setFocus(item: Focusable | undefined): void {
    this.focused?.setFocused(false);
    this.focused = item;
    item?.setFocused(true);
  }
}
