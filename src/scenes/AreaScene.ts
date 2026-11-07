import { BaseScene } from './BaseScene';
import { findArea } from '../logic/areas';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData, type TaskSceneData } from '../types/scenes';
import type { TaskLevel } from '../types/task';
import { Penguin } from '../ui/Penguin';
import { Color } from '../ui/theme';

const LEVELS: TaskLevel[] = [1, 2, 3];

/** Gehege eines Bereichs mit Tier und Stufenwahl. */
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
    this.addBackButton(() => this.scene.start(SceneKey.Map));
    this.addTitle(this.t(`area.${area.id}`));
    this.addText(this.scale.width / 2, 190, this.t('area.stars', { stars: progress.stars }));
    new Penguin(this, 200, 620);

    LEVELS.forEach((level, i) => {
      const open = level <= progress.unlockedLevel;
      const data: TaskSceneData = { areaId: area.id, level };
      this.addButton({
        x: 640,
        y: 300 + i * 120,
        width: 360,
        label: open ? this.t('area.level', { level }) : this.t('area.locked', { level }),
        fill: level === progress.unlockedLevel ? Color.sonne : Color.papier,
        onPress: () => this.scene.start(SceneKey.Task, data),
      }).setEnabled(open);
    });
  }
}
