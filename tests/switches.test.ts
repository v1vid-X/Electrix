import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/circuit/analyze';
import { pinHole } from '../src/lib/circuit/netlist';
import { emptyCircuit, type Circuit, type PartInstance } from '../src/lib/circuit/types';

const part = (p: Partial<PartInstance> & { id: string; typeId: string }): PartInstance => ({
  anchor: null,
  rotation: 0,
  ...p,
});

/** 5 V -> switch or button -> resistor -> LED -> ground. */
function gated(typeId: 'push-button' | 'switch', closed: boolean): Circuit {
  const c = emptyCircuit();
  c.parts.push(
    part({ id: 'src', typeId: 'usb-5v', value: 5 }),
    part({ id: 'sw', typeId, anchor: 'e5', closed }),
    part({ id: 'r1', typeId: 'resistor', anchor: 'g12', value: 220 }),
    part({ id: 'led', typeId: 'led', anchor: 'f20', color: 'red' }),
  );
  const out = typeId === 'push-button' ? pinHole(c.parts[1], 'r1')! : pinHole(c.parts[1], 'b')!;
  c.wires.push(
    { id: 'w1', from: { kind: 'pin', partId: 'src', pinId: 'pos' }, to: { kind: 'hole', hole: 'a5' }, color: 'red' },
    { id: 'w2', from: { kind: 'hole', hole: out }, to: { kind: 'hole', hole: 'h12' }, color: 'orange' },
    { id: 'w3', from: { kind: 'hole', hole: 'h15' }, to: { kind: 'hole', hole: 'h20' }, color: 'orange' },
    { id: 'w4', from: { kind: 'hole', hole: 'h21' }, to: { kind: 'pin', partId: 'src', pinId: 'neg' }, color: 'black' },
  );
  return c;
}

describe('push button', () => {
  it('passes no current when it is not held', () => {
    expect(Math.abs(analyze(gated('push-button', false)).results.led.current)).toBeLessThan(1e-5);
  });

  it('lights the LED while it is held', () => {
    const a = analyze(gated('push-button', true));
    expect(a.results.led.current).toBeGreaterThan(0.004);
    expect(a.ok).toBe(true);
  });

  it('joins the two legs on each side even when it is not pressed', () => {
    // This is the trap: people wire across one side and wonder why it is always connected.
    const c = emptyCircuit();
    c.parts.push(
      part({ id: 'src', typeId: 'usb-5v', value: 5 }),
      part({ id: 'sw', typeId: 'push-button', anchor: 'e5', closed: false }),
      part({ id: 'r1', typeId: 'resistor', anchor: 'g12', value: 1000 }),
    );
    const l1 = pinHole(c.parts[1], 'l1')!;
    const l2 = pinHole(c.parts[1], 'l2')!;
    c.wires.push(
      { id: 'w1', from: { kind: 'pin', partId: 'src', pinId: 'pos' }, to: { kind: 'hole', hole: l1.replace('e', 'a') }, color: 'red' },
      { id: 'w2', from: { kind: 'hole', hole: l2.replace('e', 'a') }, to: { kind: 'hole', hole: 'h12' }, color: 'orange' },
      { id: 'w3', from: { kind: 'hole', hole: 'h15' }, to: { kind: 'pin', partId: 'src', pinId: 'neg' }, color: 'black' },
    );
    // Current flows with the button released, because both legs are the same side.
    expect(Math.abs(analyze(c).results.r1.current)).toBeCloseTo(0.005, 4);
  });
});

describe('switch', () => {
  it('is open until it is flipped', () => {
    expect(Math.abs(analyze(gated('switch', false)).results.led.current)).toBeLessThan(1e-5);
  });

  it('closes the circuit when on', () => {
    expect(analyze(gated('switch', true)).results.led.current).toBeGreaterThan(0.004);
  });
});
