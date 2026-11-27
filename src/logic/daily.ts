import { areaStates, profileGrade } from './areas';
import { areaFamilies, enclosures } from './content';
import { confidence, daysBetween } from './skills';
import type { GameContent } from '../types/content';
import type { Profile } from '../types/save';
import type { TaskLevel } from '../types/task';

export type DailyItem = { family: string; areaId: string; level: TaskLevel };

/**
 * Tagesfutter (Spezifikation 7): Themen aus offenen Gehegen, zuerst die mit der längsten
 * Pause (ab dailyPauseDays Tagen), dann die mit der niedrigsten Sicherheit; reicht das nicht,
 * kommen noch nicht geübte Themen dazu. Je Thema eine Aufgabe auf der Stufe des Kindes.
 */
export function dailyPlan(content: GameContent, profile: Profile, today: string): DailyItem[] {
  const r = content.rules.skill;
  const states = areaStates(content, profile);
  const candidates: Array<{ family: string; areaId: string }> = [];
  for (const area of enclosures(content)) {
    if (states[area.id] !== 'open') continue;
    for (const family of areaFamilies(area)) {
      if (!candidates.some((c) => c.family === family))
        candidates.push({ family, areaId: area.id });
    }
  }
  const played = candidates
    .filter((c) => profile.skills[c.family])
    .map((c) => {
      const skill = profile.skills[c.family]!;
      const pause = daysBetween(skill.lastPlayed, today);
      return { ...c, pause, conf: confidence(skill.last) ?? 0.5 };
    })
    .sort((a, b) => {
      const ao = a.pause >= r.dailyPauseDays;
      const bo = b.pause >= r.dailyPauseDays;
      if (ao !== bo) return ao ? -1 : 1;
      if (ao) return b.pause - a.pause || a.conf - b.conf;
      return a.conf - b.conf || b.pause - a.pause;
    });
  const fresh = candidates.filter((c) => !profile.skills[c.family]);
  return [...played, ...fresh]
    .slice(0, profileGrade(profile) === 1 ? content.rules.gradeOne.dailyTasks : r.dailyTasks)
    .map((c) => ({
      family: c.family,
      areaId: c.areaId,
      level: profile.skills[c.family]?.level ?? 1,
    }));
}
