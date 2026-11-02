import { useMemo } from 'react';
import { Quaternion, Vector3 } from 'three';
import { BOARD_SURFACE_Y, holePosition } from '../../lib/circuit/coords';
import { bandsFor } from '../../lib/colorCode';
import { makeEsp32Texture } from './esp32Texture';
import { LEFT_PINS } from '../../lib/esp32/pins';
import { LED_COLORS, partDef } from '../../lib/circuit/parts';
import { pinHole } from '../../lib/circuit/netlist';
import type { PartInstance } from '../../lib/circuit/types';
import type { PartResult } from '../../lib/circuit/analyze';

const TOP = BOARD_SURFACE_Y;
const UP = new Vector3(0, 1, 0);

/** Position, orientation and length of a cylinder spanning two points.
 *  Building every leg and body this way means a part's geometry always follows its real pin
 *  positions — the previous code rotated with an Euler angle that had no effect at all, so
 *  rotated parts pointed the wrong way. */
function segment(from: Vector3, to: Vector3) {
  const dir = to.clone().sub(from);
  const length = Math.max(dir.length(), 1e-4);
  return {
    position: from.clone().add(to).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
    length,
  };
}

/** A metal lead. */
function Rod({ from, to, radius = 0.26 }: { from: Vector3; to: Vector3; radius?: number }) {
  const s = useMemo(() => segment(from, to), [from, to]);
  return (
    <mesh position={s.position} quaternion={s.quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, s.length, 10]} />
      <meshStandardMaterial color="#cdd2d6" roughness={0.3} metalness={0.55} />
    </mesh>
  );
}

const at = (p: { x: number; z: number }, y: number) => new Vector3(p.x, y, p.z);

export function ResistorMesh({ part }: { part: PartInstance }) {
  const a = pinHole(part, 'a');
  const b = pinHole(part, 'b');
  const pa = a ? holePosition(a) : null;
  const pb = b ? holePosition(b) : null;

  const geo = useMemo(() => {
    if (!pa || !pb) return null;
    // Legs go into the holes; the body sits just above the board between them.
    const bodyY = TOP + 1.5;
    const legTopA = at(pa, bodyY);
    const legTopB = at(pb, bodyY);
    const axis = legTopB.clone().sub(legTopA);
    const span = axis.length();
    const dir = axis.clone().normalize();
    // Leave a little lead showing at each end, like a real axial part.
    const bodyLength = Math.max(span - 2.4, 1.5);
    const start = legTopA.clone().add(dir.clone().multiplyScalar((span - bodyLength) / 2));
    const end = start.clone().add(dir.clone().multiplyScalar(bodyLength));
    return { bodyY, legTopA, legTopB, start, end, dir, bodyLength, ...segment(start, end) };
  }, [pa, pb]);

  if (!pa || !pb || !geo) return null;

  const bands = bandsFor(part.value ?? 330);
  const burnt = part.burnt === true;
  const R = 1.05;

  return (
    <group>
      <mesh position={geo.position} quaternion={geo.quaternion} castShadow>
        <cylinderGeometry args={[R, R, geo.bodyLength, 18]} />
        <meshStandardMaterial color={burnt ? '#2a2724' : '#d9c9a3'} roughness={0.6} />
      </mesh>
      {/* Rounded shoulders, so it reads as a real part rather than a plain tube. */}
      {[geo.start, geo.end].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[R, 14, 10]} />
          <meshStandardMaterial color={burnt ? '#2a2724' : '#d2c097' } roughness={0.65} />
        </mesh>
      ))}
      {!burnt &&
        bands.colors.map((color, i) => {
          // Three value bands grouped at one end, tolerance band set apart at the other.
          const t = i < 3 ? 0.2 + i * 0.14 : 0.84;
          const p = geo.start.clone().lerp(geo.end, t);
          return (
            <mesh key={i} position={p} quaternion={geo.quaternion}>
              <cylinderGeometry args={[R + 0.05, R + 0.05, i === 3 ? 0.5 : 0.62, 18]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          );
        })}
      <Rod from={at(pa, TOP - 1.6)} to={geo.start} />
      <Rod from={at(pb, TOP - 1.6)} to={geo.end} />
    </group>
  );
}

