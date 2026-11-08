import { BaseScene } from './BaseScene';
import { findArea } from '../logic/content';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData, type TaskSceneData } from '../types/scenes';
import type { TaskLevel } from '../types/task';
import { AnimalSprite } from '../ui/AnimalSprite';
import { areaBackground } from '../ui/animals';
import { Color, Stroke } from '../ui/theme';

const BOARD = { x: 660, y: 168, w: 440, h: 460 };

/** Gehege eines Bereichs mit Hintergrund, Tier und Stufenwahl. */
export class AreaScene extends BaseScene<AreaSceneData> {
  private areaId = '';

  constructor(services: Services) {
    super(SceneKey.Area, services);
  }

  protected override onInit(data: AreaSceneData): void {
    this.areaId = data.areaId;
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    const area = findArea(this.content, this.areaId);
    if (!profile || !area?.family) {
      this.scene.start(SceneKey.Map);
      return;
    }
    const progress = areaProgress(profile, area.id);
    this.addBackground(areaBackground(area.id));
    this.addBackButton(() => this.scene.start(SceneKey.Map));
    this.addTitle(this.t(`area.${area.id}`));
    // Ruhige Tafel hinter Sternen und Stufen, damit sie vor dem Bild gut lesbar sind.
    const board = this.add.graphics();
    board.fillStyle(Color.papier, 0.94);
    board.lineStyle(Stroke.outline, Color.kontur, 1);
    board.fillRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, BOARD.h, 28);
    board.strokeRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, BOARD.h, 28);
    this.addText(BOARD.x, BOARD.y + 44, this.t('area.stars', { stars: progress.stars }));
    const art = this.content.animals[area.animal];
    if (art) {
      // Antippen lässt das Tier vor Freude springen.
      const animal = new AnimalSprite(this, art.areaSpot.x, art.areaSpot.y, art, 280);
      animal.setInteractive({ useHandCursor: true }).on('pointerup', () => animal.cheer());
    }

    const levels = Array.from(
      { length: this.content.rules.maxLevel },
      (_, i) => (i + 1) as TaskLevel,
    );
    levels.forEach((level, i) => {
      const open = level <= progress.unlockedLevel;
      const data: TaskSceneData = { areaId: area.id, level };
      this.addButton({
        x: BOARD.x,
        y: BOARD.y + 140 + i * 120,
        width: 360,
        label: open ? this.t('area.level', { level }) : this.t('area.locked', { level }),
        fill: level === progress.unlockedLevel ? Color.sonne : Color.papier,
        onPress: () => this.scene.start(SceneKey.Task, data),
      }).setEnabled(open);
    });
  }
}
