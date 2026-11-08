import { analog, digital, HALF_DAY, hour12, minuteType, timeLabel, wrapDay } from '../clock';
import { choice, num, nums } from '../params';
import type { Rng } from '../rng';
import type { FamilyParams } from '../../types/content';
import type { Generator, Hint, Task, TaskOption, TextParams } from '../../types/task';

/**
 * Futteruhr: Uhrzeiten lesen und einstellen (KE: volle, halbe, Viertel- und
 * Dreiviertelstunde; analog und digital). Eine Familie je Zeitart, die Stufen wechseln die
 * Aufgabenart (families.json, Parameter `mode` und `minutes`):
 * - read: Uhr lesen, Antwortkarten mit gesprochener Uhrzeit („halb 8“)
 * - set: Zeiger einstellen („Stelle halb 8 ein.“)
 * - later: Zeitspanne weiter- oder zurückrechnen („Wie spät ist es in einer halben Stunde?“)
 * - toDigital: Uhr lesen und digital schreiben, auf Wunsch am Nachmittag („19:30“)
 * - setDigital: Digitalzeit am Nachmittag auf der analogen Uhr einstellen
 */
export const CLOCK_FAMILIES = ['clock_full', 'clock_half', 'clock_quarter', 'clock_digital'];

const MODES = ['read', 'set', 'later', 'toDigital', 'setDigital'] as const;
type Mode = (typeof MODES)[number];

/** Minuten-Schrittweite beim Einstellen des langen Zeigers */
const SET_STEP = 5;

type Wrong = { value: string; errorTag: string; time?: number };

/** Lösung und falsche Antworten; die erste falsche ist immer dabei, die übrigen gemischt. */
function pickWrong(answer: string, wrong: readonly Wrong[], count: number, rng: Rng): Wrong[] {
  const seen = new Set([answer]);
  const unique = wrong.filter((w) => !seen.has(w.value) && seen.add(w.value));
  const [first, ...rest] = unique;
  return first ? [first, ...rng.shuffle(rest)].slice(0, count - 1) : [];
}

const labelOption = (time: number, errorTag?: string): TaskOption => ({
  value: analog(time),
  label: timeLabel(time),
  ...(errorTag ? { errorTag } : {}),
});

/** Typische Lesefehler je Zeitart, als Uhrzeiten. */
function readingErrors(time: number): Array<{ time: number; errorTag: string }> {
  const type = minuteType(time);
  const h = hour12(time);
  const at = (hour: number, minute: number) => wrapDay(hour * 60 + minute);
  if (type === 'full') {
    return [
      { time: at(h + 1, 0), errorTag: 'hour_off' },
      // langer und kurzer Zeiger verwechselt: „12 Uhr“
      ...(h !== 12 ? [{ time: at(12, 0), errorTag: 'hands_swapped' }] : []),
      { time: at(h - 1, 0), errorTag: 'hour_off' },
    ];
  }
  if (type === 'half') {
    return [
      // „halb 7“ statt „halb 8“: die Stunde, die gerade war
      { time: at(h - 1, 30), errorTag: 'half_hour_off' },
      { time: at(h, 0), errorTag: 'minutes_ignored' },
      { time: at(h + 1, 30), errorTag: 'hour_off' },
    ];
  }
  if (type === 'quarterPast') {
    return [
      { time: at(h, 45), errorTag: 'quarter_direction' },
      { time: at(h - 1, 15), errorTag: 'hour_off' },
      { time: at(h - 1, 45), errorTag: 'quarter_direction' },
    ];
  }
  return [
    { time: at(h, 15), errorTag: 'quarter_direction' },
    { time: at(h - 1, 45), errorTag: 'hour_off' },
    { time: at(h + 1, 15), errorTag: 'quarter_direction' },
  ];
}

/** Hinweise beim Lesen und Einstellen: erst der lange Zeiger, dann der kurze, dann die Lösung. */
function clockHints(time: number, set: boolean): [Hint, Hint, Hint] {
  const type = minuteType(time);
  const { key, params } = timeLabel(time);
  const p: TextParams = { ...params, label: `@${key}` };
  return set
    ? [
        { key: 'hint.clock.set.1' },
        { key: `hint.clock.set.2.${type}`, params: p },
        { key: 'hint.clock.set.3', params: p },
      ]
    : [
        { key: `hint.clock.read.1.${type}` },
        { key: `hint.clock.read.2.${type}`, params: p },
        { key: 'hint.clock.read.3', params: p },
      ];
}

function base(
  family: string,
  level: Task['level'],
  id: string,
  mode: Mode,
  time: number,
): Pick<Task, 'id' | 'family' | 'level' | 'strategyId' | 'dedupeKey'> {
  return { id, family, level, strategyId: family, dedupeKey: `${family}:${mode}:${time}` };
}

/** Zeit aus Stunde (1 bis 12) und Minuten; am Nachmittag 12 Stunden später. */
function randomTime(rng: Rng, params: FamilyParams, afternoon: boolean): number {
  const minute = rng.pick(nums(params, 'minutes'));
  // Nachmittags und abends: 13 bis 22 Uhr, damit die Digitalzeit zweistellig ist
  const hour = afternoon ? rng.int(1, 10) + 12 : rng.int(1, 12);
  return wrapDay(hour * 60 + minute);
}

