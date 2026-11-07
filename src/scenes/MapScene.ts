import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData } from '../types/scenes';

/** Zu Beginn offene Bereiche (Spezifikation, Abschnitt 5); später aus `areas.json`. */
const OPEN_AREAS = ['affenwald', 'pinguinfelsen'] as const;

export class MapScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Map, services);
  }

  create(): void {
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('map.title'));
    OPEN_AREAS.forEach((areaId, i) => {
      const data: AreaSceneData = { areaId };
      this.addButton({
        x: this.scale.width / 2,
        y: 320 + i * 130,
        width: 400,
        label: this.t(`area.${areaId}`),
        onPress: () => this.scene.start(SceneKey.Area, data),
      });
    });
  }
}
