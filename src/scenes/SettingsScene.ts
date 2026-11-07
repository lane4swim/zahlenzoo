import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';

/** Einstellungen (Lautstärke, Vorlesen, große Schrift ...) folgen in Phase 4. */
export class SettingsScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Settings, services);
  }

  create(): void {
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('settings.title'));
    this.addText(this.scale.width / 2, 360, this.t('settings.placeholder'));
  }
}
