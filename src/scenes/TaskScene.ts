import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { findArea } from '../logic/areas';
import { check } from '../logic/check';
import { createRng } from '../logic/rng';
import {
  appendTask,
  composeRound,
  currentTask,
  isFinished,
  progress,
  recordOutcome,
  summarize,
  type Round,
  type TaskFactory,
} from '../logic/rounds';
import type { Services } from '../services/services';
import { GameEvent, type AnswerSubmittedPayload, type RoundFinishedPayload } from '../types/events';
import type { AnswerOutcome } from '../types/round';
import { SceneKey, type TaskSceneData } from '../types/scenes';
import type { CheckResult, Hint, Task, TaskLevel } from '../types/task';
import { AnswerCards } from '../ui/AnswerCards';
import { Button } from '../ui/Button';
import { Expression } from '../ui/Expression';
import { HintPanel } from '../ui/HintPanel';
import {
  drawHundredBoardIcon,
  drawNumberLineIcon,
  drawSpeaker,
  drawTensOnesIcon,
} from '../ui/icons';
import { HundredBoard } from '../ui/math/HundredBoard';
import { NumberLine } from '../ui/math/NumberLine';
import { TensOnes } from '../ui/math/TensOnes';
import { Numpad } from '../ui/Numpad';
import { Penguin } from '../ui/Penguin';
import { ProgressDots } from '../ui/ProgressDots';
import { Color, Layout, reducedMotion, Tex } from '../ui/theme';

/** Versuche je Aufgabe, danach wird der Rechenweg gezeigt (Spezifikation, Abschnitt 8). */
const MAX_ATTEMPTS = 3;
/** Höchstens so viele Wiederholungen hängt eine Runde an. */
const MAX_REPEATS = 2;
const PRAISE_COUNT = 6;
const NEXT_DELAY = 1400;

type Aid = 'tensOnes' | 'numberLine' | 'hundredBoard';

// Aufteilung der Fläche 1024 × 768
const PANEL = { x: 600, y: 300, width: 760 };
const VISUAL_Y = 420;
const INPUT_Y = 648;

/**
 * Aufgabenansicht: Tier links, Rechnung oben, Hinweise in der Mitte, Eingabe unten.
 * Ablauf je Aufgabe: richtig → Lob und weiter; falsch → Hinweis 1 und zweiter Versuch;
 * wieder falsch → Hinweis 2 mit Rechenstrich und dritter Versuch; wieder falsch →
 * Rechenweg, dieselbe Familie kommt später in der Runde noch einmal.
 */
export class TaskScene extends BaseScene<TaskSceneData> {
  private areaId = '';
  private level: TaskLevel = 1;
  private family = '';
  private round!: Round;
  private factory!: TaskFactory;
  private task!: Task;
  private attempts = 0;
  private hintStage = 0;
  private usedHelp = false;
  private locked = false;
  private repeats = 0;
  private praiseIndex = 0;
  private aid: Aid | undefined;
  private strategies: Array<{ strategyId: string; outcome: AnswerOutcome }> = [];

  private penguin!: Penguin;
  private dots!: ProgressDots;
  private panel!: HintPanel;
  private expression?: Expression;
  private answerInput?: Numpad | AnswerCards;
  private feedbackIcon?: Phaser.GameObjects.Image;
  private nextButton?: Button;

  constructor(services: Services) {
    super(SceneKey.Task, services);
  }

  protected override onInit(data: TaskSceneData): void {
    this.areaId = data.areaId;
    this.level = data.level;
    this.repeats = 0;
    this.strategies = [];
    this.aid = undefined;
    const area = findArea(data.areaId);
    if (!area?.family) throw new Error(`Bereich ${data.areaId} hat keine Aufgaben`);
    this.family = area.family.id;
    // Startwert aus der Uhrzeit: jede Runde ist anders, im Test aber reproduzierbar.
    const rng = createRng(Date.now() >>> 0);
    this.praiseIndex = rng.int(0, PRAISE_COUNT - 1);
    const composed = composeRound({
      family: area.family.id,
      generator: area.family.generator,
      level: data.level,
      rng,
    });
    this.round = composed.round;
    this.factory = composed.factory;
  }

