/** All local state in one place: progress, quiz scores, flashcard scheduling, settings.
 *  No accounts, no backend — it is the learner's own browser. */

import type { CardState } from './srs';

const KEY = 'circuit-brain/v1';

export interface Progress {
  /** Module slugs the learner has marked complete. */
  completed: string[];
  /** Best quiz score per lesson slug, 0..1. */
  quizScores: Record<string, number>;
  cards: Record<string, CardState>;
  /** ISO dates on which something was studied, for the streak. */
  studyDays: string[];
  settings: { sound: boolean; theme: 'dark' | 'light'; labQuality: 'low' | 'medium' | 'high' };
}

const DEFAULT: Progress = {
  completed: [],
  quizScores: {},
  cards: {},
  studyDays: [],
  settings: { sound: false, theme: 'dark', labQuality: 'high' },
};

export function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return { ...structuredClone(DEFAULT), ...JSON.parse(raw) };
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function save(progress: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    // Private browsing or a full quota. Losing progress is not worth crashing over.
  }
}

export function update(fn: (p: Progress) => Progress): Progress {
  const next = fn(load());
  save(next);
  return next;
}

export function markStudiedToday(): void {
  const today = new Date().toISOString().slice(0, 10);
  update((p) => (p.studyDays.includes(today) ? p : { ...p, studyDays: [...p.studyDays, today] }));
}

/** Consecutive days up to today. */
export function streak(days: readonly string[], today = new Date()): number {
  const set = new Set(days);
  let count = 0;
  const cursor = new Date(today);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
