import { describe, expect, it } from 'vitest';
import { analyze } from '../src/lib/circuit/analyze';
import { buildNetlist, pinHole } from '../src/lib/circuit/netlist';
import { partDef } from '../src/lib/circuit/parts';
import { emptyCircuit, type Circuit, type PartInstance } from '../src/lib/circuit/types';
import { LEFT_PINS, RIGHT_PINS, readLogicLevel, VDD } from '../src/lib/esp32/pins';
import { PRESETS } from '../src/components/lab/presets';
import { withGpio } from '../src/components/lab/sketchHost';

const part = (p: Partial<PartInstance> & { id: string; typeId: string }): PartInstance => ({
  anchor: null,
  rotation: 0,
  ...p,
});

/** ESP32 on the board, a resistor and an LED from GPIO13 to ground. */
function blinkCircuit(gpioState: 'input' | 'high' | 'low', resistorOhms: number | null): Circuit {
  const c = emptyCircuit();
  c.parts.push(
    part({ id: 'mcu', typeId: 'esp32-devkit', anchor: 'b3', gpio: { '13': gpioState } }),
  );
  const ledAnchor = 'f20';
  c.parts.push(part({ id: 'led', typeId: 'led', anchor: ledAnchor, color: 'red' }));

  const gpio13 = pinHole(c.parts[0], 'GPIO13')!;
  const gnd = pinHole(c.parts[0], 'GND2')!;

  if (resistorOhms !== null) {
    c.parts.push(part({ id: 'r1', typeId: 'resistor', anchor: 'g10', value: resistorOhms }));
    c.wires.push(
      { id: 'w1', from: { kind: 'hole', hole: gpio13 }, to: { kind: 'hole', hole: 'h10' }, color: 'red' },
      { id: 'w2', from: { kind: 'hole', hole: 'h13' }, to: { kind: 'hole', hole: 'h20' }, color: 'orange' },
      { id: 'w3', from: { kind: 'hole', hole: 'h21' }, to: { kind: 'hole', hole: gnd }, color: 'black' },
    );
  } else {
    c.wires.push(
      { id: 'w1', from: { kind: 'hole', hole: gpio13 }, to: { kind: 'hole', hole: 'h20' }, color: 'red' },
      { id: 'w3', from: { kind: 'hole', hole: 'h21' }, to: { kind: 'hole', hole: gnd }, color: 'black' },
    );
  }
  return c;
}

describe('the board itself', () => {
  it('has twelve pins down each side, straddling the centre channel', () => {
    expect(LEFT_PINS).toHaveLength(12);
    expect(RIGHT_PINS).toHaveLength(12);
    const def = partDef('esp32-devkit');
    expect(def.pins).toHaveLength(24);
    const p = part({ id: 'mcu', typeId: 'esp32-devkit', anchor: 'b3' });
    // Left header in the left half of the board, right header in the right half.
    expect(pinHole(p, '3V3')).toBe('b3');
    expect(pinHole(p, 'VIN')).toBe('i3');
  });

  it('gives every pin a unique id', () => {
    const ids = partDef('esp32-devkit').pins.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('puts 3.3 V on the 3V3 pin and 5 V on VIN, measured from GND', () => {
    const c = emptyCircuit();
    c.parts.push(part({ id: 'mcu', typeId: 'esp32-devkit', anchor: 'b3' }));
    const a = analyze(c);
    const v = (pin: string) => a.nodeVoltages[nodeOfIn(c, 'mcu', pin)];
    expect(v('3V3')).toBeCloseTo(3.3, 3);
    expect(v('VIN')).toBeCloseTo(5, 3);
    expect(v('GND2')).toBeCloseTo(0, 3);
  });
});

/** buildNetlist is deterministic, so we can ask it which solver node a pin became. */
function nodeOfIn(circuit: Circuit, partId: string, pin: string): number {
  return buildNetlist(circuit).pinNode(partId, pin);
}

describe('a GPIO pin driving an LED', () => {
  it('an input pin drives nothing, so the LED stays dark', () => {
    const a = analyze(blinkCircuit('input', 220));
    expect(Math.abs(a.results.led.current)).toBeLessThan(1e-5);
  });

  it('driving the pin LOW also leaves the LED dark', () => {
    const a = analyze(blinkCircuit('low', 220));
    expect(Math.abs(a.results.led.current)).toBeLessThan(1e-5);
  });

  it('driving the pin HIGH lights the LED at a sane current', () => {
    const a = analyze(blinkCircuit('high', 220));
    const led = a.results.led;
    expect(led.current).toBeGreaterThan(0.004);
    expect(led.current).toBeLessThan(0.02);
    expect(led.burnsOut).toBe(false);
    expect(led.brightness).toBeGreaterThan(0.2);
  });

  it('a GPIO pin is not a battery: it sags under load', () => {
    const light = analyze(blinkCircuit('high', 100_000));
    const heavy = analyze(blinkCircuit('high', 100));
    const pinVolts = (a: ReturnType<typeof analyze>, c: Circuit) =>
      a.nodeVoltages[nodeOfIn(c, 'mcu', 'GPIO13')];
    const vLight = pinVolts(light, blinkCircuit('high', 100_000));
    const vHeavy = pinVolts(heavy, blinkCircuit('high', 100));
    expect(vLight).toBeGreaterThan(3.2);
    expect(vHeavy).toBeLessThan(vLight);
  });

  it('warns when a pin is pushed past the current an ESP32 can actually give', () => {
    // An LED straight on a GPIO: the pin's own resistance stops the LED exploding, but the
    // chip is now over its rated drive, which is the real hazard.
    const a = analyze(blinkCircuit('high', null));
    expect(a.results.led.current).toBeGreaterThan(0.04);
    expect(a.diagnostics.some((d) => /more current than the chip can give/i.test(d.title))).toBe(true);
    expect(a.ok).toBe(false);
  });

  it('a proper resistor keeps the pin inside its rating', () => {
    const a = analyze(blinkCircuit('high', 220));
    expect(a.diagnostics.some((d) => /more current than the chip/i.test(d.title))).toBe(false);
  });
});

describe('logic levels seen by digitalRead', () => {
  it('a pin pulled to ground reads LOW, one at 3.3 V reads HIGH', () => {
    expect(readLogicLevel(0)).toBe('LOW');
    expect(readLogicLevel(VDD)).toBe('HIGH');
  });
});

describe('the blink preset is actually wired correctly', () => {
  it('lights the LED when GPIO13 goes high, and not before', () => {
    const base = PRESETS['esp32-blink'].build();

    const dark = analyze(withGpio(base, { '13': 'input' }));
    expect(Math.abs(dark.results.led1.current)).toBeLessThan(1e-5);

    const lit = analyze(withGpio(base, { '13': 'high' }));
    expect(lit.results.led1.current).toBeGreaterThan(0.004);
    expect(lit.results.led1.burnsOut).toBe(false);
    expect(lit.ok).toBe(true);

    const off = analyze(withGpio(base, { '13': 'low' }));
    expect(Math.abs(off.results.led1.current)).toBeLessThan(1e-5);
  });

  it('does not accidentally short anything', () => {
    const a = analyze(PRESETS['esp32-blink'].build());
    expect(a.diagnostics.filter((d) => d.severity === 'danger')).toEqual([]);
  });
});