  create(): void {
    const { width } = this.scale;
    this.add.rectangle(0, 0, width, 132, Color.himmel).setOrigin(0);
    this.addBackButton(() => this.scene.start(SceneKey.Map), this.t('task.toMap'));
    this.dots = new ProgressDots(this, width / 2 - 40, Layout.margin + Layout.minTouch / 2);
    this.addButton({
      x: width - Layout.margin - 48 - 112,
      y: Layout.margin + 48,
      width: 96,
      label: this.t('task.readAloud'),
      drawIcon: drawSpeaker,
      onPress: () => this.readAloud(),
    });
    this.addButton({
      x: width - Layout.margin - 48,
      y: Layout.margin + 48,
      width: 96,
      label: this.t('task.hint'),
      icon: Tex.hint,
      iconScale: 0.45,
      onPress: () => this.showNextHint(),
    });

    this.penguin = new Penguin(this, 120, 330).setScale(0.7);
    this.createAidButtons();

    this.panel = new HintPanel(this, PANEL.x, PANEL.y, PANEL.width);
    this.listen(this.events, GameEvent.AnswerSubmitted, this.onAnswer);
    this.listen(this.events, GameEvent.RoundFinished, this.onRoundFinished);
    this.showTask();
  }

  // -------------------------------------------------------------------------
  // Aufbau einer Aufgabe

  private createAidButtons(): void {
    const aids: Array<[Aid, (g: Phaser.GameObjects.Graphics) => void]> = [
      ['tensOnes', drawTensOnesIcon],
      ['numberLine', drawNumberLineIcon],
      ['hundredBoard', drawHundredBoardIcon],
    ];
    aids.forEach(([aid, icon], i) => {
      this.addButton({
        x: Layout.margin + 48,
        y: 420 + i * 112,
        width: 96,
        drawIcon: icon,
        onPress: () => this.toggleAid(aid),
      });
    });
  }

  private showTask(): void {
    const task = currentTask(this.round);
    if (!task) return;
    this.task = task;
    this.attempts = 0;
    this.hintStage = 0;
    this.usedHelp = false;
    this.locked = false;
    this.penguin.idle();
    this.panel.clear();
    this.feedbackIcon?.destroy();
    this.nextButton?.destroy();
    this.nextButton = undefined;
    this.expression?.destroy();
    this.answerInput?.destroy();

    const { done, total } = progress(this.round);
    this.dots.setProgress(done, total);

    this.expression = new Expression(this, PANEL.x, 200, task.prompt.terms);
    this.expression.setAnswer('');
    if (task.kind === 'choice' && task.options) {
      this.answerInput = new AnswerCards(this, PANEL.x, INPUT_Y, task.options, (value) =>
        this.submit(value),
      );
    } else {
      this.answerInput = new Numpad(this, {
        x: PANEL.x,
        y: INPUT_Y,
        okLabel: this.t('common.ok'),
        onChange: (value) => this.expression?.setAnswer(value),
        onSubmit: (value) => this.submit(value),
      });
    }
    if (this.aid) this.showAid(this.aid);
  }

  private submit(value: string): void {
    const payload: AnswerSubmittedPayload = { taskId: this.task.id, input: value };
    this.events.emit(GameEvent.AnswerSubmitted, payload);
  }

  // -------------------------------------------------------------------------
  // Antworten

  private onAnswer(payload: AnswerSubmittedPayload): void {
    if (this.locked || payload.taskId !== this.task.id) return;
    const result = check(this.task, payload.input);
    if (result.invalid) return;
    if (this.answerInput instanceof AnswerCards) this.expression?.setAnswer(String(payload.input));
    if (result.correct) this.onCorrect(String(payload.input));
    else this.onWrong(String(payload.input), result);
  }

  private onCorrect(value: string): void {
    this.locked = true;
    this.lockInput(true);
    const outcome: AnswerOutcome =
      this.attempts === 0 && !this.usedHelp ? 'first_try' : 'with_help';
    this.expression?.setAnswer(value, 'correct');
    if (this.answerInput instanceof AnswerCards) this.answerInput.markCorrect(value);
    this.showFeedbackIcon(Tex.correct);
    this.penguin.cheer();
    const praise =
      outcome === 'first_try'
        ? this.t(`praise.${(this.praiseIndex++ % PRAISE_COUNT) + 1}`)
        : this.t('praise.withHelp');
    this.panel.show(praise, Tex.correct);
    this.finishTask(outcome);
    this.time.delayedCall(NEXT_DELAY, () => this.advance());
  }

  private onWrong(value: string, result: CheckResult): void {
    this.attempts++;
    this.penguin.think();
    if (this.answerInput instanceof AnswerCards) this.answerInput.markWrong(value);
    if (this.answerInput instanceof Numpad) this.answerInput.clear();

    if (this.attempts >= MAX_ATTEMPTS) {
      this.showSolution();
      return;
    }
    this.hintStage = Math.max(this.hintStage, this.attempts);
    const hint = this.task.hints[this.hintStage - 1];
    const prefix =
      result.errorTag && this.services.i18n.has(`error.${result.errorTag}`)
        ? `${this.t(`error.${result.errorTag}`)} `
        : '';
    if (hint) this.showHint(hint, `${prefix}${this.hintText(hint)}`, Tex.tryAgain);
  }

