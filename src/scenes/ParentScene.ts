import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';

/** Erwachsenenbereich; Zugang über Rechenaufgabe und Übersicht folgen in Phase 4. */
export class ParentScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Parent, services);
  }

  create(): void {
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('parent.title'));
    this.addText(this.scale.width / 2, 360, this.t('parent.placeholder'));
  }
}
