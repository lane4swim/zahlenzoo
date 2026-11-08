import { BaseScene } from './BaseScene';
import { findArea } from '../logic/areas';
import { applyRoundResult, type RoundReward } from '../logic/progress';
import type { Services } from '../services/services';
import { SceneKey, type RoundEndSceneData, type TaskSceneData } from '../types/scenes';
import { AnimalSprite } from '../ui/AnimalSprite';
import { ANIMAL_ART } from '../ui/animals';
import { StarMeter } from '../ui/StarMeter';
import { Color, Tex } from '../ui/theme';

/** Rundenabschluss: Sterne, kurzer Rückblick, freigeschaltete Stufe. */
export class RoundEndScene extends BaseScene<RoundEndSceneData> {
  private result!: RoundEndSceneData;
  private reward!: RoundReward;

  constructor(services: Services) {
    super(SceneKey.RoundEnd, services);
  }

  protected override onInit(data: RoundEndSceneData): void {
    this.result = data;
    const { save } = this.services;
    const profile = save.activeProfile;
    const date = new Date().toISOString().slice(0, 10);
    if (!profile) {
      this.reward = { stars: 1, unlockedLevel: data.level, levelUnlocked: false };
      return;
    }
    const applied = applyRoundResult(profile, { ...data, date });
    save.updateProfile(applied.profile);
    this.reward = applied.reward;
  }

  create(): void {
    const cx = this.scale.width / 2;
    const { summary } = this.result;
    this.addBackground(Tex.menuRoundEnd);
    this.addTitle(this.t('roundEnd.title'), 104);
    new StarMeter(this, cx, 230, this.reward.stars);
    this.addText(
      cx,
      330,
      this.t('roundEnd.summary', { firstTry: summary.firstTry, total: summary.total }),
    );

    const lines: string[] = [];
    const { easy, practice } = this.review();
    if (easy.length > 0) lines.push(this.t('roundEnd.easy', { list: easy.join(', ') }));
    if (practice.length > 0) lines.push(this.t('roundEnd.practice', { list: practice.join(', ') }));
    if (this.reward.levelUnlocked) {
      lines.push(this.t('roundEnd.levelUnlocked', { level: this.reward.unlockedLevel }));
    }
    let y = 380;
    for (const line of lines) {
      const text = this.addText(cx, y, line).setWordWrapWidth(820).setOrigin(0.5, 0);
      y += text.height + 10;
    }

    // Das Tier freut sich über die geschaffte Runde.
    const animalId = findArea(this.result.areaId)?.animal;
    if (animalId && ANIMAL_ART[animalId]) {
      const animal = new AnimalSprite(this, 100, 744, animalId, 190);
      this.time.delayedCall(500, () => animal.cheer());
    }

    const again: TaskSceneData = { areaId: this.result.areaId, level: this.result.level };
    this.addButton({
      x: cx - 140,
      y: 640,
      width: 300,
      label: this.t('roundEnd.again'),
      onPress: () => this.scene.start(SceneKey.Task, again),
    });
    this.addButton({
      x: cx + 220,
      y: 640,
      width: 300,
      label: this.t('roundEnd.toMap'),
      fill: Color.grasHell,
      onPress: () => this.scene.start(SceneKey.Map),
    });
  }

  /** Was war leicht (immer im ersten Versuch), was üben wir wieder? */
  private review(): { easy: string[]; practice: string[] } {
    const byStrategy = new Map<string, boolean>();
    for (const { strategyId, outcome } of this.result.strategies) {
      const allFirst = byStrategy.get(strategyId) ?? true;
      byStrategy.set(strategyId, allFirst && outcome === 'first_try');
    }
    const name = (id: string) => this.t(`strategy.${id}`);
    // Höchstens drei Einträge je Zeile, damit der Rückblick kurz bleibt.
    const easy = [...byStrategy]
      .filter(([, ok]) => ok)
      .map(([id]) => name(id))
      .slice(0, 3);
    const practice = [...byStrategy]
      .filter(([, ok]) => !ok)
      .map(([id]) => name(id))
      .slice(0, 3);
    return { easy, practice };
  }
}
