import { describe, expect, it } from 'vitest';
import { injectLoopGuards, transpile } from '../src/lib/esp32/arduino';

const BLINK = `
// Blink the LED on GPIO13.
#define LED 13

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(500);
  digitalWrite(LED, LOW);
  delay(500);
}
`;

describe('transpile', () => {
  it('turns setup and loop into async functions', () => {
    const { js, errors } = transpile(BLINK);
    expect(errors).toEqual([]);
    expect(js).toContain('async function setup()');
    expect(js).toContain('async function loop()');
  });

  it('awaits delay so it can actually suspend', () => {
    expect(transpile(BLINK).js).toContain('await delay(500)');
  });

  it('turns #define into a constant', () => {
    expect(transpile(BLINK).js).toContain('const LED = 13;');
  });

  it('keeps comments, because the lessons explain code in them', () => {
    expect(transpile(BLINK).js).toContain('// Blink the LED on GPIO13.');
  });

  it('converts typed variables', () => {
    const { js } = transpile('void setup() {\n  int count = 0;\n  const int pin = 13;\n  float x;\n}\nvoid loop() {}');
    expect(js).toContain('let count =');
    expect(js).toContain('const pin =');
    expect(js).toContain('let x ;');
  });

  it('strips types from function parameters', () => {
    const { js } = transpile('void flash(int pin, int times) {\n}\nvoid setup(){}\nvoid loop(){}');
    expect(js).toContain('async function flash(pin, times) {');
  });

  it('drops #include <Arduino.h>', () => {
    const { js } = transpile('#include <Arduino.h>\nvoid setup(){}\nvoid loop(){}');
    expect(js).not.toContain('#include');
  });

  it('complains when setup or loop is missing', () => {
    expect(transpile('void loop(){}').errors.join(' ')).toMatch(/setup\(\)/);
    expect(transpile('void setup(){}').errors.join(' ')).toMatch(/loop\(\)/);
  });

  it('rejects things it cannot honestly simulate, with a reason', () => {
    const cases: [string, RegExp][] = [
      ['void setup(){ analogRead(32); }\nvoid loop(){}', /ADC|analogRead/],
      ['void setup(){ analogWrite(13, 128); }\nvoid loop(){}', /PWM/],
      ['void setup(){ pinMode(13, INPUT_PULLUP); }\nvoid loop(){}', /pull-up/i],
      ['#include <WiFi.h>\nvoid setup(){}\nvoid loop(){}', /Librar/i],
      ['void setup(){ attachInterrupt(0, f, 1); }\nvoid loop(){}', /Interrupt/i],
    ];
    for (const [src, expected] of cases) {
      expect(transpile(src).errors.join(' ')).toMatch(expected);
    }
  });

  it('does not flag a clean sketch', () => {
    expect(transpile(BLINK).errors).toEqual([]);
  });
});

describe('loop guards', () => {
  it('adds a budget check inside a while body', () => {
    expect(injectLoopGuards('while (true) { x++; }')).toBe('while (true) {__tick(); x++; }');
  });

  it('adds one inside a for body', () => {
    expect(injectLoopGuards('for (let i = 0; i < 3; i++) { f(); }')).toBe(
      'for (let i = 0; i < 3; i++) {__tick(); f(); }',
    );
  });

  it('handles nested parentheses in the header', () => {
    expect(injectLoopGuards('while (f(a, g(b))) { x(); }')).toBe('while (f(a, g(b))) {__tick(); x(); }');
  });

  it('guards nested loops separately', () => {
    const out = injectLoopGuards('while (a) { while (b) { c(); } }');
    expect(out.match(/__tick\(\);/g)).toHaveLength(2);
  });

  it('leaves a word ending in "for" alone', () => {
    expect(injectLoopGuards('int before (x) { y(); }')).toBe('int before (x) { y(); }');
  });

  it('leaves a brace-less loop body untouched rather than corrupting it', () => {
    expect(injectLoopGuards('while (a) x++;')).toBe('while (a) x++;');
  });
});
