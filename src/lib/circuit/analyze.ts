/** Runs the solver on a Circuit and works out what it means: who is burning,
 *  what is shorted, and how to say it in plain language. */

import { amps, ohms, trim, volts, watts } from '../format';
import { solveDc, type DcSolution } from '../solver/mna';
import { SingularMatrixError } from '../solver/matrix';
import { LED_COLORS, partDef } from './parts';
import { buildNetlist } from './netlist';
import type { Circuit, Diagnostic, Severity } from './types';

/** Current above which we call it a short and stop pretending the source is ideal. */
export const SHORT_CIRCUIT_AMPS = 1;

export type { Diagnostic, Severity };

export interface PartResult {
  partId: string;
  typeId: string;
  /** Current through the part, A. Positive in the part's own pin order. */
  current: number;
  /** Voltage across the part, V. */
  voltage: number;
  /** Power turned into heat, W. */
  power: number;
  /** 0..1 for an LED, where 1 is its rated brightness. */
  brightness?: number;
  /** Part is destroyed by this result and must be replaced. */
  burnsOut: boolean;
  /** Part is being pushed past its rating but survives. */
  overStressed: boolean;
}

export interface Analysis {
  ok: boolean;
  nodeVoltages: number[];
  /** Current each power source delivers, A, with solver leakage cleaned away. */
  sourceCurrents: Record<string, number>;
  results: Record<string, PartResult>;
  diagnostics: Diagnostic[];
  /** Lines for the "What's happening?" panel. */
  story: string[];
  /** Voltage at a breadboard hole, relative to ground. null when the circuit did not solve. */
  voltageAtHole: (hole: string) => number | null;
  solution?: DcSolution;
}

/** The solver keeps every node weakly tied to ground, which shows up as picoamps of
 *  leakage. Real meters do not show that, and neither should we. */
const clean = (a: number): number => (Math.abs(a) < 1e-9 ? 0 : a);

