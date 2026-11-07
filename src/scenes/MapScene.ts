import { BaseScene } from './BaseScene';
import { AREAS } from '../logic/areas';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData } from '../types/scenes';

/** Weltkarte; vorerst eine Liste der Startbereiche. Die gezeichnete Karte folgt in Phase 3. */
export class MapScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Map, services);
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    if (!profile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('map.title'));
    AREAS.forEach((area, i) => {
      const data: AreaSceneData = { areaId: area.id };
      const playable = area.family !== undefined;
      const stars = areaProgress(profile, area.id).stars;
      const suffix = playable ? this.t('map.stars', { stars }) : this.t('map.soon');
      this.addButton({
        x: this.scale.width / 2,
        y: 300 + i * 140,
        width: 520,
        height: 112,
        label: `${this.t(`area.${area.id}`)}  ·  ${suffix}`,
        onPress: () => this.scene.start(SceneKey.Area, data),
      }).setEnabled(playable);
    });
  }
}
