import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey, type RoundEndSceneData, type TaskSceneData } from '../types/scenes';

/** Rundenabschluss; Sterne und Rückblick folgen in Phase 2. */
export class RoundEndScene extends BaseScene<RoundEndSceneData> {
  private result!: RoundEndSceneData;

  constructor(services: Services) {
    super(SceneKey.RoundEnd, services);
  }

  protected override onInit(data: RoundEndSceneData): void {
    this.result = data;
  }

  create(): void {
    const cx = this.scale.width / 2;
    this.addTitle(this.t('roundEnd.title'), 200);
    this.addText(cx, 300, this.t('roundEnd.summary', { total: this.result.summary.total }));
    const again: TaskSceneData = { areaId: this.result.areaId };
    this.addButton({
      x: cx - 180,
      y: 480,
      width: 300,
      label: this.t('roundEnd.again'),
      onPress: () => this.scene.start(SceneKey.Task, again),
    });
    this.addButton({
      x: cx + 180,
      y: 480,
      width: 300,
      label: this.t('roundEnd.toMap'),
      onPress: () => this.scene.start(SceneKey.Map),
    });
  }
}
