import { useMemo } from 'react';
import type { Vector3 } from 'three';
import { terminalPosition, wireArc } from './positions';
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
    return wireArc(a, b);
  }, [wire, circuit]);

  if (!curve) return null;

  return (
    <mesh castShadow onClick={onClick ? (e) => (e.stopPropagation(), onClick()) : undefined}>
      <tubeGeometry args={[curve, 40, selected ? 0.8 : 0.62, 12, false]} />
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
  const curve = useMemo(() => wireArc(from, to), [from, to]);

  return (
    <mesh>
      <tubeGeometry args={[curve, 28, 0.5, 10, false]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} />
    </mesh>
  );
}
