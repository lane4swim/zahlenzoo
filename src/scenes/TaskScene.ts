import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { familyParams, findArea } from '../logic/content';
import { GENERATORS } from '../logic/generators';
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
import type { CheckResult, Hint, Task, TaskLevel, Visual } from '../types/task';
import { AnimalSprite } from '../ui/AnimalSprite';
import { taskBackground } from '../ui/animals';
import { AnswerCards } from '../ui/AnswerCards';
import { Button } from '../ui/Button';
import { Expression } from '../ui/Expression';
import { HintPanel } from '../ui/HintPanel';
import { DotArray } from '../ui/math/DotArray';
import { HundredBoard } from '../ui/math/HundredBoard';
import { NumberLine } from '../ui/math/NumberLine';
import { TenFrame } from '../ui/math/TenFrame';
import { TensOnes } from '../ui/math/TensOnes';
import { Numpad } from '../ui/Numpad';
import { ProgressDots } from '../ui/ProgressDots';
import { StoryPictureView } from '../ui/StoryPictureView';
import { Color, CssColor, FontFamily, FontSize, Layout, reducedMotion, Tex } from '../ui/theme';

const NEXT_DELAY = 1600;

type Aid = 'tensOnes' | 'numberLine' | 'hundredBoard';

// Aufteilung der Fläche 1024 × 768
const PANEL = { x: 624, y: 262, width: 712 };
/** Eingabe etwas weiter links als die Tafel, damit vier Antwortkarten Platz haben. */
const INPUT_X = 600;
const VISUAL_Y = 448;
const INPUT_Y = 648;
const ANIMAL_HEIGHT = 230;

/**
 * Aufgabenansicht: Tier links, Rechnung oben, Hinweise in der Mitte, Eingabe unten.
 * Ablauf je Aufgabe: richtig → Tier bekommt Futter, Lob, weiter; falsch → Hinweis 1
 * und zweiter Versuch; wieder falsch → Hinweis 2 mit Bild und dritter Versuch;
 * wieder falsch → Lösungsweg, dieselbe Familie kommt später in der Runde noch einmal.
 */
export class TaskScene extends BaseScene<TaskSceneData> {
  private areaId = '';
  private animalId = '';
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

