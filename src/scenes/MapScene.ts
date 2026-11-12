import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import layout from '../data/map-layout.json';
import { areaState } from '../logic/areas';
import { findArea } from '../logic/content';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import type { AreaConfig } from '../types/content';
import {
  SceneKey,
  type AreaSceneData,
  type TaskSceneData,
  type ZooSceneData,
} from '../types/scenes';
import { isAreaDone } from '../logic/zoo';
import { AreaMarker } from '../ui/AreaMarker';
import { decorTexture } from '../ui/rewards';
import { StarCounter } from '../ui/StarCounter';
import { Color, CssColor, FontFamily, FontSize, Layout, Stroke, Tex } from '../ui/theme';

type Point = { x: number; y: number };
const POSITIONS: Readonly<Record<string, Point>> = layout.areas;

/**
 * Leiste am unteren Rand, deutlich von der Karte abgesetzt (die Namensschilder der unteren
 * Gehege enden bei etwa y = 660): links „Tagesfutter“, in der Mitte der Hinweis, rechts
 * „Wege im Zoo“. Die Knöpfe sind 96 px hoch und füllen die Leiste ganz aus.
 */
const BAR = { top: 668, y: 720, side: 140, width: 232 };
const MESSAGE_Y = BAR.y;

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
    // Gekaufte Dekoration steht an ihrem festen Platz: Der Zoo wächst sichtbar.
    for (const d of this.content.decor) {
      if (!profile.zoo.decor.includes(d.id)) continue;
      const image = this.add.image(d.x, d.y, decorTexture(d.id));
      image.setScale(d.size / Math.max(image.width, image.height));
    }
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('map.title'), 62);
    const zoo: ZooSceneData = { back: 'Map' };
    this.addButton({
      x: this.scale.width - Layout.margin - 95,
      y: Layout.margin + Layout.minTouch / 2,
      width: 190,
      label: this.t('map.zoo'),
      fill: Color.sonne,
      onPress: () => this.scene.start(SceneKey.Zoo, zoo),
    });
    new StarCounter(
      this,
      this.scale.width - Layout.margin - 270,
      Layout.margin + 48,
      profile.stars,
    );

    const starsByArea = Object.fromEntries(
      this.content.areas.map((a) => [a.id, areaProgress(profile, a.id).stars]),
    );
    for (const area of this.content.areas) {
      if (area.extra) continue;
      const pos = POSITIONS[area.id];
      if (!pos) continue;
      const state = areaState(area, starsByArea, this.content.rules);
      const done = isAreaDone(area, profile.areas[area.id]);
      this.addMarker(area, pos, state, starsByArea[area.id] ?? 0, done);
    }

    // Untere Leiste: hell hinterlegt, damit Knöpfe und Hinweis nicht in die Gehege laufen
    const bar = this.add.graphics();
    bar.fillStyle(Color.papier, 0.88);
    bar.fillRect(0, BAR.top, this.scale.width, this.scale.height - BAR.top);
    bar.lineStyle(Stroke.inner, Color.kontur, 0.6);
    bar.lineBetween(0, BAR.top, this.scale.width, BAR.top);

    // Wege im Zoo: Lage und Wege auf dem Zooplan (Zusatzbereich ohne Gehege auf der Karte)
    const tour = this.content.areas.find((a) => a.extra && a.families.length > 0);
    if (tour) {
      const data: AreaSceneData = { areaId: tour.id };
      this.addButton({
        x: this.scale.width - BAR.side,
        y: BAR.y,
        width: BAR.width,
        label: this.t(`area.${tour.id}`),
        fontSize: FontSize.small,
        fill: Color.sonne,
        onPress: () => this.scene.start(SceneKey.Area, data),
      });
    }

    // Tagesfutter: je ein Aufgabe aus den Themen, die Übung brauchen (Spezifikation 7)
    if (tour) {
      const today = new Date().toISOString().slice(0, 10);
      const fed = profile.dailyDone === today;
      const daily: TaskSceneData = { areaId: tour.id, family: 'daily', level: 1, daily: true };
      this.addButton({
        x: BAR.side,
        y: BAR.y,
        width: BAR.width,
        label: this.t(fed ? 'map.dailyDone' : 'map.daily'),
        fontSize: FontSize.small,
        fill: fed ? Color.papier : Color.grasHell,
        onPress: () => this.scene.start(SceneKey.Task, daily),
      });
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

  private addMarker(
    area: AreaConfig,
    pos: Point,
    state: string,
    stars: number,
    done: boolean,
  ): void {
    const name = this.t(`area.${area.id}`);
    const icon = this.content.animals[area.animal]?.icon;
    if (state === 'open' && icon) {
      const data: AreaSceneData = { areaId: area.id };
      new AreaMarker(this, {
        ...pos,
        name,
        icon,
        stars,
        inviting: true,
        done,
        onPress: () => this.scene.start(SceneKey.Area, data),
      });
    } else if (state === 'locked') {
      const required = area.requires ? findArea(this.content, area.requires) : undefined;
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
