import Phaser from 'phaser';
import type { Animation, Expression } from './animals';
import type { AnimalConfig } from '../types/content';
import { reducedMotion } from './theme';

/** Fußpunkt in den Tierbildern: Standlinie y = 481 von 512 (Stilvorgabe). */
const FOOT = 481 / 512;
const FRAME = 256;
const STILL = 512;

export const animKey = (prefix: string, animation: Animation) => `${prefix}_${animation}`;

/**
 * Animiertes Tier: wippt im Ruhezustand, frisst oder freut sich bei richtigen
 * Antworten, denkt nach bei Fehlern (nie traurig). Bei reduzierter Bewegung
 * zeigt es statt Animationen kurz den passenden Ausdruck.
 */
export class AnimalSprite extends Phaser.GameObjects.Sprite {
  private readonly art: AnimalConfig;
  private readonly baseScale: number;
  private stillTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, art: AnimalConfig, height: number) {
    const idle = animKey(art.prefix, 'idle');
    super(scene, x, y, idle, `${idle}_0`);
    this.art = art;
    this.baseScale = height / FRAME;
    this.setOrigin(0.5, FOOT).setScale(this.baseScale);
    scene.add.existing(this);
    this.idle();
  }

  idle(): void {
    this.clearStill();
    this.setScale(this.baseScale);
    const key = animKey(this.art.prefix, 'idle');
    if (reducedMotion()) {
      this.stop();
      this.setTexture(key, `${key}_0`);
    } else {
      this.play(key, true);
    }
  }

  /** Freut sich (Sprung). */
  cheer(): void {
    this.playOnce('freude', 'jubelnd');
  }

  /** Bekommt Futter (Banane bzw. Fisch). */
  feed(): void {
    this.playOnce('fuetterung', 'froh');
  }

  /** Denkt nach, danach wieder Ruhe. */
  think(): void {
    this.showStill('nachdenklich', 1600);
  }

  private playOnce(animation: Animation, fallback: Expression): void {
    if (reducedMotion()) {
      this.showStill(fallback, 1200);
      return;
    }
    this.clearStill();
    this.setScale(this.baseScale);
    this.play(animKey(this.art.prefix, animation));
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.idle());
  }

  private showStill(expression: Expression, ms: number): void {
    this.clearStill();
    this.stop();
    this.setTexture(`${this.art.prefix}_${expression}`);
    this.setScale((this.baseScale * FRAME) / STILL);
    this.stillTimer = this.scene.time.delayedCall(ms, () => this.idle());
  }

  private clearStill(): void {
    this.stillTimer?.remove(false);
    this.stillTimer = undefined;
  }
}

/** Legt die Animationen aller Tiere einmal an (in der BootScene). */
export function createAnimalAnimations(scene: Phaser.Scene, arts: readonly AnimalConfig[]): void {
  for (const art of arts) {
    if (scene.anims.exists(animKey(art.prefix, 'idle'))) continue;
    const frames = (animation: Animation, sequence: number[]) =>
      sequence.map((i) => ({
        key: animKey(art.prefix, animation),
        frame: `${animKey(art.prefix, animation)}_${i}`,
      }));
    // Idle: auf und ab, am Ende einmal blinzeln, dann eine Pause.
    scene.anims.create({
      key: animKey(art.prefix, 'idle'),
      frames: frames('idle', [0, 1, 2, 3, 4, 3, 2, 1, 0, 5, 0]),
      frameRate: 8,
      repeat: -1,
      repeatDelay: 1400,
    });
    scene.anims.create({
      key: animKey(art.prefix, 'freude'),
      frames: frames('freude', [0, 1, 2, 3, 4, 5, 6, 7]),
      frameRate: 12,
    });
    scene.anims.create({
      key: animKey(art.prefix, 'fuetterung'),
      frames: frames('fuetterung', [0, 1, 2, 2, 3, 4, 5, 5, 6, 7, 7]),
      frameRate: 8,
    });
  }
}
