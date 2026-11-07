import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { cleanNickname, NICKNAME_MAX } from '../services/save';
import type { Services } from '../services/services';
import { AVATARS, type Avatar } from '../types/save';
import { SceneKey } from '../types/scenes';
import { drawAvatar } from '../ui/AvatarBadge';
import { Button } from '../ui/Button';
import { Color, CssColor, FontFamily, FontSize } from '../ui/theme';

/**
 * Neues Profil: Spitzname (HTML-Eingabefeld über der Leinwand, damit die
 * Bildschirmtastatur des Tablets erscheint) und eines von acht Tierbildern.
 */
export class ProfileCreateScene extends BaseScene {
  private avatar: Avatar = 'penguin';
  private readonly avatarButtons = new Map<Avatar, Button>();
  private nameField?: HTMLInputElement;
  private message!: Phaser.GameObjects.Text;

  constructor(services: Services) {
    super(SceneKey.ProfileCreate, services);
  }

  create(): void {
    const cx = this.scale.width / 2;
    this.addBackButton(() => this.scene.start(SceneKey.Profile));
    this.addTitle(this.t('profile.createTitle'), 80);

    const field = this.add.dom(cx, 180, 'input', {
      width: '420px',
      height: '64px',
      fontSize: `${FontSize.text}px`,
      fontFamily: FontFamily.text,
      color: CssColor.text,
      background: CssColor.papier,
      border: `4px solid ${CssColor.kontur}`,
      borderRadius: '16px',
      padding: '0 16px',
      boxSizing: 'border-box',
      outline: 'none',
    });
    this.nameField = field.node as HTMLInputElement;
    this.nameField.maxLength = NICKNAME_MAX;
    this.nameField.placeholder = this.t('profile.nickname');
    this.nameField.autocomplete = 'off';
    this.nameField.spellcheck = false;
    this.nameField.setAttribute('aria-label', this.t('profile.nickname'));
    this.nameField.addEventListener('keydown', (e) => e.stopPropagation());

    this.addText(cx, 268, this.t('profile.chooseAvatar'));
    AVATARS.forEach((avatar, i) => {
      const x = cx + ((i % 4) - 1.5) * 220;
      const y = 370 + Math.floor(i / 4) * 140;
      const name = this.t(`avatar.${avatar}`);
      const button = new Button(this, {
        x,
        y,
        width: 200,
        height: 124,
        label: name,
        fontSize: FontSize.small - 2,
        labelBottom: true,
        onPress: () => this.choose(avatar),
      });
      button.add(drawAvatar(this, 0, -18, avatar, name, 30));
      this.avatarButtons.set(avatar, button);
    });
    this.choose(this.avatar);

    this.message = this.add
      .text(cx, 590, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.kontur,
      })
      .setOrigin(0.5);
    this.addButton({
      x: cx,
      y: this.scale.height - 80,
      width: 260,
      label: this.t('profile.create'),
      fill: Color.grasHell,
      onPress: () => this.submit(),
    });
  }

  private choose(avatar: Avatar): void {
    this.avatar = avatar;
    for (const [a, button] of this.avatarButtons) {
      button.setFill(a === avatar ? Color.sonne : Color.papier);
    }
  }

  private submit(): void {
    const name = cleanNickname(this.nameField?.value ?? '');
    if (name === '') {
      this.message.setText(this.t('profile.missingName'));
      this.nameField?.focus();
      return;
    }
    this.services.save.addProfile(name, this.avatar);
    this.scene.start(SceneKey.Menu);
  }
}
