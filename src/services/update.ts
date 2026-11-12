/**
 * Neue Version und Offline-Bereitschaft (Service Worker). main.ts meldet hierher, was der
 * Service Worker sagt; Szenen fragen den Zustand ab. Ohne Service Worker (Entwicklung, Tests)
 * bleibt alles auf „nichts Neues“.
 */
type Listener = () => void;

let applyUpdate: (() => Promise<void>) | undefined;
let needRefresh = false;
let offlineReady = false;
const listeners = new Set<Listener>();

const notify = () => listeners.forEach((l) => l());

export const updates = {
  /** Eine neue Version liegt bereit und wartet auf „Neue Version laden“. */
  get available(): boolean {
    return needRefresh;
  },
  /** Alle Dateien sind abgelegt: Das Spiel läuft ab jetzt auch ohne Internet. */
  get offlineReady(): boolean {
    return offlineReady;
  },
  setNeedRefresh(apply: () => Promise<void>): void {
    applyUpdate = apply;
    needRefresh = true;
    notify();
  },
  setOfflineReady(): void {
    offlineReady = true;
    notify();
  },
  /** Neue Version aktivieren; die Seite lädt dann neu (nur aus dem Menü aufrufen). */
  async apply(): Promise<void> {
    await applyUpdate?.();
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
