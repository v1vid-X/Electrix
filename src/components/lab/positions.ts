/** Where a wire end physically attaches, in scene millimetres. */
import { Vector3 } from 'three';
import { BOARD_HEIGHT, holePosition } from '../../lib/circuit/coords';
import { partDef } from '../../lib/circuit/parts';
import type { Circuit, Terminal } from '../../lib/circuit/types';

export function sourceTerminalPosition(
  position: { x: number; z: number },
  typeId: string,
  pinId: string,
): Vector3 {
  const isUsb = typeId === 'usb-5v';
  const offset = isUsb ? 0 : pinId === 'pos' ? -3.5 : 3.5;
  const z = pinId === 'pos' ? -7 : 7;
  return new Vector3(position.x + offset, 17.4, position.z + z);
}

export function terminalPosition(terminal: Terminal, circuit: Circuit): Vector3 | null {
  if (terminal.kind === 'hole') {
    const p = holePosition(terminal.hole);
    return p ? new Vector3(p.x, BOARD_HEIGHT + 0.4, p.z) : null;
  }
  const part = circuit.parts.find((p) => p.id === terminal.partId);
  if (!part) return null;
  if (partDef(part.typeId).category === 'power') {
    return sourceTerminalPosition(part.position ?? { x: -40, z: 0 }, part.typeId, terminal.pinId);
  }
  return null;
}
