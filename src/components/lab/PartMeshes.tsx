import { useMemo } from 'react';
import { LatheGeometry, Quaternion, Vector2, Vector3 } from 'three';
import { BOARD_SURFACE_Y, holePosition } from '../../lib/circuit/coords';
import { bandsFor } from '../../lib/colorCode';
import { makeEsp32Texture } from './esp32Texture';
import { LEFT_PINS } from '../../lib/esp32/pins';
import { LED_COLORS, partDef } from '../../lib/circuit/parts';
import { pinHole } from '../../lib/circuit/netlist';
import { surfaceNoise } from './surfaceNoise';
import type { PartInstance } from '../../lib/circuit/types';
import type { PartResult } from '../../lib/circuit/analyze';

const TOP = BOARD_SURFACE_Y;
const UP = new Vector3(0, 1, 0);

export type Detail = 'low' | 'medium' | 'high';

/** Position, orientation and length of a cylinder spanning two points. Building every lead
 *  and body this way means geometry always follows the part's real pin positions. */
function segment(from: Vector3, to: Vector3) {
  const dir = to.clone().sub(from);
  const length = Math.max(dir.length(), 1e-4);
  return {
    position: from.clone().add(to).multiplyScalar(0.5),
    quaternion: new Quaternion().setFromUnitVectors(UP, dir.clone().normalize()),
    length,
  };
}

/** Tinned steel component lead. */
function Lead({ from, to, radius = 0.26 }: { from: Vector3; to: Vector3; radius?: number }) {
  const s = useMemo(() => segment(from, to), [from, to]);
  return (
    <mesh position={s.position} quaternion={s.quaternion} castShadow>
      <cylinderGeometry args={[radius, radius, s.length, 12]} />
      <meshStandardMaterial color="#d6dade" roughness={0.22} metalness={1} />
    </mesh>
  );
}

const at = (p: { x: number; z: number }, y: number) => new Vector3(p.x, y, p.z);

/** The silhouette of an axial resistor: a barrel with rounded shoulders, lathed around its
 *  axis. A plain cylinder reads as a peg; the shoulders are what make it a component. */
function resistorBody(length: number, radius: number): LatheGeometry {
  const steps = 22;
  const points: Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = -length / 2 + t * length;
    // Round off the last 12% at each end.
    const edge = Math.min(t, 1 - t) / 0.12;
    const r = radius * Math.sin(Math.min(1, edge) * (Math.PI / 2));
    points.push(new Vector2(Math.max(r, 0.2), y));
  }
  return new LatheGeometry(points, 28);
}

export function ResistorMesh({ part }: { part: PartInstance }) {
  const noise = useMemo(() => {
    const t = surfaceNoise().clone();
    t.repeat.set(3, 1);
    t.needsUpdate = true;
    return t;
  }, []);
  const a = pinHole(part, 'a');
  const b = pinHole(part, 'b');
  const pa = a ? holePosition(a) : null;
  const pb = b ? holePosition(b) : null;

  const geo = useMemo(() => {
    if (!pa || !pb) return null;
    const bodyY = TOP + 1.5;
    const legTopA = at(pa, bodyY);
    const legTopB = at(pb, bodyY);
    const axis = legTopB.clone().sub(legTopA);
    const span = axis.length();
    const dir = axis.clone().normalize();
    const bodyLength = Math.max(span - 2.6, 1.6);
    const start = legTopA.clone().add(dir.clone().multiplyScalar((span - bodyLength) / 2));
    const end = start.clone().add(dir.clone().multiplyScalar(bodyLength));
    return { legTopA, legTopB, start, end, bodyLength, ...segment(start, end) };
  }, [pa, pb]);

  const lathe = useMemo(() => (geo ? resistorBody(geo.bodyLength, 1.05) : null), [geo]);

  if (!pa || !pb || !geo || !lathe) return null;

  const bands = bandsFor(part.value ?? 330);
  const burnt = part.burnt === true;

  return (
    <group>
      <mesh position={geo.position} quaternion={geo.quaternion} geometry={lathe} castShadow receiveShadow>
        {/* Painted ceramic: matte body under a thin gloss lacquer. */}
        <meshStandardMaterial
          color={burnt ? '#2a2724' : '#cdb78d'}
          roughness={burnt ? 0.9 : 0.46}
          roughnessMap={noise}
          envMapIntensity={0.9}
        />
      </mesh>
      {!burnt &&
        bands.colors.map((color, i) => {
          const t = i < 3 ? 0.21 + i * 0.145 : 0.845;
          const p = geo.start.clone().lerp(geo.end, t);
          return (
            <mesh key={i} position={p} quaternion={geo.quaternion} castShadow>
              <cylinderGeometry args={[1.08, 1.08, i === 3 ? 0.46 : 0.6, 28]} />
              <meshStandardMaterial color={color} roughness={0.42} metalness={0.05} />
            </mesh>
          );
        })}
      <Lead from={at(pa, TOP - 1.6)} to={geo.start} />
      <Lead from={at(pb, TOP - 1.6)} to={geo.end} />
    </group>
  );
}

