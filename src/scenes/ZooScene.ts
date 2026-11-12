import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { enclosures } from '../logic/content';
import {
  awardBadges,
  babyState,
  buyBaby,
  buyDecor,
  decorState,
  type ShopState,
} from '../logic/zoo';
import { cleanNickname, NICKNAME_MAX } from '../services/save';
import type { Services } from '../services/services';
import type { Profile } from '../types/save';
import { SceneKey, type ZooSceneData, type ZooTab } from '../types/scenes';
import { Button } from '../ui/Button';
import { babyTexture, badgeTexture, decorTexture } from '../ui/rewards';
import { ShapeRow } from '../ui/math/Shapes';
import { StarCounter } from '../ui/StarCounter';
import { Color, CssColor, FontFamily, FontSize, Layout, Stroke, Tex } from '../ui/theme';

const TABS: ZooTab[] = ['babies', 'decor', 'badges', 'patterns'];
const MESSAGE_Y = 722;
const ROW_Y = [338, 574];

/**
 * Mein Zoo: Sterne gegen Baby-Tiere (mit Namen) und Dekoration für die Karte eintauschen,
 * dazu das Sticker-Album mit allen Abzeichen. Ausgeben nimmt nichts weg, was schon
 * erreicht ist: Die Sterne der Gehege und alle Abzeichen bleiben (Spezifikation, Abschnitt 8).
 */
export class ZooScene extends BaseScene<ZooSceneData> {
  private tab: ZooTab = 'babies';
  private back: 'Menu' | 'Map' = 'Menu';
  private message!: Phaser.GameObjects.Text;
  private messagePlate!: Phaser.GameObjects.Graphics;
  private dialog?: Phaser.GameObjects.Container;
  private notice?: string;

  constructor(services: Services) {
    super(SceneKey.Zoo, services);
  }

  protected override onInit(data: ZooSceneData): void {
    this.tab = data.tab ?? 'babies';
    this.back = data.back ?? 'Menu';
    this.notice = data.message;
    this.dialog = undefined;
  }

  private get profile(): Profile | undefined {
    return this.services.save.activeProfile;
  }

