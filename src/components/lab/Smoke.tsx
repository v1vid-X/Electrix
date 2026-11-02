import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';

/** The magic smoke. Three puffs that rise, expand and fade, then stop.
 *  Deliberately short: the message panel is what teaches, this just makes it land. */
export function Smoke({ x, y, z, startedAt }: { x: number; y: number; z: number; startedAt: number }) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = Math.min(1, (performance.now() - startedAt) / 2200);
    ref.current.children.forEach((child, i) => {
      const local = Math.max(0, Math.min(1, t * 1.4 - i * 0.18));
      child.position.y = local * 16;
      const scale = 0.4 + local * 3.4;
      child.scale.setScalar(scale);
      const material = (child as unknown as { material: { opacity: number } }).material;
      material.opacity = Math.max(0, 0.42 * (1 - local));
    });
  });

  return (
    <group ref={ref} position={[x, y, z]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * 0.8, 0, 0]}>
          <sphereGeometry args={[1.6, 10, 8]} />
          <meshBasicMaterial color="#8d8b86" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}
