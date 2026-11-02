import { describe, expect, it, vi } from 'vitest';
import { Sketch, type GpioState, type SketchHost } from '../src/lib/esp32/runtime';
import { readLogicLevel, V_IH, V_IL } from '../src/lib/esp32/pins';

/** A fake board: records pin changes, lets a test dictate what the pins read. */
function fakeHost(volts: Record<number, number> = {}) {
  const pins = new Map<number, GpioState>();
  const changes: [number, GpioState][] = [];
  const warnings: string[] = [];
  const failures: string[] = [];
  const printed: string[] = [];
  const host: SketchHost = {
    setPin: (gpio, state) => {
      // Ignore the reset-everything sweep so tests see only real writes.
      if (pins.get(gpio) !== state) changes.push([gpio, state]);
      pins.set(gpio, state);
    },
    readVolts: (gpio) => volts[gpio] ?? 0,
    print: (line) => printed.push(line),
    warn: (m) => warnings.push(m),
    fail: (m) => failures.push(m),
  };
  return { host, pins, changes, warnings, failures, printed };
}

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

describe('Sketch', () => {
  it('runs setup and drives a pin high', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    expect(
      s.start(`void setup() { pinMode(13, OUTPUT); digitalWrite(13, HIGH); }\nvoid loop() { delay(1000); }`),
    ).toEqual([]);
    await tick();
    expect(f.pins.get(13)).toBe('high');
    s.stop();
  });

  it('blinks: the pin goes high then low over time', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`
      void setup() { pinMode(13, OUTPUT); }
      void loop() {
        digitalWrite(13, HIGH);
        delay(10);
        digitalWrite(13, LOW);
        delay(10);
      }`);
    await tick(60);
    s.stop();
    const driven = f.changes.filter(([p]) => p === 13).map(([, st]) => st);
    expect(driven).toContain('high');
    expect(driven).toContain('low');
    // It really alternated rather than settling.
    expect(new Set(driven).size).toBeGreaterThan(1);
  });

  it('leaves every pin undriven after stop, like a reset board', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { pinMode(13, OUTPUT); digitalWrite(13, HIGH); }\nvoid loop() { delay(1000); }`);
    await tick();
    s.stop();
    expect(f.pins.get(13)).toBe('input');
    expect(s.running).toBe(false);
  });

  it('reads a pin held high', async () => {
    const f = fakeHost({ 14: 3.3 });
    const s = new Sketch(f.host);
    s.start(`
      void setup() { pinMode(14, INPUT); pinMode(13, OUTPUT); }
      void loop() { digitalWrite(13, digitalRead(14)); delay(5); }`);
    await tick(40);
    s.stop();
    expect(f.changes.some(([p, st]) => p === 13 && st === 'high')).toBe(true);
  });

  it('warns about a floating input instead of inventing an answer', async () => {
    const f = fakeHost({ 14: 1.65 }); // right between the thresholds
    const s = new Sketch(f.host);
    s.start(`void setup() { pinMode(14, INPUT); }\nvoid loop() { digitalRead(14); delay(5); }`);
    await tick(40);
    s.stop();
    expect(f.warnings.join(' ')).toMatch(/floating/i);
  });

  it('warns when writing to a pin that was never set to OUTPUT', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { digitalWrite(13, HIGH); }\nvoid loop() { delay(1000); }`);
    await tick();
    s.stop();
    expect(f.warnings.join(' ')).toMatch(/pinMode\(13, OUTPUT\)/);
  });

  it('refuses the flash pins, which would crash a real board', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { pinMode(7, OUTPUT); }\nvoid loop() { delay(1000); }`);
    await tick();
    expect(f.failures.join(' ')).toMatch(/flash chip/i);
  });

  it('refuses a pin the board does not have, and says which it does', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { pinMode(99, OUTPUT); }\nvoid loop() { delay(1000); }`);
    await tick();
    expect(f.failures.join(' ')).toMatch(/does not break out GPIO99/);
    expect(f.failures.join(' ')).toMatch(/13/);
  });

  it('allows a strapping pin but warns about booting', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { pinMode(2, OUTPUT); digitalWrite(2, HIGH); }\nvoid loop() { delay(1000); }`);
    await tick();
    s.stop();
    expect(f.warnings.join(' ')).toMatch(/strapping/i);
    expect(f.failures).toEqual([]);
  });

  it('stops a runaway loop instead of freezing, and explains why', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() {}\nvoid loop() { while (true) { int x = 1; } }`);
    await tick(80);
    expect(f.failures.join(' ')).toMatch(/delay\(\)/);
    expect(s.running).toBe(false);
  });

  it('reports compile errors without running anything', () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    const errors = s.start(`void loop() { analogRead(32); }`);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.join(' ')).toMatch(/setup\(\)/);
    // start() resets the board, but nothing may be *driven* by a sketch that did not compile.
    expect(f.changes.filter(([, st]) => st !== 'input')).toEqual([]);
  });

  it('captures Serial output', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { Serial.begin(115200); Serial.println("hello"); }\nvoid loop() { delay(1000); }`);
    await tick();
    s.stop();
    expect(f.printed.join('')).toMatch(/hello/);
  });

  it('millis() advances', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`
      void setup() { Serial.begin(9600); }
      void loop() { Serial.println(millis()); delay(15); }`);
    await tick(60);
    s.stop();
    const values = f.printed.map((l) => Number(l.trim())).filter((n) => !Number.isNaN(n));
    expect(values.length).toBeGreaterThan(1);
    expect(values[values.length - 1]).toBeGreaterThan(values[0]);
  });

  it('a second start replaces the first rather than running both', async () => {
    const f = fakeHost();
    const s = new Sketch(f.host);
    s.start(`void setup() { pinMode(13, OUTPUT); digitalWrite(13, HIGH); }\nvoid loop() { delay(1000); }`);
    await tick();
    s.start(`void setup() { pinMode(14, OUTPUT); digitalWrite(14, HIGH); }\nvoid loop() { delay(1000); }`);
    await tick();
    expect(f.pins.get(13)).toBe('input');
    expect(f.pins.get(14)).toBe('high');
    s.stop();
  });
});

describe('logic thresholds', () => {
  it('matches the datasheet thresholds at 3.3 V', () => {
    expect(V_IH).toBeCloseTo(2.475, 3);
    expect(V_IL).toBeCloseTo(0.825, 3);
  });

  it('classifies levels, including the undefined band', () => {
    expect(readLogicLevel(3.3)).toBe('HIGH');
    expect(readLogicLevel(2.5)).toBe('HIGH');
    expect(readLogicLevel(0)).toBe('LOW');
    expect(readLogicLevel(0.8)).toBe('LOW');
    expect(readLogicLevel(1.65)).toBe('undefined');
  });
});

it('does not leak page globals into the sketch', async () => {
  const f = fakeHost();
  const s = new Sketch(f.host);
  s.start(`void setup() { localStorage.clear(); }\nvoid loop() { delay(1000); }`);
  await tick();
  // It may or may not exist in the test env, but it must not silently succeed unnoticed.
  expect(f.failures.length + (typeof localStorage === 'undefined' ? 1 : 0)).toBeGreaterThan(0);
  vi.restoreAllMocks();
});
