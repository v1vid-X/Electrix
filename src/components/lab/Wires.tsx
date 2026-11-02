import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { terminalPosition } from './positions';
import type { Circuit, WireInstance } from '../../lib/circuit/types';

/** Jumper wires: they lift off the board in the middle, like real ones do. */
export function Wire({
  wire,
  circuit,
  onClick,
  selected,
}: {
  wire: WireInstance;
  circuit: Circuit;
  onClick?: () => void;
  selected?: boolean;
}) {
  const curve = useMemo(() => {
    const a = terminalPosition(wire.from, circuit);
    const b = terminalPosition(wire.to, circuit);
    if (!a || !b) return null;
    const lift = Math.min(14, 3 + a.distanceTo(b) * 0.18);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += lift;
    const q1 = a.clone().lerp(mid, 0.5);
    q1.y += lift * 0.25;
    const q2 = mid.clone().lerp(b, 0.5);
    q2.y += lift * 0.25;
    return new CatmullRomCurve3([a, q1, mid, q2, b]);
  }, [wire, circuit]);

  if (!curve) return null;

  return (
    <mesh castShadow onClick={onClick ? (e) => (e.stopPropagation(), onClick()) : undefined}>
      <tubeGeometry args={[curve, 28, selected ? 0.75 : 0.55, 7, false]} />
      <meshStandardMaterial
        color={wire.color}
        emissive={selected ? wire.color : '#000000'}
        emissiveIntensity={selected ? 0.4 : 0}
        roughness={0.4}
      />
    </mesh>
  );
}

/** The wire being drawn, from a fixed end to wherever the pointer is. */
export function GhostWire({ from, to, color }: { from: Vector3; to: Vector3; color: string }) {
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5);
    mid.y += Math.min(14, 3 + from.distanceTo(to) * 0.18);
    return new CatmullRomCurve3([from, mid, to]);
  }, [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 20, 0.45, 6, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </mesh>
  );
}
