import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData, type TaskSceneData } from '../types/scenes';

/** Gehege eines Bereichs; später mit Tier, Stufenwahl und Baumodus. */
export class AreaScene extends BaseScene<AreaSceneData> {
  private areaId = '';

  constructor(services: Services) {
    super(SceneKey.Area, services);
  }

  protected override onInit(data: AreaSceneData): void {
    this.areaId = data.areaId;
  }

  create(): void {
    this.addBackButton(() => this.scene.start(SceneKey.Map));
    this.addTitle(this.t(`area.${this.areaId}`));
    const data: TaskSceneData = { areaId: this.areaId };
    this.addButton({
      x: this.scale.width / 2,
      y: 420,
      width: 360,
      label: this.t('area.startRound'),
      onPress: () => this.scene.start(SceneKey.Task, data),
    });
  }
}
