import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/circuit/analyze';
import { pinHole, rotateOffset } from '../src/lib/circuit/netlist';
import type { Circuit, PartInstance } from '../src/lib/circuit/types';
import { emptyCircuit } from '../src/lib/circuit/types';

const part = (p: Partial<PartInstance> & { id: string; typeId: string }): PartInstance => ({
  anchor: null,
  rotation: 0,
  ...p,
});

/** The canonical first circuit: USB 5 V -> resistor -> LED -> back to ground. */
function ledCircuit(ohms: number | null): Circuit {
  const c = emptyCircuit();
  c.parts.push(
    part({ id: 'src', typeId: 'usb-5v', value: 5 }),
    part({ id: 'led', typeId: 'led', anchor: 'f10', rotation: 0, color: 'red' }),
  );
  if (ohms !== null) {
    // Resistor from row 5 to row 8 in the right half.
    c.parts.push(part({ id: 'r1', typeId: 'resistor', anchor: 'g5', rotation: 0, value: ohms }));
    // supply + -> resistor top; resistor bottom -> LED anode; LED cathode -> supply -
    c.wires.push(
      { id: 'w1', from: { kind: 'pin', partId: 'src', pinId: 'pos' }, to: { kind: 'hole', hole: 'h5' }, color: 'red' },
      { id: 'w2', from: { kind: 'hole', hole: 'h8' }, to: { kind: 'hole', hole: 'h10' }, color: 'orange' },
      { id: 'w3', from: { kind: 'hole', hole: 'h11' }, to: { kind: 'pin', partId: 'src', pinId: 'neg' }, color: 'black' },
    );
  } else {
    c.wires.push(
      { id: 'w1', from: { kind: 'pin', partId: 'src', pinId: 'pos' }, to: { kind: 'hole', hole: 'h10' }, color: 'red' },
      { id: 'w3', from: { kind: 'hole', hole: 'h11' }, to: { kind: 'pin', partId: 'src', pinId: 'neg' }, color: 'black' },
    );
  }
  return c;
}

describe('pin placement', () => {
  it('rotates offsets in 90 degree steps', () => {
    expect(rotateOffset(0, 3, 0)).toEqual([0, 3]);
    expect(rotateOffset(0, 3, 1)).toEqual([-3, 0]);
    expect(rotateOffset(0, 3, 2)).toEqual([0, -3]);
    expect(rotateOffset(0, 3, 3)).toEqual([3, 0]);
  });

  it('puts a resistor three rows down from its anchor', () => {
    const r = part({ id: 'r1', typeId: 'resistor', anchor: 'a5' });
    expect(pinHole(r, 'a')).toBe('a5');
    expect(pinHole(r, 'b')).toBe('a8');
  });

  it('lays a rotated resistor across the columns', () => {
    const r = part({ id: 'r1', typeId: 'resistor', anchor: 'd5', rotation: 1 });
    expect(pinHole(r, 'b')).toBe('a5');
  });

  it('returns null when a pin would fall off the board', () => {
    const r = part({ id: 'r1', typeId: 'resistor', anchor: 'a29' });
    expect(pinHole(r, 'b')).toBe(null);
  });
});