export function analyze(circuit: Circuit): Analysis {
  const diagnostics: Diagnostic[] = [];
  const results: Record<string, PartResult> = {};
  const { netlist, pinNode, holeNode, skipped } = buildNetlist(circuit);
  const noVoltage = () => null;

  for (const s of skipped) {
    const part = circuit.parts.find((p) => p.id === s.partId);
    diagnostics.push({
      severity: s.reason === 'burnt out' ? 'danger' : 'info',
      partId: s.partId,
      title:
        s.reason === 'burnt out'
          ? `${part ? partDef(part.typeId).name : 'A part'} is burnt out`
          : `${part ? partDef(part.typeId).name : 'A part'} is not connected`,
      detail:
        s.reason === 'burnt out'
          ? 'It is dead and does nothing until you replace it. That is how real components work.'
          : 'It is sitting on the bench rather than plugged into the breadboard, so it is not part of any circuit.',
    });
  }

  // A source whose two terminals land on the same electrical point is a dead short,
  // and the matrix would have no solution. Catch it before solving so we can explain it.
  for (const part of circuit.parts) {
    const def = partDef(part.typeId);
    if (def.category !== 'power' || part.burnt) continue;
    if (pinNode(part.id, 'pos') === pinNode(part.id, 'neg')) {
      diagnostics.push({
        severity: 'danger',
        partId: part.id,
        title: 'Short circuit straight across the supply',
        detail:
          `The + and − of the ${def.name} are connected to the same point with nothing in between. ` +
          'A real battery would get hot, a real USB port would shut itself off, and nothing else in the circuit would work. ' +
          'Put a resistor (or a load) in the path.',
      });
      return {
        ok: false,
        nodeVoltages: [0],
        sourceCurrents: {},
        results,
        diagnostics,
        story: [],
        voltageAtHole: noVoltage,
      };
    }
  }

  if (netlist.elements.length === 0) {
    return {
      ok: true,
      nodeVoltages: [0],
      sourceCurrents: {},
      results,
      diagnostics,
      story: ['Nothing is connected yet. Drop a power source, a resistor and an LED on the bench.'],
      voltageAtHole: noVoltage,
    };
  }

  let solution: DcSolution;
  try {
    solution = solveDc(netlist);
  } catch (err) {
    diagnostics.push({
      severity: 'danger',
      title: 'This circuit has no single answer',
      detail:
        err instanceof SingularMatrixError
          ? 'Two different voltages are being forced onto the same point, which cannot physically happen. Check for two sources wired against each other.'
          : String(err),
    });
    return {
      ok: false,
      nodeVoltages: [0],
      sourceCurrents: {},
      results,
      diagnostics,
      story: [],
      voltageAtHole: noVoltage,
    };
  }

  if (!solution.converged) {
    diagnostics.push({
      severity: 'warning',
      title: 'The simulation could not settle',
      detail:
        'The numbers kept moving after 200 attempts. This usually means an extreme value somewhere — a 0 Ω resistor, or a huge voltage.',
    });
  }

  // Per-part numbers.
  for (const part of circuit.parts) {
    const def = partDef(part.typeId);
    if (part.burnt || (def.onBoard && !part.anchor)) continue;
    const current = clean(solution.elementCurrents[part.id] ?? 0);
    const pins = def.pins;
    const vA = solution.nodeVoltages[pinNode(part.id, pins[0].id)] ?? 0;
    const vB = solution.nodeVoltages[pinNode(part.id, pins[1].id)] ?? 0;
    const voltage = vA - vB;
    const power = Math.abs(voltage * current);

    const limits = def.limits;
    let burnsOut = false;
    let overStressed = false;
    let brightness: number | undefined;

    if (def.typeId === 'led') {
      const rated = limits?.ratedCurrent ?? 0.02;
      const absMax = limits?.absMaxCurrent ?? 0.05;
      brightness = Math.max(0, Math.min(1, current / rated));
      if (current > absMax) burnsOut = true;
      else if (current > rated * 1.15) overStressed = true;
    } else if (limits?.powerRating) {
      if (power > limits.powerRating * 2) burnsOut = true;
      else if (power > limits.powerRating) overStressed = true;
    }

    results[part.id] = { partId: part.id, typeId: def.typeId, current, voltage, power, brightness, burnsOut, overStressed };
  }

  const sourceCurrents = Object.fromEntries(
    Object.entries(solution.sourceCurrents).map(([id, a]) => [id, clean(a)]),
  );

  // Source current tells us about shorts the pre-check could not see.
  for (const [id, current] of Object.entries(sourceCurrents)) {
    if (Math.abs(current) < SHORT_CIRCUIT_AMPS) continue;
    const part = circuit.parts.find((p) => p.id === id);
    diagnostics.push({
      severity: 'danger',
      partId: id,
      title: 'Far too much current is being drawn',
      detail:
        `The ${part ? partDef(part.typeId).name : 'supply'} is being asked for ${amps(Math.abs(current))}. ` +
        'That is a short circuit in all but name: the path has almost no resistance in it. ' +
        'A real supply would sag, get hot, or shut down.',
    });
  }

  // Parts that know something about themselves get to say it. This is how the ESP32
  // reports a pin being asked for more current than the chip can give.
  for (const part of circuit.parts) {
    const def = partDef(part.typeId);
    if (part.burnt || !def.diagnose) continue;
    diagnostics.push(
      ...def.diagnose(part, {
        current: (elementId) => clean(solution.elementCurrents[elementId] ?? 0),
        voltage: (pinId) => solution.nodeVoltages[pinNode(part.id, pinId)] ?? 0,
      }),
    );
  }

  // Burnout and stress explanations, with the arithmetic shown.
  for (const r of Object.values(results)) {
    const part = circuit.parts.find((p) => p.id === r.partId)!;
    const def = partDef(r.typeId);
    if (r.typeId === 'led') {
      const spec = LED_COLORS[part.color ?? 'red'] ?? LED_COLORS.red;
      if (r.burnsOut) {
        diagnostics.push({
          severity: 'danger',
          partId: r.partId,
          title: 'The LED just let the smoke out',
          detail:
            `${amps(r.current)} went through it. A 5 mm LED is built for about 20 mA and dies past roughly 50 mA. ` +
            `It only drops about ${volts(spec.vf)} no matter what you do, so the rest of the supply voltage has to be absorbed by a resistor. ` +
            'With no resistor (or far too small a one) there is nothing to limit the current, and the LED is what gives up.',
        });
      } else if (r.overStressed) {
        diagnostics.push({
          severity: 'warning',
          partId: r.partId,
          title: 'The LED is running hot',
          detail: `${amps(r.current)} is above its 20 mA rating. It still works, but it will not last. Use a bigger resistor.`,
        });
      }
    } else if (def.limits?.powerRating) {
      if (r.burnsOut) {
        diagnostics.push({
          severity: 'danger',
          partId: r.partId,
          title: `The ${def.name.toLowerCase()} burnt out`,
          detail:
            `It is turning ${watts(r.power)} into heat, and it is only rated for ${watts(def.limits.powerRating)}. ` +
            `That came from ${volts(Math.abs(r.voltage))} across it times ${amps(Math.abs(r.current))} through it.`,
        });
      } else if (r.overStressed) {
        diagnostics.push({
          severity: 'warning',
          partId: r.partId,
          title: `The ${def.name.toLowerCase()} is getting hot`,
          detail: `${watts(r.power)} in a ${watts(def.limits.powerRating)} part. It will survive, but you would smell it.`,
        });
      }
    }
  }

  return {
    ok: diagnostics.every((d) => d.severity !== 'danger'),
    nodeVoltages: solution.nodeVoltages,
    sourceCurrents,
    results,
    diagnostics,
    story: buildStory(circuit, results, sourceCurrents),
    voltageAtHole: (hole: string) => {
      try {
        return clean(solution.nodeVoltages[holeNode(hole)] ?? 0);
      } catch {
        return null; // not a hole on this board
      }
    },
    solution,
  };
}

