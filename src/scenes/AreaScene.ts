import { BaseScene } from './BaseScene';
import { findArea } from '../logic/content';
import { areaProgress, familyLevel } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData, type TaskSceneData } from '../types/scenes';
import type { TaskLevel } from '../types/task';
import { AnimalSprite } from '../ui/AnimalSprite';
import { areaBackground } from '../ui/animals';
import { babyTexture } from '../ui/rewards';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../ui/theme';

const BOARD = { x: 660, y: 150, w: 460, h: 520 };
const TAB = { w: 140, gap: 10 };
const MAX_TABS_PER_ROW = 4;
/** Höhe des Baby-Tiers neben dem großen Tier */
const BABY_HEIGHT = 130;
/** Ab dieser Länge passt ein Themenname nicht mehr einzeilig in eine Registerkarte. */
const LONG_TAB_LABEL = 12;

/**
 * Gehege eines Bereichs mit Hintergrund, Tier und Tafel. Hat der Bereich mehrere
 * Aufgabenfamilien, wählt das Kind oben das Thema; darunter die Stufen dieses Themas.
 */
export class AreaScene extends BaseScene<AreaSceneData> {
  private areaId = '';
  private family?: string;

  constructor(services: Services) {
    super(SceneKey.Area, services);
  }

  protected override onInit(data: AreaSceneData): void {
    this.areaId = data.areaId;
    this.family = data.family;
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    const area = findArea(this.content, this.areaId);
    if (!profile || !area || area.families.length === 0) {
      this.scene.start(SceneKey.Map);
      return;
    }
    const family =
      this.family && area.families.includes(this.family) ? this.family : area.families[0]!;
    const progress = areaProgress(profile, area.id);
    this.addBackground(areaBackground(area.id));
    this.addBackButton(() => this.scene.start(SceneKey.Map));
    this.addTitle(this.t(`area.${area.id}`));

    // Mehr als vier Themen stehen in zwei Reihen; die Tafel wird dann länger.
    const n = area.families.length;
    const tabRows = n > MAX_TABS_PER_ROW ? 2 : 1;
    const boardH = tabRows === 2 ? BOARD.h + 80 : BOARD.h;
    const levelStep = tabRows === 2 ? 100 : 110;

    // Ruhige Tafel hinter Sternen, Themen und Stufen, damit sie vor dem Bild gut lesbar sind.
    const board = this.add.graphics();
    board.fillStyle(Color.papier, 0.94);
    board.lineStyle(Stroke.outline, Color.kontur, 1);
    board.fillRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, boardH, 28);
    board.strokeRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, boardH, 28);
    this.addText(BOARD.x, BOARD.y + 40, this.t('area.stars', { stars: progress.stars }));

    const art = this.content.animals[area.animal];
    if (art) {
      // Antippen lässt das Tier vor Freude springen.
      const animal = new AnimalSprite(this, art.areaSpot.x, art.areaSpot.y, art, 280);
      animal.setInteractive({ useHandCursor: true }).on('pointerup', () => animal.cheer());
      // Das Baby-Tier aus dem Zoo-Laden steht mit seinem Namen neben dem großen Tier.
      const baby = profile.zoo.babies.find((b) => b.animal === area.animal);
      if (baby) this.addBaby(babyTexture(art), baby.name, art.areaSpot.x - 130, art.areaSpot.y);
    }

    let levelsTop = BOARD.y + 150;
    if (n > 1) {
      // Bis zu vier Themen in einer Reihe; Beschriftungen zweizeilig, wenn es eng wird.
      const perRow = Math.ceil(n / tabRows);
      const tabW = Math.min(TAB.w, Math.floor((BOARD.w - 24 - (perRow - 1) * TAB.gap) / perRow));
      area.families.forEach((f, i) => {
        const data: AreaSceneData = { areaId: area.id, family: f };
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, n - row * perRow);
        const rowW = inRow * tabW + (inRow - 1) * TAB.gap;
        this.addButton({
          x: BOARD.x - rowW / 2 + tabW / 2 + (i - row * perRow) * (tabW + TAB.gap),
          y: BOARD.y + 120 + row * 104,
          width: tabW,
          label: this.tabLabel(f, perRow),
          fontSize: 20,
          fill: f === family ? Color.sonne : Color.papier,
          onPress: () => this.scene.restart(data),
        });
      });
      levelsTop = BOARD.y + 250 + (tabRows - 1) * 96;
    }

    const unlocked = familyLevel(progress, family);
    const levels = Array.from(
      { length: this.content.rules.maxLevel },
      (_, i) => (i + 1) as TaskLevel,
    );
    levels.forEach((level, i) => {
      const open = level <= unlocked;
      const data: TaskSceneData = { areaId: area.id, family, level };
      this.addButton({
        x: BOARD.x,
        y: levelsTop + i * levelStep,
        width: 360,
        label: open ? this.t('area.level', { level }) : this.t('area.locked', { level }),
        fill: level === unlocked ? Color.grasHell : Color.papier,
        onPress: () => this.scene.start(SceneKey.Task, data),
      }).setEnabled(open);
    });
  }

  private addBaby(texture: string, name: string, x: number, y: number): void {
    const image = this.add.image(x, y, texture).setOrigin(0.5, 1);
    image.setScale(BABY_HEIGHT / image.height);
    image.setInteractive({ useHandCursor: true }).on('pointerup', () => {
      this.tweens.add({
        targets: image,
        y: y - 24,
        duration: 180,
        yoyo: true,
        ease: 'Sine.easeOut',
      });
    });
    const label = this.add
      .text(x, y + 6, name, {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.small - 2}px`,
        color: CssColor.text,
      })
      .setOrigin(0.5, 0);
    const plate = this.add.graphics();
    plate.fillStyle(Color.papier, 0.95);
    plate.lineStyle(Stroke.inner, Color.kontur, 1);
    const w = label.width + 20;
    plate.fillRoundedRect(x - w / 2, y + 2, w, label.height + 8, 10);
    plate.strokeRoundedRect(x - w / 2, y + 2, w, label.height + 8, 10);
    label.setDepth(1);
  }

  /** Bei vielen Themen oder langen Namen die zweizeilige Kurzform, damit nichts übersteht. */
  private tabLabel(family: string, tabs: number): string {
    const full = this.t(`family.${family}`);
    return tabs > 3 || full.length > LONG_TAB_LABEL ? this.t(`family.${family}.short`) : full;
  }
}
