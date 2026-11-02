import { describe, expect, it } from 'vitest';
import { amps, eng, ohms, trim, volts } from '../src/lib/format';

describe('eng', () => {
  it('scales down to milli', () => {
    expect(amps(0.0136364)).toBe('13.6 mA');
  });
  it('scales down to micro', () => {
    expect(eng(4.7e-6, 'F')).toBe('4.7 µF');
  });
  it('scales up to kilo', () => {
    expect(ohms(4700)).toBe('4.7 kΩ');
  });
  it('leaves units in range alone', () => {
    expect(volts(3.3)).toBe('3.3 V');
  });
  it('keeps zero clean', () => {
    expect(volts(0)).toBe('0 V');
  });
  it('handles negatives', () => {
    expect(volts(-0.005)).toBe('-5 mV');
  });
  it('survives infinity', () => {
    expect(amps(Infinity)).toBe('— A');
  });
  it('clamps very small values to pico', () => {
    expect(eng(1e-15, 'F')).toBe('0.001 pF');
  });
});

describe('trim', () => {
  it('drops trailing zeros', () => {
    expect(trim(5)).toBe('5');
    expect(trim(13.63636)).toBe('13.6');
  });
});
