import type { BoardConfig, HoleId } from './board';

export type Rotation = 0 | 1 | 2 | 3;

/** Anything a wire can be clipped to. */
export type Terminal =
  | { kind: 'hole'; hole: HoleId }
  | { kind: 'pin'; partId: string; pinId: string };

export interface PartInstance {
  id: string;
  typeId: string;
  /** Hole the part's first pin sits in. null for bench parts (battery, multimeter). */
  anchor: HoleId | null;
  rotation: Rotation;
  /** Bench position in millimetres, board origin at hole a1. Only for anchor === null. */
  position?: { x: number; z: number };
  /** Ω for resistors, F for capacitors, V for sources. Units are SI base units. */
  value?: number;
  /** LED colour, which sets its forward voltage. */
  color?: string;
  /** Burnt parts stay broken until replaced. */
  burnt?: boolean;
  /** Buttons and switches. */
  closed?: boolean;
  /** For a microcontroller: what each GPIO is currently doing. Written by the sketch
   *  runtime, read by the netlist builder. Keyed by GPIO number. */
  gpio?: Record<string, 'input' | 'high' | 'low'>;
}

export interface WireInstance {
  id: string;
  from: Terminal;
  to: Terminal;
  color: string;
}

export interface Circuit {
  board: BoardConfig;
  parts: PartInstance[];
  wires: WireInstance[];
}

export const emptyCircuit = (board: BoardConfig = { splitRails: false }): Circuit => ({
  board,
  parts: [],
  wires: [],
});

export type Severity = 'info' | 'warning' | 'danger';

export interface Diagnostic {
  severity: Severity;
  /** Part this is about, if any. */
  partId?: string;
  title: string;
  /** Plain-language explanation, with the arithmetic spelled out. */
  detail: string;
}

export const terminalKey = (t: Terminal): string =>
  t.kind === 'hole' ? `hole:${t.hole}` : `pin:${t.partId}:${t.pinId}`;
