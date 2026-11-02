/** Where every hole physically sits, in millimetres, with the board centred on the origin.
 *  The 3D scene and the snapping logic both read these numbers, so they live in one
 *  tested place rather than being guessed inside a mesh component.
 *
 *  Modelled on a 400-point half-size breadboard: 30 rows, columns a-e and f-j, a
 *  0.3 inch centre channel, and four power rails.
 *
 *  shortcut: real rails have 25 holes in groups of 5. We give each rail 30 evenly
 *  spaced holes aligned with the rows, which keeps rail wiring predictable. Upgrade
 *  when the Lab starts teaching board layout rather than circuits.
 */
import { COLUMNS, PITCH_MM, ROWS, parseHole, type Column, type HoleId, type RailId } from './board';

/** Centre-to-centre distance across the channel, 0.3 inch. */
export const CHANNEL_MM = PITCH_MM * 3;

export const BOARD_WIDTH = 50;
export const BOARD_LENGTH = ROWS * PITCH_MM + 6;
export const BOARD_HEIGHT = 9;

const COLUMN_X: Record<Column, number> = {
  a: -13.97,
  b: -11.43,
  c: -8.89,
  d: -6.35,
  e: -3.81,
  f: 3.81,
  g: 6.35,
  h: 8.89,
  i: 11.43,
  j: 13.97,
};

const RAIL_X: Record<RailId, number> = {
  TP: -22.0,
  TN: -19.46,
  BN: 19.46,
  BP: 22.0,
};

/** Rows run along z, centred on 0. Row 1 is at the near edge. */
export const rowZ = (row: number): number => (row - 1) * PITCH_MM - ((ROWS - 1) * PITCH_MM) / 2;

export interface HolePoint {
  id: HoleId;
  x: number;
  z: number;
}

export function holePosition(id: HoleId): HolePoint | null {
  const parsed = parseHole(id);
  if (!parsed) return null;
  if (parsed.kind === 'main') {
    return { id, x: COLUMN_X[parsed.col], z: rowZ(parsed.row) };
  }
  return { id, x: RAIL_X[parsed.rail], z: rowZ(parsed.index) };
}

/** Every hole on the board, in a stable order. The 3D scene uses the index of this
 *  list as the instance id, so it must not be shuffled. */
export function allHoles(): HolePoint[] {
  const out: HolePoint[] = [];
  for (let row = 1; row <= ROWS; row++) {
    for (const col of COLUMNS) {
      out.push(holePosition(`${col}${row}`)!);
    }
  }
  for (const rail of ['TP', 'TN', 'BN', 'BP'] as RailId[]) {
    for (let i = 1; i <= ROWS; i++) out.push(holePosition(`${rail}:${i}`)!);
  }
  return out;
}

/** The hole a dropped part should snap to. Returns null when nothing is close enough,
 *  so a part dropped off the board stays off the board. */
export function nearestHole(x: number, z: number, maxDistance = PITCH_MM * 0.9): HolePoint | null {
  let best: HolePoint | null = null;
  let bestDistance = Infinity;
  for (const hole of allHoles()) {
    const d = Math.hypot(hole.x - x, hole.z - z);
    if (d < bestDistance) {
      bestDistance = d;
      best = hole;
    }
  }
  return best && bestDistance <= maxDistance ? best : null;
}