export const clockFor =
  (family: string): Generator =>
  (level, rng, id, params): Task => {
    const mode = choice(params, 'mode', MODES);
    const afternoon = params.level.afternoon === 1;
    const time = randomTime(rng, params, afternoon);
    const label = timeLabel(time);

    if (mode === 'read') {
      const wrong = pickWrong(
        analog(time),
        readingErrors(time).map((e) => ({
          value: analog(e.time),
          errorTag: e.errorTag,
          time: e.time,
        })),
        3,
        rng,
      );
      return {
        ...base(family, level, id, mode, time),
        kind: 'choice',
        prompt: { terms: [], textKey: 'task.prompt.clockRead' },
        answer: analog(time),
        options: rng.shuffle([
          labelOption(time),
          ...wrong.map((w) => labelOption(w.time!, w.errorTag)),
        ]),
        hints: clockHints(time, false),
        clock: { time, face: true },
      };
    }

    if (mode === 'set' || mode === 'setDigital') {
      const errors = readingErrors(time).map((e) => ({
        value: analog(e.time),
        errorTag: e.errorTag,
      }));
      const prompt: { textKey: string; textParams: TextParams } =
        mode === 'set'
          ? {
              textKey: 'task.prompt.clockSet',
              textParams: { ...label.params, time: `@${label.key}` },
            }
          : { textKey: 'task.prompt.clockSetDigital', textParams: { digital: digital(time) } };
      const hints = clockHints(time, true);
      if (mode === 'setDigital') {
        hints[0] = {
          key: 'hint.clock.setDigital.1',
          params: { h24: Math.floor(time / 60), h: hour12(time) },
        };
      }
      return {
        ...base(family, level, id, mode, time),
        kind: 'clock',
        prompt: { terms: [], ...prompt, instructionKey: 'task.clock.drag' },
        answer: analog(time),
        hints,
        clock: { time, face: false, set: { step: SET_STEP } },
        // je Wert nur die erste (wichtigste) Fehlerart
        errorAnswers: errors.filter(
          (e, i) => e.value !== analog(time) && errors.findIndex((f) => f.value === e.value) === i,
        ),
      };
    }

    if (mode === 'later') {
      const span = num(params, 'span');
      const forward = rng.chance(0.5);
      const target = wrapDay(time + (forward ? span : -span));
      const other = wrapDay(time + (forward ? -span : span));
      const wrong = pickWrong(
        analog(target),
        [
          { value: analog(other), errorTag: 'later_earlier', time: other },
          ...readingErrors(target).map((e) => ({
            value: analog(e.time),
            errorTag: e.errorTag === 'hands_swapped' ? 'hour_off' : e.errorTag,
            time: e.time,
          })),
        ],
        3,
        rng,
      );
      const answerLabel = timeLabel(target);
      const direction = forward ? 'forward' : 'back';
      const p: TextParams = {
        ...answerLabel.params,
        label: `@${answerLabel.key}`,
        now: digital(time % HALF_DAY === 0 ? HALF_DAY : time % HALF_DAY),
        answer: digital(target % HALF_DAY === 0 ? HALF_DAY : target % HALF_DAY),
        minutes: span,
      };
      return {
        ...base(family, level, id, mode, time),
        dedupeKey: `${family}:${mode}:${time}:${direction}`,
        kind: 'choice',
        prompt: {
          terms: [],
          textKey: `task.prompt.clock${forward ? 'Later' : 'Earlier'}.${span}`,
        },
        answer: analog(target),
        options: rng.shuffle([
          labelOption(target),
          ...wrong.map((w) => labelOption(w.time!, w.errorTag)),
        ]),
        hints: [
          { key: 'hint.clock.later.1' },
          { key: `hint.clock.later.2.${direction}`, params: p },
          { key: `hint.clock.later.3.${direction}`, params: p },
        ],
        clock: { time, face: true },
      };
    }

    // toDigital: Uhr lesen und digital schreiben
    const answer = digital(time);
    const h = Math.floor(time / 60);
    const m = time % 60;
    const two = (n: number) => String(n).padStart(2, '0');
    const candidates: Wrong[] = [
      ...(afternoon ? [{ value: `${h - 12}:${two(m)}`, errorTag: 'twelve_hours' }] : []),
      ...(m === 30 ? [{ value: `${h + 1}:30`, errorTag: 'half_hour_off' }] : []),
      ...(m > 0 ? [{ value: `${h}:${two(m / 5)}`, errorTag: 'minute_number' }] : []),
      ...(m === 45 ? [{ value: `${h}:15`, errorTag: 'quarter_direction' }] : []),
      ...(m === 15 ? [{ value: `${h}:45`, errorTag: 'quarter_direction' }] : []),
      { value: `${h + 1}:${two(m)}`, errorTag: 'hour_off' },
      { value: `${h - 1 === 0 ? 12 : h - 1}:${two(m)}`, errorTag: 'hour_off' },
      { value: `${h}:${two((m + 30) % 60)}`, errorTag: 'minute_hand' },
      // langen und kurzen Zeiger verwechselt: Stunde 12, Minuten von der Stundenzahl
      ...(m === 0 && h % 12 !== 0
        ? [{ value: `12:${two((h % 12) * 5)}`, errorTag: 'hands_swapped' }]
        : []),
    ];
    const wrong = pickWrong(answer, candidates, 4, rng);
    const p: TextParams = { ...label.params, label: `@${label.key}`, digital: answer };
    return {
      ...base(family, level, id, mode, time),
      kind: 'choice',
      prompt: {
        terms: [],
        textKey: afternoon
          ? `task.prompt.clockDigital.${h >= 18 ? 'evening' : 'afternoon'}`
          : 'task.prompt.clockDigital',
      },
      answer,
      options: rng.shuffle([
        { value: answer },
        ...wrong.map((w) => ({ value: w.value, errorTag: w.errorTag })),
      ]),
      hints: [
        { key: afternoon ? 'hint.clock.digital.afternoon.1' : 'hint.clock.digital.1' },
        { key: `hint.clock.digital.2.${minuteType(time)}`, params: p },
        { key: 'hint.clock.digital.3', params: p },
      ],
      clock: { time, face: true },
    };
  };
