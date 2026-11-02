import { describe, expect, it } from 'vitest';
import {
  averageCurrent,
  batteryLifeHours,
  ledResistor,
  ohmsLaw,
  parallelResistance,
  rcCharge,
  rcDischarge,
  rcTimeToReach,
  seriesResistance,
  timeConstant,
  voltageDivider,
} from '../src/lib/ee';

describe('ohmsLaw', () => {
  it('solves for current (textbook: 9 V across 330 Ω)', () => {
    const r = ohmsLaw({ v: 9, r: 330 });
    expect(r.i).toBeCloseTo(0.027272727, 9);
    expect(r.p).toBeCloseTo(0.245454545, 9);
  });

  it('solves for voltage', () => {
    expect(ohmsLaw({ i: 0.02, r: 220 }).v).toBeCloseTo(4.4, 10);
  });

  it('solves for resistance', () => {
    expect(ohmsLaw({ v: 5, i: 0.01 }).r).toBeCloseTo(500, 10);
  });

  it('reports infinite current into a 0 Ω short', () => {
    expect(ohmsLaw({ v: 5, r: 0 }).i).toBe(Infinity);
  });

  it('refuses fewer than two knowns', () => {
    expect(() => ohmsLaw({ v: 5 })).toThrow();
  });
});

describe('series and parallel', () => {
  it('adds in series', () => {
    expect(seriesResistance([220, 330, 1000])).toBe(1550);
  });

  it('halves two equal resistors in parallel', () => {
    expect(parallelResistance([1000, 1000])).toBeCloseTo(500, 10);
  });

  it('matches the textbook 2k/3k parallel case', () => {
    expect(parallelResistance([2000, 3000])).toBeCloseTo(1200, 10);
  });

  it('treats a 0 Ω branch as a short', () => {
    expect(parallelResistance([1000, 0])).toBe(0);
  });

  it('is infinite with no resistors', () => {
    expect(parallelResistance([])).toBe(Infinity);
  });
});

describe('voltageDivider', () => {
  it('halves with equal resistors', () => {
    expect(voltageDivider(5, 1000, 1000).vOut).toBeCloseTo(2.5, 10);
  });

  it('makes 3.3 V from 5 V with 1k7/3k3 (textbook ratio)', () => {
    const { vOut } = voltageDivider(5, 1700, 3300);
    expect(vOut).toBeCloseTo(3.3, 10);
  });

  it('reports total current and each resistor power', () => {
    const d = voltageDivider(12, 10_000, 2_000);
    expect(d.current).toBeCloseTo(0.001, 10);
    expect(d.vOut).toBeCloseTo(2, 10);
    expect(d.pR1).toBeCloseTo(0.01, 10);
    expect(d.pR2).toBeCloseTo(0.002, 10);
  });
});

describe('ledResistor', () => {
  it('red LED on 5 V at 20 mA needs 150 Ω', () => {
    const r = ledResistor({ supplyV: 5, forwardV: 2, targetI: 0.02 });
    expect(r.idealR).toBeCloseTo(150, 10);
  });

  it('a 330 Ω resistor on a 3.3 V pin with a 2 V red LED gives about 3.9 mA', () => {
    const r = ledResistor({ supplyV: 3.3, forwardV: 2, targetI: 0.02, chosenR: 330 });
    expect(r.actualI).toBeCloseTo(0.0039394, 6);
    expect(r.resistorP).toBeCloseTo(0.00512, 5);
  });

  it('flags a supply below the forward voltage (blue LED on 3 V coin cell)', () => {
    const r = ledResistor({ supplyV: 3, forwardV: 3.2, targetI: 0.02 });
    expect(r.tooLittleVoltage).toBe(true);
    expect(r.actualI).toBe(0);
  });

  it('gives infinite current with no resistor at all', () => {
    const r = ledResistor({ supplyV: 5, forwardV: 2, targetI: 0.02, chosenR: 0 });
    expect(r.actualI).toBe(Infinity);
  });
});

describe('RC', () => {
  it('1 kΩ with 1000 µF is a 1 s time constant', () => {
    expect(timeConstant(1000, 1000e-6)).toBeCloseTo(1, 10);
  });

  it('reaches 63.2% of the supply after one time constant', () => {
    expect(rcCharge(5, 1000, 1000e-6, 1)).toBeCloseTo(5 * 0.6321206, 6);
  });

  it('falls to 36.8% after one time constant', () => {
    expect(rcDischarge(5, 1000, 1000e-6, 1)).toBeCloseTo(5 * 0.3678794, 6);
  });

  it('takes about 0.69 time constants to reach half the supply', () => {
    expect(rcTimeToReach(5, 2.5, 1000, 1000e-6)).toBeCloseTo(0.6931472, 6);
  });

  it('never reaches the supply voltage', () => {
    expect(rcTimeToReach(5, 5, 1000, 1000e-6)).toBe(Infinity);
  });
});

describe('battery life', () => {
  it('applies the derating factor', () => {
    expect(batteryLifeHours(2000, 100, 0.8)).toBeCloseTo(16, 10);
  });

  it('averages a duty-cycled load', () => {
    // 80 mA awake for 2 s, 0.02 mA asleep for 598 s -> 600 s period
    const avg = averageCurrent({ activeI: 80, activeSeconds: 2, sleepI: 0.02, sleepSeconds: 598 });
    expect(avg).toBeCloseTo((80 * 2 + 0.02 * 598) / 600, 10);
    expect(avg).toBeLessThan(1);
  });
});
