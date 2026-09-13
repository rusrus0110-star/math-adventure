export const INACTIVITY_MS = 30_000;
export const MAX_SAMPLE_GAP_MS = 5_000;

export interface LearningContext {
  playerId: string | null;
  sessionId: string | null;
  mathematics: boolean;
  visible: boolean;
  focused: boolean;
}

export interface LearningInterval {
  playerId: string;
  start: number;
  end: number;
}

export class ActiveLearningClock {
  private context: LearningContext | null = null;
  private previousTime: number | null = null;
  private lastInteraction = 0;

  sample(context: LearningContext, now: number, interaction = false): LearningInterval | null {
    const previous = this.context;
    const start = this.previousTime;
    const eligible = (value: LearningContext | null) => Boolean(value?.playerId && value.sessionId && value.mathematics && value.visible && value.focused);
    const end = Math.min(now, this.lastInteraction + INACTIVITY_MS);
    const interval = start !== null && now >= start && now - start <= MAX_SAMPLE_GAP_MS && eligible(previous) && end > start
      ? { playerId: previous!.playerId!, start, end } : null;
    if (interaction || !previous || context.playerId !== previous.playerId || context.sessionId !== previous.sessionId) {
      this.lastInteraction = now;
    }
    this.context = context;
    this.previousTime = now;
    return interval;
  }
}