  create(): void {
    const profile = this.profile;
    if (!profile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    const { width } = this.scale;
    this.addBackground(Tex.menuProfile);
    this.addBackButton(() => this.scene.start(this.back === 'Map' ? SceneKey.Map : SceneKey.Menu));
    this.addTitle(this.t('zoo.title'), 62);
    new StarCounter(this, width - Layout.margin - 80, Layout.margin + 40, profile.stars);

    TABS.forEach((tab, i) => {
      this.addButton({
        x: width / 2 + (i - (TABS.length - 1) / 2) * 226,
        y: 166,
        width: 210,
        label: this.t(`zoo.tab.${tab}`),
        fill: tab === this.tab ? Color.sonne : Color.papier,
        onPress: () => this.scene.restart({ tab, back: this.back }),
      });
    });

    const board = this.add.graphics();
    board.fillStyle(Color.papier, 0.9);
    board.lineStyle(Stroke.outline, Color.kontur, 1);
    board.fillRoundedRect(32, 222, width - 64, 470, 28);
    board.strokeRoundedRect(32, 222, width - 64, 470, 28);

    this.messagePlate = this.add.graphics();
    this.message = this.add
      .text(width / 2, MESSAGE_Y, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text - 4}px`,
        color: CssColor.text,
        align: 'center',
        wordWrap: { width: width - 120 },
      })
      .setOrigin(0.5);

    if (this.tab === 'babies') this.showBabies(profile);
    else if (this.tab === 'decor') this.showDecor(profile);
    else if (this.tab === 'patterns') this.showPatterns(profile);
    else this.showBadges(profile);
    if (this.notice) this.showMessage(this.notice);
  }

  // ---------------------------------------------------------------------------

  /** Karte mit Bild, Name und Preis; der Zustand bestimmt Farbe und Schloss. */
  private card(options: {
    x: number;
    y: number;
    width: number;
    texture: string;
    size: number;
    label: string;
    state: ShopState;
    price?: number;
    /** Bild stark abgeblendet (noch nicht verdiente Sticker) */
    faded?: boolean;
    onPress: () => void;
  }): Button {
    const { state } = options;
    const button = new Button(this, {
      x: options.x,
      y: options.y,
      width: options.width,
      height: 220,
      label: options.label,
      labelBottom: true,
      fontSize: FontSize.small - 4,
      wrapWidth: options.width - 16,
      fill: state === 'owned' ? Color.grasHell : Color.papier,
      onPress: options.onPress,
    });
    const image = this.add.image(0, -22, options.texture);
    image.setScale(options.size / Math.max(image.width, image.height));
    if (options.faded || state === 'locked') image.setAlpha(0.3);
    else if (state === 'tooExpensive') image.setAlpha(0.6);
    button.add(image);
    if (state === 'locked') button.add(this.add.image(0, -22, Tex.mapLock).setScale(0.5));
    if (options.price !== undefined && state !== 'owned' && state !== 'locked') {
      const w = options.width;
      button.add(this.add.image(w / 2 - 44, -88, Tex.starFull).setScale(0.3));
      button.add(
        this.add
          .text(w / 2 - 30, -88, String(options.price), {
            fontFamily: FontFamily.text,
            fontSize: `${FontSize.small}px`,
            color: CssColor.text,
          })
          .setOrigin(0, 0.5),
      );
    }
    return button;
  }

  private showBabies(profile: Profile): void {
    const animals = enclosures(this.content).map((a) => a.animal);
    animals.forEach((animal, i) => {
      const art = this.content.animals[animal];
      if (!art) return;
      const state = babyState(this.content, profile, animal);
      const baby = profile.zoo.babies.find((b) => b.animal === animal);
      const species = this.t(`baby.${animal}`);
      this.card({
        x: this.scale.width / 2 + ((i % 4) - 1.5) * 232,
        y: ROW_Y[Math.floor(i / 4)]!,
        width: 212,
        texture: babyTexture(art),
        size: 150,
        label: baby ? baby.name : species,
        state,
        price: art.babyPrice,
        onPress: () => this.pickBaby(animal, state, art.babyPrice),
      });
    });
    this.showMessage(this.t('zoo.hint'));
  }

  private pickBaby(animal: string, state: ShopState, price: number): void {
    if (this.dialog) return;
    const species = this.t(`baby.${animal}`);
    if (state === 'owned') {
      const name = this.profile?.zoo.babies.find((b) => b.animal === animal)?.name ?? species;
      this.showMessage(`${name} · ${species}`);
    } else if (state === 'locked') {
      this.showMessage(this.t('zoo.lockedHint'));
    } else if (state === 'tooExpensive') {
      this.showMessage(this.t('zoo.needStars', { missing: price - (this.profile?.stars ?? 0) }));
    } else {
      this.askName(animal, species);
    }
  }

  private showDecor(profile: Profile): void {
    this.content.decor.forEach((d, i) => {
      const state = decorState(this.content, profile, d.id);
      this.card({
        x: this.scale.width / 2 + ((i % 6) - 2.5) * 154,
        y: ROW_Y[Math.floor(i / 6)]!,
        width: 144,
        texture: decorTexture(d.id),
        size: 110,
        label: this.t(`decor.${d.id}`),
        state,
        price: d.price,
        onPress: () => this.pickDecor(d.id, state, d.price),
      });
    });
    this.showMessage(this.t('zoo.hint'));
  }

  private pickDecor(id: string, state: ShopState, price: number): void {
    const name = this.t(`decor.${id}`);
    const profile = this.profile;
    if (!profile) return;
    if (state === 'owned') {
      this.showMessage(`${name} · ${this.t('zoo.onMap')}`);
    } else if (state === 'tooExpensive') {
      this.showMessage(this.t('zoo.needStars', { missing: price - profile.stars }));
    } else if (state === 'buyable') {
      const earned = this.save(buyDecor(this.content, profile, id));
      this.restartWith('decor', [this.t('zoo.bought', { name }), ...this.badgeLines(earned)]);
    }
  }

  /** Selbst erfundene Muster aus dem Schmetterlingshaus, neuestes oben. */
  private showPatterns(profile: Profile): void {
    const patterns = profile.zoo.patterns ?? [];
    if (patterns.length === 0) {
      this.showMessage(this.t('zoo.patterns.empty'));
      return;
    }
    patterns.forEach((p, i) => {
      new ShapeRow(this, this.scale.width / 2, 266 + i * 72, p.items, 560);
    });
  }

  private showBadges(profile: Profile): void {
    this.content.achievements.forEach((a, i) => {
      const earned = profile.badges[a.id] !== undefined;
      this.card({
        x: this.scale.width / 2 + ((i % 6) - 2.5) * 154,
        y: ROW_Y[Math.floor(i / 6)]!,
        width: 144,
        texture: badgeTexture(a.id),
        size: 118,
        label: this.t(`badge.${a.id}`),
        state: earned ? 'owned' : 'tooExpensive',
        faded: !earned,
        onPress: () =>
          this.showMessage(
            this.t(earned ? 'zoo.badgeEarned' : 'zoo.badgeOpen', {
              how: this.t(`badge.${a.id}.how`),
            }),
          ),
      });
    });
    const count = Object.keys(profile.badges).length;
    this.showMessage(`${count} / ${this.content.achievements.length}`);
  }

  // ---------------------------------------------------------------------------

  /** Speichert das Profil und verleiht dabei neue Abzeichen (z. B. für das erste Baby-Tier). */
  private save(profile: Profile): string[] {
    const date = new Date().toISOString().slice(0, 10);
    const { profile: updated, earned } = awardBadges(this.content, profile, date);
    this.services.save.updateProfile(updated);
    return earned;
  }

  private badgeLines(earned: readonly string[]): string[] {
    return earned.map((id) => this.t('roundEnd.newBadge', { name: this.t(`badge.${id}`) }));
  }

  /** Neu aufbauen (Sterne und Karten aktualisiert) und dabei eine Nachricht zeigen. */
  private restartWith(tab: ZooTab, lines: string[]): void {
    const data: ZooSceneData = { tab, back: this.back, message: lines.join(' ') };
    this.scene.restart(data);
  }

  /** Name für das Baby-Tier: Feld wie beim Profil, mit Zurück und Fertig. */
  private askName(animal: string, species: string): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const shade = this.add
      .rectangle(cx, height / 2, width, height, Color.kontur, 0.35)
      .setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(Color.papier, 1);
    panel.lineStyle(Stroke.outline, Color.kontur, 1);
    panel.fillRoundedRect(cx - 320, 190, 640, 380, 28);
    panel.strokeRoundedRect(cx - 320, 190, 640, 380, 28);
    const art = this.content.animals[animal];
    const image = art ? this.add.image(cx - 210, 330, babyTexture(art)).setScale(0.3) : undefined;
    const title = this.add
      .text(cx + 70, 250, this.t('zoo.nameTitle', { baby: species }), {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
        align: 'center',
        wordWrap: { width: 380 },
      })
      .setOrigin(0.5, 0);
    const field = this.add.dom(cx + 70, 370, 'input', {
      width: '340px',
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
    const input = field.node as HTMLInputElement;
    input.maxLength = NICKNAME_MAX;
    input.placeholder = this.t('zoo.namePlaceholder');
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('aria-label', this.t('zoo.namePlaceholder'));
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') done();
    });
    const hint = this.add
      .text(cx + 70, 430, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.small}px`,
        color: CssColor.kontur,
      })
      .setOrigin(0.5);
    const close = () => {
      this.dialog?.destroy(true);
      field.destroy();
      this.dialog = undefined;
    };
    const done = () => {
      const name = cleanNickname(input.value);
      const profile = this.profile;
      if (name === '') {
        hint.setText(this.t('zoo.nameMissing'));
        input.focus();
        return;
      }
      if (!profile) return;
      const earned = this.save(buyBaby(this.content, profile, animal, name));
      close();
      this.restartWith('babies', [this.t('zoo.welcome', { name }), ...this.badgeLines(earned)]);
    };
    const cancel = new Button(this, {
      x: cx - 110,
      y: 510,
      width: 190,
      label: this.t('zoo.cancel'),
      onPress: close,
    });
    const ok = new Button(this, {
      x: cx + 190,
      y: 510,
      width: 190,
      label: this.t('zoo.done'),
      fill: Color.grasHell,
      onPress: done,
    });
    this.dialog = this.add.container(0, 0, [
      shade,
      panel,
      ...(image ? [image] : []),
      title,
      hint,
      cancel,
      ok,
    ]);
    input.focus();
  }

  /** Kurzer Hinweis unten auf einem Schild. */
  private showMessage(text: string): void {
    this.message.setText(text);
    const w = Math.min(this.message.width + 40, this.scale.width - 80);
    const h = this.message.height + 20;
    this.messagePlate.clear();
    this.messagePlate.fillStyle(Color.papier, 0.95);
    this.messagePlate.lineStyle(Stroke.inner + 0.5, Color.kontur, 1);
    this.messagePlate.fillRoundedRect(this.scale.width / 2 - w / 2, MESSAGE_Y - h / 2, w, h, 16);
    this.messagePlate.strokeRoundedRect(this.scale.width / 2 - w / 2, MESSAGE_Y - h / 2, w, h, 16);
  }
}
