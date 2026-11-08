import { BaseScene } from './BaseScene';
import { findArea } from '../logic/areas';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData, type TaskSceneData } from '../types/scenes';
import type { TaskLevel } from '../types/task';
import { AnimalSprite } from '../ui/AnimalSprite';
import { ANIMAL_ART, areaBackground, hasAreaArt } from '../ui/animals';
import { Color, Stroke } from '../ui/theme';

const LEVELS: TaskLevel[] = [1, 2, 3];
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
    const area = findArea(this.areaId);
    if (!profile || !area?.family) {
      this.scene.start(SceneKey.Map);
      return;
    }
    const progress = areaProgress(profile, area.id);
    if (hasAreaArt(area.id)) this.add.image(0, 0, areaBackground(area.id)).setOrigin(0);
    this.addBackButton(() => this.scene.start(SceneKey.Map));
    this.addTitle(this.t(`area.${area.id}`));
    // Ruhige Tafel hinter Sternen und Stufen, damit sie vor dem Bild gut lesbar sind.
    const board = this.add.graphics();
    board.fillStyle(Color.papier, 0.94);
    board.lineStyle(Stroke.outline, Color.kontur, 1);
    board.fillRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, BOARD.h, 28);
    board.strokeRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, BOARD.h, 28);
    this.addText(BOARD.x, BOARD.y + 44, this.t('area.stars', { stars: progress.stars }));
    const art = ANIMAL_ART[area.animal];
    if (art) {
      // Antippen lässt das Tier vor Freude springen.
      const animal = new AnimalSprite(this, art.areaSpot.x, art.areaSpot.y, area.animal, 280);
      animal.setInteractive({ useHandCursor: true }).on('pointerup', () => animal.cheer());
    }

    LEVELS.forEach((level, i) => {
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
