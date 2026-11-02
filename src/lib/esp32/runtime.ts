/** Runs a transpiled sketch and drives the simulated GPIO pins.
 *
 *  Kept free of React and of three.js: the Lab hands it a host object, and all it does is
 *  call setPin / readVolts on that host. That makes it unit-testable with a fake host. */

import { transpile } from './arduino';
import { readLogicLevel, USABLE_GPIO, VDD } from './pins';

/** What a pin is doing. 'input' means high-impedance: the pin drives nothing. */
export type GpioState = 'input' | 'high' | 'low';

export interface SketchHost {
  /** Drive (or stop driving) a pin. The host re-solves the circuit on the next read. */
  setPin(gpio: number, state: GpioState): void;
  /** Voltage at a pin right now, after solving the circuit. */
  readVolts(gpio: number): number;
  print(line: string): void;
  /** Something the learner should know, but that is not fatal. */
  warn(message: string): void;
  /** Fatal: the sketch has stopped. */
  fail(message: string): void;
}

/** A tight loop with no delay() would freeze the page, so it is stopped after this many
 *  iterations with an explanation instead. */
const TICK_BUDGET = 200_000;

export class Sketch {
  private pinModes = new Map<number, 'input' | 'output'>();
  private startedAt = 0;
  private ticks = 0;
  private stopped = true;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(private readonly host: SketchHost) {}

  get running(): boolean {
    return !this.stopped;
  }

  /** Compiles and starts the sketch. Returns compile errors; an empty array means it ran. */
  start(source: string): string[] {
    this.stop();
    const { js, errors } = transpile(source);
    if (errors.length > 0) return errors;

    let entry: { setup: () => Promise<void>; loop: () => Promise<void> };
    try {
      entry = this.instantiate(js);
    } catch (err) {
      return [`That is not valid code: ${err instanceof Error ? err.message : String(err)}`];
    }

    this.stopped = false;
    this.startedAt = performance.now();
    this.pinModes.clear();
    void this.run(entry);
    return [];
  }

  stop(): void {
    this.stopped = true;
    for (const t of this.timers) clearTimeout(t);
    this.timers.clear();
    // Leave every pin not driving anything, exactly like a board being reset.
    for (const gpio of USABLE_GPIO) this.host.setPin(gpio, 'input');
    for (const gpio of [0, 2, 5, 12, 15]) this.host.setPin(gpio, 'input');
  }

  private async run(entry: { setup: () => Promise<void>; loop: () => Promise<void> }) {
    try {
      await entry.setup();
      while (!this.stopped) {
        this.ticks = 0;
        await entry.loop();
        // Give the browser a moment even if loop() never calls delay().
        await this.sleep(0);
      }
    } catch (err) {
      if (this.stopped) return;
      this.stopped = true;
      this.host.fail(err instanceof Error ? err.message : String(err));
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        this.timers.delete(t);
        resolve();
      }, ms);
      this.timers.add(t);
    });
  }

  /** Builds the sketch's functions with the Arduino API injected as real parameters,
   *  rather than leaking anything else from the page into the learner's code. */
  private instantiate(js: string) {
    const api = this.api();
    const names = Object.keys(api);
    const factory = new Function(
      ...names,
      `"use strict";\n${js}\nreturn { setup, loop };`,
    ) as (...args: unknown[]) => { setup: () => Promise<void>; loop: () => Promise<void> };
    return factory(...names.map((n) => api[n]));
  }

  private checkPin(gpio: number, what: string): boolean {
    if (!Number.isInteger(gpio)) {
      throw new Error(`${what} needs a pin number, got ${JSON.stringify(gpio)}.`);
    }
    if (USABLE_GPIO.includes(gpio)) return true;
    if ([0, 2, 5, 12, 15].includes(gpio)) {
      this.host.warn(
        `GPIO${gpio} is a strapping pin: its level is read while the board boots, so using it can stop the board starting. It works here, but be careful on real hardware.`,
      );
      return true;
    }
    if (gpio >= 6 && gpio <= 11) {
      throw new Error(
        `GPIO${gpio} is wired to the flash chip inside the ESP32 module. Using it crashes a real board. Pick one of: ${USABLE_GPIO.join(', ')}.`,
      );
    }
    throw new Error(
      `This board does not break out GPIO${gpio}. Available pins: ${USABLE_GPIO.join(', ')}.`,
    );
  }

  private api(): Record<string, unknown> {
    const host = this.host;

    return {
      HIGH: 1,
      LOW: 0,
      INPUT: 'input',
      OUTPUT: 'output',

      __tick: () => {
        this.ticks += 1;
        if (this.ticks > TICK_BUDGET) {
          throw new Error(
            'A loop ran hundreds of thousands of times without a delay(). On a real board that is fine, but here it would freeze the page. Add a delay() inside the loop.',
          );
        }
      },

      pinMode: (gpio: number, mode: string) => {
        this.checkPin(gpio, 'pinMode()');
        if (mode !== 'input' && mode !== 'output') {
          throw new Error('pinMode() takes INPUT or OUTPUT.');
        }
        this.pinModes.set(gpio, mode);
        // An input drives nothing; an output starts LOW, like a real board after reset.
        host.setPin(gpio, mode === 'input' ? 'input' : 'low');
      },

      digitalWrite: (gpio: number, value: number | boolean) => {
        this.checkPin(gpio, 'digitalWrite()');
        if (this.pinModes.get(gpio) !== 'output') {
          host.warn(
            `digitalWrite() on GPIO${gpio}, but it was never set to OUTPUT. Add pinMode(${gpio}, OUTPUT) in setup().`,
          );
        }
        host.setPin(gpio, value ? 'high' : 'low');
      },

      digitalRead: (gpio: number): number => {
        this.checkPin(gpio, 'digitalRead()');
        if (this.pinModes.get(gpio) === 'output') {
          host.warn(`digitalRead() on GPIO${gpio}, which you set to OUTPUT. You are reading back your own output.`);
        }
        const level = readLogicLevel(host.readVolts(gpio));
        if (level === 'undefined') {
          host.warn(
            `GPIO${gpio} is floating: its voltage is between ${(0.25 * VDD).toFixed(2)} V and ${(0.75 * VDD).toFixed(2)} V, so the chip cannot tell HIGH from LOW. A real board would read noise. Add a pull-down resistor.`,
          );
          return 0;
        }
        return level === 'HIGH' ? 1 : 0;
      },

      delay: (ms: number) => {
        this.ticks = 0;
        return this.sleep(Math.max(0, ms));
      },
      delayMicroseconds: (us: number) => {
        this.ticks = 0;
        return this.sleep(Math.max(0, us / 1000));
      },

      millis: () => Math.round(performance.now() - this.startedAt),
      micros: () => Math.round((performance.now() - this.startedAt) * 1000),

      Serial: {
        begin: () => host.print('Serial started.'),
        print: (v: unknown) => host.print(String(v)),
        println: (v: unknown = '') => host.print(`${String(v)}\n`),
      },
    };
  }
}
