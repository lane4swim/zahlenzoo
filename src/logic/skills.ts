import type { Rules } from '../types/content';
import type { AnswerOutcome } from '../types/round';
import type { AnswerScore, SkillState } from '../types/save';
import type { TaskLevel } from '../types/task';

export const SCORE: Record<AnswerOutcome, AnswerScore> = { first_try: 1, with_help: 0.5, wrong: 0 };

/**
 * Sicherheit: gewichteter Anteil richtiger Antworten (1 / 0,5 / 0); die neueste Antwort zählt
 * am stärksten (Gewichte 1, 2, 3, … von alt nach neu). Ohne Antworten: undefined.
 */
export function confidence(last: readonly AnswerScore[]): number | undefined {
  if (last.length === 0) return undefined;
  let sum = 0;
  let weights = 0;
  last.forEach((score, i) => {
    sum += score * (i + 1);
    weights += i + 1;
  });
  return sum / weights;
}

export type SkillChange = 'up' | 'down' | undefined;

export type SkillInput = {
  level: TaskLevel;
  outcomes: readonly AnswerOutcome[];
  date: string;
  errors?: readonly string[];
  times?: readonly number[];
  tempoMs?: number;
};

/**
 * Trägt die Antworten einer Runde in das Kompetenzmodell einer Familie ein und wendet die
 * Regeln an (Spezifikation 7): Stufe steigt ab hoher Sicherheit mit genug Antworten, sinkt bei
 * geringer Sicherheit über die letzten Antworten; danach beginnt die Liste der Stufe neu.
 */
export function updateSkill(
  prev: SkillState | undefined,
  input: SkillInput,
  rules: Pick<Rules, 'skill' | 'skillHistory' | 'maxLevel'>,
): { skill: SkillState; change: SkillChange } {
  const r = rules.skill;
  const history = prev !== undefined && prev.level === input.level ? prev.last : [];
  const last = [...history, ...input.outcomes.map((o) => SCORE[o])].slice(-rules.skillHistory);
  const errors = { ...(prev?.errors ?? {}) };
  for (const tag of input.errors ?? []) errors[tag] = (errors[tag] ?? 0) + 1;
  const times = [...(prev?.times ?? []), ...(input.times ?? [])].slice(-20);
  const tempoBest =
    input.tempoMs !== undefined
      ? Math.min(prev?.tempoBest ?? Infinity, input.tempoMs)
      : prev?.tempoBest;

  let level = input.level;
  let change: SkillChange;
  // Hilfe bleibt, solange das Kind nicht freiwillig eine höhere Stufe spielt.
  let support = (prev?.support ?? false) && input.level <= (prev?.level ?? 1);
  const all = confidence(last) ?? 0;
  const recent = confidence(last.slice(-r.downWindow)) ?? 1;
  if (last.length >= r.upMin && all >= r.upConfidence && level < rules.maxLevel) {
    level = (level + 1) as TaskLevel;
    change = 'up';
    support = false;
  } else if (last.length >= r.downWindow && recent < r.downConfidence && level > 1) {
    level = (level - 1) as TaskLevel;
    change = 'down';
    support = true;
  } else if (support && all >= 0.7) {
    support = false;
  }
  const skill: SkillState = {
    level,
    last: change ? [] : last,
    lastPlayed: input.date,
    ...(support ? { support } : {}),
    ...(Object.keys(errors).length ? { errors } : {}),
    ...(times.length ? { times } : {}),
    ...(tempoBest !== undefined && Number.isFinite(tempoBest) ? { tempoBest } : {}),
  };
  return { skill, change };
}

/** Häufigste Fehlerart einer Familie (für die Übersicht). */
export function topError(skill: SkillState | undefined): string | undefined {
  const entries = Object.entries(skill?.errors ?? {});
  if (entries.length === 0) return undefined;
  return entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]![0];
}

/** Tempo-Runde anbieten: ab Stufe tempoMinLevel, sicher und mindestens so schnell wie sonst. */
export function tempoOffered(skill: SkillState | undefined, rules: Pick<Rules, 'skill'>): boolean {
  if (!skill || skill.level < rules.skill.tempoMinLevel) return false;
  const c = confidence(skill.last);
  if (c === undefined || skill.last.length < 4 || c < rules.skill.tempoConfidence) return false;
  const t = skill.times ?? [];
  if (t.length < 5) return true;
  const mean = (l: readonly number[]) => l.reduce((a, b) => a + b, 0) / l.length;
  return mean(t.slice(-5)) <= mean(t) * 1.05;
}

/** Fehlerarten einer Runde: Welche ist zum n-ten Mal aufgetreten (Erklärung fällig)? */
export function explainDue(tags: readonly string[], tag: string, after: number): boolean {
  return tags.filter((t) => t === tag).length === after;
}

/** Tage zwischen zwei Daten (JJJJ-MM-TT). */
export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

/** Zeit als m:ss für die Stoppuhr der Tempo-Runde. */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
