import { describe, expect, it } from 'vitest';
import {
  BACKUP_KEY,
  cleanNickname,
  createProfile,
  emptySave,
  exportSave,
  migrate,
  parseSave,
  SAVE_VERSION,
  SaveService,
  STORAGE_KEY,
  type KeyValueStore,
} from '../src/services/save';

function memoryStore(initial: Record<string, string> = {}): KeyValueStore & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => {
      data[k] = v;
    },
    removeItem: (k) => {
      delete data[k];
    },
  };
}

describe('SaveService', () => {
  it('startet ohne Spielstand leer', () => {
    const save = new SaveService(memoryStore());
    expect(save.profiles).toEqual([]);
    expect(save.activeProfile).toBeUndefined();
  });

  it('speichert und lädt Profile', () => {
    const store = memoryStore();
    const save = new SaveService(store);
    const mia = save.addProfile('  Mia  ', 'monkey');
    save.addProfile('Ben', 'owl');
    save.selectProfile(mia.id);
    save.updateProfile({ ...mia, stars: 5 });

    const loaded = new SaveService(store);
    expect(loaded.profiles.map((p) => p.nickname)).toEqual(['Mia', 'Ben']);
    expect(loaded.activeProfile?.nickname).toBe('Mia');
    expect(loaded.activeProfile?.stars).toBe(5);
    expect(JSON.parse(store.data[STORAGE_KEY]!).version).toBe(SAVE_VERSION);
  });

  it('löscht ein Profil und hebt die Auswahl auf', () => {
    const store = memoryStore();
    const save = new SaveService(store);
    const mia = save.addProfile('Mia', 'monkey');
    save.deleteProfile(mia.id);
    expect(save.profiles).toEqual([]);
    expect(new SaveService(store).activeProfile).toBeUndefined();
  });

  it('sichert einen beschädigten Spielstand und startet leer', () => {
    const store = memoryStore({ [STORAGE_KEY]: '{kaputt' });
    const save = new SaveService(store);
    expect(save.profiles).toEqual([]);
    expect(store.data[BACKUP_KEY]).toBe('{kaputt');
  });

  it('läuft ohne Speicher weiter (z. B. privater Modus)', () => {
    const broken: KeyValueStore = {
      getItem: () => {
        throw new Error('gesperrt');
      },
      setItem: () => {
        throw new Error('gesperrt');
      },
      removeItem: () => undefined,
    };
    const save = new SaveService(broken);
    expect(() => save.addProfile('Mia', 'monkey')).not.toThrow();
    expect(save.profiles).toHaveLength(1);
  });

  it('exportiert und importiert den Spielstand', () => {
    const a = new SaveService(memoryStore());
    a.addProfile('Mia', 'giraffe');
    const json = a.exportJson();

    const b = new SaveService(memoryStore());
    b.importJson(json);
    expect(b.profiles).toEqual(a.profiles);
    expect(() => b.importJson('{"profiles": "nein"}')).toThrow();
    expect(b.profiles).toEqual(a.profiles);
  });

  it('entfernt mit clear() alle lokalen Daten', () => {
    const store = memoryStore();
    const save = new SaveService(store);
    save.addProfile('Mia', 'monkey');
    save.clear();
    expect(save.profiles).toEqual([]);
    expect(store.data[STORAGE_KEY]).toBeUndefined();
  });
});

describe('Profile', () => {
  it('kürzt Spitznamen und lehnt leere ab', () => {
    expect(cleanNickname('  Lina   Marie  ')).toBe('Lina Marie');
    expect(cleanNickname('A'.repeat(30))).toHaveLength(16);
    expect(() => createProfile('   ', 'owl')).toThrow();
  });

  it('lehnt unbekannte Tierbilder beim Laden ab', () => {
    const data = emptySave();
    const profile = { ...createProfile('Mia', 'owl'), avatar: 'dragon' };
    expect(() => parseSave(JSON.stringify({ ...data, profiles: [profile] }))).toThrow();
  });
});

describe('Migration', () => {
  it('führt Versionssprünge nacheinander aus', () => {
    const migrations = {
      1: (d: Record<string, unknown>) => ({ ...d, renamed: d.old }),
      2: (d: Record<string, unknown>) => ({ ...d, added: true }),
    };
    expect(migrate({ version: 1, old: 'x' }, migrations, 3)).toEqual({
      version: 3,
      old: 'x',
      renamed: 'x',
      added: true,
    });
  });

  it('wirft bei fehlender Migration und bei zu neuen Spielständen', () => {
    expect(() => migrate({ version: 1 }, {}, 2)).toThrow();
    expect(() => migrate({ version: 5 }, {}, 2)).toThrow();
  });

  it('lässt aktuelle Spielstände unverändert', () => {
    const data = { ...emptySave(), profiles: [createProfile('Mia', 'owl')] };
    expect(parseSave(exportSave(data))).toEqual(data);
  });
});
