/**
 * Bildschirmleser (Spezifikation 9): Das Spiel zeichnet auf eine Zeichenfläche, die
 * Bildschirmleser nicht lesen können. Ein unsichtbarer Textbereich mit aria-live gibt ihnen
 * Titel, Aufgaben, Hinweise und Rückmeldungen weiter. Ohne DOM (Tests) passiert nichts.
 */
let region: HTMLElement | undefined;

function liveRegion(): HTMLElement | undefined {
  if (typeof document === 'undefined') return undefined;
  if (region && document.body.contains(region)) return region;
  region = document.getElementById('a11y-live') ?? undefined;
  if (!region) {
    region = document.createElement('div');
    region.id = 'a11y-live';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    // sichtbar nur für Bildschirmleser
    Object.assign(region.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      margin: '-1px',
      padding: '0',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap',
      border: '0',
    });
    document.body.appendChild(region);
  }
  return region;
}

/** Text an den Bildschirmleser geben (ersetzt die vorige Meldung). */
export function announce(text: string): void {
  const el = liveRegion();
  if (!el || text.trim() === '') return;
  // Leeren und neu setzen, damit auch eine gleiche Meldung erneut gelesen wird.
  el.textContent = '';
  setTimeout(() => {
    el.textContent = text;
  }, 50);
}
