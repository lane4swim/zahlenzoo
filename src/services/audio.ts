/**
 * Vorlesen (Variante B, Spezifikation Abschnitt 11): eingesprochene Dateien folgen;
 * bis dahin liest die Sprachausgabe des Browsers. Startet erst nach einer Berührung,
 * weil der Aufruf immer aus einem Tipp heraus kommt.
 */
export class AudioService {
  private readonly synth: SpeechSynthesis | undefined =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined;

  /** Lautstärken (0 bis 1) für Musik und Geräusche; gelten, sobald es Musik und Effekte gibt (#25). */
  music = 0.4;
  sfx = 0.8;

  setVolumes(music: number, sfx: number): void {
    this.music = Math.max(0, Math.min(1, music));
    this.sfx = Math.max(0, Math.min(1, sfx));
  }

  get canSpeak(): boolean {
    return this.synth !== undefined;
  }

  speak(text: string, lang = 'de-DE'): void {
    if (!this.synth || text.trim() === '') return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    const voice = this.synth.getVoices().find((v) => v.lang.startsWith('de'));
    if (voice) utterance.voice = voice;
    this.synth.speak(utterance);
  }

  stop(): void {
    this.synth?.cancel();
  }
}
