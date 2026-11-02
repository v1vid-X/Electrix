import { useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, type Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import { allHoles, BOARD_HEIGHT, BOARD_LENGTH, BOARD_WIDTH } from '../../lib/circuit/coords';
import { makeBoardTexture } from './boardTexture';
import type { HoleId } from '../../lib/circuit/board';

/** The board itself, plus one invisible instanced mesh that does all the hole picking.
 *  420 holes in a single draw call, so hovering stays smooth. */
export function Breadboard({
  onHoverHole,
  onClickHole,
}: {
  onHoverHole: (id: HoleId | null) => void;
  onClickHole: (id: HoleId) => void;
}) {
  const texture = useMemo(() => makeBoardTexture(), []);
  const holes = useMemo(() => allHoles(), []);
  // Place one pick target per hole.
  const matrices = useMemo(() => {
    const m = new Matrix4();
    return holes.map((h) => m.clone().makeTranslation(h.x, BOARD_HEIGHT / 2 + 0.05, h.z));
  }, [holes]);

  const applyMatrices = (mesh: InstancedMesh | null) => {
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  };

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.instanceId !== undefined ? holes[e.instanceId]?.id : undefined;
    onHoverHole(id ?? null);
  };

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, BOARD_HEIGHT / 2 - 0.3, 0]}>
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_LENGTH]} />
        <meshStandardMaterial color="#dcd8cb" roughness={0.75} metalness={0} />
      </mesh>

      {/* Printed top surface. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOARD_HEIGHT - 0.28, 0]} receiveShadow>
        <planeGeometry args={[BOARD_WIDTH, BOARD_LENGTH]} />
        <meshStandardMaterial map={texture} roughness={0.65} metalness={0} />
      </mesh>

      <instancedMesh
        ref={applyMatrices}
        args={[undefined, undefined, holes.length]}
        onPointerMove={handleMove}
        onPointerOut={() => onHoverHole(null)}
        onClick={(e) => {
          e.stopPropagation();
          const id = e.instanceId !== undefined ? holes[e.instanceId]?.id : undefined;
          if (id) onClickHole(id);
        }}
      >
        <boxGeometry args={[2.3, 1.2, 2.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/** The ring that shows where a part or wire end will land. */
export function HoleHighlight({ x, z, color }: { x: number; z: number; color: string }) {
  const ref = useRef<Mesh>(null);
  return (
    <mesh ref={ref} position={[x, BOARD_HEIGHT + 0.06, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.5, 2.3, 24]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}
