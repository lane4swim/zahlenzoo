import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import { SceneKey } from '../types/scenes';
import { drawAvatar } from '../ui/AvatarBadge';
import { Button } from '../ui/Button';
import { Color, CssColor, FontFamily, FontSize, Tex } from '../ui/theme';

/**
 * Erwachsenenbereich. Bisher: Profile ansehen und löschen (zweimal tippen zur Sicherheit).
 * Zugang über Rechenaufgabe, Übersicht und Export folgen in Phase 4.
 */
export class ParentScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Parent, services);
  }

  create(): void {
    this.addBackground(Tex.menuAdults);
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('parent.title'));
    this.renderProfiles();
  }

  private renderProfiles(): void {
    const { save } = this.services;
    const cx = this.scale.width / 2;
    this.addText(cx, 200, this.t('parent.profiles'));
    if (save.profiles.length === 0) this.addText(cx, 280, this.t('parent.noProfiles'));
    save.profiles.slice(0, 4).forEach((profile, i) => {
      const y = 290 + i * 112;
      drawAvatar(this, cx - 330, y, profile.avatar, this.t(`avatar.${profile.avatar}`), 26);
      this.add
        .text(
          cx - 290,
          y,
          this.t('parent.profileLine', { name: profile.nickname, stars: profile.stars }),
          {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.text}px`,
            color: CssColor.text,
          },
        )
        .setOrigin(0, 0.5);
      let armed = false;
      const button: Button = this.addButton({
        x: cx + 250,
        y,
        width: 260,
        label: this.t('common.delete'),
        onPress: () => {
          if (!armed) {
            armed = true;
            button.setLabel(this.t('common.confirmDelete')).setFill(Color.orange);
            return;
          }
          save.deleteProfile(profile.id);
          this.scene.restart();
        },
      });
    });
    this.addText(cx, this.scale.height - 70, this.t('parent.placeholder'));
  }
}
