/** The part registry: one entry per part type, holding everything the rest of the app
 *  needs to know about it — pins, limits, the simulation model, the tooltip, and which
 *  module unlocks it. Adding a part means adding one entry here and nothing else. */

import type { Element } from '../solver/mna';
import { saturationCurrentFor } from '../solver/mna';
import type { PartInstance } from './types';

export interface PinDef {
  id: string;
  label: string;
  /** Hole offset from the part's anchor, in (column, row) steps, before rotation. */
  dCol: number;
  dRow: number;
}

export interface PartLimits {
  /** Normal operating current, A. */
  ratedCurrent?: number;
  /** Beyond this the part is destroyed, A. */
  absMaxCurrent?: number;
  /** Power the package can get rid of, W. */
  powerRating?: number;
}

export interface PartDef {
  typeId: string;
  name: string;
  category: 'power' | 'passive' | 'semiconductor' | 'input' | 'instrument';
  /** One line for the hover tooltip. Plain language, no jargon. */
  summary: string;
  /** Module number that unlocks this part in the Lab. */
  unlockModule: number;
  pins: readonly PinDef[];
  /** Sits on the breadboard (true) or on the bench (false). */
  onBoard: boolean;
  defaultValue?: number;
  /** Values offered in the inspector, in SI base units. */
  valueOptions?: readonly number[];
  limits?: PartLimits;
  /** Turns an instance into solver elements. `node` resolves one of this part's pins. */
  toElements: (part: PartInstance, node: (pinId: string) => number) => Element[];
}

/** Forward voltage at 20 mA for common 5 mm LEDs, plus the bulk resistance that stops
 *  the current running away when the series resistor is missing.
 *  Typical values — real parts vary, which is what the datasheet is for. */
export const LED_COLORS: Record<string, { vf: number; rs: number; hex: string; label: string }> = {
  red: { vf: 2.0, rs: 15, hex: '#ff4436', label: 'Red' },
  yellow: { vf: 2.1, rs: 15, hex: '#ffc529', label: 'Yellow' },
  green: { vf: 2.1, rs: 15, hex: '#49dd6a', label: 'Green' },
  blue: { vf: 3.2, rs: 12, hex: '#4aa8ff', label: 'Blue' },
  white: { vf: 3.2, rs: 12, hex: '#f4f7ff', label: 'White' },
};

/** E12 series, the values a beginner's assortment actually contains. */
export const COMMON_RESISTORS = [
  10, 22, 47, 100, 150, 220, 330, 470, 680, 1_000, 2_200, 4_700, 10_000, 22_000, 47_000, 100_000,
  220_000, 1_000_000,
] as const;

const PART_LIST: readonly PartDef[] = [
  {
    typeId: 'battery-9v',
    name: '9 V battery',
    category: 'power',
    summary: 'A 9 volt block battery. Pushes current out of the + terminal, back into the −.',
    unlockModule: 1,
    onBoard: false,
    defaultValue: 9,
    valueOptions: [1.5, 3, 4.5, 9],
    pins: [
      { id: 'pos', label: '+', dCol: 0, dRow: 0 },
      { id: 'neg', label: '−', dCol: 0, dRow: 1 },
    ],
    toElements: (part, node) => [
      {
        kind: 'vsource',
        id: part.id,
        pos: node('pos'),
        neg: node('neg'),
        volts: part.value ?? 9,
      },
    ],
  },
  {
    typeId: 'usb-5v',
    name: 'USB 5 V supply',
    category: 'power',
    summary: '5 volts from a USB port. The safe way to power everything you build.',
    unlockModule: 1,
    onBoard: false,
    defaultValue: 5,
    valueOptions: [3.3, 5],
    pins: [
      { id: 'pos', label: '5V', dCol: 0, dRow: 0 },
      { id: 'neg', label: 'GND', dCol: 0, dRow: 1 },
    ],
    toElements: (part, node) => [
      { kind: 'vsource', id: part.id, pos: node('pos'), neg: node('neg'), volts: part.value ?? 5 },
    ],
  },
  {
    typeId: 'resistor',
    name: 'Resistor',
    category: 'passive',
    summary: 'Limits current. Same both ways round. Turns the energy it removes into heat.',
    unlockModule: 1,
    onBoard: true,
    defaultValue: 330,
    valueOptions: COMMON_RESISTORS,
    limits: { powerRating: 0.25 },
    pins: [
      { id: 'a', label: 'leg 1', dCol: 0, dRow: 0 },
      { id: 'b', label: 'leg 2', dCol: 0, dRow: 3 },
    ],
    toElements: (part, node) => [
      { kind: 'resistor', id: part.id, a: node('a'), b: node('b'), ohms: part.value ?? 330 },
    ],
  },
  {
    typeId: 'led',
    name: 'LED',
    category: 'semiconductor',
    summary: 'Lights up when current flows from its long leg to its short leg. Needs a resistor.',
    unlockModule: 1,
    onBoard: true,
    limits: { ratedCurrent: 0.02, absMaxCurrent: 0.05 },
    pins: [
      { id: 'anode', label: 'anode (long leg, +)', dCol: 0, dRow: 0 },
      { id: 'cathode', label: 'cathode (short leg, flat side, −)', dCol: 0, dRow: 1 },
    ],
    toElements: (part, node) => {
      const spec = LED_COLORS[part.color ?? 'red'] ?? LED_COLORS.red;
      return [
        {
          kind: 'diode',
          id: part.id,
          anode: node('anode'),
          cathode: node('cathode'),
          is: saturationCurrentFor(spec.vf, 0.02, 2, spec.rs),
          n: 2,
          rs: spec.rs,
        },
      ];
    },
  },
  {
    typeId: 'wire-link',
    name: 'Wire link',
    category: 'passive',
    summary: 'A bare piece of wire. Connects two points with (almost) no resistance.',
    unlockModule: 2,
    onBoard: true,
    pins: [
      { id: 'a', label: 'end 1', dCol: 0, dRow: 0 },
      { id: 'b', label: 'end 2', dCol: 5, dRow: 0 },
    ],
    toElements: (part, node) => [
      { kind: 'resistor', id: part.id, a: node('a'), b: node('b'), ohms: 0.01 },
    ],
  },
];

export const PARTS: Record<string, PartDef> = Object.fromEntries(
  PART_LIST.map((p) => [p.typeId, p]),
);

export const partDef = (typeId: string): PartDef => {
  const def = PARTS[typeId];
  if (!def) throw new Error(`Unknown part type: ${typeId}`);
  return def;
};

export const partList = (): PartDef[] => [...PART_LIST];