describe('analyze', () => {
  it('says nothing is happening on an empty bench', () => {
    const a = analyze(emptyCircuit());
    expect(a.ok).toBe(true);
    expect(a.story[0]).toMatch(/Nothing is connected/i);
  });

  it('lights the LED at a safe current with a 220 Ω resistor on 5 V', () => {
    const a = analyze(ledCircuit(220));
    expect(a.ok).toBe(true);
    const led = a.results.led;
    expect(led.current).toBeGreaterThan(0.008);
    expect(led.current).toBeLessThan(0.02);
    expect(led.burnsOut).toBe(false);
    expect(led.brightness).toBeGreaterThan(0.3);
    // The explanation must actually contain the arithmetic.
    expect(a.story.join(' ')).toMatch(/÷/);
  });

  it('burns the LED out when the resistor is missing', () => {
    const a = analyze(ledCircuit(null));
    expect(a.results.led.burnsOut).toBe(true);
    expect(a.ok).toBe(false);
    expect(a.diagnostics.some((d) => /smoke/i.test(d.title))).toBe(true);
  });

  it('burns the LED out with a resistor that is far too small', () => {
    const a = analyze(ledCircuit(10));
    expect(a.results.led.burnsOut).toBe(true);
  });

  it('cooks the resistor when it is asked to dissipate too much', () => {
    const c = emptyCircuit();
    c.parts.push(
      part({ id: 'src', typeId: 'battery-9v', value: 9 }),
      part({ id: 'r1', typeId: 'resistor', anchor: 'a5', value: 10 }),
    );
    c.wires.push(
      { id: 'w1', from: { kind: 'pin', partId: 'src', pinId: 'pos' }, to: { kind: 'hole', hole: 'b5' }, color: 'red' },
      { id: 'w2', from: { kind: 'hole', hole: 'b8' }, to: { kind: 'pin', partId: 'src', pinId: 'neg' }, color: 'black' },
    );
    const a = analyze(c);
    // 9 V across 10 Ω is 8.1 W in a quarter-watt part.
    expect(a.results.r1.power).toBeGreaterThan(8);
    expect(a.results.r1.burnsOut).toBe(true);
  });

  it('refuses a dead short across the supply and explains it', () => {
    const c = emptyCircuit();
    c.parts.push(part({ id: 'src', typeId: 'usb-5v', value: 5 }));
    c.wires.push({
      id: 'w1',
      from: { kind: 'pin', partId: 'src', pinId: 'pos' },
      to: { kind: 'pin', partId: 'src', pinId: 'neg' },
      color: 'red',
    });
    const a = analyze(c);
    expect(a.ok).toBe(false);
    expect(a.diagnostics[0].title).toMatch(/short circuit/i);
  });

  it('does not light an LED that is in backwards', () => {
    const c = ledCircuit(220);
    const led = c.parts.find((p) => p.id === 'led')!;
    led.rotation = 2; // anode and cathode swap places
    const a = analyze(c);
    expect(Math.abs(a.results.led.current)).toBeLessThan(1e-5);
    expect(a.story.join(' ')).toMatch(/backwards/i);
  });

  it('treats the centre gap as a real break in the circuit', () => {
    const c = ledCircuit(220);
    // Move the LED to the left half: the wires still land in the right half, so the
    // loop is now open even though the row numbers look right.
    const led = c.parts.find((p) => p.id === 'led')!;
    led.anchor = 'a10';
    const a = analyze(c);
    expect(Math.abs(a.results.led.current)).toBeLessThan(1e-5);
  });

  it('keeps a burnt part dead until it is replaced', () => {
    const c = ledCircuit(220);
    c.parts.find((p) => p.id === 'led')!.burnt = true;
    const a = analyze(c);
    expect(a.results.led).toBeUndefined();
    expect(a.diagnostics.some((d) => /burnt out/i.test(d.title))).toBe(true);
  });

  it('notices a split rail, which is the classic beginner trap', () => {
    const build = (splitRails: boolean): Circuit => {
      const c = emptyCircuit({ splitRails });
      c.parts.push(
        part({ id: 'src', typeId: 'usb-5v', value: 5 }),
        part({ id: 'r1', typeId: 'resistor', anchor: 'a5', value: 1000 }),
      );
      c.wires.push(
        // Supply feeds the TOP of the + rail; the resistor is fed from the BOTTOM of it.
        { id: 'w1', from: { kind: 'pin', partId: 'src', pinId: 'pos' }, to: { kind: 'hole', hole: 'TP:2' }, color: 'red' },
        { id: 'w2', from: { kind: 'hole', hole: 'TP:28' }, to: { kind: 'hole', hole: 'b5' }, color: 'red' },
        { id: 'w3', from: { kind: 'hole', hole: 'b8' }, to: { kind: 'pin', partId: 'src', pinId: 'neg' }, color: 'black' },
      );
      return c;
    };
    expect(Math.abs(analyze(build(false)).results.r1.current)).toBeCloseTo(0.005, 4);
    expect(Math.abs(analyze(build(true)).results.r1.current)).toBeLessThan(1e-6);
  });
});

describe('reported numbers are honest', () => {
  it('shows exactly zero current when nothing forms a loop', () => {
    const c = emptyCircuit();
    c.parts.push(part({ id: 'src', typeId: 'usb-5v', value: 5 }));
    c.parts.push(part({ id: 'r1', typeId: 'resistor', anchor: 'a5', value: 1000 }));
    const a = analyze(c);
    expect(a.sourceCurrents.src).toBe(0);
    expect(a.results.r1.current).toBe(0);
    expect(a.story.join(' ')).toMatch(/no current is flowing/i);
  });
});
