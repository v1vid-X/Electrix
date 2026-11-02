import { useState } from 'react';
import { Slider } from '../ui/Slider';
import { ohmsLaw } from '../../lib/ee';
import { amps, ohms as fmtOhms, trim, volts, watts } from '../../lib/format';
import { WidgetFrame } from './WidgetFrame';

/** Ohm's law with live sliders. The point is to feel the relationship, not to read a number:
 *  double the voltage, double the current; double the resistance, halve the current. */
export function OhmsLaw() {
  const [v, setV] = useState(3.3);
  const [r, setR] = useState(330);
  const { i, p } = ohmsLaw({ v, r });

  // Current scaled for the bar, with 100 mA as full width.
  const barPct = Math.min(100, (i / 0.1) * 100);

  return (
    <WidgetFrame
      title="Ohm's law"
      caption="Drag either slider. Notice that current follows voltage up, and resistance down."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Slider
            label="Voltage across the resistor"
            value={v}
            min={0}
            max={12}
            step={0.1}
            onChange={setV}
            display={volts(v)}
            color="var(--color-volt)"
          />
          <Slider
            label="Resistance"
            value={r}
            min={10}
            max={100_000}
            onChange={(x) => setR(Math.round(x))}
            display={fmtOhms(r)}
            color="var(--color-ohm)"
            logarithmic
          />
        </div>

        <div className="flex flex-col justify-center gap-3 rounded-[var(--radius-md)] border border-line bg-surface-2 p-4">
          <div>
            <div className="font-sans text-[12px] uppercase tracking-[0.08em] text-ink-3">
              Current
            </div>
            <div
              className="font-mono text-[1.75rem] leading-none tabular-nums"
              style={{ color: 'var(--color-amp)' }}
            >
              {amps(i)}
            </div>
          </div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--color-line-strong)' }}
            role="img"
            aria-label={`Current bar, ${amps(i)} of 100 mA full scale`}
          >
            <div
              className="h-full rounded-full transition-[width] duration-150 ease-[var(--ease-out)]"
              style={{ width: `${barPct}%`, background: 'var(--color-amp)' }}
            />
          </div>
          <div className="font-mono text-[12px] text-ink-3">full scale 100 mA</div>
          <div className="mt-1 border-t border-line pt-3">
            <div className="font-sans text-[12px] uppercase tracking-[0.08em] text-ink-3">
              Power turned into heat
            </div>
            <div className="font-mono text-[1.0625rem] tabular-nums text-ink">{watts(p)}</div>
          </div>
        </div>
      </div>

      <p className="mt-4 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-3 py-2 font-mono text-[13px] leading-[1.6] text-ink-2">
        I = V ÷ R = {trim(v)} V ÷ {trim(r)} Ω = <span style={{ color: 'var(--color-amp)' }}>{amps(i)}</span>
        {'  ·  '}P = V × I = {trim(v)} × {trim(i, 4)} = {watts(p)}
      </p>
    </WidgetFrame>
  );
}
