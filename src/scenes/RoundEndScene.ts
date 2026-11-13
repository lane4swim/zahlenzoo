import { BaseScene } from './BaseScene';
import { findArea } from '../logic/content';
import {
  applyDailyResult,
  applyRoundResult,
  firstTryStreak,
  type RoundReward,
} from '../logic/progress';
import { formatTime } from '../logic/skills';
import { awardBadges } from '../logic/zoo';
import type { Services } from '../services/services';
import { SceneKey, type RoundEndSceneData, type TaskSceneData } from '../types/scenes';
import { AnimalSprite } from '../ui/AnimalSprite';
import { StarMeter } from '../ui/StarMeter';
import { badgeTexture } from '../ui/rewards';
import { Color, CssColor, FontFamily, FontSize, reducedMotion, Tex } from '../ui/theme';

/** Rundenabschluss: Sterne, kurzer Rückblick, freigeschaltete Stufe. */
export class RoundEndScene extends BaseScene<RoundEndSceneData> {
  private result!: RoundEndSceneData;
  private reward!: RoundReward;
  /** in dieser Runde neu verdiente Abzeichen */
  private badges: string[] = [];

  constructor(services: Services) {
    super(SceneKey.RoundEnd, services);
  }

  protected override onInit(data: RoundEndSceneData): void {
    this.result = data;
    const { save } = this.services;
    const profile = save.activeProfile;
    const date = new Date().toISOString().slice(0, 10);
    this.badges = [];
    if (!profile) {
      this.reward = {
        stars: 1,
        unlockedLevel: data.level,
        levelUnlocked: false,
        skillLevel: data.level,
      };
      return;
    }
    let after: typeof profile;
    if (data.daily) {
      const applied = applyDailyResult(
        profile,
        { items: data.daily, summary: data.summary, date },
        this.content.rules,
      );
      after = applied.profile;
      this.reward = {
        stars: applied.stars,
        unlockedLevel: data.level,
        levelUnlocked: false,
        skillLevel: data.level,
      };
    } else {
      const applied = applyRoundResult(
        profile,
        {
          ...data,
          date,
          ...(data.errors ? { errors: data.errors } : {}),
          ...(data.times ? { times: data.times } : {}),
          ...(data.tempoMs !== undefined ? { tempoMs: data.tempoMs } : {}),
        },
        this.content.rules,
      );
      after = applied.profile;
      this.reward = applied.reward;
    }
    const awarded = awardBadges(this.content, after, date, {
      stars: this.reward.stars,
      streak: firstTryStreak(data.outcomes),
    });
    save.updateProfile(awarded.profile);
    this.badges = awarded.earned;
  }

  create(): void {
    const cx = this.scale.width / 2;
    const { summary } = this.result;
    this.addBackground(Tex.menuRoundEnd);
    this.addTitle(this.t(this.result.daily ? 'roundEnd.dailyTitle' : 'roundEnd.title'), 104);
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
    // Kompetenzmodell: Stufenwechsel freundlich ankündigen (Spezifikation 7)
    if (this.reward.skillChange === 'up' && !this.reward.levelUnlocked) {
      lines.push(this.t('roundEnd.skillUp', { level: this.reward.skillLevel }));
    } else if (this.reward.skillChange === 'down') {
      lines.push(this.t('roundEnd.skillDown', { level: this.reward.skillLevel }));
    }
    if (this.result.tempoMs !== undefined) {
      const time = formatTime(this.result.tempoMs);
      lines.push(
        this.t(this.reward.tempoRecord ? 'roundEnd.tempoRecord' : 'roundEnd.tempo', { time }),
      );
    }
    let y = 380;
    for (const line of lines) {
      const text = this.addText(cx, y, line).setWordWrapWidth(820).setOrigin(0.5, 0);
      y += text.height + 10;
    }
    if (this.badges.length > 0) this.showBadges(cx + 70, Math.min(Math.max(y + 46, 540), 560));

    // Das Tier freut sich über die geschaffte Runde.
    const animalId = findArea(this.content, this.result.areaId)?.animal;
    const art = animalId ? this.content.animals[animalId] : undefined;
    if (art) {
      const animal = new AnimalSprite(this, 100, 744, art, 190);
      this.time.delayedCall(500, () => animal.cheer());
    }

    const { areaId, family, level } = this.result;
    const again: TaskSceneData = {
      areaId,
      family,
      level,
      ...(this.result.tempoMs !== undefined ? { tempo: true } : {}),
    };
    const buttons: Array<{ label: string; data?: TaskSceneData; primary?: boolean }> = [
      ...(this.result.daily ? [] : [{ label: this.t('roundEnd.again'), data: again }]),
    ];
    // Neue Stufe freigeschaltet: direkt weiterspielen, ohne Umweg über Karte und Gehege.
    if (this.reward.levelUnlocked && !this.result.daily) {
      const next = this.reward.unlockedLevel;
      buttons.push({
        label: this.t('roundEnd.playLevel', { level: next }),
        data: { areaId, family, level: next },
        primary: true,
      });
    }
    buttons.push({ label: this.t('roundEnd.toMap'), primary: !this.reward.levelUnlocked });

    // Knöpfe rechts neben dem Tier verteilen.
    const width = buttons.length === 3 ? 250 : 300;
    const gap = buttons.length === 3 ? 24 : 60;
    const total = buttons.length * width + (buttons.length - 1) * gap;
    const left = cx + 70 - total / 2;
    buttons.forEach((b, i) => {
      this.addButton({
        x: left + width / 2 + i * (width + gap),
        y: 640,
        width,
        label: b.label,
        fill: b.primary ? Color.grasHell : Color.papier,
        onPress: () =>
          b.data ? this.scene.start(SceneKey.Task, b.data) : this.scene.start(SceneKey.Map),
      });
    });
  }

  /** Neue Sticker: Bilder nebeneinander, dahinter die Namen. */
  private showBadges(cx: number, y: number): void {
    const names = this.badges.map((id) => this.t(`badge.${id}`));
    const label = this.add
      .text(
        0,
        y,
        this.t(names.length === 1 ? 'roundEnd.newBadge' : 'roundEnd.newBadges', {
          name: names[0] ?? '',
        }) + (names.length > 1 ? ` ${names.join(', ')}` : ''),
        {
          fontFamily: FontFamily.text,
          fontSize: `${FontSize.text}px`,
          color: CssColor.text,
          wordWrap: { width: 620 },
        },
      )
      .setOrigin(0, 0.5);
    // Umgebrochene Zeilen (größere Schrift) dürfen nicht unter die Knöpfe (Oberkante 592) rutschen.
    y = Math.min(y, 584 - Math.max(label.height, 84) / 2);
    label.y = y;
    const size = 84;
    const shown = this.badges.slice(0, 4);
    const total = shown.length * (size + 8) + 12 + label.width;
    let x = cx - total / 2;
    for (const id of shown) {
      const image = this.add.image(x + size / 2, y, badgeTexture(id));
      image.setScale(size / image.width);
      if (!reducedMotion()) {
        const scale = image.scale;
        image.setScale(0);
        this.tweens.add({ targets: image, scale, duration: 400, ease: 'Back.easeOut', delay: 600 });
      }
      x += size + 8;
    }
    label.x = x + 4;
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
