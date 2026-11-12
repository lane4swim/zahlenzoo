import { BaseScene } from './BaseScene';
import { familyOverview, parentGate } from '../logic/parent';
import { createRng } from '../logic/rng';
import type { Services } from '../services/services';
import type { Profile, Settings } from '../types/save';
import { SceneKey } from '../types/scenes';
import { drawAvatar } from '../ui/AvatarBadge';
import { Button } from '../ui/Button';
import { Numpad } from '../ui/Numpad';
import { Color, CssColor, FontFamily, FontSize, Stroke, Tex } from '../ui/theme';

type Tab = 'overview' | 'settings' | 'data';
type ParentSceneData = { tab?: Tab; profileId?: string; page?: number; message?: string };

const TABS: Tab[] = ['overview', 'settings', 'data'];
const ROWS_PER_PAGE = 7;
/** Der Zugang gilt, bis die Seite neu geladen wird. */
const GATE_KEY = 'parentGatePassed';
const ASK: NonNullable<Settings['strategyAsk']>[] = ['off', 'sometimes', 'often'];

/**
 * Erwachsenenbereich (Spezifikation 7 und 10): Zugang über eine Rechenaufgabe; Übersicht je
 * Profil und Thema (Stufe, Sicherheit, häufigste Fehlerart); Einstellungen; Export und Import
 * des Spielstands als Datei; Profile und alle lokalen Daten löschen.
 */
export class ParentScene extends BaseScene<ParentSceneData> {
  private tab: Tab = 'overview';
  private profileId?: string;
  private page = 0;
  private notice?: string;

  constructor(services: Services) {
    super(SceneKey.Parent, services);
  }

  protected override onInit(data: ParentSceneData): void {
    this.tab = data.tab ?? 'overview';
    this.profileId = data.profileId;
    this.page = data.page ?? 0;
    this.notice = data.message;
  }

