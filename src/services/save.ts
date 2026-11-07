import {
  AVATARS,
  type AreaProgress,
  type Avatar,
  type Profile,
  type SaveData,
  type Settings,
} from '../types/save';

/** Aktuelle Version des Spielstands; bei jeder Formatänderung erhöhen und Migration ergänzen. */
export const SAVE_VERSION = 1;
export const STORAGE_KEY = 'zahlenzoo.save';
export const BACKUP_KEY = 'zahlenzoo.save.backup';
export const NICKNAME_MAX = 16;

/** Wandelt Version n in Version n + 1 um. */
export type Migration = (data: Record<string, unknown>) => Record<string, unknown>;

/**
 * Migrationen je Versionssprung: MIGRATIONS[1] macht aus Version 1 die Version 2.
 * Noch leer, weil es erst Version 1 gibt.
 */
export const MIGRATIONS: Readonly<Record<number, Migration>> = {};

/** Speicher mit der Schnittstelle von localStorage (für Tests austauschbar). */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const DEFAULT_SETTINGS: Settings = {
  music: 0.4,
  sfx: 0.8,
  readAloud: true,
  largeText: false,
};

export function emptySave(): SaveData {
  return { version: SAVE_VERSION, activeProfileId: null, profiles: [] };
}

export function migrate(
  data: Record<string, unknown>,
  migrations: Readonly<Record<number, Migration>> = MIGRATIONS,
  target = SAVE_VERSION,
): Record<string, unknown> {
  let current = data;
  let version = typeof current.version === 'number' ? current.version : 0;
  if (version > target) throw new Error(`Spielstand-Version ${version} ist neuer als ${target}`);
  while (version < target) {
    const step = migrations[version];
    if (!step) throw new Error(`Keine Migration von Version ${version}`);
    current = { ...step(current), version: version + 1 };
    version++;
  }
  return current;
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function validate(data: Record<string, unknown>): SaveData {
  if (!Array.isArray(data.profiles)) throw new Error('Spielstand ohne Profilliste');
  const profiles = data.profiles.map((p, i) => {
    if (!isObject(p) || typeof p.id !== 'string' || typeof p.nickname !== 'string') {
      throw new Error(`Profil ${i} ist ungültig`);
    }
    if (!AVATARS.includes(p.avatar as Avatar)) throw new Error(`Profil ${i}: unbekanntes Tierbild`);
    return p as unknown as Profile;
  });
  const active = typeof data.activeProfileId === 'string' ? data.activeProfileId : null;
  return {
    version: SAVE_VERSION,
    activeProfileId: profiles.some((p) => p.id === active) ? active : null,
    profiles,
  };
}

/** Liest einen Spielstand aus JSON-Text (auch für den Import). Wirft bei ungültigen Daten. */
export function parseSave(text: string): SaveData {
  const raw: unknown = JSON.parse(text);
  if (!isObject(raw)) throw new Error('Spielstand ist kein JSON-Objekt');
  return validate(migrate(raw));
}

/** Spielstand als JSON-Text für den Export. */
export function exportSave(data: SaveData): string {
  return JSON.stringify(data, null, 2);
}

function newId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `p-${Date.now().toString(36)}-${performance.now().toString(36).replace('.', '')}`;
}

export function cleanNickname(nickname: string): string {
  return nickname.replace(/\s+/g, ' ').trim().slice(0, NICKNAME_MAX);
}

export function createProfile(nickname: string, avatar: Avatar, now = new Date()): Profile {
  const name = cleanNickname(nickname);
  if (name === '') throw new Error('Spitzname fehlt');
  return {
    id: newId(),
    nickname: name,
    avatar,
    createdAt: now.toISOString().slice(0, 10),
    stars: 0,
    zoo: { animals: [], decor: [] },
    areas: {},
    skills: {},
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function areaProgress(profile: Profile, areaId: string): AreaProgress {
  return profile.areas[areaId] ?? { stars: 0, unlockedLevel: 1, rounds: 0 };
}

/**
 * Spielstand im Browser. Jede Änderung wird sofort gespeichert.
 * Ein nicht lesbarer Spielstand wird gesichert (BACKUP_KEY) und durch einen leeren ersetzt.
 */
export class SaveService {
  private data: SaveData;

  constructor(private readonly store: KeyValueStore | undefined) {
    this.data = this.read();
  }

  private read(): SaveData {
    let text: string | null;
    try {
      text = this.store?.getItem(STORAGE_KEY) ?? null;
    } catch {
      return emptySave();
    }
    if (text === null) return emptySave();
    try {
      return parseSave(text);
    } catch {
      try {
        this.store?.setItem(BACKUP_KEY, text);
      } catch {
        // Sicherung ist nicht möglich; weiter mit leerem Spielstand.
      }
      return emptySave();
    }
  }

  private write(): void {
    try {
      this.store?.setItem(STORAGE_KEY, exportSave(this.data));
    } catch {
      // Speicher voll oder gesperrt (z. B. privater Modus): Spiel läuft ohne Speichern weiter.
    }
  }

  get profiles(): readonly Profile[] {
    return this.data.profiles;
  }

  get activeProfile(): Profile | undefined {
    return this.data.profiles.find((p) => p.id === this.data.activeProfileId);
  }

  addProfile(nickname: string, avatar: Avatar): Profile {
    const profile = createProfile(nickname, avatar);
    this.data = {
      ...this.data,
      profiles: [...this.data.profiles, profile],
      activeProfileId: profile.id,
    };
    this.write();
    return profile;
  }

  selectProfile(id: string): void {
    if (!this.data.profiles.some((p) => p.id === id)) throw new Error(`Profil ${id} fehlt`);
    this.data = { ...this.data, activeProfileId: id };
    this.write();
  }

  deleteProfile(id: string): void {
    const profiles = this.data.profiles.filter((p) => p.id !== id);
    const activeProfileId = this.data.activeProfileId === id ? null : this.data.activeProfileId;
    this.data = { ...this.data, profiles, activeProfileId };
    this.write();
  }

  updateProfile(profile: Profile): void {
    const index = this.data.profiles.findIndex((p) => p.id === profile.id);
    if (index < 0) throw new Error(`Profil ${profile.id} fehlt`);
    const profiles = [...this.data.profiles];
    profiles[index] = profile;
    this.data = { ...this.data, profiles };
    this.write();
  }

  exportJson(): string {
    return exportSave(this.data);
  }

  /** Ersetzt den Spielstand durch eine exportierte Datei. Wirft bei ungültigen Daten. */
  importJson(text: string): void {
    this.data = parseSave(text);
    this.write();
  }

  /** Entfernt alle lokalen Daten. */
  clear(): void {
    this.data = emptySave();
    try {
      this.store?.removeItem(STORAGE_KEY);
      this.store?.removeItem(BACKUP_KEY);
    } catch {
      // nichts zu tun
    }
  }
}
