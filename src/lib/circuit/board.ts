/** The breadboard, as it is actually wired inside — the single most common source of
 *  beginner confusion, so it gets its own tested module. */

export const COLUMNS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'] as const;
export type Column = (typeof COLUMNS)[number];
/** Full-size solderless breadboard: 30 numbered rows, 10 lettered columns. */
export const ROWS = 30;
/** Hole spacing in millimetres. The whole industry is built on this number. */
export const PITCH_MM = 2.54;

export type RailId = 'TP' | 'TN' | 'BP' | 'BN';
export const RAILS: readonly RailId[] = ['TP', 'TN', 'BP', 'BN'];

/** "e12" for a main-area hole, "TP:12" for a power-rail hole. */
export type HoleId = string;

export const hole = (col: Column, row: number): HoleId => `${col}${row}`;
export const railHole = (rail: RailId, index: number): HoleId => `${rail}:${index}`;

export interface BoardConfig {
  /** Many real boards cut each power rail in the middle. When true, holes 1-15 and
   *  16-30 of a rail are NOT connected — the classic "why is half my board dead" trap. */
  splitRails: boolean;
}

export const DEFAULT_BOARD: BoardConfig = { splitRails: false };

export function parseHole(id: HoleId): { kind: 'main'; col: Column; row: number } | { kind: 'rail'; rail: RailId; index: number } | null {
  const railMatch = /^(TP|TN|BP|BN):(\d+)$/.exec(id);
  if (railMatch) {
    const index = Number(railMatch[2]);
    if (index < 1 || index > ROWS) return null;
    return { kind: 'rail', rail: railMatch[1] as RailId, index };
  }
  const mainMatch = /^([a-j])(\d+)$/.exec(id);
  if (mainMatch) {
    const row = Number(mainMatch[2]);
    if (row < 1 || row > ROWS) return null;
    return { kind: 'main', col: mainMatch[1] as Column, row };
  }
  return null;
}

/** The group of holes that are electrically the same point as `id`.
 *  Main area: the five holes of one half-row (a-e or f-j) — the centre gap separates them.
 *  Rails: the whole rail, or half of it when the board has split rails. */
export function stripOf(id: HoleId, config: BoardConfig = DEFAULT_BOARD): string {
  const parsed = parseHole(id);
  if (!parsed) throw new Error(`Not a hole on this board: ${id}`);
  if (parsed.kind === 'main') {
    const half = parsed.col <= 'e' ? 'L' : 'R';
    return `row:${parsed.row}:${half}`;
  }
  const segment = config.splitRails ? (parsed.index <= 15 ? 'A' : 'B') : 'ALL';
  return `rail:${parsed.rail}:${segment}`;
}

export function holesInStrip(strip: string, config: BoardConfig = DEFAULT_BOARD): HoleId[] {
  const rowMatch = /^row:(\d+):(L|R)$/.exec(strip);
  if (rowMatch) {
    const row = Number(rowMatch[1]);
    const cols = rowMatch[2] === 'L' ? COLUMNS.slice(0, 5) : COLUMNS.slice(5);
    return cols.map((c) => hole(c, row));
  }
  const railMatch = /^rail:(TP|TN|BP|BN):(ALL|A|B)$/.exec(strip);
  if (railMatch) {
    const rail = railMatch[1] as RailId;
    const range =
      railMatch[2] === 'ALL'
        ? { from: 1, to: ROWS }
        : railMatch[2] === 'A'
          ? { from: 1, to: 15 }
          : { from: 16, to: ROWS };
    const out: HoleId[] = [];
    for (let i = range.from; i <= range.to; i++) out.push(railHole(rail, i));
    return out;
  }
  void config;
  return [];
}

export const sameStrip = (a: HoleId, b: HoleId, config: BoardConfig = DEFAULT_BOARD): boolean =>
  stripOf(a, config) === stripOf(b, config);
