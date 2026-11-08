import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';
import { drawAvatar } from '../ui/AvatarBadge';
import { Button } from '../ui/Button';
import { Tex } from '../ui/theme';

const COLS = 3;

/** Profilauswahl: ein Profil pro Kind mit Spitzname und Tierbild. */
export class ProfileScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Profile, services);
  }

  create(): void {
    const { save } = this.services;
    this.addBackground(Tex.menuProfile);
    this.addTitle(this.t('profile.title'), 110);
    const profiles = save.profiles.slice(0, 9);
    profiles.forEach((profile, i) => {
      const x = this.scale.width / 2 + ((i % COLS) - 1) * 310;
      const y = 230 + Math.floor(i / COLS) * 130;
      const button = new Button(this, {
        x,
        y,
        width: 290,
        height: 110,
        label: `      ${profile.nickname}`,
        onPress: () => {
          save.selectProfile(profile.id);
          this.scene.start(SceneKey.Menu);
        },
      });
      button.add(
        drawAvatar(this, -100, -4, profile.avatar, this.t(`avatar.${profile.avatar}`), 32),
      );
    });
    this.addButton({
      x: this.scale.width / 2,
      y: this.scale.height - 90,
      width: 320,
      label: this.t('profile.new'),
      onPress: () => this.scene.start(SceneKey.ProfileCreate),
    });
  }
}
