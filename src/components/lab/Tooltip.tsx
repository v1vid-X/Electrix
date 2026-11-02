import { holesInStrip, stripOf } from '../../lib/circuit/board';
import { partDef } from '../../lib/circuit/parts';
import { pinHole } from '../../lib/circuit/netlist';
import { amps, ohms, volts, watts } from '../../lib/format';
import type { Analysis } from '../../lib/circuit/analyze';
import type { Circuit } from '../../lib/circuit/types';

/** Describes a part's value in the unit that part is measured in. */
function valueOf(typeId: string, value?: number, color?: string): string | null {
  if (typeId === 'resistor') return ohms(value ?? 0);
  if (typeId === 'led') return `${color ?? 'red'} LED`;
  if (value !== undefined) return volts(value);
  return null;
}

/** The hover readout. The brief asks for name, value and live voltage and current, and it
 *  is the only way a beginner can tell one grey cylinder from another. */
export function Tooltip({
  circuit,
  analysis,
  partId,
  hole,
  at,
}: {
  circuit: Circuit;
  analysis: Analysis;
  partId: string | null;
  hole: string | null;
  at: { x: number; y: number } | null;
}) {
  if (!at || (!partId && !hole)) return null;

  const part = partId ? circuit.parts.find((p) => p.id === partId) : undefined;

  // Sit above the pointer, so the readout never covers the part it is describing. Flip to
  // below near the top of the window, and to the left near the right edge.
  const flipDown = at.y < 240;
  const flipLeft = at.x > window.innerWidth - 340;
  const style: React.CSSProperties = {
    left: flipLeft ? undefined : at.x + 18,
    right: flipLeft ? window.innerWidth - at.x + 18 : undefined,
    top: flipDown ? at.y + 18 : at.y - 14,
    transform: flipDown ? undefined : 'translateY(-100%)',
    boxShadow: 'var(--e-3)',
  };

  if (part) {
    const def = partDef(part.typeId);
    const result = analysis.results[part.id];
    const value = valueOf(part.typeId, part.value, part.color);
    const occupied = def.pins
      .map((pin) => pinHole(part, pin.id))
      .filter((h): h is string => Boolean(h));

    return (
      <div
        className="pointer-events-none fixed z-50 max-w-[280px] rounded-[var(--radius-md)] border border-line bg-surface/97 px-3 py-2 backdrop-blur-sm"
        style={style}
      >
        <div className="flex items-baseline gap-2">
          <span className="font-sans text-[13.5px] font-semibold text-ink">{def.name}</span>
          {value && <span className="font-mono text-[12.5px] text-accent">{value}</span>}
        </div>
        <p className="m-0 mt-0.5 font-sans text-[12px] leading-[1.45] text-ink-3">{def.summary}</p>

        {part.burnt ? (
          <p className="m-0 mt-1.5 font-sans text-[12.5px] text-danger">
            Burnt out. Delete it and place a new one.
          </p>
        ) : result ? (
          <dl className="m-0 mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-t border-line pt-1.5">
            <dt className="font-sans text-[11.5px] text-ink-3">across it</dt>
            <dd className="m-0 font-mono text-[12px]" style={{ color: 'var(--color-volt)' }}>
              {volts(Math.abs(result.voltage))}
            </dd>
            <dt className="font-sans text-[11.5px] text-ink-3">through it</dt>
            <dd className="m-0 font-mono text-[12px]" style={{ color: 'var(--color-amp)' }}>
              {amps(Math.abs(result.current))}
            </dd>
            <dt className="font-sans text-[11.5px] text-ink-3">heat</dt>
            <dd className="m-0 font-mono text-[12px] text-ink-2">{watts(result.power)}</dd>
          </dl>
        ) : null}

        {occupied.length > 0 && (
          <p className="m-0 mt-1.5 font-mono text-[11.5px] text-ink-3">
            in {occupied.join(' and ')}
          </p>
        )}
      </div>
    );
  }

  // A hole. Showing which holes are joined to it is the whole breadboard lesson in one line.
  const joined = (() => {
    try {
      return holesInStrip(stripOf(hole!, circuit.board), circuit.board);
    } catch {
      return [];
    }
  })();
  const v = analysis.voltageAtHole(hole!);

  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[300px] rounded-[var(--radius-md)] border border-line bg-surface/97 px-3 py-2 backdrop-blur-sm"
      style={style}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[13.5px] font-semibold text-accent">{hole}</span>
        {v !== null && (
          <span className="font-mono text-[12.5px]" style={{ color: 'var(--color-volt)' }}>
            {volts(v)}
          </span>
        )}
      </div>
      <p className="m-0 mt-1 font-sans text-[12px] leading-[1.45] text-ink-2">
        Joined to {joined.length - 1} other hole{joined.length === 2 ? '' : 's'} inside the board:
      </p>
      <p className="m-0 mt-0.5 font-mono text-[11.5px] leading-[1.5] text-ink-3">
        {joined.join(' ')}
      </p>
    </div>
  );
}
