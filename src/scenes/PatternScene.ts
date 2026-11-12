import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { exhibitPattern, patternPeriod } from '../logic/patterns';
import type { Services } from '../services/services';
import {
  SceneKey,
  type AreaSceneData,
  type PatternSceneData,
  type ZooSceneData,
} from '../types/scenes';
import type { ShapeColor, ShapeKind, ShapeSpec } from '../types/task';
import { taskBackground } from '../ui/animals';
import { Button } from '../ui/Button';
import { drawShape } from '../ui/math/Shapes';
import { Color, CssColor, FontFamily, FontSize, Stroke } from '../ui/theme';

const SLOTS = 10;
const SLOT = 78;
const STRIP_Y = 250;
const KINDS: ShapeKind[] = ['circle', 'square', 'rect', 'triangle'];
const COLORS: ShapeColor[] = ['red', 'blue', 'yellow', 'green'];

/**
 * Muster erfinden (freier Modus, ohne Sterne): Form und Farbe wählen, dann ein Kästchen der
 * Reihe antippen. Wiederholt sich das Muster, freut sich das Spiel darüber. „Ausstellen“
 * zeigt das Muster in „Mein Zoo“.
 */
export class PatternScene extends BaseScene<PatternSceneData> {
  private areaId = '';
  private items: Array<ShapeSpec | null> = [];
  private kind: ShapeKind = 'circle';
  private color: ShapeColor = 'red';
  private slots: Phaser.GameObjects.Graphics[] = [];
  private kindButtons: Button[] = [];
  private colorButtons: Button[] = [];
  private message!: Phaser.GameObjects.Text;
  private exhibit!: Button;

  constructor(services: Services) {
    super(SceneKey.Pattern, services);
  }

  protected override onInit(data: PatternSceneData): void {
    this.areaId = data.areaId;
    this.items = Array<ShapeSpec | null>(SLOTS).fill(null);
    this.slots = [];
    this.kindButtons = [];
    this.colorButtons = [];
  }

  create(): void {
    if (!this.services.save.activeProfile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    this.addBackground(taskBackground(this.areaId));
    const back: AreaSceneData = { areaId: this.areaId };
    this.addBackButton(() => this.scene.start(SceneKey.Area, back));
    this.addTitle(this.t('pattern.title'), 62);

    // Reihe mit zehn Kästchen
    const left = this.scale.width / 2 - ((SLOTS - 1) * (SLOT + 6)) / 2;
    for (let i = 0; i < SLOTS; i++) {
      const g = this.add.graphics({ x: left + i * (SLOT + 6), y: STRIP_Y });
      const zone = this.add
        .zone(g.x, g.y, SLOT, SLOT)
        .setInteractive({ useHandCursor: true })
        .on('pointerup', () => this.place(i));
      zone.setData('slot', i);
      this.slots.push(g);
    }

    this.message = this.add
      .text(this.scale.width / 2, STRIP_Y + 82, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
        align: 'center',
        wordWrap: { width: 860 },
      })
      .setOrigin(0.5, 0);

    // Formen und Farben
    KINDS.forEach((kind, i) => {
      const b = this.addButton({
        x: this.scale.width / 2 + (i - 1.5) * 128,
        y: 480,
        width: 112,
        height: 104,
        label: '',
        onPress: () => this.pickKind(kind),
      });
      this.kindButtons.push(b);
    });
    COLORS.forEach((color, i) => {
      const b = this.addButton({
        x: this.scale.width / 2 + (i - 1.5) * 128,
        y: 596,
        width: 112,
        height: 96,
        label: '',
        onPress: () => this.pickColor(color),
      });
      const g = this.add.graphics();
      drawShape(g, { kind: 'circle', color }, 54);
      b.add(g);
      this.colorButtons.push(b);
    });

    this.addButton({
      x: 150,
      y: 700,
      width: 220,
      label: this.t('grid.clear'),
      fontSize: FontSize.text,
      onPress: () => this.clear(),
    });
    this.exhibit = this.addButton({
      x: this.scale.width - 170,
      y: 700,
      width: 280,
      label: this.t('pattern.exhibit'),
      fontSize: FontSize.text,
      fill: Color.grasHell,
      onPress: () => this.save(),
    });
    this.refresh();
  }

  private pickKind(kind: ShapeKind): void {
    this.kind = kind;
    this.refresh();
  }

  private pickColor(color: ShapeColor): void {
    this.color = color;
    this.refresh();
  }

  /** Kästchen antippen: Form hineinlegen; dieselbe Form noch einmal antippen nimmt sie weg. */
  private place(i: number): void {
    const cur = this.items[i];
    const next: ShapeSpec = { kind: this.kind, color: this.color };
    this.items[i] = cur && cur.kind === next.kind && cur.color === next.color ? null : next;
    this.refresh();
  }

  private clear(): void {
    this.items = Array<ShapeSpec | null>(SLOTS).fill(null);
    this.refresh();
  }

  private filled(): ShapeSpec[] {
    const end = this.items.indexOf(null);
    return (end < 0 ? this.items : this.items.slice(0, end)) as ShapeSpec[];
  }

  private save(): void {
    const profile = this.services.save.activeProfile;
    const row = this.filled();
    if (!profile || row.length < 3) return;
    const date = new Date().toISOString().slice(0, 10);
    this.services.save.updateProfile(exhibitPattern(profile, row, date));
    const data: ZooSceneData = { tab: 'patterns', back: 'Map', message: this.t('pattern.saved') };
    this.scene.start(SceneKey.Zoo, data);
  }

  private refresh(): void {
    this.slots.forEach((g, i) => {
      g.clear();
      g.fillStyle(Color.papier, 0.95);
      g.lineStyle(Stroke.inner, Color.kontur, 1);
      g.fillRoundedRect(-SLOT / 2, -SLOT / 2, SLOT, SLOT, 12);
      g.strokeRoundedRect(-SLOT / 2, -SLOT / 2, SLOT, SLOT, 12);
      const spec = this.items[i];
      if (spec) drawShape(g, spec, 46);
    });
    this.kindButtons.forEach((b, i) => {
      const kind = KINDS[i]!;
      b.setFill(kind === this.kind ? Color.sonne : Color.papier);
      b.list.filter((o) => o.name === 'shape').forEach((o) => o.destroy());
      const g = this.add.graphics().setName('shape');
      drawShape(g, { kind, color: this.color }, 52);
      b.add(g);
    });
    this.colorButtons.forEach((b, i) =>
      b.setFill(COLORS[i] === this.color ? Color.sonne : Color.papier),
    );

    const row = this.filled();
    const period = patternPeriod(this.items);
    const text =
      row.length === 0
        ? this.t('pattern.start')
        : period === 1
          ? this.t('pattern.same')
          : period > 1
            ? this.t('pattern.repeat', { n: period })
            : row.length < this.items.filter(Boolean).length
              ? this.t('pattern.gap')
              : this.t('pattern.go');
    this.message.setText(text);
    this.exhibit.setEnabled(row.length >= 3);
  }
}
