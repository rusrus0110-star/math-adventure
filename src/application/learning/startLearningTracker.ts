import { ActiveLearningClock, type LearningContext, type LearningInterval } from '@/domain/learning/ActiveLearningClock';
import { localDateKey } from '@/domain/activity/activity';

interface TrackerDependencies {
  getContext: () => LearningContext;
  record: (interval: LearningInterval) => void;
  subscribe: (listener: () => void) => () => void;
  document: Document;
  window: Window;
  now?: () => number;
  onDayChanged?: () => void;
}

export function startLearningTracker({ getContext, record, subscribe, document, window, now = Date.now, onDayChanged }: TrackerDependencies) {
  const clock = new ActiveLearningClock();
  let day = localDateKey(new Date(now()));
  const sample = (interaction = false) => {
    const instant = now();
    const currentDay = localDateKey(new Date(instant));
    if (currentDay !== day) {
      day = currentDay;
      onDayChanged?.();
    }
    const interval = clock.sample({ ...getContext(), visible: document.visibilityState === 'visible', focused: document.hasFocus() }, instant, interaction);
    if (interval) record(interval);
  };
  const update = () => sample();
  const hide = () => {
    const interval = clock.sample({ ...getContext(), mathematics: false, visible: false, focused: false }, now());
    if (interval) record(interval);
  };
  const interact = (event: Event) => { if (event.isTrusted) sample(true); };
  sample();
  const unsubscribe = subscribe(update);
  const timer = window.setInterval(update, 1000);
  document.addEventListener('visibilitychange', update);
  document.addEventListener('pointerdown', interact);
  document.addEventListener('keydown', interact);
  window.addEventListener('focus', update);
  window.addEventListener('blur', update);
  window.addEventListener('pagehide', hide);
  return () => {
    update();
    unsubscribe();
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', update);
    document.removeEventListener('pointerdown', interact);
    document.removeEventListener('keydown', interact);
    window.removeEventListener('focus', update);
    window.removeEventListener('blur', update);
    window.removeEventListener('pagehide', hide);
  };
}
