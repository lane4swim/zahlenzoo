import { BaseScene } from './BaseScene';
import type { Services } from '../services/services';
import type { Settings } from '../types/save';
import { SceneKey } from '../types/scenes';
import { Color, FontSize, Stroke, Tex } from '../ui/theme';

type Choice<T> = { label: string; value: T };
type Row<K extends keyof Settings> = { key: K; title: string; choices: Array<Choice<Settings[K]>> };

/** Lautstärken: aus, leise (Startwert der Musik), laut. */
const VOLUMES = [0, 0.4, 0.8] as const;

/**
 * Einstellungen des aktiven Profils (Spezifikation 9): links Ton (Musik, Geräusche, Vorlesen),
 * rechts Anzeige (größere Schrift, hoher Kontrast, weniger Bewegung). Jede Änderung gilt sofort.
 */
export class SettingsScene extends BaseScene {
  constructor(services: Services) {
    super(SceneKey.Settings, services);
  }

  create(): void {
    const profile = this.services.save.activeProfile;
    if (!profile) {
      this.scene.start(SceneKey.Profile);
      return;
    }
    this.addBackground(Tex.menuAdults);
    this.addBackButton(() => this.scene.start(SceneKey.Menu));
    this.addTitle(this.t('settings.title'), 62);

    const volume = (k: 'music' | 'sfx'): Row<typeof k> => ({
      key: k,
      title: this.t(`settings.${k}`),
      choices: VOLUMES.map((v, i) => ({
        label: this.t(`settings.volume.${['off', 'low', 'high'][i]}`),
        value: v,
      })),
    });
    const onOff = (k: 'readAloud' | 'largeText' | 'highContrast' | 'reducedMotion') => ({
      key: k,
      title: this.t(`settings.${k}`),
      choices: [
        { label: this.t('settings.on'), value: true },
        { label: this.t('settings.off'), value: false },
      ],
    });
    const columns = [
      [volume('music'), volume('sfx'), onOff('readAloud')],
      [onOff('largeText'), onOff('highContrast'), onOff('reducedMotion')],
    ];
    const board = this.add.graphics();
    board.fillStyle(Color.papier, 0.94);
    board.lineStyle(Stroke.outline, Color.kontur, 1);
    board.fillRoundedRect(28, 118, this.scale.width - 56, 616, 24);
    board.strokeRoundedRect(28, 118, this.scale.width - 56, 616, 24);

    columns.forEach((rows, col) => {
      const cx = this.scale.width / 2 + (col === 0 ? -238 : 238);
      rows.forEach((row, i) => {
        const y = 170 + i * 196;
        this.addText(cx, y, row.title);
        const current = profile.settings[row.key] ?? (row.key === 'readAloud' ? true : false);
        const n = row.choices.length;
        const w = n === 3 ? 136 : 180;
        row.choices.forEach((choice, j) => {
          const selected =
            typeof choice.value === 'number'
              ? Math.abs((current as number) - choice.value) < 0.05
              : current === choice.value;
          this.addButton({
            x: cx + (j - (n - 1) / 2) * (w + 12),
            y: y + 84,
            width: w,
            label: choice.label,
            fontSize: FontSize.small,
            fill: selected ? Color.grasHell : Color.papier,
            onPress: () => this.change(row.key, choice.value),
          });
        });
      });
    });
  }

  private change<K extends keyof Settings>(key: K, value: Settings[K]): void {
    const profile = this.services.save.activeProfile;
    if (!profile) return;
    this.services.save.updateProfile({
      ...profile,
      settings: { ...profile.settings, [key]: value },
    });
    if (key === 'readAloud' && value === false) this.services.audio.stop();
    this.services.audio.setVolumes(
      key === 'music' ? (value as number) : profile.settings.music,
      key === 'sfx' ? (value as number) : profile.settings.sfx,
    );
    // Neu aufbauen, damit Schrift und Kontrast sofort sichtbar werden.
    this.scene.restart();
  }
}
