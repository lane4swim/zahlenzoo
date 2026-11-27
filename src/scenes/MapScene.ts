import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import layout from '../data/map-layout.json';
import {
  areaMap,
  areaStates,
  defaultMap,
  lockReason,
  mapStars,
  profileGrade,
} from '../logic/areas';
import { findArea } from '../logic/content';
import { areaProgress } from '../services/save';
import type { Services } from '../services/services';
import type { AreaConfig, MapId } from '../types/content';
import type { Profile } from '../types/save';
import {
  SceneKey,
  type AreaSceneData,
  type MapSceneData,
  type TaskSceneData,
  type ZooSceneData,
} from '../types/scenes';
import { isAreaDone } from '../logic/zoo';
import { announce } from '../ui/a11y';
import { AreaMarker } from '../ui/AreaMarker';
import { decorTexture } from '../ui/rewards';
import { StarCounter } from '../ui/StarCounter';
import { Color, CssColor, FontFamily, FontSize, Stroke, Tex } from '../ui/theme';

type Point = { x: number; y: number };
type MapLayout = { areas: Readonly<Record<string, Point>>; signpost: Point };
/** Lage der Gehege und des Wegweisers je Karte (map-layout.json) */
const LAYOUTS: Readonly<Record<MapId, MapLayout>> = {
  zoo: { areas: layout.areas, signpost: layout.signpost },
  streichelzoo: layout.streichelzoo,
};
/** Hintergrund je Karte */
const BACKGROUND: Readonly<Record<MapId, string>> = {
  zoo: Tex.map,
  streichelzoo: Tex.pettingMap,
};
/** Registry-Schlüssel: zuletzt gezeigte Karte (für „Zurück zur Karte“ ohne Angabe) */
const LAST_MAP = 'map.last';

/**
 * Bedienelemente der Karte (Mitte, Breite, Höhe) und die untere Leiste stehen in
 * map-layout.json. Ein Test prüft damit, dass keine Dekoration darunter verschwindet.
 */
const UI = layout.ui;
const BAR_TOP = layout.bar.top;

/**
 * Zoo-Karte: der große Zoo (Klasse 2) oder der Streichelzoo (Klasse 1), verbunden über
 * einen Wegweiser auf dem Hauptweg. Freigeschaltete Gehege zeigen ihr Tier, das zu den
 * Aufgaben führt; gesperrte ein Schloss. Hat ein freigeschaltetes Gehege noch keine
 * Aufgaben, steht „bald“ am Namen (oder auf einem Schild, solange das Tierbild fehlt).
 */
export class MapScene extends BaseScene<MapSceneData> {
  private message!: Phaser.GameObjects.Text;
  private messagePlate!: Phaser.GameObjects.Graphics;
  private requested?: MapId;

  constructor(services: Services) {
    super(SceneKey.Map, services);
  }

  protected override onInit(data: MapSceneData): void {
    this.requested = data.map;
  }

