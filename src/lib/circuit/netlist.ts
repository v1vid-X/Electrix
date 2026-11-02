/** Turns a Circuit (parts in holes, wires between terminals) into a solver netlist.
 *  This is where "which holes are the same electrical point" is decided. */

import { COLUMNS, hole, parseHole, stripOf, type Column, type HoleId } from './board';
import { partDef } from './parts';
import type { Circuit, PartInstance, Rotation, Terminal } from './types';
import { terminalKey } from './types';
import type { Element, Netlist } from '../solver/mna';

/** Rotate a (column, row) offset by 90° steps. */
export function rotateOffset(dCol: number, dRow: number, rotation: Rotation): [number, number] {
  // Avoids handing -0 to callers, which compares unequal to 0.
  const neg = (n: number) => (n === 0 ? 0 : -n);
  switch (rotation) {
    case 0:
      return [dCol, dRow];
    case 1:
      return [neg(dRow), dCol];
    case 2:
      return [neg(dCol), neg(dRow)];
    case 3:
      return [dRow, neg(dCol)];
  }
}

/** Where a given pin of a board-mounted part ends up. null if it hangs off the board. */
export function pinHole(part: PartInstance, pinId: string): HoleId | null {
  if (!part.anchor) return null;
  const def = partDef(part.typeId);
  const pin = def.pins.find((p) => p.id === pinId);
  if (!pin) throw new Error(`${part.typeId} has no pin ${pinId}`);
  const anchor = parseHole(part.anchor);
  if (!anchor || anchor.kind !== 'main') return null;
  const [dCol, dRow] = rotateOffset(pin.dCol, pin.dRow, part.rotation);
  const colIndex = COLUMNS.indexOf(anchor.col) + dCol;
  const row = anchor.row + dRow;
  if (colIndex < 0 || colIndex >= COLUMNS.length) return null;
  const target = hole(COLUMNS[colIndex] as Column, row);
  return parseHole(target) ? target : null;
}

/** The electrical node key for one pin: the breadboard strip it is plugged into, or
 *  the pin itself when the part sits on the bench. */
export function pinKey(part: PartInstance, pinId: string, circuit: Circuit): string {
  const h = pinHole(part, pinId);
  if (h) return `strip:${stripOf(h, circuit.board)}`;
  return `pin:${part.id}:${pinId}`;
}

function keyOfTerminal(t: Terminal, circuit: Circuit): string {
  if (t.kind === 'hole') return `strip:${stripOf(t.hole, circuit.board)}`;
  const part = circuit.parts.find((p) => p.id === t.partId);
  if (!part) return terminalKey(t);
  return pinKey(part, t.pinId, circuit);
}

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    const p = this.parent.get(x);
    if (p === undefined) {
      this.parent.set(x, x);
      return x;
    }
    if (p === x) return x;
    const root = this.find(p);
    this.parent.set(x, root);
    return root;
  }

  union(a: string, b: string): void {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.parent.set(ra, rb);
  }
}

export interface BuiltNetlist {
  netlist: Netlist;
  /** Node number for each electrical key. */
  nodeOf: Map<string, number>;
  /** Solver node number for a given pin of a given part. */
  pinNode: (partId: string, pinId: string) => number;
  /** Solver node number for a breadboard hole. */
  holeNode: (hole: HoleId) => number;
  /** Parts that were skipped, with the reason. */
  skipped: { partId: string; reason: string }[];
}

export function buildNetlist(circuit: Circuit): BuiltNetlist {
  const uf = new UnionFind();
  const skipped: { partId: string; reason: string }[] = [];

  // Seed every pin and every wire end, then merge whatever the wires join.
  for (const part of circuit.parts) {
    for (const pin of partDef(part.typeId).pins) uf.find(pinKey(part, pin.id, circuit));
  }
  for (const wire of circuit.wires) {
    uf.union(keyOfTerminal(wire.from, circuit), keyOfTerminal(wire.to, circuit));
  }

  // Ground is the pin a part nominates as 0 V — the battery's minus, or the board's GND.
  // Everything is measured against it, exactly like putting the black probe there.
  const grounded =
    circuit.parts.find((p) => partDef(p.typeId).category === 'power' && partDef(p.typeId).groundPin) ??
    circuit.parts.find((p) => partDef(p.typeId).groundPin);
  const groundRoot = grounded
    ? uf.find(pinKey(grounded, partDef(grounded.typeId).groundPin!, circuit))
    : null;

  const nodeOf = new Map<string, number>();
  let next = 1;
  const nodeForKey = (key: string): number => {
    const root = uf.find(key);
    if (groundRoot !== null && root === groundRoot) return 0;
    const existing = nodeOf.get(root);
    if (existing !== undefined) return existing;
    nodeOf.set(root, next);
    return next++;
  };

  for (const part of circuit.parts) {
    for (const pin of partDef(part.typeId).pins) nodeForKey(pinKey(part, pin.id, circuit));
  }

  const elements: Element[] = [];
  for (const part of circuit.parts) {
    const def = partDef(part.typeId);
    if (part.burnt) {
      skipped.push({ partId: part.id, reason: 'burnt out' });
      continue;
    }
    if (def.onBoard && !part.anchor) {
      skipped.push({ partId: part.id, reason: 'not plugged into the board' });
      continue;
    }
    elements.push(
      ...def.toElements(
        part,
        (pinId) => nodeForKey(pinKey(part, pinId, circuit)),
        () => next++,
      ),
    );
  }

  const pinNode = (partId: string, pinId: string): number => {
    const part = circuit.parts.find((p) => p.id === partId);
    if (!part) return 0;
    return nodeForKey(pinKey(part, pinId, circuit));
  };

  const holeNode = (hole: HoleId): number => nodeForKey(`strip:${stripOf(hole, circuit.board)}`);

  return { netlist: { nodeCount: next - 1, elements }, nodeOf, pinNode, holeNode, skipped };
}
