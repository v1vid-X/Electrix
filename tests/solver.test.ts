import { describe, expect, it } from 'vitest';
import { solveDc, saturationCurrentFor, type Netlist } from '../src/lib/solver/mna';
import { solveLinear, SingularMatrixError } from '../src/lib/solver/matrix';
import { parallelResistance, voltageDivider } from '../src/lib/ee';

describe('solveLinear', () => {
  it('solves a 2x2 system', () => {
    const x = solveLinear(
      [
        [2, 1],
        [1, 3],
      ],
      [5, 10],
    );
    expect(x[0]).toBeCloseTo(1, 10);
    expect(x[1]).toBeCloseTo(3, 10);
  });

  it('pivots when the first entry is zero', () => {
    const x = solveLinear(
      [
        [0, 2],
        [1, 1],
      ],
      [4, 3],
    );
    expect(x[0]).toBeCloseTo(1, 10);
    expect(x[1]).toBeCloseTo(2, 10);
  });

  it('rejects a singular system', () => {
    expect(() =>
      solveLinear(
        [
          [1, 1],
          [2, 2],
        ],
        [1, 2],
      ),
    ).toThrow(SingularMatrixError);
  });
});

describe('solveDc — linear circuits against textbook answers', () => {
  it('single resistor across a battery obeys Ohm law', () => {
    const net: Netlist = {
      nodeCount: 1,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 9 },
        { kind: 'resistor', id: 'r1', a: 1, b: 0, ohms: 330 },
      ],
    };
    const s = solveDc(net);
    expect(s.converged).toBe(true);
    expect(s.nodeVoltages[1]).toBeCloseTo(9, 6);
    expect(s.elementCurrents.r1).toBeCloseTo(9 / 330, 9);
    expect(s.sourceCurrents.bat).toBeCloseTo(9 / 330, 9);
  });

  it('two resistors in series divide the voltage, and match ee.voltageDivider', () => {
    const net: Netlist = {
      nodeCount: 2,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 5 },
        { kind: 'resistor', id: 'r1', a: 1, b: 2, ohms: 1700 },
        { kind: 'resistor', id: 'r2', a: 2, b: 0, ohms: 3300 },
      ],
    };
    const s = solveDc(net);
    const expected = voltageDivider(5, 1700, 3300);
    expect(s.nodeVoltages[2]).toBeCloseTo(expected.vOut, 6);
    expect(s.elementCurrents.r1).toBeCloseTo(expected.current, 9);
  });

  it('two resistors in parallel draw the combined current', () => {
    const net: Netlist = {
      nodeCount: 1,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 12 },
        { kind: 'resistor', id: 'r1', a: 1, b: 0, ohms: 2000 },
        { kind: 'resistor', id: 'r2', a: 1, b: 0, ohms: 3000 },
      ],
    };
    const s = solveDc(net);
    expect(s.sourceCurrents.bat).toBeCloseTo(12 / parallelResistance([2000, 3000]), 9);
  });

  it('solves a Wheatstone-style bridge (known analytic answer)', () => {
    // 10 V across two dividers: 1k/1k and 2k/3k. Bridge nodes should sit at 5 V and 6 V.
    const net: Netlist = {
      nodeCount: 3,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 10 },
        { kind: 'resistor', id: 'ra', a: 1, b: 2, ohms: 1000 },
        { kind: 'resistor', id: 'rb', a: 2, b: 0, ohms: 1000 },
        { kind: 'resistor', id: 'rc', a: 1, b: 3, ohms: 2000 },
        { kind: 'resistor', id: 'rd', a: 3, b: 0, ohms: 3000 },
      ],
    };
    const s = solveDc(net);
    expect(s.nodeVoltages[2]).toBeCloseTo(5, 6);
    expect(s.nodeVoltages[3]).toBeCloseTo(6, 6);
  });

  it('handles a current source into a resistor', () => {
    const net: Netlist = {
      nodeCount: 1,
      elements: [
        { kind: 'isource', id: 'i1', from: 0, to: 1, amps: 0.001 },
        { kind: 'resistor', id: 'r1', a: 1, b: 0, ohms: 1000 },
      ],
    };
    const s = solveDc(net);
    expect(s.nodeVoltages[1]).toBeCloseTo(1, 6);
  });

  it('treats a capacitor as an open circuit at DC', () => {
    const net: Netlist = {
      nodeCount: 2,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 5 },
        { kind: 'resistor', id: 'r1', a: 1, b: 2, ohms: 1000 },
        { kind: 'capacitor', id: 'c1', a: 2, b: 0, farads: 1e-6 },
      ],
    };
    const s = solveDc(net);
    // No steady current, so the capacitor sits at the full supply voltage.
    expect(s.nodeVoltages[2]).toBeCloseTo(5, 5);
    expect(Math.abs(s.elementCurrents.r1)).toBeLessThan(1e-8);
  });

  it('an unconnected node does not break the solve', () => {
    const net: Netlist = {
      nodeCount: 2,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 5 },
        { kind: 'resistor', id: 'r1', a: 1, b: 0, ohms: 1000 },
      ],
    };
    const s = solveDc(net);
    expect(s.nodeVoltages[2]).toBeCloseTo(0, 6);
  });
});