  create(): void {
    this.addBackground(Tex.menuAdults);
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('parent.title'), 62);
    if (this.registry.get(GATE_KEY) !== true) {
      this.showGate();
      return;
    }
    this.board();
    TABS.forEach((tab, i) => {
      this.addButton({
        x: this.scale.width / 2 + (i - 1) * 240,
        y: 160,
        width: 220,
        label: this.t(`parent.tab.${tab}`),
        fontSize: FontSize.small,
        fill: tab === this.tab ? Color.sonne : Color.papier,
        onPress: () => this.go({ tab }),
      });
    });
    if (this.tab === 'overview') this.showOverview();
    else if (this.tab === 'settings') this.showSettings();
    else this.showData();
    if (this.notice) this.small(this.scale.width / 2, 722, this.notice, 860).setOrigin(0.5);
  }

  private go(data: ParentSceneData): void {
    this.scene.restart({
      tab: this.tab,
      page: 0,
      ...(this.profileId ? { profileId: this.profileId } : {}),
      ...data,
    });
  }

  private board(): void {
    const g = this.add.graphics();
    g.fillStyle(Color.papier, 0.94);
    g.lineStyle(Stroke.outline, Color.kontur, 1);
    g.fillRoundedRect(28, 214, this.scale.width - 56, 480, 24);
    g.strokeRoundedRect(28, 214, this.scale.width - 56, 480, 24);
  }

  private small(x: number, y: number, text: string, wrap?: number, size = 20) {
    return this.add.text(x, y, text, {
      fontFamily: FontFamily.text,
      fontSize: `${size}px`,
      color: CssColor.text,
      ...(wrap ? { wordWrap: { width: wrap } } : {}),
    });
  }

  // -------------------------------------------------------------------------
  // Zugang

  private showGate(): void {
    const cx = this.scale.width / 2;
    const gate = parentGate(createRng(Date.now() >>> 0));
    this.addText(cx, 200, this.t('parent.gate', { a: gate.a, b: gate.b }));
    const box = this.addText(cx, 290, '?');
    const pad = new Numpad(this, {
      x: cx,
      y: 560,
      okLabel: this.t('common.ok'),
      maxDigits: 3,
      onChange: (value) => box.setText(value || '?'),
      onSubmit: (value) => {
        if (Number(value) === gate.answer) {
          this.registry.set(GATE_KEY, true);
          this.scene.restart({});
        } else {
          pad.clear();
          box.setText('?');
          this.scene.restart({ message: this.t('parent.gateWrong') });
        }
      },
    });
    if (this.notice) this.addText(cx, 370, this.notice);
  }

  // -------------------------------------------------------------------------
  // Profilwahl

  private selectedProfile(): Profile | undefined {
    const { save } = this.services;
    return (
      save.profiles.find((p) => p.id === this.profileId) ?? save.activeProfile ?? save.profiles[0]
    );
  }

  private profileChooser(y: number): Profile | undefined {
    const profiles = this.services.save.profiles.slice(0, 4);
    const selected = this.selectedProfile();
    profiles.forEach((p, i) => {
      this.addButton({
        x: this.scale.width / 2 + (i - (profiles.length - 1) / 2) * 230,
        y,
        width: 210,
        height: 64,
        label: p.nickname,
        fontSize: FontSize.small,
        fill: p.id === selected?.id ? Color.grasHell : Color.papier,
        onPress: () => this.go({ profileId: p.id }),
      });
    });
    return selected;
  }

  // -------------------------------------------------------------------------
  // Übersicht

  private showOverview(): void {
    const profile = this.profileChooser(262);
    if (!profile) {
      this.addText(this.scale.width / 2, 400, this.t('parent.noProfiles'));
      return;
    }
    // Nur Themen, die es im Spiel gibt (alte Spielstände können andere enthalten)
    const rows = familyOverview(profile).filter((r) => this.content.families[r.family]);
    if (rows.length === 0) {
      this.addText(this.scale.width / 2, 420, this.t('parent.noRounds'));
      return;
    }
    const cols = { name: 56, level: 400, conf: 490, error: 680 };
    const headY = 316;
    this.small(cols.name, headY, this.t('parent.col.family'), undefined, 20).setFontStyle('bold');
    this.small(cols.level, headY, this.t('parent.col.level'), undefined, 20).setFontStyle('bold');
    this.small(cols.conf, headY, this.t('parent.col.confidence'), undefined, 20).setFontStyle(
      'bold',
    );
    this.small(cols.error, headY, this.t('parent.col.error'), undefined, 20).setFontStyle('bold');
    const pages = Math.ceil(rows.length / ROWS_PER_PAGE);
    const page = Math.min(this.page, pages - 1);
    const g = this.add.graphics();
    rows.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE).forEach((row, i) => {
      const y = 356 + i * 46;
      g.lineStyle(1, Color.kontur, 0.2);
      g.lineBetween(48, y - 8, this.scale.width - 48, y - 8);
      this.small(
        cols.name,
        y,
        this.t(`family.${row.family}`) + (row.support ? ` ${this.t('parent.support')}` : ''),
        330,
      );
      this.small(cols.level, y, String(row.level));
      // Balken für die Sicherheit
      const c = row.confidence;
      g.fillStyle(Color.grauWarm, 0.5);
      g.fillRoundedRect(cols.conf, y + 4, 120, 16, 6);
      if (c !== undefined) {
        g.fillStyle(c >= 0.85 ? Color.gras : c >= 0.5 ? Color.sonne : Color.orange, 1);
        g.fillRoundedRect(cols.conf, y + 4, Math.max(8, 120 * c), 16, 6);
      }
      this.small(cols.conf + 130, y, c === undefined ? '–' : `${Math.round(c * 100)} %`);
      const err = row.topError ? this.errorName(row.topError) : '–';
      this.small(cols.error, y - 4, err, 300, 16);
    });
    if (pages > 1) {
      this.small(
        this.scale.width / 2,
        676,
        this.t('parent.page', { page: page + 1, pages }),
      ).setOrigin(0.5);
      if (page > 0) {
        this.pageButton(this.scale.width / 2 - 200, this.t('parent.prev'), page - 1);
      }
      if (page < pages - 1) {
        this.pageButton(this.scale.width / 2 + 200, this.t('parent.next'), page + 1);
      }
    }
  }

  private pageButton(x: number, label: string, page: number): void {
    this.addButton({
      x,
      y: 664,
      width: 160,
      height: 56,
      label,
      fontSize: 20,
      onPress: () => this.go({ page }),
    });
  }

  /** Fehlerart als die Rückmeldung an das Kind (gekürzt, damit sie in zwei Zeilen passt). */
  private errorName(tag: string): string {
    const key = `error.${tag}`;
    if (!this.services.i18n.has(key)) return tag;
    const text = this.t(key);
    return text.length > 80 ? `${text.slice(0, 78)}…` : text;
  }

  // -------------------------------------------------------------------------
  // Einstellungen

  private showSettings(): void {
    const profile = this.profileChooser(262);
    if (!profile) {
      this.addText(this.scale.width / 2, 400, this.t('parent.noProfiles'));
      return;
    }
    const cx = this.scale.width / 2;
    this.addText(cx, 360, this.t('parent.strategyAsk'));
    const current = profile.settings.strategyAsk ?? 'sometimes';
    ASK.forEach((value, i) => {
      this.addButton({
        x: cx + (i - 1) * 240,
        y: 450,
        width: 220,
        label: this.t(`parent.ask.${value}`),
        fontSize: FontSize.small,
        fill: value === current ? Color.grasHell : Color.papier,
        onPress: () => {
          this.services.save.updateProfile({
            ...profile,
            settings: { ...profile.settings, strategyAsk: value },
          });
          this.go({});
        },
      });
    });
    this.small(cx, 540, this.t('parent.strategyAskHelp'), 820).setOrigin(0.5, 0).setAlign('center');
  }

  // -------------------------------------------------------------------------
  // Daten

  private showData(): void {
    const cx = this.scale.width / 2;
    const { save } = this.services;
    this.addButton({
      x: cx - 220,
      y: 280,
      width: 400,
      label: this.t('parent.export'),
      fontSize: FontSize.small,
      onPress: () => this.exportFile(),
    });
    this.addButton({
      x: cx + 220,
      y: 280,
      width: 400,
      label: this.t('parent.import'),
      fontSize: FontSize.small,
      onPress: () => this.importFile(),
    });
    this.small(60, 350, this.t('parent.profiles'), undefined, 22);
    save.profiles.slice(0, 4).forEach((profile, i) => {
      // zwei Spalten, damit die Löschen-Knöpfe (mindestens 96 px hoch) Platz haben
      const x = 60 + (i % 2) * 460;
      const y = 430 + Math.floor(i / 2) * 110;
      drawAvatar(this, x + 30, y, profile.avatar, this.t(`avatar.${profile.avatar}`), 22);
      this.small(
        x + 70,
        y,
        this.t('parent.profileLine', { name: profile.nickname, stars: profile.stars }),
        undefined,
        22,
      ).setOrigin(0, 0.5);
      this.confirmButton(x + 330, y, 170, this.t('common.delete'), () => {
        save.deleteProfile(profile.id);
        this.go({ tab: 'data', message: this.t('parent.deleted', { name: profile.nickname }) });
      });
    });
    if (save.profiles.length === 0)
      this.small(130, 404, this.t('parent.noProfiles'), undefined, 22);
    this.confirmButton(this.scale.width - 220, 640, 360, this.t('parent.clearAll'), () => {
      save.clear();
      this.registry.set(GATE_KEY, false);
      this.scene.start(SceneKey.Profile);
    });
  }

  /** Knopf, der zur Sicherheit zweimal getippt werden muss. */
  private confirmButton(
    x: number,
    y: number,
    width: number,
    label: string,
    action: () => void,
  ): void {
    let armed = false;
    const button: Button = this.addButton({
      x,
      y,
      width,
      height: 60,
      label,
      fontSize: 20,
      onPress: () => {
        if (!armed) {
          armed = true;
          button.setLabel(this.t('common.confirmDelete')).setFill(Color.orange);
          return;
        }
        action();
      },
    });
  }

  private exportFile(): void {
    const json = this.services.save.exportJson();
    const date = new Date().toISOString().slice(0, 10);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `zahlenzoo-spielstand-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.go({ tab: 'data', message: this.t('parent.exported') });
  }

  private importFile(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      void file.text().then((text) => {
        try {
          this.services.save.importJson(text);
          this.go({ tab: 'data', message: this.t('parent.imported') });
        } catch {
          this.go({ tab: 'data', message: this.t('parent.importFailed') });
        }
      });
    });
    input.click();
  }
}
