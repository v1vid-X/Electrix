/** The ESP32 board the Lab simulates.
 *
 *  ACCURACY NOTE. Per CLAUDE.md none of this is from memory. Everything below is either
 *  verified against the Espressif ESP32 / ESP32-WROOM-32 datasheet DC characteristics tables
 *  (see Sources in curriculum/21-first-code.md), or is explicitly marked as unverified and
 *  listed in docs/open-questions.md.
 *
 *  What is deliberately NOT modelled yet, because it could not be verified from a primary
 *  source in this environment:
 *   - GPIO34-39 (commonly said to be input-only) are not exposed at all.
 *   - INPUT_PULLUP, because the internal pull-up resistance is unverified. Lessons use an
 *     external resistor instead, which is better practice anyway.
 *   - The physical header order of any specific product. The Lab's board is a generic
 *     representation with correct GPIO numbers, not a photo-accurate clone of one product.
 */

/** Supply rail of a classic ESP32 dev board, in volts. */
export const VDD = 3.3;

/** Logic thresholds, from the datasheet DC characteristics table (at VDD = 3.3 V).
 *  VIH min = 0.75 x VDD, VIL max = 0.25 x VDD. Anything between the two is undefined —
 *  which is exactly why a floating input is a bug and not a feature. */
export const V_IH = 0.75 * VDD;
export const V_IL = 0.25 * VDD;

/** Output levels from the same table: VOH min = 0.8 x VDD, VOL max = 0.1 x VDD. */
export const V_OH_MIN = 0.8 * VDD;
export const V_OL_MAX = 0.1 * VDD;

/** Typical drive current from the datasheet DC table: IOH about 40 mA, IOL about 28 mA.
 *  We turn those into an output resistance, so a pin cannot deliver infinite current:
 *    high side: the pin may sag to VOH min (0.8 x VDD) at IOH  ->  R = 0.2 x VDD / IOH
 *    low side:  the pin may rise to VOL max (0.1 x VDD) at IOL ->  R = 0.1 x VDD / IOL
 *  This is a simplification of a real push-pull output stage, but it gets the important
 *  teaching point right: a GPIO is not a battery, and loading it makes its voltage sag. */
export const I_OH = 0.04;
export const I_OL = 0.028;
export const R_PIN_HIGH = ((1 - 0.8) * VDD) / I_OH;
export const R_PIN_LOW = (0.1 * VDD) / I_OL;

/** Absolute maximum cumulative current for all IO pins together, from the datasheet
 *  absolute maximum ratings table. Per-pin absolute maximums are NOT verified, so the Lab
 *  warns on the typical drive figures rather than claiming a destruction threshold. */
export const I_CUMULATIVE_MAX = 1.2;

export type PinKind = 'gpio' | 'power' | 'ground' | 'control';

export interface Esp32Pin {
  /** Silkscreen label, e.g. "GPIO13", "3V3", "GND". */
  id: string;
  kind: PinKind;
  /** GPIO number, for the ones that have one. */
  gpio?: number;
  /** Shown on hover. */
  note: string;
  /** Sampled at boot: using it carelessly can stop the board starting. */
  strapping?: boolean;
}

/** Strapping pins — GPIO0, GPIO2, GPIO5, GPIO12 and GPIO15 — are sampled while the chip
 *  comes out of reset, so whatever you wire to them decides how the board boots. They are
 *  included because they exist on a real board and the learner must know about them, but
 *  they are flagged everywhere they appear. */
const STRAPPING = new Set([0, 2, 5, 12, 15]);

/** General-purpose pins that are safe on a classic ESP32: not the SPI flash pins
 *  (GPIO6-GPIO11, which are wired to the flash chip inside the module and must never be
 *  used), and not a strapping pin. */
const SAFE_GPIO = [13, 14, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33];

const gpioPin = (n: number): Esp32Pin => ({
  id: `GPIO${n}`,
  kind: 'gpio',
  gpio: n,
  strapping: STRAPPING.has(n),
  note: STRAPPING.has(n)
    ? `GPIO${n}. STRAPPING PIN: its level is read while the board boots, so what you connect here can stop the board starting. Fine to use once you know that.`
    : `GPIO${n}. A general-purpose pin — safe to use as an input or an output.`,
});

/** The pins the Lab's board breaks out, twelve down each side.
 *  Pin ids are unique, so the two ground pins are GND1 and GND2; they are tied together
 *  inside the board, exactly as on real hardware. */
export const LEFT_PINS: Esp32Pin[] = [
  { id: '3V3', kind: 'power', note: '3.3 V out. The board makes this from the USB power coming in. Everything you build runs from it.' },
  { id: 'GND1', kind: 'ground', note: 'Ground, 0 V. The reference every other voltage is measured against.' },
  gpioPin(15),
  gpioPin(12),
  ...[13, 14, 27, 26, 25, 33, 32].map(gpioPin),
  gpioPin(2),
];

export const RIGHT_PINS: Esp32Pin[] = [
  { id: 'VIN', kind: 'power', note: '5 V, straight from the USB connector. NOT 3.3 V — do not feed this to a 3.3 V part.' },
  { id: 'GND2', kind: 'ground', note: 'Ground, 0 V. The same point as the other GND pin; boards have several for convenience.' },
  { id: 'EN', kind: 'control', note: 'Reset. Pulling this down to ground restarts the board.' },
  ...[23, 22, 21, 19, 18, 17, 16].map(gpioPin),
  gpioPin(5),
  gpioPin(0),
];

export const ALL_PINS: Esp32Pin[] = [...LEFT_PINS, ...RIGHT_PINS];

export const USABLE_GPIO = SAFE_GPIO;

export const gpioByNumber = (n: number): Esp32Pin | undefined =>
  ALL_PINS.find((p) => p.gpio === n);

/** What a digitalRead() sees. Between the two thresholds the real chip's answer is not
 *  defined, and pretending otherwise would teach the wrong lesson. */
export function readLogicLevel(volts: number): 'HIGH' | 'LOW' | 'undefined' {
  if (volts >= V_IH) return 'HIGH';
  if (volts <= V_IL) return 'LOW';
  return 'undefined';
}
