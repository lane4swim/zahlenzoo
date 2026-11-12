import { afterEach, describe, expect, it } from 'vitest';
import { nextIndex, readingOrder } from '../src/logic/focusOrder';
import { patternContinue } from '../src/logic/generators/geometry';
import { createRng } from '../src/logic/rng';
import { DEFAULT_SETTINGS } from '../src/services/save';
import type { TaskLevel } from '../src/types/task';
import { applyDisplay, Color, CssColor, FontSize, reducedMotion, Stroke } from '../src/ui/theme';
import { paramsOf } from './helpers/content';

afterEach(() => applyDisplay(undefined));

describe('Tastaturbedienung: Reihenfolge', () => {
  // drei Knöpfe in einer Reihe, darunter einer
  const points = readingOrder([
    { x: 700, y: 400 },
    { x: 300, y: 405 },
    { x: 500, y: 398 },
    { x: 500, y: 600 },
  ]);

  it('Tab geht in Leserichtung: Zeilen von oben, darin von links', () => {
    expect(points.map((p) => p.x)).toEqual([300, 500, 700, 500]);
    expect(nextIndex(points, -1, 'next')).toBe(0);
    expect(nextIndex(points, 3, 'next')).toBe(0);
    expect(nextIndex(points, 0, 'prev')).toBe(3);
  });

  it('Pfeiltasten springen zum nächsten Element in der Richtung', () => {
    expect(nextIndex(points, 0, 'right')).toBe(1);
    expect(nextIndex(points, 1, 'down')).toBe(3);
    expect(nextIndex(points, 3, 'up')).toBe(1);
    // nach links gibt es nichts mehr: Fokus bleibt
    expect(nextIndex(points, 0, 'left')).toBe(0);
  });
});

describe('Anzeige-Einstellungen', () => {
  it('größere Schrift vergrößert Lesetexte, Ziffern und Titel bleiben', () => {
    expect(FontSize.small).toBe(24);
    applyDisplay({ ...DEFAULT_SETTINGS, largeText: true });
    expect(FontSize.small).toBe(27);
    expect(FontSize.text).toBe(32);
    expect(FontSize.digits).toBe(48);
  });

  it('hoher Kontrast: Schwarz auf Weiß und dickere Konturen', () => {
    expect(Color.kontur).toBe(0x4a3426);
    applyDisplay({ highContrast: true });
    expect(Color.kontur).toBe(0x000000);
    expect(Color.papier).toBe(0xffffff);
    expect(CssColor.text).toBe('#000000');
    expect(Stroke.outline).toBeGreaterThan(4);
  });

  it('weniger Bewegung als Einstellung (auch ohne Vorgabe des Betriebssystems)', () => {
    expect(reducedMotion()).toBe(false);
    applyDisplay({ reducedMotion: true });
    expect(reducedMotion()).toBe(true);
  });
});

describe('Farbenblind-sicher', () => {
  it('Muster: Rot und Grün kommen nie zusammen vor, auch nicht auf den Karten', () => {
    for (const level of [1, 2, 3] as TaskLevel[]) {
      for (let s = 0; s < 300; s++) {
        const t = patternContinue(level, createRng(s), 't', paramsOf('pattern_continue')(level));
        const v = t.display!.visual;
        const colors = new Set<string>();
        if (v.type === 'shapes') v.items.forEach((i) => i && colors.add(i.color));
        t.options!.forEach((o) => colors.add(o.shape!.color));
        expect(colors.has('red') && colors.has('green')).toBe(false);
      }
    }
  });
});
