import { BaseScene } from './BaseScene';
import { placeholderTasks } from '../logic/generators/placeholder';
import {
  createRound,
  currentTask,
  isFinished,
  progress,
  recordOutcome,
  summarize,
  type Round,
} from '../logic/rounds';
import type { Services } from '../services/services';
import { GameEvent, type AnswerSubmittedPayload, type RoundFinishedPayload } from '../types/events';
import { SceneKey, type RoundEndSceneData, type TaskSceneData } from '../types/scenes';
import { ProgressDots } from '../ui/ProgressDots';
import { Layout } from '../ui/theme';

/** Anzahl der Aufgaben einer leeren Runde (Spezifikation: 8 bis 12). */
const EMPTY_ROUND_SIZE = 8;

/**
 * Aufgabenansicht. In Phase 1 läuft eine leere Runde mit Platzhalteraufgaben;
 * der OK-Knopf meldet `answer-submitted`, die Szene meldet am Ende `round-finished`.
 */
export class TaskScene extends BaseScene<TaskSceneData> {
  private areaId = '';
  private round!: Round;
  private dots!: ProgressDots;
  private progressText!: Phaser.GameObjects.Text;

  constructor(services: Services) {
    super(SceneKey.Task, services);
  }

  protected override onInit(data: TaskSceneData): void {
    this.areaId = data.areaId;
    this.round = createRound(placeholderTasks(EMPTY_ROUND_SIZE));
  }

  create(): void {
    const { width, height } = this.scale;
    this.addBackButton(() => this.scene.start(SceneKey.Map), this.t('task.toMap'));
    this.dots = new ProgressDots(this, width / 2, Layout.margin + Layout.minTouch / 2);
    this.progressText = this.addText(width / 2, 260, '');
    this.addText(width / 2, 340, this.t('task.placeholder'));

    this.addButton({
      x: width / 2,
      y: height - Layout.margin - Layout.minTouch / 2,
      width: 200,
      label: this.t('common.ok'),
      onPress: () => {
        const task = currentTask(this.round);
        if (!task) return;
        const payload: AnswerSubmittedPayload = { taskId: task.id, input: 'ok' };
        this.events.emit(GameEvent.AnswerSubmitted, payload);
      },
    });

    this.listen(this.events, GameEvent.AnswerSubmitted, this.onAnswer);
    this.listen(this.events, GameEvent.RoundFinished, this.onRoundFinished);
    this.render();
  }

  private onAnswer(payload: AnswerSubmittedPayload): void {
    if (currentTask(this.round)?.id !== payload.taskId) return;
    // Platzhalter: jede Antwort gilt als richtig im ersten Versuch. Prüfung folgt in Phase 2.
    this.round = recordOutcome(this.round, 'first_try');
    this.render();
    if (isFinished(this.round)) {
      const finished: RoundFinishedPayload = {
        areaId: this.areaId,
        summary: summarize(this.round),
      };
      this.events.emit(GameEvent.RoundFinished, finished);
    }
  }

  private onRoundFinished(payload: RoundFinishedPayload): void {
    const data: RoundEndSceneData = payload;
    this.scene.start(SceneKey.RoundEnd, data);
  }

  private render(): void {
    const { done, total } = progress(this.round);
    this.dots.setProgress(done, total);
    this.progressText.setText(
      this.t('task.progress', { current: Math.min(done + 1, total), total }),
    );
  }
}
