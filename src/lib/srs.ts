/** Spaced repetition, SM-2 style. Small enough to understand, good enough to work.
 *  Cards are generated from each lesson's flashcard block; state lives in localStorage. */

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  /** Module the card came from, so we can show "from Module 1". */
  module: number;
}

export interface CardState {
  id: string;
  /** SM-2 ease factor. Starts at 2.5, never drops below 1.3. */
  ease: number;
  /** Days until the next review. */
  intervalDays: number;
  /** Consecutive successful reviews. */
  reps: number;
  lapses: number;
  /** ISO timestamp of when this card is next due. */
  due: string;
}

/** What the learner pressed. */
export type Grade = 'again' | 'hard' | 'good' | 'easy';

const QUALITY: Record<Grade, number> = { again: 1, hard: 3, good: 4, easy: 5 };
const DAY_MS = 86_400_000;

export const newCardState = (id: string, now = new Date()): CardState => ({
  id,
  ease: 2.5,
  intervalDays: 0,
  reps: 0,
  lapses: 0,
  due: now.toISOString(),
});

export function review(state: CardState, grade: Grade, now = new Date()): CardState {
  const q = QUALITY[grade];
  const ease = Math.max(1.3, state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    // Failed: back to the start of the ladder, due again in 10 minutes.
    return {
      ...state,
      ease,
      reps: 0,
      lapses: state.lapses + 1,
      intervalDays: 0,
      due: new Date(now.getTime() + 10 * 60_000).toISOString(),
    };
  }

  const reps = state.reps + 1;
  const intervalDays =
    reps === 1 ? 1 : reps === 2 ? 6 : Math.max(1, Math.round(state.intervalDays * ease));

  return {
    ...state,
    ease,
    reps,
    intervalDays,
    due: new Date(now.getTime() + intervalDays * DAY_MS).toISOString(),
  };
}

export const isDue = (state: CardState, now = new Date()): boolean =>
  new Date(state.due).getTime() <= now.getTime();

/** Due cards first, then unseen ones. */
export function dueQueue(
  cards: readonly Flashcard[],
  states: Record<string, CardState>,
  now = new Date(),
): Flashcard[] {
  return cards.filter((c) => {
    const s = states[c.id];
    return !s || isDue(s, now);
  });
}
