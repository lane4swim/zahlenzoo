import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';
import { drawAvatar } from '../ui/AvatarBadge';
import { Layout, Tex } from '../ui/theme';

export class MenuScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Menu, services);
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    if (!profile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    const cx = this.scale.width / 2;
    this.addBackground(Tex.menuStart);
    // Der Titel steht auf dem Schild über dem Zoo-Eingang.
    this.addTitle(this.t('app.title'), 150);
    drawAvatar(this, cx - 160, 260, profile.avatar, this.t(`avatar.${profile.avatar}`), 30);
    this.addText(cx + 30, 260, this.t('menu.hello', { name: profile.nickname }));
    this.addButton({
      x: cx,
      y: 400,
      width: 320,
      label: this.t('menu.play'),
      onPress: () => this.scene.start(SceneKey.Map),
    });
    this.addButton({
      x: cx,
      y: 510,
      width: 320,
      label: this.t('menu.zoo'),
      onPress: () => this.scene.start(SceneKey.Zoo, { back: 'Menu' }),
    });
    this.addButton({
      x: cx,
      y: 620,
      width: 320,
      label: this.t('menu.settings'),
      onPress: () => this.scene.start(SceneKey.Settings),
    });
    this.addButton({
      x: Layout.margin + 110,
      y: this.scale.height - Layout.margin - 48,
      width: 220,
      label: this.t('menu.switchProfile'),
      onPress: () => this.scene.start(SceneKey.Profile),
    });
    this.addButton({
      x: this.scale.width - Layout.margin - 110,
      y: this.scale.height - Layout.margin - 48,
      width: 220,
      label: this.t('menu.parents'),
      onPress: () => this.scene.start(SceneKey.Parent),
    });
  }
}
