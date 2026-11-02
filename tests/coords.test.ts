import { describe, expect, it } from 'vitest';
import { allHoles, holePosition, nearestHole, rowZ, CHANNEL_MM } from '../src/lib/circuit/coords';
import { PITCH_MM } from '../src/lib/circuit/board';
import { bandsFor } from '../src/lib/colorCode';

describe('board geometry', () => {
  it('spaces adjacent rows by exactly one pitch', () => {
    expect(rowZ(2) - rowZ(1)).toBeCloseTo(PITCH_MM, 10);
  });

  it('spaces adjacent columns by exactly one pitch', () => {
    const a = holePosition('a5')!;
    const b = holePosition('b5')!;
    expect(b.x - a.x).toBeCloseTo(PITCH_MM, 2);
  });

  it('separates e and f by the 0.3 inch centre channel', () => {
    const e = holePosition('e5')!;
    const f = holePosition('f5')!;
    expect(f.x - e.x).toBeCloseTo(CHANNEL_MM, 2);
  });

  it('centres the board on the origin', () => {
    expect(rowZ(1)).toBeCloseTo(-rowZ(30), 10);
    expect(holePosition('a1')!.x).toBeCloseTo(-holePosition('j1')!.x, 10);
  });

  it('has 300 main holes and 120 rail holes', () => {
    const holes = allHoles();
    expect(holes).toHaveLength(420);
    expect(holes.filter((h) => h.id.includes(':'))).toHaveLength(120);
  });

  it('gives every hole a unique position', () => {
    const keys = new Set(allHoles().map((h) => `${h.x.toFixed(3)},${h.z.toFixed(3)}`));
    expect(keys.size).toBe(420);
  });

  it('rejects holes that do not exist', () => {
    expect(holePosition('k1')).toBe(null);
    expect(holePosition('a99')).toBe(null);
  });
});

describe('snapping', () => {
  it('snaps a near miss to the right hole', () => {
    const target = holePosition('c12')!;
    expect(nearestHole(target.x + 0.6, target.z - 0.5)?.id).toBe('c12');
  });

  it('snaps exactly on a hole', () => {
    const target = holePosition('h20')!;
    expect(nearestHole(target.x, target.z)?.id).toBe('h20');
  });

  it('does not snap from the middle of the channel', () => {
    expect(nearestHole(0, 0)).toBe(null);
  });

  it('does not snap from off the board', () => {
    expect(nearestHole(100, 100)).toBe(null);
  });
});

describe('resistor colour bands', () => {
  it('decodes 330 Ω as orange orange brown', () => {
    expect(bandsFor(330).names).toEqual(['orange', 'orange', 'brown', 'gold']);
  });

  it('decodes 220 Ω as red red brown', () => {
    expect(bandsFor(220).names).toEqual(['red', 'red', 'brown', 'gold']);
  });

  it('decodes 1 kΩ as brown black red', () => {
    expect(bandsFor(1000).names).toEqual(['brown', 'black', 'red', 'gold']);
  });

  it('decodes 4.7 kΩ as yellow violet red', () => {
    expect(bandsFor(4700).names).toEqual(['yellow', 'violet', 'red', 'gold']);
  });

  it('decodes 10 Ω as brown black black', () => {
    expect(bandsFor(10).names).toEqual(['brown', 'black', 'black', 'gold']);
  });

  it('decodes 1 MΩ as brown black green', () => {
    expect(bandsFor(1_000_000).names).toEqual(['brown', 'black', 'green', 'gold']);
  });

  it('survives nonsense values', () => {
    expect(bandsFor(0).names[0]).toBe('black');
    expect(bandsFor(Number.NaN).names[0]).toBe('black');
  });
});
