import { BaseScene } from './BaseScene';
import { applyRoundResult, type RoundReward } from '../logic/progress';
import type { Services } from '../services/services';
import { SceneKey, type RoundEndSceneData, type TaskSceneData } from '../types/scenes';
import { StarMeter } from '../ui/StarMeter';
import { Color } from '../ui/theme';

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
    this.addTitle(this.t('roundEnd.title'), 90);
    new StarMeter(this, cx, 220, this.reward.stars);
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
    lines.forEach((line, i) => this.addText(cx, 390 + i * 44, line));

    const again: TaskSceneData = { areaId: this.result.areaId, level: this.result.level };
    this.addButton({
      x: cx - 180,
      y: 640,
      width: 300,
      label: this.t('roundEnd.again'),
      onPress: () => this.scene.start(SceneKey.Task, again),
    });
    this.addButton({
      x: cx + 180,
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
    const easy = [...byStrategy].filter(([, ok]) => ok).map(([id]) => name(id));
    const practice = [...byStrategy].filter(([, ok]) => !ok).map(([id]) => name(id));
    return { easy, practice };
  }
}
