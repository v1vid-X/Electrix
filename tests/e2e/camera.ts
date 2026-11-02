/** Where a breadboard hole appears on screen, using the same camera the Lab configures.
 *  Shared by the browser checks so they can click on a specific hole. */
import { PerspectiveCamera, Vector3 } from 'three';
import { BOARD_SURFACE_Y, holePosition } from '../../src/lib/circuit/coords';

export const VIEWPORT = { width: 1600, height: 1000 };

/** Must match LabScene.tsx. */
export const CAMERA = { position: [118, 92, 78], fov: 32, near: 1, far: 2000, target: [-6, 5, 0] };

export function screenPositionOf(holeId: string): { x: number; y: number } {
  const p = holePosition(holeId);
  if (!p) throw new Error(`no such hole: ${holeId}`);
  const camera = new PerspectiveCamera(
    CAMERA.fov,
    VIEWPORT.width / VIEWPORT.height,
    CAMERA.near,
    CAMERA.far,
  );
  camera.position.set(CAMERA.position[0], CAMERA.position[1], CAMERA.position[2]);
  camera.lookAt(new Vector3(CAMERA.target[0], CAMERA.target[1], CAMERA.target[2]));
  camera.updateMatrixWorld(true);
  const ndc = new Vector3(p.x, BOARD_SURFACE_Y, p.z).project(camera);
  return { x: (ndc.x * 0.5 + 0.5) * VIEWPORT.width, y: (-ndc.y * 0.5 + 0.5) * VIEWPORT.height };
}
