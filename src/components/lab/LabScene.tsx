import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { Suspense } from 'react';
import { Breadboard, HoleHighlight } from './Breadboard';
import { PartMesh } from './PartMeshes';
import { GhostWire, Wire } from './Wires';
import { Smoke } from './Smoke';
import { holePosition, BOARD_HEIGHT } from '../../lib/circuit/coords';
import type { HoleId } from '../../lib/circuit/board';
import type { Circuit, Terminal } from '../../lib/circuit/types';
import type { Analysis } from '../../lib/circuit/analyze';
import { terminalPosition } from './positions';
import { partDef } from '../../lib/circuit/parts';

export type Quality = 'low' | 'medium' | 'high';

export interface SceneProps {
  circuit: Circuit;
  analysis: Analysis;
  hoveredHole: HoleId | null;
  wireStart: Terminal | null;
  pointer: Vector3 | null;
  wireColor: string;
  selectedPartId: string | null;
  smoke: { partId: string; startedAt: number }[];
  quality: Quality;
  onHoverHole: (id: HoleId | null) => void;
  onClickHole: (id: HoleId) => void;
  onClickPart: (id: string) => void;
  onClickSourcePin: (partId: string, pinId: string) => void;
  onPointerMove: (p: Vector3 | null) => void;
}

export function LabScene(props: SceneProps) {
  const { quality } = props;
  return (
    <Canvas
      shadows={quality !== 'low'}
      dpr={quality === 'high' ? [1, 1.75] : quality === 'medium' ? [1, 1.25] : 1}
      camera={{ position: [118, 92, 78], fov: 32, near: 1, far: 2000 }}
      gl={{ antialias: quality !== 'low' }}
    >
      <color attach="background" args={['#0c0e0d']} />
      <fog attach="fog" args={['#0c0e0d', 260, 620]} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[70, 130, 60]}
        intensity={1.5}
        castShadow={quality !== 'low'}
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      <directionalLight position={[-90, 70, -50]} intensity={0.35} color="#9fb6c9" />

      {/* Desk */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
        onPointerMove={(e) => {
          e.stopPropagation();
          props.onPointerMove(e.point);
        }}
      >
        <planeGeometry args={[900, 900]} />
        <meshStandardMaterial color="#1a1c1b" roughness={0.95} />
      </mesh>
      {quality !== 'low' && (
        <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={240} blur={2.4} far={40} />
      )}

      <Suspense fallback={null}>
        <Breadboard onHoverHole={props.onHoverHole} onClickHole={props.onClickHole} />

        {props.circuit.parts.map((part) => {
          const def = partDef(part.typeId);
          const isSource = def.category === 'power';
          return (
            <group
              key={part.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isSource) {
                  // Clicking the near half picks +, the far half picks −.
                  const local = e.point.z - (part.position?.z ?? 0);
                  props.onClickSourcePin(part.id, local < 0 ? 'pos' : 'neg');
                } else {
                  props.onClickPart(part.id);
                }
              }}
            >
              <PartMesh part={part} result={props.analysis.results[part.id]} />
            </group>
          );
        })}

        {props.circuit.wires.map((wire) => (
          <Wire key={wire.id} wire={wire} circuit={props.circuit} />
        ))}

        {props.wireStart && props.pointer && (
          <GhostWire
            from={terminalPosition(props.wireStart, props.circuit) ?? new Vector3()}
            to={props.pointer}
            color={props.wireColor}
          />
        )}

        {props.hoveredHole &&
          (() => {
            const p = holePosition(props.hoveredHole);
            return p ? (
              <HoleHighlight
                x={p.x}
                z={p.z}
                color={props.wireStart ? props.wireColor : '#c47a45'}
              />
            ) : null;
          })()}

        {props.smoke.map((s) => {
          const part = props.circuit.parts.find((p) => p.id === s.partId);
          if (!part) return null;
          const pos = terminalPosition({ kind: 'hole', hole: part.anchor ?? 'a1' }, props.circuit);
          return (
            <Smoke
              key={`${s.partId}-${s.startedAt}`}
              x={pos?.x ?? 0}
              y={BOARD_HEIGHT + 5}
              z={pos?.z ?? 0}
              startedAt={s.startedAt}
            />
          );
        })}
      </Suspense>

      <OrbitControls
        makeDefault
        target={[-6, 5, 0]}
        minDistance={40}
        maxDistance={340}
        maxPolarAngle={Math.PI / 2.08}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
