import { BaseScene } from './BaseScene';
import { findArea } from '../logic/content';
import { areaProgress, familyLevel } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData, type TaskSceneData } from '../types/scenes';
import type { TaskLevel } from '../types/task';
import { AnimalSprite } from '../ui/AnimalSprite';
import { areaBackground } from '../ui/animals';
import { Color, Stroke } from '../ui/theme';

const BOARD = { x: 660, y: 150, w: 460, h: 520 };
const TAB = { w: 140, gap: 10 };

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

    // Ruhige Tafel hinter Sternen, Themen und Stufen, damit sie vor dem Bild gut lesbar sind.
    const board = this.add.graphics();
    board.fillStyle(Color.papier, 0.94);
    board.lineStyle(Stroke.outline, Color.kontur, 1);
    board.fillRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, BOARD.h, 28);
    board.strokeRoundedRect(BOARD.x - BOARD.w / 2, BOARD.y, BOARD.w, BOARD.h, 28);
    this.addText(BOARD.x, BOARD.y + 40, this.t('area.stars', { stars: progress.stars }));

    const art = this.content.animals[area.animal];
    if (art) {
      // Antippen lässt das Tier vor Freude springen.
      const animal = new AnimalSprite(this, art.areaSpot.x, art.areaSpot.y, art, 280);
      animal.setInteractive({ useHandCursor: true }).on('pointerup', () => animal.cheer());
    }

    let levelsTop = BOARD.y + 150;
    if (area.families.length > 1) {
      const n = area.families.length;
      const rowW = n * TAB.w + (n - 1) * TAB.gap;
      area.families.forEach((f, i) => {
        const data: AreaSceneData = { areaId: area.id, family: f };
        this.addButton({
          x: BOARD.x - rowW / 2 + TAB.w / 2 + i * (TAB.w + TAB.gap),
          y: BOARD.y + 120,
          width: TAB.w,
          label: this.t(`family.${f}`),
          fontSize: 20,
          fill: f === family ? Color.sonne : Color.papier,
          onPress: () => this.scene.restart(data),
        });
      });
      levelsTop = BOARD.y + 250;
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
        y: levelsTop + i * 110,
        width: 360,
        label: open ? this.t('area.level', { level }) : this.t('area.locked', { level }),
        fill: level === unlocked ? Color.grasHell : Color.papier,
        onPress: () => this.scene.start(SceneKey.Task, data),
      }).setEnabled(open);
    });
  }
}
