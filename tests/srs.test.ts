import { describe, expect, it } from 'vitest';
import { dueQueue, isDue, newCardState, review, type CardState } from '../src/lib/srs';

const NOW = new Date('2026-01-01T12:00:00Z');
const daysBetween = (a: string, b: Date) =>
  (new Date(a).getTime() - b.getTime()) / 86_400_000;

describe('SM-2 scheduling', () => {
  it('a new card is due immediately', () => {
    expect(isDue(newCardState('c1', NOW), NOW)).toBe(true);
  });

  it('first correct answer schedules one day out', () => {
    const s = review(newCardState('c1', NOW), 'good', NOW);
    expect(s.intervalDays).toBe(1);
    expect(daysBetween(s.due, NOW)).toBeCloseTo(1, 6);
  });

  it('second correct answer schedules six days out', () => {
    let s = review(newCardState('c1', NOW), 'good', NOW);
    s = review(s, 'good', NOW);
    expect(s.intervalDays).toBe(6);
  });

  it('later intervals multiply by the ease factor', () => {
    let s = review(newCardState('c1', NOW), 'good', NOW);
    s = review(s, 'good', NOW);
    const before = s.intervalDays;
    s = review(s, 'good', NOW);
    expect(s.intervalDays).toBe(Math.round(before * s.ease));
    expect(s.intervalDays).toBeGreaterThan(before);
  });

  it('"again" resets the ladder and counts a lapse', () => {
    let s = review(newCardState('c1', NOW), 'good', NOW);
    s = review(s, 'good', NOW);
    s = review(s, 'again', NOW);
    expect(s.reps).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.intervalDays).toBe(0);
    expect(daysBetween(s.due, NOW)).toBeLessThan(0.01);
  });

  it('ease drops on hard answers but never below 1.3', () => {
    let s: CardState = newCardState('c1', NOW);
    for (let i = 0; i < 30; i++) s = review(s, 'again', NOW);
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
    expect(s.ease).toBeCloseTo(1.3, 10);
  });

  it('easy answers raise the ease above the starting value', () => {
    const s = review(newCardState('c1', NOW), 'easy', NOW);
    expect(s.ease).toBeGreaterThan(2.5);
  });

  it('the queue holds unseen cards and overdue cards only', () => {
    const cards = [
      { id: 'a', front: 'a', back: 'a', module: 1 },
      { id: 'b', front: 'b', back: 'b', module: 1 },
    ];
    const states = { b: review(newCardState('b', NOW), 'good', NOW) };
    expect(dueQueue(cards, states, NOW).map((c) => c.id)).toEqual(['a']);
    const later = new Date(NOW.getTime() + 2 * 86_400_000);
    expect(dueQueue(cards, states, later).map((c) => c.id)).toEqual(['a', 'b']);
  });
});