export function LedMesh({ part, result }: { part: PartInstance; result?: PartResult }) {
  const anode = pinHole(part, 'anode');
  const cathode = pinHole(part, 'cathode');
  const pa = anode ? holePosition(anode) : null;
  const pc = cathode ? holePosition(cathode) : null;
  if (!pa || !pc) return null;

  const spec = LED_COLORS[part.color ?? 'red'] ?? LED_COLORS.red;
  const brightness = part.burnt ? 0 : Math.min(1, result?.brightness ?? 0);
  // A 5 mm LED: 2.5 mm radius body, a flange at the bottom, dome on top.
  const mid = { x: (pa.x + pc.x) / 2, z: (pa.z + pc.z) / 2 };
  const flangeY = TOP + 2.0;
  const bodyHeight = 3.2;
  const domeY = flangeY + bodyHeight;
  const colour = part.burnt ? '#3a3632' : spec.hex;
  const lens = (
    <meshStandardMaterial
      color={colour}
      emissive={part.burnt ? '#000000' : spec.hex}
      emissiveIntensity={brightness * 2.6}
      transparent
      opacity={part.burnt ? 1 : 0.8}
      roughness={0.22}
    />
  );

  return (
    <group>
      <group position={[mid.x, 0, mid.z]}>
        <mesh position={[0, domeY, 0]} castShadow>
          <sphereGeometry args={[2.5, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {lens}
        </mesh>
        <mesh position={[0, flangeY + bodyHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, bodyHeight, 22]} />
          {lens}
        </mesh>
        {/* The flange around the base, which is how you tell a real LED's orientation. */}
        <mesh position={[0, flangeY + 0.25, 0]} castShadow>
          <cylinderGeometry args={[2.95, 2.95, 0.5, 22]} />
          <meshStandardMaterial color={part.burnt ? '#2a2724' : colour} transparent opacity={part.burnt ? 1 : 0.85} roughness={0.4} />
        </mesh>
        {brightness > 0.06 && (
          <pointLight position={[0, domeY, 0]} color={spec.hex} intensity={brightness * 22} distance={44} decay={2} />
        )}
      </group>
      <Rod from={at(pa, TOP - 1.6)} to={at(pa, flangeY)} />
      <Rod from={at(pc, TOP - 1.6)} to={at(pc, flangeY)} />
      {/* The short bends from the leads in to the body. */}
      <Rod from={at(pa, flangeY)} to={new Vector3(mid.x, flangeY, mid.z)} />
      <Rod from={at(pc, flangeY)} to={new Vector3(mid.x, flangeY, mid.z)} />
    </group>
  );
}

/** Bench power: a block battery or a USB brick, sitting beside the board. */
export function SourceMesh({ part }: { part: PartInstance }) {
  const pos = part.position ?? { x: -40, z: 0 };
  const isUsb = part.typeId === 'usb-5v';
  return (
    <group position={[pos.x, 0, pos.z]}>
      <mesh position={[0, 8, 0]} castShadow receiveShadow>
        <boxGeometry args={isUsb ? [20, 16, 26] : [17, 16, 26]} />
        <meshStandardMaterial color={isUsb ? '#46504f' : '#39506a'} roughness={0.55} />
      </mesh>
      <mesh position={[isUsb ? 0 : -3.5, 16.6, -7]}>
        <cylinderGeometry args={[2.1, 2.1, 1.6, 14]} />
        <meshStandardMaterial color="#d8322a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[isUsb ? 0 : 3.5, 16.6, 7]}>
        <cylinderGeometry args={[2.1, 2.1, 1.6, 14]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

/** The dev board: a PCB on headers, straddling the centre channel. */
export function Esp32Mesh({ part }: { part: PartInstance }) {
  const first = pinHole(part, LEFT_PINS[0].id);
  const last = pinHole(part, LEFT_PINS[LEFT_PINS.length - 1].id);
  const right = pinHole(part, 'VIN');
  const pa = first ? holePosition(first) : null;
  const pb = last ? holePosition(last) : null;
  const pr = right ? holePosition(right) : null;

  const widthMm = pa && pr ? Math.abs(pr.x - pa.x) + 4.5 : 27;
  const lengthMm = pa && pb ? Math.abs(pb.z - pa.z) + 5 : 35;
  const texture = useMemo(() => makeEsp32Texture(widthMm, lengthMm), [widthMm, lengthMm]);

  if (!pa || !pb || !pr) return null;
  const cx = (pa.x + pr.x) / 2;
  const cz = (pa.z + pb.z) / 2;
  const headerHeight = 5.5;
  const pcbY = TOP + headerHeight + 0.8;

  return (
    <group>
      <mesh position={[cx, pcbY, cz]} castShadow receiveShadow>
        <boxGeometry args={[widthMm, 1.6, lengthMm]} />
        <meshStandardMaterial color="#1b2d44" roughness={0.6} />
      </mesh>
      <mesh position={[cx, pcbY + 0.81, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[widthMm, lengthMm]} />
        <meshStandardMaterial map={texture} roughness={0.55} />
      </mesh>
      <mesh position={[cx, pcbY + 1.6, cz - lengthMm * 0.18]} castShadow>
        <boxGeometry args={[widthMm * 0.62, 1.4, lengthMm * 0.4]} />
        <meshStandardMaterial color="#b9bec4" roughness={0.35} metalness={0.8} />
      </mesh>
      <mesh position={[cx, pcbY + 1.3, cz + lengthMm / 2 - 1]} castShadow>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color="#c9ced3" roughness={0.3} metalness={0.85} />
      </mesh>
      {[pa.x, pr.x].map((x) => (
        <mesh key={x} position={[x, TOP + headerHeight / 2, cz]} castShadow>
          <boxGeometry args={[2.4, headerHeight, lengthMm - 4]} />
          <meshStandardMaterial color="#17191a" roughness={0.8} />
        </mesh>
      ))}
      {LEFT_PINS.map((_, i) => {
        const z = pa.z + (pb.z - pa.z) * (i / (LEFT_PINS.length - 1));
        return [pa.x, pr.x].map((x) => (
          <Rod
            key={`${x}-${i}`}
            from={new Vector3(x, TOP - 1.6, z)}
            to={new Vector3(x, TOP + 0.3, z)}
            radius={0.3}
          />
        ));
      })}
    </group>
  );
}

export function PartMesh({ part, result }: { part: PartInstance; result?: PartResult }) {
  const def = partDef(part.typeId);
  if (part.typeId === 'esp32-devkit') return <Esp32Mesh part={part} />;
  if (def.category === 'power') return <SourceMesh part={part} />;
  if (part.typeId === 'led') return <LedMesh part={part} result={result} />;
  if (part.typeId === 'resistor') return <ResistorMesh part={part} />;
  return null;
}
