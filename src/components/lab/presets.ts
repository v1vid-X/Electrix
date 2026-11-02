/** Starter benches that lessons link to with ::lab{preset=...}. */
import { emptyCircuit, type Circuit } from '../../lib/circuit/types';

export interface Preset {
  id: string;
  goal: string;
  build: () => Circuit;
  /** Start with the supply switched off, so the learner presses the button and
   *  watches what happens rather than arriving after the fact. */
  startPowered?: boolean;
}

/** Power source on the bench, nothing wired. The learner does the rest. */
function withSource(typeId: 'usb-5v' | 'battery-9v', volts: number): Circuit {
  const c = emptyCircuit();
  c.parts.push({
    id: 'src',
    typeId,
    anchor: null,
    rotation: 0,
    position: { x: -42, z: 0 },
    value: volts,
  });
  return c;
}

export const PRESETS: Record<string, Preset> = {
  'led-basic': {
    id: 'led-basic',
    goal: 'Light the red LED without burning it out. Aim for roughly 10 to 20 mA.',
    build: () => withSource('usb-5v', 5),
  },
  'led-burn': {
    id: 'led-burn',
    goal: 'This LED is wired straight across 5 V with no resistor. Press Power on, watch it die, read why, then rebuild it properly.',
    startPowered: false,
    build: () => {
      const c = withSource('usb-5v', 5);
      c.parts.push({ id: 'led1', typeId: 'led', anchor: 'f10', rotation: 0, color: 'red' });
      c.wires.push(
        {
          id: 'w1',
          from: { kind: 'pin', partId: 'src', pinId: 'pos' },
          to: { kind: 'hole', hole: 'h10' },
          color: '#d8322a',
        },
        {
          id: 'w2',
          from: { kind: 'hole', hole: 'h11' },
          to: { kind: 'pin', partId: 'src', pinId: 'neg' },
          color: '#1a1a1a',
        },
      );
      return c;
    },
  },
  'ohms-law': {
    id: 'ohms-law',
    goal: 'Put one resistor across the 9 V battery and check the current with the numbers panel.',
    build: () => withSource('battery-9v', 9),
  },
};

export const presetOrDefault = (id: string | null): Preset =>
  (id && PRESETS[id]) || PRESETS['led-basic'];
