import { useMemo } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { BOARD_HEIGHT, holePosition } from '../../lib/circuit/coords';
import { bandsFor } from '../../lib/colorCode';
import { LED_COLORS, partDef } from '../../lib/circuit/parts';
import { pinHole } from '../../lib/circuit/netlist';
import type { PartInstance } from '../../lib/circuit/types';
import type { PartResult } from '../../lib/circuit/analyze';

const TOP = BOARD_HEIGHT;

/** A leg: a thin wire from the part's body down into a hole. */
function Leg({ from, to }: { from: [number, number, number]; to: [number, number, number] }) {
  const curve = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const mid = a.clone().lerp(b, 0.5);
    mid.y = Math.max(a.y, b.y) * 0.75;
    return new CatmullRomCurve3([a, mid, b]);
  }, [from, to]);

  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 12, 0.28, 6, false]} />
      <meshStandardMaterial color="#ced2d6" roughness={0.28} metalness={0.6} />
    </mesh>
  );
}

export function ResistorMesh({ part }: { part: PartInstance }) {
  const a = pinHole(part, 'a');
  const b = pinHole(part, 'b');
  const pa = a ? holePosition(a) : null;
  const pb = b ? holePosition(b) : null;
  if (!pa || !pb) return null;

  const mid = { x: (pa.x + pb.x) / 2, z: (pa.z + pb.z) / 2 };
  const bodyY = TOP + 2.2;
  const angle = Math.atan2(pb.x - pa.x, pb.z - pa.z);
  const bands = bandsFor(part.value ?? 330);
  const burnt = part.burnt === true;

  return (
    <group>
      <group position={[mid.x, bodyY, mid.z]} rotation={[Math.PI / 2, angle, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.1, 1.1, 6.2, 16]} />
          <meshStandardMaterial color={burnt ? '#2a2724' : '#d9c9a3'} roughness={0.6} />
        </mesh>
        {/* End caps, so it reads as a real axial part. */}
        {[-3.1, 3.1].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[1.11, 1.11, 0.5, 16]} />
            <meshStandardMaterial color={burnt ? '#1d1b19' : '#cdbb92'} roughness={0.7} />
          </mesh>
        ))}
        {!burnt &&
          bands.colors.map((color, i) => (
            <mesh key={i} position={[0, -1.8 + i * 1.2 + (i === 3 ? 0.5 : 0), 0]}>
              <cylinderGeometry args={[1.16, 1.16, i === 3 ? 0.5 : 0.7, 16]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
      </group>
      <Leg from={[pa.x, TOP + 1.4, pa.z]} to={[pa.x, TOP - 1, pa.z]} />
      <Leg from={[pb.x, TOP + 1.4, pb.z]} to={[pb.x, TOP - 1, pb.z]} />
      <Leg from={[mid.x, bodyY, mid.z]} to={[pa.x, TOP + 1.4, pa.z]} />
      <Leg from={[mid.x, bodyY, mid.z]} to={[pb.x, TOP + 1.4, pb.z]} />
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
  const mid = { x: (pa.x + pc.x) / 2, z: (pa.z + pc.z) / 2 };
  const bodyY = TOP + 4.4;

  return (
    <group>
      <group position={[mid.x, bodyY, mid.z]}>
        {/* Dome */}
        <mesh castShadow>
          <sphereGeometry args={[2.5, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color={part.burnt ? '#3a3632' : spec.hex}
            emissive={part.burnt ? '#000000' : spec.hex}
            emissiveIntensity={brightness * 3}
            transparent
            opacity={part.burnt ? 1 : 0.82}
            roughness={0.25}
          />
        </mesh>
        {/* Body below the dome, with the flat side on the cathode. */}
        <mesh position={[0, -1.4, 0]} castShadow>
          <cylinderGeometry args={[2.5, 2.5, 2.8, 20]} />
          <meshStandardMaterial
            color={part.burnt ? '#3a3632' : spec.hex}
            emissive={part.burnt ? '#000000' : spec.hex}
            emissiveIntensity={brightness * 1.4}
            transparent
            opacity={part.burnt ? 1 : 0.82}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -2.9, 0]}>
          <cylinderGeometry args={[2.9, 2.9, 0.7, 20]} />
          <meshStandardMaterial color={part.burnt ? '#2a2724' : '#cfd3d6'} roughness={0.5} metalness={0.3} />
        </mesh>
        {brightness > 0.08 && (
          <pointLight color={spec.hex} intensity={brightness * 20} distance={38} decay={2} />
        )}
      </group>
      <Leg from={[mid.x, bodyY - 3, mid.z]} to={[pa.x, TOP - 1, pa.z]} />
      <Leg from={[mid.x, bodyY - 3, mid.z]} to={[pc.x, TOP - 1, pc.z]} />
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
      {/* Terminals, so it is obvious where the wires go. */}
      <mesh position={[isUsb ? 0 : -3.5, 16.6, -7]}>
        <cylinderGeometry args={[2.1, 2.1, 1.6, 12]} />
        <meshStandardMaterial color="#d8322a" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[isUsb ? 0 : 3.5, 16.6, 7]}>
        <cylinderGeometry args={[2.1, 2.1, 1.6, 12]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

export function PartMesh({ part, result }: { part: PartInstance; result?: PartResult }) {
  const def = partDef(part.typeId);
  if (def.category === 'power') return <SourceMesh part={part} />;
  if (part.typeId === 'led') return <LedMesh part={part} result={result} />;
  if (part.typeId === 'resistor') return <ResistorMesh part={part} />;
  return null;
}
