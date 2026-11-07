import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';

export class MenuScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Menu, services);
  }

  create(): void {
    const cx = this.scale.width / 2;
    this.addTitle(this.t('app.title'), 200);
    this.addButton({
      x: cx,
      y: 400,
      width: 320,
      label: this.t('menu.play'),
      onPress: () => this.scene.start(SceneKey.Map),
    });
    this.addButton({
      x: cx,
      y: 520,
      width: 320,
      label: this.t('menu.settings'),
      onPress: () => this.scene.start(SceneKey.Settings),
    });
    this.addButton({
      x: this.scale.width - 24 - 110,
      y: this.scale.height - 24 - 48,
      width: 220,
      label: this.t('menu.parents'),
      onPress: () => this.scene.start(SceneKey.Parent),
    });
  }
}
