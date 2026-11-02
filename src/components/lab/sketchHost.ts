/** Connects the sketch runtime to the circuit solver.
 *
 *  The sketch needs an answer to "what voltage is on this pin?" immediately, so this solves
 *  the circuit synchronously on demand rather than waiting for React to re-render. Pin state
 *  lives in a ref, outside React, and a version counter tells the UI when to catch up. */

import { analyze, type Analysis } from '../../lib/circuit/analyze';
import { buildNetlist } from '../../lib/circuit/netlist';
import type { Circuit, PartInstance } from '../../lib/circuit/types';
import type { GpioState } from '../../lib/esp32/runtime';

export const ESP32_TYPE = 'esp32-devkit';

export const findBoard = (circuit: Circuit): PartInstance | undefined =>
  circuit.parts.find((p) => p.typeId === ESP32_TYPE && !p.burnt);

/** Returns the circuit as the simulation currently sees it: the bench, plus whatever the
 *  running sketch has done to the board's pins. */
export function withGpio(circuit: Circuit, gpio: Record<string, GpioState>): Circuit {
  if (!findBoard(circuit)) return circuit;
  return {
    ...circuit,
    parts: circuit.parts.map((p) => (p.typeId === ESP32_TYPE ? { ...p, gpio: { ...gpio } } : p)),
  };
}

/** Voltage at one GPIO pin of the board, solving the circuit as it stands right now. */
export function gpioVolts(circuit: Circuit, gpio: Record<string, GpioState>, pin: number): number {
  const live = withGpio(circuit, gpio);
  const board = findBoard(live);
  if (!board) return 0;
  const solved: Analysis = analyze(live);
  const node = buildNetlist(live).pinNode(board.id, `GPIO${pin}`);
  return solved.nodeVoltages[node] ?? 0;
}