/** The "What's happening?" panel: the same arithmetic the lessons teach, in sentences.
 *  Every number here comes from the solved circuit, never from an assumption. */
function buildStory(
  circuit: Circuit,
  results: Record<string, PartResult>,
  sourceCurrents: Record<string, number>,
): string[] {
  const lines: string[] = [];
  const alive = (p: (typeof circuit.parts)[number]) => !p.burnt;
  const supply = circuit.parts.filter(alive).find((p) => partDef(p.typeId).category === 'power');
  const board = circuit.parts.filter(alive).find((p) => partDef(p.typeId).category === 'mcu');

  if (!supply && !board) {
    lines.push('There is no power source in this circuit, so nothing can happen. Nothing is moving.');
    return lines;
  }

  if (supply) {
    const total = Math.abs(sourceCurrents[supply.id] ?? 0);
    lines.push(
      total === 0
        ? `The ${partDef(supply.typeId).name} is holding ${volts(supply.value ?? 0)} ready, but no current is flowing anywhere. Nothing forms a complete loop yet.`
        : `The ${partDef(supply.typeId).name} is holding ${volts(supply.value ?? 0)} across the circuit and delivering ${amps(total)} in total.`,
    );
  }

  if (board) {
    const driving = Object.entries(board.gpio ?? {}).filter(([, state]) => state === 'high');
    const lowPins = Object.entries(board.gpio ?? {}).filter(([, state]) => state === 'low');
    lines.push(
      `The ESP32 board is powered: it puts ${volts(3.3)} on its 3V3 pin and ${volts(5)} on VIN, both measured from GND.`,
    );
    if (driving.length > 0) {
      lines.push(
        `Your code has switched ${driving.map(([pin]) => `GPIO${pin}`).join(', ')} ON, so ${driving.length === 1 ? 'that pin is' : 'those pins are'} connected to 3.3 V inside the chip. A pin is a switch, not a battery — it can only supply a limited current.`,
      );
    } else if (lowPins.length > 0) {
      lines.push(
        `Every pin your code set up is currently OFF, which means connected to 0 V inside the chip. Nothing is being driven.`,
      );
    } else {
      lines.push('No pin has been set up yet. Press Run to start your code.');
    }
  }

  const led = Object.values(results).find((r) => r.typeId === 'led');
  const resistor = Object.values(results).find((r) => r.typeId === 'resistor');

  if (led && resistor && Math.abs(led.current) > 1e-7) {
    const part = circuit.parts.find((p) => p.id === resistor.partId)!;
    const r = part.value ?? 0;
    const vLed = Math.abs(led.voltage);
    const vRes = Math.abs(resistor.voltage);
    lines.push(
      `The LED drops ${volts(vLed)} — that is fixed by its colour, not by you. The resistor takes ${volts(vRes)}.`,
    );
    lines.push(
      `So the current is ${trim(vRes)} V ÷ ${ohms(r)} = ${amps(Math.abs(resistor.current))}, and the same current flows through every part in the loop.`,
    );
    lines.push(
      `The resistor turns ${watts(resistor.power)} into heat; the LED turns ${watts(led.power)} into light and heat.`,
    );
  } else if (led && Math.abs(led.current) <= 1e-7) {
    lines.push(
      'No current is reaching the LED. Either the loop is not closed, the pin driving it is off, or the LED is in backwards — it only conducts one way.',
    );
  } else if (resistor && Math.abs(resistor.current) > 1e-7) {
    const part = circuit.parts.find((p) => p.id === resistor.partId)!;
    lines.push(
      `The resistor has ${volts(Math.abs(resistor.voltage))} across it, so ${trim(Math.abs(resistor.voltage))} V ÷ ${ohms(part.value ?? 0)} = ${amps(Math.abs(resistor.current))} flows through it.`,
    );
  }

  return lines;
}
