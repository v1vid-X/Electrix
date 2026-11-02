/** Resistor colour bands. Used to paint the 3D resistors correctly, and by the
 *  colour-code decoder widget later. */

export const BAND_COLORS = [
  '#1a1a1a', // 0 black
  '#6b3f17', // 1 brown
  '#d8322a', // 2 red
  '#e07b1d', // 3 orange
  '#e8cf3a', // 4 yellow
  '#3f9e4d', // 5 green
  '#3061c2', // 6 blue
  '#8b4fc4', // 7 violet
  '#8c8c8c', // 8 grey
  '#f2f2f2', // 9 white
] as const;

export const BAND_NAMES = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'grey',
  'white',
] as const;

export const GOLD = '#c9a227';

export interface Bands {
  /** Hex colours for the three value bands, plus the tolerance band. */
  colors: [string, string, string, string];
  /** Human-readable names, for the tooltip and the decoder widget. */
  names: [string, string, string, string];
}

/** Four-band code for a resistance in ohms: two digits, a multiplier, and gold (±5%). */
export function bandsFor(ohms: number): Bands {
  if (!Number.isFinite(ohms) || ohms <= 0) {
    return { colors: [BAND_COLORS[0], BAND_COLORS[0], BAND_COLORS[0], GOLD], names: ['black', 'black', 'black', 'gold'] };
  }
  // Two significant digits, then count how many zeros follow.
  const exponent = Math.max(0, Math.floor(Math.log10(ohms)) - 1);
  const mantissa = Math.round(ohms / 10 ** exponent);
  // Rounding 99.6 -> 100 would give a three-digit mantissa; carry it instead.
  const [digits, multiplier] =
    mantissa >= 100 ? [Math.round(mantissa / 10), exponent + 1] : [mantissa, exponent];
  const first = Math.floor(digits / 10);
  const second = digits % 10;
  const m = Math.min(9, multiplier);
  return {
    colors: [BAND_COLORS[first], BAND_COLORS[second], BAND_COLORS[m], GOLD],
    names: [BAND_NAMES[first], BAND_NAMES[second], BAND_NAMES[m], 'gold'],
  };
}
