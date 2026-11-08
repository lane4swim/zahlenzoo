import type { Rng } from './rng';
import type { FamilyParams, Rules } from '../types/content';
import type { AnswerOutcome, RoundSummary } from '../types/round';
import type { Generator, Task, TaskLevel } from '../types/task';

/** Unveränderlicher Zustand einer Runde. */
export type Round = {
  readonly tasks: readonly Task[];
  readonly outcomes: readonly AnswerOutcome[];
};

export function createRound(tasks: readonly Task[]): Round {
  if (tasks.length === 0) throw new RangeError('createRound(): Runde ohne Aufgaben');
  const ids = new Set(tasks.map((task) => task.id));
  if (ids.size !== tasks.length) throw new RangeError('createRound(): doppelte Aufgaben-IDs');
  return { tasks: [...tasks], outcomes: [] };
}

export function isFinished(round: Round): boolean {
  return round.outcomes.length >= round.tasks.length;
}

export function currentTask(round: Round): Task | undefined {
  return round.tasks[round.outcomes.length];
}

export function recordOutcome(round: Round, outcome: AnswerOutcome): Round {
  if (isFinished(round)) throw new RangeError('recordOutcome(): Runde ist schon beendet');
  return { tasks: round.tasks, outcomes: [...round.outcomes, outcome] };
}

/** Hängt eine Aufgabe an (z. B. Wiederholung derselben Familie nach drei Fehlversuchen). */
export function appendTask(round: Round, task: Task): Round {
  if (round.tasks.some((t) => t.id === task.id)) {
    throw new RangeError('appendTask(): doppelte Aufgaben-ID');
  }
  return { tasks: [...round.tasks, task], outcomes: round.outcomes };
}

export function progress(round: Round): { done: number; total: number } {
  return { done: round.outcomes.length, total: round.tasks.length };
}

export function summarize(round: Round): RoundSummary {
  const count = (outcome: AnswerOutcome) => round.outcomes.filter((o) => o === outcome).length;
  return {
    total: round.outcomes.length,
    firstTry: count('first_try'),
    withHelp: count('with_help'),
    wrong: count('wrong'),
  };
}

// ---------------------------------------------------------------------------
// Rundenzusammenstellung (Spezifikation, Abschnitt 7)

/** Versuche, eine neue (nicht doppelte) Aufgabe zu erzeugen, bevor aufgegeben wird. */
const MAX_TRIES = 200;

/**
 * Anzahl Aufgaben je Stufe nach rules.json (Start: 70 % aktuell, 20 % Vorstufe,
 * 10 % nächste Stufe). Ohne Vor- oder Folgestufe fällt der Anteil der aktuellen zu;
 * gibt es eine nächste Stufe, ist mindestens eine Aufgabe daraus dabei.
 */
export function levelMix(
  level: TaskLevel,
  size: number,
  rules: Pick<Rules, 'round' | 'maxLevel'>,
): Array<[TaskLevel, number]> {
  const { mix } = rules.round;
  const prev = level > 1 ? Math.round(size * mix.previous) : 0;
  const next =
    level < rules.maxLevel && mix.next > 0 ? Math.max(1, Math.round(size * mix.next)) : 0;
  const current = size - prev - next;
  const result: Array<[TaskLevel, number]> = [[level, current]];
  if (prev > 0) result.push([(level - 1) as TaskLevel, prev]);
  if (next > 0) result.push([(level + 1) as TaskLevel, next]);
  return result;
}

/**
 * Ordnet Aufgaben leicht ansteigend: erst leichter, in der Mitte schwerer,
 * am Ende wieder leichter. Gleich schwere Aufgaben werden gemischt.
 */
export function hillOrder<T>(items: readonly T[], difficulty: (item: T) => number, rng: Rng): T[] {
  const sorted = rng.shuffle(items).sort((x, y) => difficulty(x) - difficulty(y));
  const front: T[] = [];
  const back: T[] = [];
  sorted.forEach((item, i) => (i % 2 === 0 ? front : back).push(item));
  return [...front, ...back.reverse()];
}

/** Parameter je Stufe aus families.json. */
export type ParamsFor = (level: TaskLevel) => FamilyParams;

export type ComposeOptions = {
  family: string;
  generator: Generator;
  params: ParamsFor;
  level: TaskLevel;
  rng: Rng;
  rules: Pick<Rules, 'round' | 'maxLevel'>;
  size?: number;
};

/** Erzeugt Aufgaben ohne Duplikate (Tauschaufgaben zählen als gleich). */
export class TaskFactory {
  private readonly used = new Set<string>();
  private counter = 0;

  constructor(
    private readonly family: string,
    private readonly generator: Generator,
    private readonly params: ParamsFor,
    private readonly rng: Rng,
  ) {}

  next(level: TaskLevel): Task {
    const params = this.params(level);
    for (let i = 0; i < MAX_TRIES; i++) {
      const task = this.generator(level, this.rng, `${this.family}-${this.counter + 1}`, params);
      if (this.used.has(task.dedupeKey)) continue;
      this.used.add(task.dedupeKey);
      this.counter++;
      return task;
    }
    throw new Error(`TaskFactory: keine neue Aufgabe für ${this.family} Stufe ${level}`);
  }
}

export function composeRound(options: ComposeOptions): { round: Round; factory: TaskFactory } {
  const { round } = options.rules;
  const size = options.size ?? round.size;
  if (size < round.minSize || size > round.maxSize) {
    throw new RangeError(
      `composeRound(): ${size} Aufgaben, erlaubt ${round.minSize} bis ${round.maxSize}`,
    );
  }
  const factory = new TaskFactory(options.family, options.generator, options.params, options.rng);
  const tasks: Task[] = [];
  for (const [level, count] of levelMix(options.level, size, options.rules)) {
    for (let i = 0; i < count; i++) tasks.push(factory.next(level));
  }
  const ordered = hillOrder(tasks, (t) => t.level, options.rng);
  return { round: createRound(ordered), factory };
}
