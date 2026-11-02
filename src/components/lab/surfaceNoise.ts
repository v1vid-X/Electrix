import { CanvasTexture, RepeatWrapping } from 'three';

let cached: CanvasTexture | null = null;

/** A small tiling noise texture, used as a roughness map.
 *
 *  Real moulded plastic and painted ceramic are never uniformly glossy: the highlight
 *  breaks up across the surface. A perfectly even roughness is the single most obvious
 *  "this is computer graphics" tell, and one shared 256px texture fixes it for every part
 *  at no meaningful cost. */
export function surfaceNoise(): CanvasTexture {
  if (cached) return cached;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(size, size);

  // Value noise at two scales: broad blotches plus fine grain.
  const lattice = (n: number) =>
    Array.from({ length: n * n }, () => Math.random());
  const coarse = lattice(16);
  const sample = (grid: number[], n: number, x: number, y: number) => {
    const gx = (x / size) * n;
    const gy = (y / size) * n;
    const x0 = Math.floor(gx) % n;
    const y0 = Math.floor(gy) % n;
    const x1 = (x0 + 1) % n;
    const y1 = (y0 + 1) % n;
    const fx = gx - Math.floor(gx);
    const fy = gy - Math.floor(gy);
    // Smoothstep, so the blotches have soft edges rather than diamonds.
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = grid[y0 * n + x0] * (1 - sx) + grid[y0 * n + x1] * sx;
    const bottom = grid[y1 * n + x0] * (1 - sx) + grid[y1 * n + x1] * sx;
    return top * (1 - sy) + bottom * sy;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const blotch = sample(coarse, 16, x, y);
      const grain = Math.random();
      const value = 150 + blotch * 80 + grain * 25;
      const i = (y * size + x) * 4;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  cached = new CanvasTexture(canvas);
  cached.wrapS = RepeatWrapping;
  cached.wrapT = RepeatWrapping;
  return cached;
}
