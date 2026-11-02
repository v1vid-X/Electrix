/** Where a wire end physically attaches, in scene millimetres. */
import { QuadraticBezierCurve3, Vector3 } from 'three';
import { BOARD_SURFACE_Y, holePosition } from '../../lib/circuit/coords';
import { partDef } from '../../lib/circuit/parts';
import type { Circuit, Terminal } from '../../lib/circuit/types';

/** The shape of a jumper wire: one arc that bows upwards.
 *  A quadratic Bezier stays inside the triangle of its three control points, so the wire can
 *  never sag below the straight line between its ends and dive through the breadboard —
 *  which is exactly what the old multi-point spline did when it overshot. */
export function wireArc(a: Vector3, b: Vector3): QuadraticBezierCurve3 {
  const lift = Math.min(18, 4 + a.distanceTo(b) * 0.22);
  // A quadratic only reaches half way to its control point, so double the lift.
  const control = a.clone().lerp(b, 0.5);
  control.y = Math.max(a.y, b.y) + lift * 2;
  return new QuadraticBezierCurve3(a, control, b);
}

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
    // Slightly BELOW the surface: a jumper's stiff end goes into the hole, so the wire has
    // to disappear into the board rather than stopping in mid-air above it.
    return p ? new Vector3(p.x, BOARD_SURFACE_Y - 1.1, p.z) : null;
  }
  const part = circuit.parts.find((p) => p.id === terminal.partId);
  if (!part) return null;
  if (partDef(part.typeId).category === 'power') {
    return sourceTerminalPosition(part.position ?? { x: -40, z: 0 }, part.typeId, terminal.pinId);
  }
  return null;
}
