import { describe, expect, it } from 'vitest';
import { applyRoundResult } from '../src/logic/progress';
import { starsForRound, unlockedLevelAfter } from '../src/logic/rewards';
import { createProfile } from '../src/services/save';

const summary = (total: number, firstTry: number, withHelp: number) => ({
  total,
  firstTry,
  withHelp,
  wrong: total - firstTry - withHelp,
});

describe('Sterne', () => {
  it('vergibt 1 bis 3 Sterne nach den Startwerten', () => {
    expect(starsForRound(summary(10, 0, 0))).toBe(1);
    expect(starsForRound(summary(10, 3, 3))).toBe(1);
    expect(starsForRound(summary(10, 4, 3))).toBe(2);
    expect(starsForRound(summary(10, 0, 7))).toBe(2);
    expect(starsForRound(summary(10, 8, 2))).toBe(2);
    expect(starsForRound(summary(10, 9, 0))).toBe(3);
    expect(starsForRound(summary(0, 0, 0))).toBe(1);
  });

  it('öffnet die nächste Stufe ab 2 Sternen in der höchsten offenen Stufe', () => {
    expect(unlockedLevelAfter(1, 1, 1)).toBe(1);
    expect(unlockedLevelAfter(1, 1, 2)).toBe(2);
    expect(unlockedLevelAfter(2, 1, 3)).toBe(2);
    expect(unlockedLevelAfter(3, 3, 3)).toBe(3);
  });
});

describe('applyRoundResult', () => {
  it('trägt Sterne, Stufe und Antwortliste ins Profil ein', () => {
    const profile = createProfile('Mia', 'penguin');
    const { profile: after, reward } = applyRoundResult(profile, {
      areaId: 'pinguinfelsen',
      family: 'add_100',
      level: 1,
      summary: summary(10, 9, 1),
      outcomes: ['first_try', 'with_help', 'wrong'],
      date: '2026-11-07',
    });
    expect(reward).toEqual({ stars: 3, unlockedLevel: 2, levelUnlocked: true });
    expect(after.stars).toBe(3);
    expect(after.areas.pinguinfelsen).toEqual({ stars: 3, unlockedLevel: 2, rounds: 1 });
    expect(after.skills.add_100).toEqual({
      level: 1,
      last: [1, 0.5, 0],
      lastPlayed: '2026-11-07',
    });
    expect(profile.stars).toBe(0);
  });

  it('behält höchstens die letzten 10 Antworten', () => {
    let profile = createProfile('Ben', 'owl');
    for (let i = 0; i < 3; i++) {
      profile = applyRoundResult(profile, {
        areaId: 'pinguinfelsen',
        family: 'add_100',
        level: 1,
        summary: summary(4, 4, 0),
        outcomes: ['first_try', 'first_try', 'first_try', i === 2 ? 'wrong' : 'first_try'],
        date: '2026-11-07',
      }).profile;
    }
    expect(profile.skills.add_100!.last).toHaveLength(10);
    expect(profile.skills.add_100!.last.at(-1)).toBe(0);
    expect(profile.areas.pinguinfelsen!.rounds).toBe(3);
  });
});
