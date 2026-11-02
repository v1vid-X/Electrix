/** The electronics maths the lessons teach, in one testable place.
 *  Widgets must not re-implement any of this. */

/** Ohm's law: give exactly two of V, I, R and get the third. */
export function ohmsLaw(known: { v?: number; i?: number; r?: number }): {
  v: number;
  i: number;
  r: number;
  p: number;
} {
  const { v, i, r } = known;
  let V = v;
  let I = i;
  let R = r;
  if (V === undefined && I !== undefined && R !== undefined) V = I * R;
  else if (I === undefined && V !== undefined && R !== undefined) I = R === 0 ? Infinity : V / R;
  else if (R === undefined && V !== undefined && I !== undefined) R = I === 0 ? Infinity : V / I;
  if (V === undefined || I === undefined || R === undefined) {
    throw new Error('ohmsLaw needs exactly two of v, i, r');
  }
  return { v: V, i: I, r: R, p: V * I };
}

/** Resistors end to end: resistance adds. */
export function seriesResistance(values: readonly number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

/** Resistors side by side: conductance adds. A single 0 Ω shorts the lot. */
export function parallelResistance(values: readonly number[]): number {
  if (values.length === 0) return Infinity;
  if (values.some((r) => r === 0)) return 0;
  const g = values.reduce((sum, r) => sum + 1 / r, 0);
  return g === 0 ? Infinity : 1 / g;
}

/** Unloaded two-resistor divider. vOut is measured across r2 (the bottom resistor). */
export function voltageDivider(vIn: number, r1: number, r2: number): {
  vOut: number;
  current: number;
  pR1: number;
  pR2: number;
} {
  const total = r1 + r2;
  if (total === 0) return { vOut: 0, current: Infinity, pR1: Infinity, pR2: Infinity };
  const current = vIn / total;
  const vOut = vIn * (r2 / total);
  return { vOut, current, pR1: current * current * r1, pR2: current * current * r2 };
}

/** The series resistor an LED needs, and what actually happens with the resistor you own. */
export function ledResistor(args: {
  supplyV: number;
  forwardV: number;
  targetI: number;
  chosenR?: number;
}): {
  idealR: number;
  actualI: number;
  resistorP: number;
  ledP: number;
  /** true when the supply cannot even reach the LED's forward voltage */
  tooLittleVoltage: boolean;
} {
  const { supplyV, forwardV, targetI } = args;
  const headroom = supplyV - forwardV;
  const tooLittleVoltage = headroom <= 0;
  const idealR = tooLittleVoltage || targetI === 0 ? Infinity : headroom / targetI;
  const chosenR = args.chosenR ?? idealR;
  const actualI = tooLittleVoltage ? 0 : chosenR === 0 ? Infinity : headroom / chosenR;
  return {
    idealR,
    actualI,
    resistorP: actualI * actualI * chosenR,
    ledP: actualI * forwardV,
    tooLittleVoltage,
  };
}

/** RC time constant, in seconds. */
export const timeConstant = (r: number, c: number): number => r * c;

/** Capacitor voltage while charging towards vSupply through r. */
export function rcCharge(vSupply: number, r: number, c: number, t: number): number {
  return vSupply * (1 - Math.exp(-t / timeConstant(r, c)));
}

/** Capacitor voltage while discharging from v0 through r. */
export function rcDischarge(v0: number, r: number, c: number, t: number): number {
  return v0 * Math.exp(-t / timeConstant(r, c));
}

/** Time to reach a target voltage while charging. Infinity if unreachable. */
export function rcTimeToReach(vSupply: number, vTarget: number, r: number, c: number): number {
  if (vTarget >= vSupply) return Infinity;
  return -timeConstant(r, c) * Math.log(1 - vTarget / vSupply);
}

/** Battery life. capacity in mAh, draw in mA. Returns hours.
 *  derate models the real-world losses the datasheet number ignores. */
export function batteryLifeHours(capacityMah: number, averageDrawMa: number, derate = 0.8): number {
  if (averageDrawMa <= 0) return Infinity;
  return (capacityMah * derate) / averageDrawMa;
}

/** Average current of a duty-cycled device, in the same unit as the inputs. */
export function averageCurrent(args: {
  activeI: number;
  activeSeconds: number;
  sleepI: number;
  sleepSeconds: number;
}): number {
  const period = args.activeSeconds + args.sleepSeconds;
  if (period === 0) return args.activeI;
  return (args.activeI * args.activeSeconds + args.sleepI * args.sleepSeconds) / period;
}
