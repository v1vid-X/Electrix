/** The ESP32 board's printed surface: silkscreen pin labels down both edges, the module's
 *  metal can, and the board name. Drawn once into a canvas, like the breadboard. */
import { CanvasTexture, SRGBColorSpace } from 'three';
import { LEFT_PINS, RIGHT_PINS } from '../../lib/esp32/pins';

const PX_PER_MM = 24;

export function makeEsp32Texture(widthMm: number, lengthMm: number): CanvasTexture {
  const w = Math.round(widthMm * PX_PER_MM);
  const h = Math.round(lengthMm * PX_PER_MM);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Dark blue solder mask.
  ctx.fillStyle = '#1b2d44';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.02)';
  for (let i = 0; i < 1400; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);

  // The shielded radio module sits at one end, with its antenna sticking past the board.
  const canTop = h * 0.04;
  const canHeight = h * 0.42;
  ctx.fillStyle = '#b9bec4';
  ctx.fillRect(w * 0.17, canTop, w * 0.66, canHeight);
  ctx.strokeStyle = '#8d9399';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.17, canTop, w * 0.66, canHeight);
  ctx.fillStyle = '#6d7479';
  ctx.font = `600 ${Math.round(2.0 * PX_PER_MM)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ESP32', w / 2, canTop + canHeight / 2);

  // Pin labels, one row down each edge, rotated to read along the board.
  const labelPin = (
    pins: typeof LEFT_PINS,
    xPx: number,
    align: CanvasTextAlign,
    firstRowPx: number,
    pitchPx: number,
  ) => {
    ctx.font = `${Math.round(1.15 * PX_PER_MM)}px sans-serif`;
    ctx.textAlign = align;
    pins.forEach((pin, i) => {
      ctx.fillStyle =
        pin.kind === 'power' ? '#ff9b6a' : pin.kind === 'ground' ? '#9aa4ad' : pin.strapping ? '#ffd166' : '#dfe6ec';
      const label = pin.id.replace('GPIO', 'IO').replace(/GND\d/, 'GND');
      ctx.fillText(label, xPx, firstRowPx + i * pitchPx);
    });
  };

  const pitchPx = (lengthMm - 4) / (LEFT_PINS.length - 1) * PX_PER_MM;
  const firstRowPx = 2 * PX_PER_MM;
  labelPin(LEFT_PINS, w * 0.12, 'left', firstRowPx, pitchPx);
  labelPin(RIGHT_PINS, w * 0.88, 'right', firstRowPx, pitchPx);

  // USB socket end.
  ctx.fillStyle = '#c9ced3';
  ctx.fillRect(w * 0.33, h - 2.2 * PX_PER_MM, w * 0.34, 2.0 * PX_PER_MM);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
