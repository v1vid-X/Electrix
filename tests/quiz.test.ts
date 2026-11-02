import { describe, expect, it } from 'vitest';
import { looksLikeUnitSlip, numericIsCorrect } from '../src/components/ui/Quiz';

describe('numeric grading', () => {
  it('accepts an exact answer', () => {
    expect(numericIsCorrect(0.0136, 0.0136)).toBe(true);
  });

  it('accepts inside the tolerance band', () => {
    expect(numericIsCorrect(13.4, 13.6, 0.05)).toBe(true);
    expect(numericIsCorrect(12.0, 13.6, 0.05)).toBe(false);
  });

  it('defaults to a tight 2% band', () => {
    expect(numericIsCorrect(330, 330)).toBe(true);
    expect(numericIsCorrect(360, 330)).toBe(false);
  });

  it('handles a zero answer', () => {
    expect(numericIsCorrect(0, 0)).toBe(true);
    expect(numericIsCorrect(0.1, 0)).toBe(false);
  });

  it('spots the classic milliamp/amp slip', () => {
    expect(looksLikeUnitSlip(13.6, 0.0136)).toBe(true);
    expect(looksLikeUnitSlip(0.0000136, 0.0136)).toBe(true);
    expect(looksLikeUnitSlip(0.027, 0.0136)).toBe(false);
  });
});
