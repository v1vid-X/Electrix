/** Modified Nodal Analysis DC solver with Newton-Raphson for diodes.
 *
 *  Why hand-written rather than ngspice-in-WebAssembly: see docs/PROGRESS.md.
 *  Short version: we need the internal node voltages and branch currents in order to
 *  *explain* them in plain language, we need our own "this part just burnt out" rules,
 *  and we need it to be small, licence-clean and unit-testable.
 *
 *  shortcut: DC operating point only. Capacitors are open circuits and inductors are
 *  shorts here. Transient (time-stepping companion models) arrives with the RC module;
 *  the stamp interface already takes the data it will need.
 */

import { solveLinear, zeros } from './matrix';

/** Node 0 is always ground. */
export type NodeId = number;

export type Element =
  | { kind: 'resistor'; id: string; a: NodeId; b: NodeId; ohms: number }
  /** Ideal DC source. `volts` is the potential of `pos` relative to `neg`. */
  | { kind: 'vsource'; id: string; pos: NodeId; neg: NodeId; volts: number }
  | { kind: 'isource'; id: string; from: NodeId; to: NodeId; amps: number }
  /** Shockley diode. An LED is a diode with a colour and a light output. */
  | {
      kind: 'diode';
      id: string;
      anode: NodeId;
      cathode: NodeId;
      /** saturation current, A */
      is: number;
      /** emission coefficient, dimensionless */
      n: number;
      /** bulk series resistance, Ω. Every real diode has some; it is what stops the
       *  current going to infinity when a beginner forgets the resistor. */
      rs?: number;
    }
  /** Open at DC, but it still has to be in the netlist so we can show its voltage. */
  | { kind: 'capacitor'; id: string; a: NodeId; b: NodeId; farads: number };

export interface Netlist {
  /** Highest node number used. Node 0 is ground and is not counted. */
  nodeCount: number;
  elements: Element[];
}

export interface DcSolution {
  /** Node voltages, index 0 is ground and is always exactly 0. */
  nodeVoltages: number[];
  /** Current through each vsource, positive flowing out of `pos` into the circuit. */
  sourceCurrents: Record<string, number>;
  /** Current through every two-terminal element, positive in the element's own direction. */
  elementCurrents: Record<string, number>;
  iterations: number;
  converged: boolean;
}

/** Thermal voltage at ~27 °C. */
export const V_T = 0.025852;

/** Conductance added across every node pair to keep the matrix non-singular,
 *  the same trick SPICE calls GMIN. 1 GΩ is electrically irrelevant. */
const GMIN = 1e-12;

const MAX_ITERATIONS = 200;
const V_TOLERANCE = 1e-9;

/** Keeps exp() from overflowing and Newton from flying off; SPICE's pnjlim. */
function limitJunctionVoltage(vNew: number, vOld: number, vCrit: number, nVt: number): number {
  if (vNew > vCrit && Math.abs(vNew - vOld) > 2 * nVt) {
    if (vOld <= 0) return nVt * Math.log(vNew / nVt);
    const arg = 1 + (vNew - vOld) / nVt;
    return arg > 0 ? vOld + nVt * Math.log(arg) : vCrit;
  }
  return vNew;
}

interface DiodeBranch {
  /** junction voltage, excluding the drop across rs */
  vj: number;
  /** branch current, A */
  i: number;
  /** branch conductance seen from the terminals, S */
  g: number;
  /** true while Newton is still being held back by voltage limiting */
  limited: boolean;
}

/** Solves the diode's own non-linear branch (junction in series with rs) so the
 *  outer MNA loop only ever sees a smooth, well-behaved two-terminal element. */
function solveDiodeBranch(
  vTotal: number,
  is: number,
  nVt: number,
  rs: number,
  vjStart: number,
): DiodeBranch {
  const vCrit = nVt * Math.log(nVt / (Math.SQRT2 * is));
  const at = (vj: number) => {
    const ex = Math.exp(Math.min(vj / nVt, 80));
    return { i: is * (ex - 1), gj: (is / nVt) * ex };
  };

  if (rs <= 0) {
    const vj = limitJunctionVoltage(vTotal, vjStart, vCrit, nVt);
    const { i, gj } = at(vj);
    return { vj, i, g: gj, limited: Math.abs(vj - vTotal) > 1e-12 };
  }

  let vj = vjStart;
  let limited = true;
  for (let k = 0; k < 80; k++) {
    const { i, gj } = at(vj);
    const next = limitJunctionVoltage(vj - (vj + rs * i - vTotal) / (1 + rs * gj), vj, vCrit, nVt);
    const step = Math.abs(next - vj);
    vj = next;
    if (step < 1e-13) {
      limited = false;
      break;
    }
  }
  const { i, gj } = at(vj);
  return { vj, i, g: gj / (1 + rs * gj), limited };
}

