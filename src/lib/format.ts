/** Engineering-notation formatting. Every number the learner reads goes through here,
 *  so units are always attached and the magnitude is always human-sized. */

const PREFIXES: ReadonlyArray<[exp: number, symbol: string]> = [
  [9, 'G'],
  [6, 'M'],
  [3, 'k'],
  [0, ''],
  [-3, 'm'],
  [-6, 'µ'],
  [-9, 'n'],
  [-12, 'p'],
];

/** 0.0136 A -> "13.6 mA"; 4700 -> "4.7 kΩ"; 0 -> "0 V". */
export function eng(value: number, unit: string, sigFigs = 3): string {
  if (!Number.isFinite(value)) return `— ${unit}`;
  if (value === 0) return `0 ${unit}`;
  const abs = Math.abs(value);
  const entry = PREFIXES.find(([exp]) => abs >= 10 ** exp) ?? PREFIXES[PREFIXES.length - 1];
  const [exp, symbol] = entry;
  const scaled = value / 10 ** exp;
  return `${trim(scaled, sigFigs)} ${symbol}${unit}`;
}

/** Significant figures without trailing zeros: 13.636 -> "13.6", 5 -> "5". */
export function trim(value: number, sigFigs = 3): string {
  const s = value.toPrecision(sigFigs);
  return String(Number(s));
}

export const volts = (v: number) => eng(v, 'V');
export const amps = (a: number) => eng(a, 'A');
export const ohms = (r: number) => eng(r, 'Ω');
export const watts = (w: number) => eng(w, 'W');
export const farads = (f: number) => eng(f, 'F');
export const seconds = (s: number) => eng(s, 's');
