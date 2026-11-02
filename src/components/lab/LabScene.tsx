import { Canvas } from '@react-three/fiber';
import { ACESFilmicToneMapping, PCFSoftShadowMap } from 'three';
import { Studio } from './Studio';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { Suspense } from 'react';
import { Breadboard, HoleHighlight } from './Breadboard';
import { PartMesh } from './PartMeshes';
import { GhostWire, Wire } from './Wires';
import { Smoke } from './Smoke';
import { holePosition, BOARD_HEIGHT, BOARD_SURFACE_Y } from '../../lib/circuit/coords';
import { pinHole } from '../../lib/circuit/netlist';
import type { HoleId } from '../../lib/circuit/board';
import type { Circuit, PartInstance, Terminal } from '../../lib/circuit/types';
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
  /** True when the select tool is active. While wiring or placing, parts must not swallow
   *  clicks meant for the holes — otherwise a tall part blocks every hole behind it and the
   *  hover readout disagrees with what clicking actually does. */
  selectMode: boolean;
  hoveredPartId: string | null;
  onHoverPart: (id: string | null) => void;
  /** A push button being held down. */
  onPressPart: (id: string, pressed: boolean) => void;
  /** A switch being flipped. */
  onTogglePart: (id: string) => void;
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
      onCreated={({ gl: renderer }) => {
        // Filmic response: highlights roll off instead of clipping to white, which is most
        // of what separates a render that looks photographed from one that looks plastic.
        renderer.toneMapping = ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        if (quality === 'high') renderer.shadowMap.type = PCFSoftShadowMap;
      }}
    >
      <color attach="background" args={['#0c0e0d']} />
      <fog attach="fog" args={['#0c0e0d', 300, 700]} />

      {/* Reflections and ambient light for every surface, generated in code.
          This replaces the fill and bounce lights rather than adding to them: one key light
          plus image-based lighting is both more convincing and cheaper than three lights. */}
      {/* Kept deliberately dim. The environment is here for reflections and a little bounce,
          not to light the scene: a bright studio would wash out the dark workbench the rest
          of the app is designed around. */}
      {quality !== 'low' && <Studio intensity={0.32} />}

      <ambientLight intensity={quality === 'low' ? 1.1 : 0.18} />
      <directionalLight
        position={[70, 130, 60]}
        intensity={quality === 'low' ? 1.5 : 1.7}
        castShadow={quality !== 'low'}
        shadow-mapSize={quality === 'high' ? [2048, 2048] : [1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.35}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
      />
      {/* Cool fill, so shadowed faces are readable without being lit from nowhere. */}
      <directionalLight position={[-90, 70, -50]} intensity={0.45} color="#9fb6c9" />

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
        {/* A dark rubber mat: almost no specular, so the parts are what catches the light. */}
        {/* The desk stays dark: it must not pick up the studio reflection. */}
        <meshStandardMaterial color="#17191a" roughness={0.96} envMapIntensity={0.12} />
      </mesh>
      {quality !== 'low' && (
        <ContactShadows position={[0, 0.02, 0]} opacity={0.5} scale={240} blur={2.4} far={40} />
      )}

      <Suspense fallback={null}>
        <Breadboard onHoverHole={props.onHoverHole} onClickHole={props.onClickHole} detail={quality} />

        {props.circuit.parts.map((part) => {
          const def = partDef(part.typeId);
          const isSource = def.category === 'power';
          // A bench supply is always clickable, because its terminals are how you wire to it.
          // Everything else is transparent to clicks unless the select tool is active.
          const clickable = isSource || props.selectMode;
          // Buttons and switches are operated by clicking them, whatever tool is active:
          // that is the whole point of having them on the bench.
          const operable = def.interaction !== undefined && !part.burnt;
          return (
            <group
              key={part.id}
              onPointerDown={
                operable && def.interaction === 'momentary'
                  ? (e) => {
                      e.stopPropagation();
                      props.onPressPart(part.id, true);
                    }
                  : undefined
              }
              onPointerUp={
                operable && def.interaction === 'momentary'
                  ? () => props.onPressPart(part.id, false)
                  : undefined
              }
              onPointerOver={
                props.selectMode
                  ? (e) => {
                      e.stopPropagation();
                      props.onHoverPart(part.id);
                    }
                  : undefined
              }
              onPointerOut={props.selectMode ? () => props.onHoverPart(null) : undefined}
              onClick={
                operable && def.interaction === 'toggle'
                  ? (e) => {
                      e.stopPropagation();
                      props.onTogglePart(part.id);
                      props.onClickPart(part.id);
                    }
                  : clickable
                  ? (e) => {
                      e.stopPropagation();
                      if (isSource) {
                        // Clicking the near half picks +, the far half picks −.
                        const local = e.point.z - (part.position?.z ?? 0);
                        props.onClickSourcePin(part.id, local < 0 ? 'pos' : 'neg');
                      } else {
                        props.onClickPart(part.id);
                      }
                    }
                  : undefined
              }
            >
              <PartMesh part={part} result={props.analysis.results[part.id]} detail={quality} />
            </group>
          );
        })}

        {/* Which part is under the pointer, and which one is selected. Without this there is
            no way to tell what a click is about to act on. */}
        {props.circuit.parts.map((part) => {
          const selected = part.id === props.selectedPartId;
          const hovered = part.id === props.hoveredPartId;
          if (!selected && !hovered) return null;
          return (
            <PartOutline
              key={`outline-${part.id}`}
              part={part}
              color={selected ? '#c47a45' : '#e9ece7'}
            />
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
        minDistance={55}
        maxDistance={340}
        maxPolarAngle={Math.PI / 2.08}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}


/** Rings in every hole a part occupies, plus a box for parts that sit on the bench.
 *  Showing the footprint rather than a glow also teaches which holes the part is using. */
function PartOutline({ part, color }: { part: PartInstance; color: string }) {
  const def = partDef(part.typeId);
  const holes = def.pins
    .map((pin) => pinHole(part, pin.id))
    .filter((h): h is string => Boolean(h))
    .map((h) => holePosition(h))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (holes.length === 0) {
    const pos = part.position ?? { x: -40, z: 0 };
    return (
      <mesh position={[pos.x, 8, pos.z]}>
        <boxGeometry args={[23, 19, 29]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.55} depthTest={false} />
      </mesh>
    );
  }

  return (
    <group>
      {holes.map((p, i) => (
        <mesh key={i} position={[p.x, BOARD_SURFACE_Y + 0.06, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 2.25, 28]} />
          <meshBasicMaterial color={color} transparent opacity={0.95} depthTest={false} />
        </mesh>
      ))}
    </group>
  );
}