export function solveDc(netlist: Netlist): DcSolution {
  const { nodeCount, elements } = netlist;
  const sources = elements.filter((e) => e.kind === 'vsource');
  const size = nodeCount + sources.length;

  if (size === 0) {
    return {
      nodeVoltages: [0],
      sourceCurrents: {},
      elementCurrents: {},
      iterations: 0,
      converged: true,
    };
  }

  const sourceRow = new Map<string, number>();
  sources.forEach((s, i) => sourceRow.set(s.id, nodeCount + i));

  // Node n maps to matrix index n-1; ground (0) is not in the matrix.
  const ix = (n: NodeId) => n - 1;

  let v = new Array<number>(size).fill(0);
  const diodeV = new Map<string, number>();
  let iterations = 0;
  let converged = false;

  const nodeV = (state: number[], n: NodeId) => (n === 0 ? 0 : state[ix(n)]);

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    iterations = iter + 1;
    const g = zeros(size, size);
    const rhs = new Array<number>(size).fill(0);
    // A limited diode voltage means Newton is still being held back, so the node
    // voltages can look settled while the answer is still wrong. Never declare
    // convergence on an iteration where limiting kicked in.
    let limitedThisIteration = false;

    const addG = (a: NodeId, b: NodeId, value: number) => {
      if (a !== 0) g[ix(a)][ix(a)] += value;
      if (b !== 0) g[ix(b)][ix(b)] += value;
      if (a !== 0 && b !== 0) {
        g[ix(a)][ix(b)] -= value;
        g[ix(b)][ix(a)] -= value;
      }
    };
    const addI = (from: NodeId, to: NodeId, value: number) => {
      if (from !== 0) rhs[ix(from)] -= value;
      if (to !== 0) rhs[ix(to)] += value;
    };

    // Keep every node weakly tied to ground so floating sub-circuits still solve.
    for (let n = 1; n <= nodeCount; n++) g[ix(n)][ix(n)] += GMIN;

    for (const e of elements) {
      switch (e.kind) {
        case 'resistor':
          // A 0 Ω resistor is a wire; model it as a very large conductance rather
          // than dividing by zero.
          addG(e.a, e.b, e.ohms <= 0 ? 1e9 : 1 / e.ohms);
          break;
        case 'capacitor':
          addG(e.a, e.b, GMIN); // open at DC
          break;
        case 'isource':
          addI(e.from, e.to, e.amps);
          break;
        case 'vsource': {
          const row = sourceRow.get(e.id)!;
          if (e.pos !== 0) {
            g[row][ix(e.pos)] += 1;
            g[ix(e.pos)][row] += 1;
          }
          if (e.neg !== 0) {
            g[row][ix(e.neg)] -= 1;
            g[ix(e.neg)][row] -= 1;
          }
          rhs[row] += e.volts;
          break;
        }
        case 'diode': {
          const nVt = e.n * V_T;
          const vTotal = nodeV(v, e.anode) - nodeV(v, e.cathode);
          const branch = solveDiodeBranch(
            vTotal,
            e.is,
            nVt,
            e.rs ?? 0,
            diodeV.get(e.id) ?? 0,
          );
          if (branch.limited) limitedThisIteration = true;
          diodeV.set(e.id, branch.vj);
          const gd = branch.g + GMIN;
          // Linearised companion model: conductance gd plus a current source.
          addG(e.anode, e.cathode, gd);
          addI(e.anode, e.cathode, branch.i - gd * vTotal);
          break;
        }
      }
    }

    const next = solveLinear(g, rhs);
    const delta = Math.max(...next.map((x, i) => Math.abs(x - v[i])));
    v = next;
    if (delta < V_TOLERANCE && !limitedThisIteration) {
      converged = true;
      break;
    }
  }

  const nodeVoltages = [0, ...v.slice(0, nodeCount)];
  const sourceCurrents: Record<string, number> = {};
  for (const s of sources) {
    // The extra unknown is the current INTO pos; flip the sign so "current the
    // battery delivers" is positive, which is what a learner expects.
    sourceCurrents[s.id] = -v[sourceRow.get(s.id)!];
  }

  const elementCurrents: Record<string, number> = {};
  for (const e of elements) {
    switch (e.kind) {
      case 'resistor': {
        const dv = nodeVoltages[e.a] - nodeVoltages[e.b];
        elementCurrents[e.id] = e.ohms <= 0 ? dv * 1e9 : dv / e.ohms;
        break;
      }
      case 'diode': {
        const nVt = e.n * V_T;
        const vd = diodeV.get(e.id) ?? 0;
        elementCurrents[e.id] = e.is * (Math.exp(Math.min(vd / nVt, 80)) - 1);
        break;
      }
      case 'isource':
        elementCurrents[e.id] = e.amps;
        break;
      case 'capacitor':
        elementCurrents[e.id] = 0;
        break;
      case 'vsource':
        elementCurrents[e.id] = sourceCurrents[e.id];
        break;
    }
  }

  return { nodeVoltages, sourceCurrents, elementCurrents, iterations, converged };
}

/** Saturation current that puts a diode at `vf` volts across its TERMINALS when
 *  `iRated` amps flow. Lets us build an LED model straight from the two numbers on
 *  its datasheet. `rs` must match the model's series resistance, because the
 *  datasheet's forward voltage includes the drop across it. */
export function saturationCurrentFor(vf: number, iRated: number, n: number, rs = 0): number {
  const junctionV = vf - rs * iRated;
  return iRated / (Math.exp(junctionV / (n * V_T)) - 1);
}