export function LedMesh({ part, result, detail = 'high' }: { part: PartInstance; result?: PartResult; detail?: Detail }) {
  const anode = pinHole(part, 'anode');
  const cathode = pinHole(part, 'cathode');
  const pa = anode ? holePosition(anode) : null;
  const pc = cathode ? holePosition(cathode) : null;
  if (!pa || !pc) return null;

  const spec = LED_COLORS[part.color ?? 'red'] ?? LED_COLORS.red;
  const brightness = part.burnt ? 0 : Math.min(1, result?.brightness ?? 0);
  const mid = { x: (pa.x + pc.x) / 2, z: (pa.z + pc.z) / 2 };
  const flangeY = TOP + 2.0;
  const bodyHeight = 3.2;
  const domeY = flangeY + bodyHeight;
  const burnt = part.burnt === true;

  // The epoxy lens.
  //
  // Deliberately NOT using `transmission`: real refraction forces the renderer to draw the
  // whole scene again every frame, which measured far too slow here, and on a 5 mm dome you
  // would barely see the difference. A transparent tinted body, a glossy coat and the real
  // metalwork visible inside it get the same read for a fraction of the cost.
  const lens = burnt ? (
    <meshStandardMaterial color="#2e2b28" roughness={0.85} />
  ) : detail === 'low' ? (
    // Fast path: one opaque lobe, no transparency and no second specular layer.
    <meshStandardMaterial
      color={spec.hex}
      emissive={spec.hex}
      emissiveIntensity={brightness * 2.8}
      roughness={0.3}
    />
  ) : (
    <meshPhysicalMaterial
      color={spec.hex}
      emissive={spec.hex}
      emissiveIntensity={brightness * 3.4}
      transparent
      opacity={0.74}
      roughness={0.12}
      clearcoat={1}
      clearcoatRoughness={0.06}
      ior={1.52}
      depthWrite={false}
    />
  );

  // Which side the cathode is on, so the flat on the flange lands correctly.
  const toCathode = new Vector3(pc.x - mid.x, 0, pc.z - mid.z).normalize();

  return (
    <group>
      <group position={[mid.x, 0, mid.z]}>
        <mesh position={[0, domeY, 0]} castShadow>
          <sphereGeometry args={detail === 'low' ? [2.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2] : [2.5, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          {lens}
        </mesh>
        <mesh position={[0, flangeY + bodyHeight / 2, 0]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, bodyHeight, 32]} />
          {lens}
        </mesh>
        {/* The flange, and the flat on its cathode side — how you read polarity in real life. */}
        <mesh position={[0, flangeY + 0.3, 0]} castShadow>
          <cylinderGeometry args={[2.95, 2.95, 0.6, 32]} />
          {lens}
        </mesh>
        <mesh position={toCathode.clone().multiplyScalar(2.78).setY(flangeY + 0.3)} castShadow>
          <boxGeometry args={[2.2, 0.62, 0.45]} />
          <meshStandardMaterial color={burnt ? '#2e2b28' : spec.hex} roughness={0.3} />
        </mesh>
        {/* Inside the lens: the reflector cup on the cathode lead and the post on the anode.
            Seeing these through the epoxy is most of what makes a rendered LED look real.
            Invisible when the lens is opaque, so skipped on the fast path. */}
        {!burnt && detail !== 'low' && (
          <>
            <mesh position={toCathode.clone().multiplyScalar(0.75).setY(flangeY + 2.1)}>
              <coneGeometry args={[0.75, 1.0, 16, 1, true]} />
              <meshStandardMaterial color="#b9bec4" roughness={0.3} metalness={1} side={2} />
            </mesh>
            <mesh position={toCathode.clone().multiplyScalar(-0.75).setY(flangeY + 1.5)}>
              <boxGeometry args={[0.45, 2.2, 0.45]} />
              <meshStandardMaterial color="#a8adb2" roughness={0.35} metalness={1} />
            </mesh>
            {brightness > 0.02 && (
              <mesh position={toCathode.clone().multiplyScalar(0.75).setY(flangeY + 2.35)}>
                <boxGeometry args={[0.5, 0.25, 0.5]} />
                <meshBasicMaterial color={spec.hex} />
              </mesh>
            )}
          </>
        )}
        {brightness > 0.06 && (
          <pointLight position={[0, domeY, 0]} color={spec.hex} intensity={brightness * 26} distance={46} decay={2} />
        )}
      </group>
      <Lead from={at(pa, TOP - 1.6)} to={at(pa, flangeY)} />
      <Lead from={at(pc, TOP - 1.6)} to={at(pc, flangeY)} />
      <Lead from={at(pa, flangeY)} to={new Vector3(mid.x, flangeY, mid.z)} />
      <Lead from={at(pc, flangeY)} to={new Vector3(mid.x, flangeY, mid.z)} />
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
        <meshStandardMaterial color={isUsb ? '#3d4746' : '#2f4760'} roughness={0.38} />
      </mesh>
      {[
        { x: isUsb ? 0 : -3.5, z: -7, color: '#c0392b' },
        { x: isUsb ? 0 : 3.5, z: 7, color: '#16181a' },
      ].map((t) => (
        <mesh key={t.z} position={[t.x, 16.6, t.z]} castShadow>
          <cylinderGeometry args={[2.1, 2.1, 1.6, 20]} />
          <meshStandardMaterial color={t.color} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}
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
        {/* Solder mask: matte underneath, glossy coat on top. */}
        <meshStandardMaterial color="#14263a" roughness={0.4} />
      </mesh>
      <mesh position={[cx, pcbY + 0.81, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[widthMm, lengthMm]} />
        <meshStandardMaterial map={texture} roughness={0.38} />
      </mesh>
      {/* Stamped steel shield over the radio. */}
      <mesh position={[cx, pcbY + 1.6, cz - lengthMm * 0.18]} castShadow>
        <boxGeometry args={[widthMm * 0.62, 1.4, lengthMm * 0.4]} />
        <meshStandardMaterial color="#aeb4ba" roughness={0.32} metalness={1} />
      </mesh>
      {/* USB socket. */}
      <mesh position={[cx, pcbY + 1.3, cz + lengthMm / 2 - 1]} castShadow>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color="#c3c9ce" roughness={0.26} metalness={1} />
      </mesh>
      {[pa.x, pr.x].map((x) => (
        <mesh key={x} position={[x, TOP + headerHeight / 2, cz]} castShadow>
          <boxGeometry args={[2.4, headerHeight, lengthMm - 4]} />
          <meshStandardMaterial color="#141617" roughness={0.85} />
        </mesh>
      ))}
      {LEFT_PINS.map((_, i) => {
        const z = pa.z + (pb.z - pa.z) * (i / (LEFT_PINS.length - 1));
        return [pa.x, pr.x].map((x) => (
          <Lead key={`${x}-${i}`} from={new Vector3(x, TOP - 1.6, z)} to={new Vector3(x, TOP + 0.3, z)} radius={0.3} />
        ));
      })}
    </group>
  );
}

export function PartMesh({
  part,
  result,
  detail = 'high',
}: {
  part: PartInstance;
  result?: PartResult;
  detail?: Detail;
}) {
  const def = partDef(part.typeId);
  if (part.typeId === 'esp32-devkit') return <Esp32Mesh part={part} />;
  if (def.category === 'power') return <SourceMesh part={part} />;
  if (part.typeId === 'led') return <LedMesh part={part} result={result} detail={detail} />;
  if (part.typeId === 'resistor') return <ResistorMesh part={part} />;
  return null;
}