  private animal?: AnimalSprite;
  private dots!: ProgressDots;
  private panel!: HintPanel;
  private expression?: Expression;
  private answerInput?: Numpad | AnswerCards;
  private feedbackIcon?: Phaser.GameObjects.Image;
  /** Text, Einheit und Bild einer Sachaufgabe */
  private storyObjects: Phaser.GameObjects.GameObject[] = [];
  private picture?: StoryPictureView;
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
    const content = this.content;
    const area = findArea(content, data.areaId);
    const family = data.family;
    const generator = GENERATORS[family];
    if (!area || !area.families.includes(family) || !generator) {
      throw new Error(`Bereich ${data.areaId} hat keine Aufgaben der Familie ${family}`);
    }
    this.family = family;
    this.animalId = area.animal;
    // Startwert aus der Uhrzeit: jede Runde ist anders, im Test aber reproduzierbar.
    const rng = createRng(Date.now() >>> 0);
    this.praiseIndex = rng.int(0, content.praise.firstTry.length - 1);
    const composed = composeRound({
      family,
      generator,
      params: (level) => familyParams(content, family, level),
      level: data.level,
      rng,
      rules: content.rules,
    });
    this.round = composed.round;
    this.factory = composed.factory;
  }

  create(): void {
    const { width } = this.scale;
    this.addBackground(taskBackground(this.areaId));

    const top = Layout.margin + Layout.minTouch / 2;
    this.addButton({
      x: Layout.margin + 48,
      y: top,
      width: 96,
      label: this.t('task.toMap'),
      icon: Tex.mapIcon,
      iconScale: 0.5,
      onPress: () => this.scene.start(SceneKey.Map),
    });
    this.dots = new ProgressDots(this, width / 2 - 20, top);
    this.addButton({
      x: width - Layout.margin - 48 - 112,
      y: top,
      width: 96,
      label: this.t('task.readAloud'),
      icon: Tex.speaker,
      iconScale: 0.5,
      onPress: () => this.readAloud(),
    });
    this.addButton({
      x: width - Layout.margin - 48,
      y: top,
      width: 96,
      label: this.t('task.hint'),
      icon: Tex.hint,
      iconScale: 0.45,
      onPress: () => this.showNextHint(),
    });

    const art = this.content.animals[this.animalId];
    if (art) {
      this.animal = new AnimalSprite(this, art.taskSpot.x, art.taskSpot.y, art, ANIMAL_HEIGHT);
    }
    this.createAidButtons();

    this.panel = new HintPanel(this, PANEL.x, PANEL.y, PANEL.width);
    this.listen(this.events, GameEvent.AnswerSubmitted, this.onAnswer);
    this.listen(this.events, GameEvent.RoundFinished, this.onRoundFinished);
    this.showTask();
  }

  // -------------------------------------------------------------------------
  // Aufbau einer Aufgabe

  private createAidButtons(): void {
    const aids: Array<[Aid, string]> = [
      ['tensOnes', Tex.aidTens],
      ['numberLine', Tex.aidLine],
      ['hundredBoard', Tex.aidHundred],
    ];
    aids.forEach(([aid, icon], i) => {
      this.addButton({
        x: Layout.margin + 48,
        y: 420 + i * 112,
        width: 96,
        icon,
        iconScale: 0.8,
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
    this.animal?.idle();
    this.feedbackIcon?.destroy();
    this.nextButton?.destroy();
    this.nextButton = undefined;
    this.expression?.destroy();
    this.answerInput?.destroy();
    for (const o of this.storyObjects) o.destroy();
    this.storyObjects = [];
    this.picture = undefined;

    const { done, total } = progress(this.round);
    this.dots.setProgress(done, total);

    if (task.prompt.story) {
      this.showStory(task);
    } else {
      this.panel.setY(PANEL.y);
      this.expression = new Expression(this, PANEL.x, 200, task.prompt.terms);
    }
    this.showQuestion();
    this.expression?.setAnswer('');
    if (task.options) {
      this.answerInput = new AnswerCards(this, INPUT_X, INPUT_Y, task.options, (value) =>
        this.submit(value),
      );
    } else {
      this.answerInput = new Numpad(this, {
        x: INPUT_X,
        y: INPUT_Y,
        okLabel: this.t('common.ok'),
        onChange: (value) => this.expression?.setAnswer(value),
        onSubmit: (value) => this.submit(value),
      });
    }
    if (this.aid) this.showAid(this.aid);
  }

  /**
   * Sachaufgabe: Text oben, darunter das Antwortkästchen mit Einheit, unten das Bild.
   * Der Hinweisbereich rückt unter das Antwortkästchen; das Bild bleibt bei Hinweisen stehen.
   */
  private showStory(task: Task): void {
    const story = task.prompt.story!;
    const left = PANEL.x - PANEL.width / 2;
    const text = this.add
      .text(left, 140, this.t(`story.${story.id}`, story.params), {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.text}px`,
        color: CssColor.text,
        wordWrap: { width: PANEL.width },
        lineSpacing: 4,
      })
      .setOrigin(0, 0);
    const answerY = 140 + text.height + 52;
    this.expression = new Expression(this, PANEL.x - 60, answerY, task.prompt.terms);
    const unit = this.add
      .text(PANEL.x + 16, answerY, this.storyUnit(), {
        fontFamily: FontFamily.text,
        fontSize: `${FontSize.digits - 8}px`,
        color: CssColor.text,
      })
      .setOrigin(0, 0.5);
    this.storyObjects.push(text, unit);
    this.panel.setY(answerY + 54);
    if (task.prompt.picture) {
      this.picture = new StoryPictureView(this, PANEL.x, 470, task.prompt.picture, PANEL.width);
      this.storyObjects.push(this.picture);
    }
  }

  private storyUnit(): string {
    const story = this.task.prompt.story;
    return story ? this.t(`story.${story.id}.unit`) : '';
  }

  /** Frage zur Aufgabe (z. B. „Welche Zahl fehlt in der Reihe?“), sonst leer. */
  private showQuestion(): void {
    const key = this.task.prompt.textKey;
    this.panel.show(key ? this.t(key) : '');
  }

  /** Lob abwechselnd verwenden, damit es nicht leer klingt (Spezifikation, Abschnitt 8). */
  private pick(list: readonly string[]): string {
    return list[this.praiseIndex++ % list.length] ?? '';
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
    this.answerInput?.setLocked(true);
    const outcome: AnswerOutcome =
      this.attempts === 0 && !this.usedHelp ? 'first_try' : 'with_help';
    this.expression?.setAnswer(value, 'correct');
    if (this.answerInput instanceof AnswerCards) this.answerInput.markCorrect(value);
    this.showFeedbackIcon(Tex.correct);
    // Jede richtige Antwort versorgt das Tier sichtbar (Spezifikation, Abschnitt 5).
    this.animal?.feed();
    const praise =
      outcome === 'first_try'
        ? this.pick(this.content.praise.firstTry)
        : this.pick(this.content.praise.withHelp);
    this.panel.show(praise, Tex.correct);
    this.finishTask(outcome);
    this.time.delayedCall(NEXT_DELAY, () => this.advance());
  }

  private onWrong(value: string, result: CheckResult): void {
    this.attempts++;
    this.animal?.think();
    if (this.answerInput instanceof AnswerCards) this.answerInput.markWrong(value);
    if (this.answerInput instanceof Numpad) this.answerInput.clear();

    if (this.attempts >= this.content.rules.attempts) {
      this.showSolution();
      return;
    }
    this.hintStage = Math.max(this.hintStage, this.attempts);
    const hint = this.task.hints[this.hintStage - 1];
    // Die Rückmeldung zum Fehler steht nur beim ersten Hinweis, damit der Text kurz bleibt.
    const prefix =
      this.hintStage === 1 && result.errorTag && this.services.i18n.has(`error.${result.errorTag}`)
        ? `${this.t(`error.${result.errorTag}`)} `
        : '';
    if (hint) this.showHint(hint, `${prefix}${this.hintText(hint)}`, Tex.tryAgain);
  }

  private showSolution(): void {
    this.locked = true;
    this.answerInput?.setLocked(true);
    this.hintStage = 3;
    const hint = this.task.hints[2];
    this.expression?.setAnswer(String(this.task.answer), 'solution');
    this.showHint(hint, `${this.hintText(hint)} ${this.t('task.solutionShown')}`, Tex.hint);
    this.finishTask('wrong');
    if (this.repeats < this.content.rules.maxRepeats) {
      this.repeats++;
      this.round = appendTask(this.round, this.factory.next(this.task.level));
    }
    // Die Eingabe weicht dem Weiter-Knopf, damit klar ist, was als Nächstes zu tun ist.
    this.answerInput?.destroy();
    this.answerInput = undefined;
    this.nextButton = this.addButton({
      x: INPUT_X,
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

  private showFeedbackIcon(texture: string): void {
    this.feedbackIcon?.destroy();
    if (!this.expression) return;
    // Bei Sachaufgaben steht der Haken hinter der Einheit.
    const right = Math.max(
      this.expression.rightEdge,
      ...this.storyObjects
        .filter((o): o is Phaser.GameObjects.Text => o instanceof Phaser.GameObjects.Text)
        .filter((t) => Math.abs(t.y - this.expression!.y) < 10)
        .map((t) => t.x + t.width),
    );
    this.feedbackIcon = this.add.image(right + 50, this.expression.y, texture).setScale(0.8);
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
    const unit = this.storyUnit();
    return this.t(hint.key, unit ? { ...hint.params, unit } : hint.params);
  }

  private visualFor(visual: Visual): Phaser.GameObjects.GameObject {
    if (visual.type === 'hundred') {
      return new HundredBoard(this, PANEL.x, VISUAL_Y + 4, visual.marked);
    }
    if (visual.type === 'tenframe') {
      return new TenFrame(this, PANEL.x, VISUAL_Y + 20, visual.first, visual.second, visual.op);
    }
    if (visual.type === 'dots') {
      return new DotArray(this, PANEL.x, VISUAL_Y + 4, visual.rows, visual.cols, visual.split);
    }
    return new NumberLine(
      this,
      PANEL.x,
      VISUAL_Y + 40,
      PANEL.width - 80,
      visual.start,
      visual.jumps,
      visual.hideResults,
    );
  }

  private showHint(hint: Hint, text: string, icon: string): void {
    this.aid = undefined;
    this.picture?.setVisible(true);
    this.panel.show(text, icon, hint.visual ? this.visualFor(hint.visual) : undefined);
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
      this.picture?.setVisible(true);
      this.showQuestion();
      return;
    }
    this.aid = aid;
    this.showAid(aid);
  }

  /** Bekannte Zahlen der Aufgabe (ohne die gesuchte). */
  private knownNumbers(): number[] {
    const m = this.task.math;
    if (m) return m.missing === 'b' ? [m.a, m.result] : [m.a, m.b];
    const story = this.task.prompt.story;
    if (story) {
      return Object.values(story.params).filter((v): v is number => typeof v === 'number');
    }
    return this.task.prompt.terms.filter((t): t is number => typeof t === 'number');
  }

  private showAid(aid: Aid): void {
    const known = this.knownNumbers();
    if (known.length === 0) return;
    this.picture?.setVisible(false);
    let visual: Phaser.GameObjects.GameObject;
    if (aid === 'tensOnes') {
      visual = new TensOnes(this, PANEL.x, VISUAL_Y - 10, known.slice(0, 3));
    } else if (aid === 'numberLine') {
      visual = new NumberLine(this, PANEL.x, VISUAL_Y + 40, PANEL.width - 80, known[0] ?? 0, []);
    } else {
      visual = new HundredBoard(this, PANEL.x, VISUAL_Y + 4, known);
    }
    const question = this.task.prompt.textKey ? `${this.t(this.task.prompt.textKey)} ` : '';
    this.panel.show(
      aid === 'hundredBoard' ? question : `${question}${this.t(`task.aid.${aid}`)}`,
      undefined,
      visual,
    );
  }

  private readAloud(): void {
    const words: Record<string, string> = {
      '+': this.t('read.plus'),
      '-': this.t('read.minus'),
      '·': this.t('read.times'),
      ':': this.t('read.divided'),
      '=': this.t('read.equals'),
      '<': this.t('read.less'),
      ',': this.t('read.comma'),
      '?': this.t('read.unknown'),
    };
    const story = this.task.prompt.story;
    if (story) {
      const extra = this.panel.message ? ` ${this.panel.message}` : '';
      this.services.audio.speak(`${this.t(`story.${story.id}`, story.params)}${extra}`);
      return;
    }
    const terms = this.task.prompt.terms
      .map((term) => (typeof term === 'number' ? String(term) : (words[term] ?? term)))
      .join(' ')
      .replace(/ ,/g, ',');
    const extra = this.panel.message ? `. ${this.panel.message}` : '';
    this.services.audio.speak(`${terms}${extra}`);
  }
}
