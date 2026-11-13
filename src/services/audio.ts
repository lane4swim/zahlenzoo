import voice from '../data/voice.json';
import {
  musicVolume,
  speechPlan,
  type Music,
  type Sfx,
  type SpeechPart,
  type SpeechStep,
} from '../logic/audio';

/** Was der Dienst vom Phaser-Soundsystem braucht (im Test durch eine Attrappe ersetzt). */
export interface SoundLike {
  play(): boolean;
  stop(): boolean;
  destroy(): void;
  setVolume(value: number): unknown;
}
export interface SoundPort {
  readonly locked: boolean;
  once(event: 'unlocked', fn: () => void): unknown;
  add(key: string, config?: { loop?: boolean; volume?: number }): SoundLike;
  play(key: string, config?: { volume?: number }): boolean;
}

/** Abspielen einer eingesprochenen Datei (Browser: HTMLAudioElement). */
export type VoicePlayer = (url: string, volume: number, done: () => void) => () => void;

/** Texturschlüssel der Klänge im Phaser-Cache. */
export const soundKey = {
  sfx: (name: Sfx) => `sfx_${name}`,
  animal: (name: string) => `animal_${name}`,
  music: (name: Music) => `music_${name}`,
};

const browserVoice: VoicePlayer = (url, volume, done) => {
  const audio = new Audio(url);
  audio.volume = volume;
  let finished = false;
  const end = () => {
    if (finished) return;
    finished = true;
    done();
  };
  audio.addEventListener('ended', end);
  audio.addEventListener('error', end);
  void audio.play().catch(end);
  return () => {
    finished = true;
    audio.pause();
  };
};

/**
 * Ton im Spiel (Spezifikation 9 und 11, Variante B): Effekte, Tierlaute, Musik je Szene und
 * Vorlesen. Vorlesen spielt die eingesprochene Datei eines Textes, falls vorhanden, sonst die
 * Sprachausgabe des Browsers. Musik und Effekte sind getrennt regelbar, Standard leise.
 * Ton beginnt erst nach der ersten Berührung (Browser-Vorgabe): Bis dahin merkt sich der
 * Dienst nur, welche Musik laufen soll.
 */
export class AudioService {
  private readonly synth: SpeechSynthesis | undefined =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  private sound?: SoundPort;
  private baseUrl = '';
  private readonly recorded: ReadonlySet<string>;
  private wanted: Music | null = null;
  private current?: { name: Music; sound: SoundLike };
  private speaking = false;
  private cancelSpeech?: () => void;
  private speechRun = 0;

  /** Lautstärken (0 bis 1) für Musik und Geräusche, aus den Einstellungen des Profils. */
  music = 0.4;
  sfx = 0.4;

  constructor(
    recordedKeys: readonly string[] = voice.keys,
    private readonly voicePlayer: VoicePlayer = browserVoice,
  ) {
    this.recorded = new Set(recordedKeys);
  }

  /** Verbindet den Dienst mit dem Soundsystem des Spiels (BootScene). */
  attach(sound: SoundPort, baseUrl: string): void {
    this.sound = sound;
    this.baseUrl = baseUrl;
    if (sound.locked) sound.once('unlocked', () => this.applyMusic());
    else this.applyMusic();
  }

  setVolumes(music: number, sfx: number): void {
    this.music = Math.max(0, Math.min(1, music));
    this.sfx = Math.max(0, Math.min(1, sfx));
    this.applyMusic();
  }

  /** Kurzer Effekt (richtig, Ziffer, Stern …); bei „Geräusche aus“ still. */
  play(name: Sfx): void {
    if (!this.sound || this.sfx <= 0 || this.sound.locked) return;
    this.sound.play(soundKey.sfx(name), { volume: this.sfx });
  }

  /** Tierlaut, z. B. wenn ein Tier sich freut. */
  animal(name: string): void {
    if (!this.sound || this.sfx <= 0 || this.sound.locked) return;
    this.sound.play(soundKey.animal(name), { volume: this.sfx * 0.8 });
  }

  /** Musik der Szene: null für Stille; dasselbe Stück läuft ohne Neustart weiter. */
  setMusic(name: Music | null): void {
    this.wanted = name;
    this.applyMusic();
  }

  get playingMusic(): Music | undefined {
    return this.current?.name;
  }

  private applyMusic(): void {
    const sound = this.sound;
    if (!sound || sound.locked) return;
    const want = this.music > 0 ? this.wanted : null;
    if (this.current && this.current.name !== want) {
      this.current.sound.stop();
      this.current.sound.destroy();
      this.current = undefined;
    }
    if (want && !this.current) {
      const s = sound.add(soundKey.music(want), { loop: true, volume: 0 });
      s.play();
      this.current = { name: want, sound: s };
    }
    this.current?.sound.setVolume(musicVolume(this.music, this.speaking));
  }

  get canSpeak(): boolean {
    return this.synth !== undefined || this.recorded.size > 0;
  }

  /** Liest einen Text oder mehrere Teile vor (Aufnahme, sonst Sprachausgabe). */
  speak(text: string | readonly SpeechPart[]): void {
    const parts = typeof text === 'string' ? [{ text }] : text;
    this.stop();
    const steps = speechPlan(parts, this.recorded);
    if (steps.length === 0) return;
    const run = ++this.speechRun;
    this.speaking = true;
    this.applyMusic();
    this.runSteps(steps, 0, run);
  }

  private runSteps(steps: readonly SpeechStep[], i: number, run: number): void {
    if (run !== this.speechRun) return;
    const step = steps[i];
    if (!step) {
      this.speaking = false;
      this.cancelSpeech = undefined;
      this.applyMusic();
      return;
    }
    const next = () => this.runSteps(steps, i + 1, run);
    if ('file' in step) {
      this.cancelSpeech = this.voicePlayer(`${this.baseUrl}${step.file}`, 1, next);
      return;
    }
    if (!this.synth) {
      next();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(step.tts);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    const voiceDe = this.synth.getVoices().find((v) => v.lang.startsWith('de'));
    if (voiceDe) utterance.voice = voiceDe;
    utterance.onend = next;
    utterance.onerror = next;
    this.cancelSpeech = () => this.synth?.cancel();
    this.synth.speak(utterance);
  }

  stop(): void {
    this.speechRun++;
    this.cancelSpeech?.();
    this.cancelSpeech = undefined;
    this.synth?.cancel();
    if (this.speaking) {
      this.speaking = false;
      this.applyMusic();
    }
  }
}