describe('solveDc — the LED', () => {
  // Red LED: 2.0 V across the terminals at 20 mA, emission coefficient 2,
  // 15 Ω of bulk resistance (typical for a 5 mm through-hole LED).
  const RED_RS = 15;
  const RED_IS = saturationCurrentFor(2.0, 0.02, 2, RED_RS);

  const ledCircuit = (supply: number, ohms: number, reversed = false): Netlist => ({
    nodeCount: 2,
    elements: [
      { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: supply },
      { kind: 'resistor', id: 'r1', a: 1, b: 2, ohms },
      reversed
        ? { kind: 'diode', id: 'led', anode: 0, cathode: 2, is: RED_IS, n: 2, rs: RED_RS }
        : { kind: 'diode', id: 'led', anode: 2, cathode: 0, is: RED_IS, n: 2, rs: RED_RS },
    ],
  });

  it('saturationCurrentFor reproduces the datasheet point', () => {
    const s = solveDc({
      nodeCount: 1,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 2.0 },
        { kind: 'diode', id: 'led', anode: 1, cathode: 0, is: RED_IS, n: 2, rs: RED_RS },
      ],
    });
    expect(s.elementCurrents.led).toBeCloseTo(0.02, 4);
  });

  it('red LED with 150 Ω on 5 V lands near the 20 mA design point', () => {
    const s = solveDc(ledCircuit(5, 150));
    expect(s.converged).toBe(true);
    expect(s.elementCurrents.led).toBeGreaterThan(0.016);
    expect(s.elementCurrents.led).toBeLessThan(0.024);
    // The LED holds roughly its forward voltage, which is the whole point.
    expect(s.nodeVoltages[2]).toBeGreaterThan(1.8);
    expect(s.nodeVoltages[2]).toBeLessThan(2.2);
  });

  it('a bigger resistor gives less current but barely changes the LED voltage', () => {
    const a = solveDc(ledCircuit(5, 150));
    const b = solveDc(ledCircuit(5, 1000));
    expect(b.elementCurrents.led).toBeLessThan(a.elementCurrents.led / 3);
    // 150 Ω -> 1 kΩ is a 6.7x change in resistance but moves the LED's own
    // voltage by less than half a volt. That is the point of a diode.
    expect(Math.abs(b.nodeVoltages[2] - a.nodeVoltages[2])).toBeLessThan(0.4);
  });

  it('passes almost nothing when wired backwards', () => {
    const s = solveDc(ledCircuit(5, 150, true));
    expect(Math.abs(s.elementCurrents.led)).toBeLessThan(1e-6);
  });

  it('no resistor on 5 V pushes a destructive current', () => {
    const s = solveDc(ledCircuit(5, 0));
    expect(s.converged).toBe(true);
    expect(s.elementCurrents.led).toBeGreaterThan(0.1); // >100 mA: magic smoke
  });

  it('a 3 V supply cannot light a 3.2 V blue LED much', () => {
    const blueIs = saturationCurrentFor(3.2, 0.02, 2, 15);
    const s = solveDc({
      nodeCount: 2,
      elements: [
        { kind: 'vsource', id: 'bat', pos: 1, neg: 0, volts: 3 },
        { kind: 'resistor', id: 'r1', a: 1, b: 2, ohms: 100 },
        { kind: 'diode', id: 'led', anode: 2, cathode: 0, is: blueIs, n: 2, rs: 15 },
      ],
    });
    expect(s.elementCurrents.led).toBeLessThan(0.005);
  });
});
