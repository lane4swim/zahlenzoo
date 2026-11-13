import { describe, expect, it, vi } from 'vitest';
import voice from '../src/data/voice.json';
import {
  ANIMAL_SOUNDS,
  DUCK,
  MUSIC,
  musicFor,
  musicVolume,
  SFX,
  speechPlan,
  voiceFile,
} from '../src/logic/audio';
import { AudioService, type SoundLike, type SoundPort } from '../src/services/audio';
import { SceneKey } from '../src/types/scenes';
import { CONTENT } from './helpers/content';

/** Vorhandene Klangdateien (relativ zu public/assets). */
const FILES = new Set(
  Object.keys(import.meta.glob('../public/assets/audio/**/*.mp3')).map((p) =>
    p.replace('../public/assets/', ''),
  ),
);
const existsSync = (path: string) => FILES.has(path);

/** Attrappe für das Phaser-Soundsystem: merkt sich, was gespielt wird. */
function fakeSound(locked = false) {
  const played: Array<{ key: string; volume?: number }> = [];
  const music: Array<{ key: string; sound: SoundLike & { volume: number; stopped: boolean } }> = [];
  let unlock: (() => void) | undefined;
  const port: SoundPort & { unlock(): void } = {
    locked,
    once: (_e, fn) => {
      unlock = fn;
    },
    unlock() {
      (this as { locked: boolean }).locked = false;
      unlock?.();
    },
    add: (key) => {
      const sound = {
        volume: 0,
        stopped: false,
        play: () => true,
        stop() {
          this.stopped = true;
          return true;
        },
        destroy: () => {},
        setVolume(v: number) {
          this.volume = v;
        },
      };
      music.push({ key, sound });
      return sound;
    },
    play: (key, config) => {
      played.push({ key, ...(config?.volume !== undefined ? { volume: config.volume } : {}) });
      return true;
    },
  };
  return { port, played, music };
}

describe('Klangdateien', () => {
  it('es gibt jede Datei, die das Spiel lädt', () => {
    for (const s of SFX) expect(existsSync(`audio/sfx/${s}.mp3`), s).toBe(true);
    for (const a of ANIMAL_SOUNDS) expect(existsSync(`audio/animals/${a}.mp3`), a).toBe(true);
    for (const m of MUSIC) expect(existsSync(`audio/music/${m}.mp3`), m).toBe(true);
    for (const k of voice.keys) expect(existsSync(voiceFile(k)), k).toBe(true);
  });

  it('jedes Tier hat einen Laut', () => {
    expect([...ANIMAL_SOUNDS].sort()).toEqual(Object.keys(CONTENT.animals).sort());
  });

  it('jede Szene hat eine Musikangabe', () => {
    for (const key of Object.values(SceneKey)) {
      if (key === SceneKey.Boot) continue;
      expect(musicFor(key), key).not.toBeUndefined();
    }
    expect(musicFor(SceneKey.Task)).toBe('task');
    expect(musicFor(SceneKey.Parent)).toBeNull();
  });
});

describe('Vorlesen: Aufnahme oder Sprachausgabe', () => {
  const recorded = new Set(['hint.add_bridge.1', 'task.prompt.match']);

  it('spielt Aufnahmen für Sätze ohne Platzhalter, den Rest liest die Sprachausgabe', () => {
    const plan = speechPlan(
      [
        { key: 'task.prompt.match', text: 'Was gehört zusammen?' },
        { text: '47 plus 26' },
        { text: 'Versuch es noch einmal.' },
        { key: 'hint.add_bridge.1', text: 'Rechne erst bis zum Zehner.' },
        { key: 'hint.add_bridge.1', params: { n: 3 }, text: 'Mit Zahl 3.' },
        { key: 'hint.unknown', text: 'Ohne Aufnahme.' },
      ],
      recorded,
    );
    expect(plan).toEqual([
      { file: 'audio/voice/task.prompt.match.mp3' },
      { tts: '47 plus 26 Versuch es noch einmal.' },
      { file: 'audio/voice/hint.add_bridge.1.mp3' },
      { tts: 'Mit Zahl 3. Ohne Aufnahme.' },
    ]);
  });

  it('leere Teile fallen weg', () => {
    expect(speechPlan([{ text: '  ' }, { text: '' }], recorded)).toEqual([]);
  });

  it('der Dienst spielt Datei und Sprachausgabe nacheinander und senkt die Musik', () => {
    const files: string[] = [];
    let finish: (() => void) | undefined;
    const audio = new AudioService(['task.prompt.match'], (url, _v, done) => {
      files.push(url);
      finish = done;
      return () => {};
    });
    const { port, music } = fakeSound();
    audio.attach(port, '/zz/assets/');
    audio.setMusic('task');
    const normal = music[0]!.sound.volume;
    audio.speak([{ key: 'task.prompt.match', text: 'Was gehört zusammen?' }]);
    expect(files).toEqual(['/zz/assets/audio/voice/task.prompt.match.mp3']);
    expect(music[0]!.sound.volume).toBeCloseTo(normal * DUCK);
    finish?.();
    expect(music[0]!.sound.volume).toBeCloseTo(normal);
  });
});

describe('Musik und Effekte', () => {
  it('Ton erst nach der ersten Berührung; die gewünschte Musik startet dann', () => {
    const audio = new AudioService([]);
    const { port, played, music } = fakeSound(true);
    audio.attach(port, '');
    audio.setMusic('map');
    audio.play('tap');
    expect(music).toHaveLength(0);
    expect(played).toHaveLength(0);
    port.unlock();
    expect(music.map((m) => m.key)).toEqual(['music_map']);
    audio.play('tap');
    expect(played).toEqual([{ key: 'sfx_tap', volume: audio.sfx }]);
  });

  it('gleiche Musik läuft weiter, neue ersetzt sie; „Musik aus“ stoppt sie', () => {
    const audio = new AudioService([]);
    const { port, music } = fakeSound();
    audio.attach(port, '');
    audio.setMusic('map');
    audio.setMusic('map');
    expect(music).toHaveLength(1);
    audio.setMusic('task');
    expect(music[0]!.sound.stopped).toBe(true);
    expect(audio.playingMusic).toBe('task');
    audio.setVolumes(0, 0.8);
    expect(audio.playingMusic).toBeUndefined();
    audio.setVolumes(0.4, 0.8);
    expect(audio.playingMusic).toBe('task');
    expect(music.at(-1)!.sound.volume).toBeCloseTo(musicVolume(0.4, false));
  });

  it('„Geräusche aus“ spielt keine Effekte und keine Tierlaute', () => {
    const audio = new AudioService([]);
    const { port, played } = fakeSound();
    audio.attach(port, '');
    audio.setVolumes(0.4, 0);
    audio.play('correct');
    audio.animal('penguin');
    expect(played).toEqual([]);
    audio.setVolumes(0.4, 0.4);
    audio.animal('penguin');
    expect(played).toEqual([{ key: 'animal_penguin', volume: expect.any(Number) }]);
  });

  it('Standard ist leise: Musik leiser als Effekte', () => {
    const audio = new AudioService([]);
    expect(musicVolume(audio.music, false)).toBeLessThan(audio.sfx);
    expect(musicVolume(1, true)).toBeLessThan(musicVolume(1, false));
    vi.restoreAllMocks();
  });
});
