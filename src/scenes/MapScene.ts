import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import layout from '../data/map-layout.json';
import { AREAS, areaState, findArea, type AreaDef } from '../logic/areas';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import { SceneKey, type AreaSceneData } from '../types/scenes';
import { AreaMarker } from '../ui/AreaMarker';
import { AnimalIcon, Color, CssColor, FontFamily, FontSize, Stroke, Tex } from '../ui/theme';

type Point = { x: number; y: number };
const POSITIONS: Readonly<Record<string, Point>> = layout.areas;

const MESSAGE_Y = 722;

/**
 * Zoo-Karte: gezeichneter Hintergrund mit acht Gehegen. Freigeschaltete Bereiche
 * zeigen ihr Tier, das zu den Aufgaben führt; gesperrte ein Schloss. Hat ein
 * freigeschalteter Bereich noch keine Aufgaben, steht „bald“ am Namen (oder auf
 * einem Schild, solange das Tierbild fehlt).
 */
export class MapScene extends BaseScene {
  private message!: Phaser.GameObjects.Text;
  private messagePlate!: Phaser.GameObjects.Graphics;

  constructor(services: Services) {
    super(SceneKey.Map, services);
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    if (!profile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    this.add.image(0, 0, Tex.map).setOrigin(0);
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('map.title'), 62);

    const starsByArea = Object.fromEntries(
      AREAS.map((a) => [a.id, areaProgress(profile, a.id).stars]),
    );
    for (const area of AREAS) {
      const pos = POSITIONS[area.id];
      if (!pos) continue;
      this.addMarker(area, pos, areaState(area, starsByArea), starsByArea[area.id] ?? 0);
    }

    this.messagePlate = this.add.graphics();
    this.message = this.add
      .text(this.scale.width / 2, MESSAGE_Y, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text - 2}px`,
        color: CssColor.text,
        align: 'center',
      })
      .setOrigin(0.5);
    this.showMessage(this.t('map.tapAnimal'));
  }

  private addMarker(area: AreaDef, pos: Point, state: string, stars: number): void {
    const name = this.t(`area.${area.id}`);
    const icon = AnimalIcon[area.animal];
    if (state === 'open' && icon) {
      const data: AreaSceneData = { areaId: area.id };
      new AreaMarker(this, {
        ...pos,
        name,
        icon,
        stars,
        inviting: true,
        onPress: () => this.scene.start(SceneKey.Area, data),
      });
    } else if (state === 'locked') {
      const required = area.requires ? findArea(area.requires) : undefined;
      new AreaMarker(this, {
        ...pos,
        name,
        icon: Tex.mapLock,
        dimmed: true,
        onPress: () =>
          this.showMessage(
            this.t('map.lockedHint', { area: required ? this.t(`area.${required.id}`) : '' }),
          ),
      });
    } else if (icon) {
      // Freigeschaltet, aber noch ohne Aufgaben: Tier zeigen, Hinweis „bald“.
      new AreaMarker(this, {
        ...pos,
        name: `${name} · ${this.t('map.soon')}`,
        icon,
        onPress: () => this.showMessage(this.t('map.soonHint')),
      });
    } else {
      new AreaMarker(this, {
        ...pos,
        name,
        icon: Tex.mapSign,
        signText: this.t('map.soon'),
        onPress: () => this.showMessage(this.t('map.soonHint')),
      });
    }
  }

  /** Kurzer Hinweis unten auf einem Schild, damit er auf der Karte lesbar bleibt. */
  private showMessage(text: string): void {
    this.message.setText(text);
    const w = this.message.width + 40;
    const h = 52;
    this.messagePlate.clear();
    this.messagePlate.fillStyle(Color.papier, 0.95);
    this.messagePlate.lineStyle(Stroke.inner + 0.5, Color.kontur, 1);
    this.messagePlate.fillRoundedRect(this.scale.width / 2 - w / 2, MESSAGE_Y - h / 2, w, h, 16);
    this.messagePlate.strokeRoundedRect(this.scale.width / 2 - w / 2, MESSAGE_Y - h / 2, w, h, 16);
  }
}
