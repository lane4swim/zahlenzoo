import { areaState } from './areas';
import { enclosures } from './content';
import type { Achievement, AreaConfig, GameContent } from '../types/content';
import type { AreaProgress, Profile } from '../types/save';

/**
 * Belohnungen (Spezifikation, Abschnitt 8): Sterne einlösen für Baby-Tiere und Dekoration,
 * Gehege „fertig“, Abzeichen. Ausgeben verringert nur die Sterne zum Einlösen; die Sterne der
 * Bereiche (für die Freischaltung) bleiben, und verdiente Abzeichen gehen nie verloren.
 */

/** Mindeststerne einer Runde in Stufe 3 je Thema, damit ein Gehege als fertig gilt. */
export const DONE_STARS = 2;
export const DONE_LEVEL = 3;

/** Gehege fertig: Jedes Thema wurde in Stufe 3 mit mindestens 2 Sternen gespielt. */
export function isAreaDone(area: AreaConfig, progress: AreaProgress | undefined): boolean {
  if (area.families.length === 0 || !progress) return false;
  return area.families.every((f) => (progress.best[f]?.[String(DONE_LEVEL)] ?? 0) >= DONE_STARS);
}

/** Alle in den Bereichen gesammelten Sterne (auch die bereits eingelösten). */
export function totalStars(profile: Profile): number {
  return Object.values(profile.areas).reduce((sum, a) => sum + a.stars, 0);
}

/** Bereiche, die das Kind schon erreicht hat (offen oder „bald“). */
function reachedAreas(content: GameContent, profile: Profile): Set<string> {
  const stars = Object.fromEntries(
    content.areas.map((a) => [a.id, profile.areas[a.id]?.stars ?? 0]),
  );
  return new Set(
    content.areas.filter((a) => areaState(a, stars, content.rules) !== 'locked').map((a) => a.id),
  );
}

export type ShopState = 'owned' | 'buyable' | 'tooExpensive' | 'locked';

/** Baby-Tier eines Bereichs: erst wenn der Bereich erreicht ist, je Tierart einmal. */
export function babyState(content: GameContent, profile: Profile, animal: string): ShopState {
  if (profile.zoo.babies.some((b) => b.animal === animal)) return 'owned';
  const area = enclosures(content).find((a) => a.animal === animal);
  if (!area || !reachedAreas(content, profile).has(area.id)) return 'locked';
  const price = content.animals[animal]?.babyPrice ?? Infinity;
  return profile.stars >= price ? 'buyable' : 'tooExpensive';
}

export function decorState(content: GameContent, profile: Profile, id: string): ShopState {
  if (profile.zoo.decor.includes(id)) return 'owned';
  const item = content.decor.find((d) => d.id === id);
  if (!item) return 'locked';
  return profile.stars >= item.price ? 'buyable' : 'tooExpensive';
}

/** Kauft ein Baby-Tier und gibt ihm den Namen. Wirft, wenn der Kauf nicht möglich ist. */
export function buyBaby(
  content: GameContent,
  profile: Profile,
  animal: string,
  name: string,
): Profile {
  if (babyState(content, profile, animal) !== 'buyable') {
    throw new Error(`Baby-Tier ${animal} kann nicht gekauft werden`);
  }
  if (name.trim() === '') throw new Error('Name fehlt');
  const price = content.animals[animal]!.babyPrice;
  return {
    ...profile,
    stars: profile.stars - price,
    zoo: { ...profile.zoo, babies: [...profile.zoo.babies, { animal, name: name.trim() }] },
  };
}

export function buyDecor(content: GameContent, profile: Profile, id: string): Profile {
  if (decorState(content, profile, id) !== 'buyable') {
    throw new Error(`Dekoration ${id} kann nicht gekauft werden`);
  }
  const price = content.decor.find((d) => d.id === id)!.price;
  return {
    ...profile,
    stars: profile.stars - price,
    zoo: { ...profile.zoo, decor: [...profile.zoo.decor, id] },
  };
}

/** Werte der letzten Runde (nur am Rundenende bekannt). */
export type RoundContext = { stars: number; streak: number };

function met(
  achievement: Achievement,
  content: GameContent,
  profile: Profile,
  round: RoundContext | undefined,
): boolean {
  const c = achievement.condition;
  switch (c.type) {
    case 'rounds':
      return profile.stats.rounds >= c.min;
    case 'streak':
      return Math.max(profile.stats.bestStreak, round?.streak ?? 0) >= c.min;
    case 'roundStars':
      return (round?.stars ?? 0) >= c.min;
    case 'totalStars':
      return totalStars(profile) >= c.min;
    case 'level':
      return Object.values(profile.areas).some((a) =>
        Object.values(a.levels).some((l) => l >= c.min),
      );
    case 'areasDone':
      return content.areas.filter((a) => isAreaDone(a, profile.areas[a.id])).length >= c.min;
    case 'withHelp':
      return profile.stats.withHelp >= c.min;
    case 'babies':
      return profile.zoo.babies.length >= c.min;
    case 'familyBest':
      return Object.values(profile.areas).some((a) =>
        c.families.some((f) => (a.best[f]?.[String(c.level)] ?? 0) >= c.stars),
      );
  }
}

/** Verleiht alle neu erfüllten Abzeichen; bereits verdiente bleiben, wie sie sind. */
export function awardBadges(
  content: GameContent,
  profile: Profile,
  date: string,
  round?: RoundContext,
): { profile: Profile; earned: string[] } {
  const earned = content.achievements
    .filter((a) => profile.badges[a.id] === undefined && met(a, content, profile, round))
    .map((a) => a.id);
  if (earned.length === 0) return { profile, earned };
  return {
    profile: {
      ...profile,
      badges: { ...profile.badges, ...Object.fromEntries(earned.map((id) => [id, date])) },
    },
    earned,
  };
}