  private showSolution(): void {
    this.locked = true;
    this.lockInput(true);
    this.hintStage = 3;
    const hint = this.task.hints[2];
    this.expression?.setAnswer(String(this.task.answer), 'solution');
    this.showHint(hint, `${this.hintText(hint)} ${this.t('task.solutionShown')}`, Tex.hint);
    this.finishTask('wrong');
    if (this.repeats < MAX_REPEATS) {
      this.repeats++;
      this.round = appendTask(this.round, this.factory.next(this.task.level));
    }
    // Die Eingabe weicht dem Weiter-Knopf, damit klar ist, was als Nächstes zu tun ist.
    this.answerInput?.destroy();
    this.answerInput = undefined;
    this.nextButton = this.addButton({
      x: PANEL.x,
      y: INPUT_Y,
      width: 260,
      label: this.t('common.next'),
      fill: Color.grasHell,
      onPress: () => this.advance(),
    });
  }

  private finishTask(outcome: AnswerOutcome): void {
    this.round = recordOutcome(this.round, outcome);
    if (this.task.strategyId) {
      this.strategies.push({ strategyId: this.task.strategyId, outcome });
    }
    const { done, total } = progress(this.round);
    this.dots.setProgress(done, total);
  }

  private advance(): void {
    if (!isFinished(this.round)) {
      this.showTask();
      return;
    }
    const payload: RoundFinishedPayload = {
      areaId: this.areaId,
      family: this.family,
      level: this.level,
      summary: summarize(this.round),
      outcomes: [...this.round.outcomes],
      strategies: this.strategies,
    };
    this.events.emit(GameEvent.RoundFinished, payload);
  }

  private onRoundFinished(payload: RoundFinishedPayload): void {
    this.services.audio.stop();
    this.scene.start(SceneKey.RoundEnd, payload);
  }

  private lockInput(locked: boolean): void {
    this.answerInput?.setLocked(locked);
  }

  private showFeedbackIcon(texture: string): void {
    this.feedbackIcon?.destroy();
    if (!this.expression) return;
    this.feedbackIcon = this.add.image(this.expression.rightEdge + 50, 200, texture).setScale(0.8);
    if (!reducedMotion()) {
      this.feedbackIcon.setScale(0);
      this.tweens.add({
        targets: this.feedbackIcon,
        scale: 0.8,
        duration: 250,
        ease: 'Back.easeOut',
      });
    }
  }

  // -------------------------------------------------------------------------
  // Hinweise, Hilfen, Vorlesen

  private hintText(hint: Hint): string {
    return this.t(hint.key, hint.params);
  }

  private showHint(hint: Hint, text: string, icon: string): void {
    this.aid = undefined;
    const visual = hint.visual
      ? new NumberLine(
          this,
          PANEL.x,
          VISUAL_Y + 30,
          PANEL.width - 80,
          hint.visual.start,
          hint.visual.jumps,
          hint.visual.hideResults,
        )
      : undefined;
    this.panel.show(text, icon, visual);
  }

  /** Hinweis-Knopf: nächste Hilfestufe; die Antwort zählt dann als „mit Hilfe“. */
  private showNextHint(): void {
    if (this.locked) return;
    this.usedHelp = true;
    this.hintStage = Math.min(3, this.hintStage + 1);
    const hint = this.task.hints[this.hintStage - 1];
    if (hint) this.showHint(hint, this.hintText(hint), Tex.hint);
  }

  private toggleAid(aid: Aid): void {
    if (this.aid === aid) {
      this.aid = undefined;
      this.panel.clear();
      return;
    }
    this.aid = aid;
    this.showAid(aid);
  }

  private showAid(aid: Aid): void {
    const m = this.task.math;
    if (!m) return;
    const known = m.missing === 'b' ? [m.a, m.result] : [m.a, m.b];
    let visual: Phaser.GameObjects.GameObject;
    if (aid === 'tensOnes') visual = new TensOnes(this, PANEL.x, VISUAL_Y - 10, known);
    else if (aid === 'numberLine')
      visual = new NumberLine(this, PANEL.x, VISUAL_Y + 30, PANEL.width - 80, m.a, []);
    else visual = new HundredBoard(this, PANEL.x, VISUAL_Y - 30, known);
    this.panel.show(aid === 'hundredBoard' ? '' : this.t(`task.aid.${aid}`), undefined, visual);
  }

  private readAloud(): void {
    const terms = this.task.prompt.terms
      .map((term) => {
        if (term === '+') return this.t('read.plus');
        if (term === '-') return this.t('read.minus');
        if (term === '=') return this.t('read.equals');
        if (term === '?') return this.t('read.unknown');
        return String(term);
      })
      .join(' ');
    const extra = this.panel.message ? `. ${this.panel.message}` : '';
    this.services.audio.speak(`${terms}${extra}`);
  }
}
