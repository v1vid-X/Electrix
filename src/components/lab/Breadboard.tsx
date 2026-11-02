import { useCallback } from 'react';
import { useMemo } from 'react';
import { InstancedMesh, Matrix4 } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import {
  allHoles,
  BOARD_HEIGHT,
  BOARD_LENGTH,
  BOARD_SURFACE_Y,
  BOARD_WIDTH,
} from '../../lib/circuit/coords';
import { PITCH_MM } from '../../lib/circuit/board';
import { makeBoardTexture } from './boardTexture';
import type { HoleId } from '../../lib/circuit/board';

/** How thick the invisible click targets are. Thin, so the point you click is the point on
 *  the board you meant — a tall target is hit at a different place than its own centre when
 *  the camera is at an angle. */
const TARGET_THICKNESS = 0.4;

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

  // One pick target per hole, sitting exactly on the surface you can see.
  const matrices = useMemo(() => {
    const m = new Matrix4();
    return holes.map((h) =>
      m.clone().makeTranslation(h.x, BOARD_SURFACE_Y + TARGET_THICKNESS / 2, h.z),
    );
  }, [holes]);

  const applyMatrices = useCallback(
    (mesh: InstancedMesh | null) => {
      if (!mesh) return;
      matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.instanceMatrix.needsUpdate = true;
      // Three culls instanced raycasts against this; it has to be computed after the
      // matrices are in place, or picking silently stops working away from the origin.
      mesh.computeBoundingSphere();
    },
    [matrices],
  );

  const holeAt = (e: ThreeEvent<PointerEvent | MouseEvent>): HoleId | undefined =>
    e.instanceId !== undefined ? holes[e.instanceId]?.id : undefined;

  return (
    <group>
      {/* Body: spans y = 0 to BOARD_SURFACE_Y exactly. */}
      <mesh castShadow receiveShadow position={[0, BOARD_HEIGHT / 2, 0]}>
        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, BOARD_LENGTH]} />
        <meshStandardMaterial color="#dcd8cb" roughness={0.75} metalness={0} />
      </mesh>

      {/* Printed top surface, a hair above the body to avoid z-fighting. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, BOARD_SURFACE_Y + 0.02, 0]} receiveShadow>
        <planeGeometry args={[BOARD_WIDTH, BOARD_LENGTH]} />
        <meshStandardMaterial map={texture} roughness={0.65} metalness={0} />
      </mesh>

      <instancedMesh
        ref={applyMatrices}
        args={[undefined, undefined, holes.length]}
        onPointerMove={(e) => {
          e.stopPropagation();
          onHoverHole(holeAt(e) ?? null);
        }}
        onPointerOut={() => onHoverHole(null)}
        onClick={(e) => {
          e.stopPropagation();
          const id = holeAt(e);
          if (id) onClickHole(id);
        }}
      >
        {/* One pitch across, so the targets tile the board and every click lands somewhere. */}
        <boxGeometry args={[PITCH_MM - 0.06, TARGET_THICKNESS, PITCH_MM - 0.06]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/** The ring that shows where a part or wire end will land. */
export function HoleHighlight({ x, z, color }: { x: number; z: number; color: string }) {
  return (
    <mesh position={[x, BOARD_SURFACE_Y + 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.35, 2.1, 28]} />
      <meshBasicMaterial color={color} transparent opacity={0.95} depthTest={false} />
    </mesh>
  );
}
