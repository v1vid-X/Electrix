import { describe, expect, it } from 'vitest';
import { holesInStrip, parseHole, sameStrip, stripOf } from '../src/lib/circuit/board';

describe('breadboard wiring', () => {
  it('connects the five holes of a half-row', () => {
    expect(sameStrip('a5', 'e5')).toBe(true);
    expect(sameStrip('b5', 'd5')).toBe(true);
  });

  it('does NOT connect across the centre gap', () => {
    expect(sameStrip('e5', 'f5')).toBe(false);
  });

  it('does NOT connect different rows', () => {
    expect(sameStrip('a5', 'a6')).toBe(false);
  });

  it('connects a whole power rail by default', () => {
    expect(sameStrip('TP:1', 'TP:30')).toBe(true);
  });

  it('keeps the two halves of a split rail apart', () => {
    const split = { splitRails: true };
    expect(sameStrip('TP:15', 'TP:16', split)).toBe(false);
    expect(sameStrip('TP:1', 'TP:15', split)).toBe(true);
    expect(sameStrip('TP:16', 'TP:30', split)).toBe(true);
  });

  it('never connects the positive rail to the negative rail', () => {
    expect(sameStrip('TP:4', 'TN:4')).toBe(false);
    expect(sameStrip('TP:4', 'BP:4')).toBe(false);
  });

  it('lists exactly the five holes of a half-row', () => {
    expect(holesInStrip(stripOf('c7'))).toEqual(['a7', 'b7', 'c7', 'd7', 'e7']);
    expect(holesInStrip(stripOf('g7'))).toEqual(['f7', 'g7', 'h7', 'i7', 'j7']);
  });

  it('lists 30 rail holes, or 15 when split', () => {
    expect(holesInStrip(stripOf('TP:3'))).toHaveLength(30);
    expect(holesInStrip(stripOf('TP:3', { splitRails: true }), { splitRails: true })).toHaveLength(15);
  });

  it('rejects holes that do not exist', () => {
    expect(parseHole('k1')).toBe(null);
    expect(parseHole('a31')).toBe(null);
    expect(parseHole('a0')).toBe(null);
    expect(parseHole('nonsense')).toBe(null);
    expect(() => stripOf('k1')).toThrow();
  });
});