  /** Karte dieser Szene: angefragt, sonst die zuletzt gezeigte, sonst die der Klasse. */
  private mapFor(profile: Profile): MapId {
    const last = this.registry.get(LAST_MAP) as MapId | undefined;
    return this.requested ?? last ?? defaultMap(profileGrade(profile));
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    if (!profile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    const mapId = this.mapFor(profile);
    this.registry.set(LAST_MAP, mapId);
    const mapLayout = LAYOUTS[mapId];
    this.addBackground(BACKGROUND[mapId]);
    // Untere Leiste: hell hinterlegt, damit Knöpfe und Hinweis nicht in die Gehege laufen.
    // Sie liegt unter der Dekoration, damit Brunnen und Ententeich auf ihr sichtbar bleiben.
    const bar = this.add.graphics();
    bar.fillStyle(Color.papier, 0.88);
    bar.fillRect(0, BAR_TOP, this.scale.width, this.scale.height - BAR_TOP);
    bar.lineStyle(Stroke.inner, Color.kontur, 0.6);
    bar.lineBetween(0, BAR_TOP, this.scale.width, BAR_TOP);
    // Gekaufte Dekoration steht an ihrem festen Platz: Der Zoo wächst sichtbar.
    // Die Dekoration steht im großen Zoo.
    for (const d of mapId === 'zoo' ? this.content.decor : []) {
      if (!profile.zoo.decor.includes(d.id)) continue;
      const image = this.add.image(d.x, d.y, decorTexture(d.id));
      image.setScale(d.size / Math.max(image.width, image.height));
    }
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t(mapId === 'zoo' ? 'map.title' : `area.${mapId}`), 62);
    const zoo: ZooSceneData = { back: 'Map' };
    this.addButton({
      x: UI.zoo.x,
      y: UI.zoo.y,
      width: UI.zoo.w,
      label: this.t('map.zoo'),
      fill: Color.sonne,
      onPress: () => this.scene.start(SceneKey.Zoo, zoo),
    });
    new StarCounter(this, UI.stars.x, UI.stars.y, profile.stars);

    const starsByArea = Object.fromEntries(
      this.content.areas.map((a) => [a.id, areaProgress(profile, a.id).stars]),
    );
    const grade = profileGrade(profile);
    const petting = mapStars(this.content.areas, starsByArea, 'streichelzoo');
    const states = areaStates(this.content, profile);
    for (const area of this.content.areas) {
      if (area.extra || areaMap(area) !== mapId) continue;
      const pos = mapLayout.areas[area.id];
      if (!pos) continue;
      const done = isAreaDone(area, profile.areas[area.id]);
      const reason = lockReason(area, grade, petting, this.content.rules);
      this.addMarker(area, pos, states[area.id]!, starsByArea[area.id] ?? 0, done, reason);
    }

    // Wegweiser zur anderen Karte (Klasse 1 beginnt im Streichelzoo, Klasse 2 im großen Zoo)
    const other: MapId = mapId === 'zoo' ? 'streichelzoo' : 'zoo';
    const target: MapSceneData = { map: other };
    new AreaMarker(this, {
      ...mapLayout.signpost,
      name: this.t(`map.to.${other}`),
      icon: Tex.signpost,
      compact: true,
      inviting: true,
      onPress: () => this.scene.start(SceneKey.Map, target),
    });

    // Wege im Zoo: Lage und Wege auf dem Zooplan (Zusatzbereich ohne Gehege auf der Karte)
    const tour = this.content.areas.find((a) => a.extra && a.families.length > 0);
    if (tour && mapId === 'zoo') {
      const data: AreaSceneData = { areaId: tour.id };
      this.addButton({
        x: UI.tour.x,
        y: UI.tour.y,
        width: UI.tour.w,
        label: this.t(`area.${tour.id}`),
        fontSize: FontSize.small,
        fill: Color.sonne,
        onPress: () => this.scene.start(SceneKey.Area, data),
      });
    }

    // Tagesfutter: je ein Aufgabe aus den Themen, die Übung brauchen (Spezifikation 7).
    // Im Streichelzoo findet es auf der ersten offenen Wiese statt.
    const host =
      mapId === 'zoo'
        ? tour
        : this.content.areas.find((a) => areaMap(a) === mapId && states[a.id] === 'open');
    if (host) {
      const today = new Date().toISOString().slice(0, 10);
      const fed = profile.dailyDone === today;
      const daily: TaskSceneData = { areaId: host.id, family: 'daily', level: 1, daily: true };
      this.addButton({
        x: UI.daily.x,
        y: UI.daily.y,
        width: UI.daily.w,
        label: this.t(fed ? 'map.dailyDone' : 'map.daily'),
        fontSize: FontSize.small,
        fill: fed ? Color.papier : Color.grasHell,
        onPress: () => this.scene.start(SceneKey.Task, daily),
      });
    }

    this.messagePlate = this.add.graphics();
    this.message = this.add
      .text(UI.message.x, UI.message.y, '', {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.small}px`,
        color: CssColor.text,
        align: 'center',
        wordWrap: { width: UI.message.w - 40 },
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
    reason: ReturnType<typeof lockReason>,
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
      const required =
        reason && 'requires' in reason ? findArea(this.content, reason.requires) : undefined;
      const hint =
        reason && 'bridge' in reason
          ? this.t('map.lockedBridge', { stars: reason.bridge })
          : this.t('map.lockedHint', { area: required ? this.t(`area.${required.id}`) : '' });
      new AreaMarker(this, {
        ...pos,
        name,
        icon: Tex.mapLock,
        dimmed: true,
        onPress: () => this.showMessage(hint),
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
    announce(text);
    this.message.setText(text);
    const w = this.message.width + 40;
    const h = Math.max(52, this.message.height + 10);
    this.messagePlate.clear();
    this.messagePlate.fillStyle(Color.papier, 0.95);
    this.messagePlate.lineStyle(Stroke.inner + 0.5, Color.kontur, 1);
    this.messagePlate.fillRoundedRect(UI.message.x - w / 2, UI.message.y - h / 2, w, h, 16);
    this.messagePlate.strokeRoundedRect(UI.message.x - w / 2, UI.message.y - h / 2, w, h, 16);
  }
}
