/**
 * Vorlesen (Variante B, Spezifikation Abschnitt 11): eingesprochene Dateien folgen;
 * bis dahin liest die Sprachausgabe des Browsers. Startet erst nach einer Berührung,
 * weil der Aufruf immer aus einem Tipp heraus kommt.
 */
export class AudioService {
  private readonly synth: SpeechSynthesis | undefined =
    typeof window !== 'undefined' ? window.speechSynthesis : undefined;

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
