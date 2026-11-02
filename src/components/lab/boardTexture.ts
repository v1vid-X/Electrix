/** The breadboard's printed surface, drawn once into a canvas and used as a texture.
 *  Far cheaper than 420 hole meshes, and it gets us real silkscreen: numbered rows,
 *  lettered columns and the red/blue rail stripes. */
import { CanvasTexture, SRGBColorSpace } from 'three';
import { allHoles, BOARD_LENGTH, BOARD_WIDTH, rowZ } from '../../lib/circuit/coords';
import { COLUMNS, ROWS } from '../../lib/circuit/board';
import { holePosition } from '../../lib/circuit/coords';

const PX_PER_MM = 26;

export interface BoardMaps {
  /** What the board looks like. */
  color: CanvasTexture;
  /** Height, so the holes and the centre channel read as real recesses rather than paint. */
  bump: CanvasTexture;
}

export function makeBoardTexture(): BoardMaps {
  const w = Math.round(BOARD_WIDTH * PX_PER_MM);
  const h = Math.round(BOARD_LENGTH * PX_PER_MM);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Board body: slightly warm off-white ABS, with a faint grain.
  ctx.fillStyle = '#e6e2d6';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.025)';
  for (let i = 0; i < 2600; i++) {
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  const toPx = (xMm: number) => ((xMm + BOARD_WIDTH / 2) / BOARD_WIDTH) * w;
  const toPy = (zMm: number) => ((zMm + BOARD_LENGTH / 2) / BOARD_LENGTH) * h;

  // Centre channel.
  const channelHalf = 2.4 * PX_PER_MM;
  const gradient = ctx.createLinearGradient(w / 2 - channelHalf, 0, w / 2 + channelHalf, 0);
  gradient.addColorStop(0, '#c9c4b6');
  gradient.addColorStop(0.5, '#d8d4c7');
  gradient.addColorStop(1, '#c9c4b6');
  ctx.fillStyle = gradient;
  ctx.fillRect(w / 2 - channelHalf, 0, channelHalf * 2, h);

  // Power rail stripes, drawn just outside each rail.
  const stripe = (xMm: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toPx(xMm), toPy(rowZ(1)) - 14);
    ctx.lineTo(toPx(xMm), toPy(rowZ(ROWS)) + 14);
    ctx.stroke();
  };
  stripe(-23.6, '#c0392b');
  stripe(-17.9, '#2c5fa8');
  stripe(17.9, '#2c5fa8');
  stripe(23.6, '#c0392b');

  // Rail + and − marks.
  ctx.fillStyle = '#b03a2e';
  ctx.font = `bold ${Math.round(3.4 * PX_PER_MM)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const [xMm, label, color] of [
    [-23.6, '+', '#b03a2e'],
    [-17.9, '−', '#2c5fa8'],
    [17.9, '−', '#2c5fa8'],
    [23.6, '+', '#b03a2e'],
  ] as [number, string, string][]) {
    ctx.fillStyle = color;
    ctx.fillText(label, toPx(xMm), toPy(rowZ(1)) - 30);
    ctx.fillText(label, toPx(xMm), toPy(rowZ(ROWS)) + 30);
  }

  // Holes: a dark square with a lighter bevel, which reads as a recess.
  for (const hole of allHoles()) {
    const px = toPx(hole.x);
    const py = toPy(hole.z);
    const s = 0.95 * PX_PER_MM;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(px - s / 2 - 1, py - s / 2 - 1, s + 2, s + 2);
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(px - s / 2, py - s / 2, s, s);
  }

  // Silkscreen labels: column letters at both ends, row numbers every five rows.
  ctx.fillStyle = '#6a6559';
  ctx.font = `${Math.round(1.9 * PX_PER_MM)}px sans-serif`;
  for (const col of COLUMNS) {
    const px = toPx(holePosition(`${col}1`)!.x);
    ctx.fillText(col, px, toPy(rowZ(1)) - 14);
    ctx.fillText(col, px, toPy(rowZ(ROWS)) + 14);
  }
  for (let row = 1; row <= ROWS; row += row === 1 ? 4 : 5) {
    const py = toPy(rowZ(row));
    ctx.textAlign = 'right';
    ctx.fillText(String(row), toPx(holePosition('a1')!.x) - 10, py);
    ctx.textAlign = 'left';
    ctx.fillText(String(row), toPx(holePosition('j1')!.x) + 10, py);
    ctx.textAlign = 'center';
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 16;

  // Height map: white is the surface, black is cut into it.
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = w;
  bumpCanvas.height = h;
  const bctx = bumpCanvas.getContext('2d')!;
  bctx.fillStyle = '#ffffff';
  bctx.fillRect(0, 0, w, h);

  // The moulded channel down the middle.
  bctx.fillStyle = '#9a9a9a';
  bctx.fillRect(w / 2 - channelHalf, 0, channelHalf * 2, h);

  // Each hole, with a soft edge so the shading rolls off instead of stepping.
  for (const hole of allHoles()) {
    const px = toPx(hole.x);
    const py = toPy(hole.z);
    const s = 1.0 * PX_PER_MM;
    const g = bctx.createRadialGradient(px, py, 0, px, py, s);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.62, '#101010');
    g.addColorStop(1, '#ffffff');
    bctx.fillStyle = g;
    bctx.beginPath();
    bctx.arc(px, py, s, 0, Math.PI * 2);
    bctx.fill();
  }

  const bump = new CanvasTexture(bumpCanvas);
  bump.anisotropy = 8;

  return { color: texture, bump };
}
