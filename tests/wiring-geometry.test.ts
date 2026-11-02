import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { terminalPosition, wireArc } from '../src/components/lab/positions';
import { BOARD_SURFACE_Y, holePosition } from '../src/lib/circuit/coords';
import { emptyCircuit } from '../src/lib/circuit/types';

describe('where a wire attaches', () => {
  it('ends inside the hole, not hovering above the board', () => {
    const p = terminalPosition({ kind: 'hole', hole: 'e12' }, emptyCircuit());
    expect(p).not.toBe(null);
    // Below the surface, so the wire visibly disappears into the board like a real jumper.
    expect(p!.y).toBeLessThan(BOARD_SURFACE_Y);
    const hole = holePosition('e12')!;
    expect(p!.x).toBeCloseTo(hole.x, 6);
    expect(p!.z).toBeCloseTo(hole.z, 6);
  });

  it('returns nothing for a hole that does not exist', () => {
    expect(terminalPosition({ kind: 'hole', hole: 'z99' }, emptyCircuit())).toBe(null);
  });
});

describe('the shape of a wire', () => {
  const sample = (a: Vector3, b: Vector3, n = 40) => {
    const curve = wireArc(a, b);
    return Array.from({ length: n + 1 }, (_, i) => curve.getPoint(i / n));
  };

  it('never dips below its own endpoints, so it cannot pass through the board', () => {
    const a = new Vector3(-14, BOARD_SURFACE_Y - 1.1, -36);
    const b = new Vector3(14, BOARD_SURFACE_Y - 1.1, 36);
    const lowest = Math.min(...sample(a, b).map((p) => p.y));
    expect(lowest).toBeGreaterThanOrEqual(Math.min(a.y, b.y) - 1e-9);
  });

  it('holds even when the two ends are at very different heights', () => {
    const a = new Vector3(-40, 17.4, 0); // a supply terminal, high up
    const b = new Vector3(10, BOARD_SURFACE_Y - 1.1, 20);
    const lowest = Math.min(...sample(a, b).map((p) => p.y));
    expect(lowest).toBeGreaterThanOrEqual(Math.min(a.y, b.y) - 1e-9);
  });

  it('bows upward rather than running straight', () => {
    const a = new Vector3(-10, BOARD_SURFACE_Y, -10);
    const b = new Vector3(10, BOARD_SURFACE_Y, 10);
    const highest = Math.max(...sample(a, b).map((p) => p.y));
    expect(highest).toBeGreaterThan(BOARD_SURFACE_Y + 2);
  });

  it('starts and ends exactly on its endpoints', () => {
    const a = new Vector3(-5, 8, -5);
    const b = new Vector3(5, 8, 5);
    const curve = wireArc(a, b);
    expect(curve.getPoint(0).distanceTo(a)).toBeLessThan(1e-9);
    expect(curve.getPoint(1).distanceTo(b)).toBeLessThan(1e-9);
  });

  it('lifts a long wire higher than a short one', () => {
    const short = wireArc(new Vector3(0, 9, 0), new Vector3(5, 9, 0));
    const long = wireArc(new Vector3(0, 9, 0), new Vector3(70, 9, 0));
    expect(long.getPoint(0.5).y).toBeGreaterThan(short.getPoint(0.5).y);
  });
});
