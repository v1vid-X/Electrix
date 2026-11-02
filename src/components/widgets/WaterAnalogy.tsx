import { useState } from 'react';
import { Slider } from '../ui/Slider';
import { amps, trim, volts } from '../../lib/format';
import { ohmsLaw } from '../../lib/ee';
import { WidgetFrame } from './WidgetFrame';

/** The water-pipe picture, drawn so the three quantities move together:
 *  tank height = voltage, pipe narrowness = resistance, dot speed = current.
 *  The lesson immediately says where this picture lies. */
export function WaterAnalogy() {
  const [pressure, setPressure] = useState(6); // volts
  const [narrow, setNarrow] = useState(400); // ohms

  const { i } = ohmsLaw({ v: pressure, r: narrow });
  // Dots move faster with more current; clamp so it stays watchable.
  const flowSeconds = Math.max(0.35, Math.min(8, 0.02 / Math.max(i, 1e-4)));
  const tankFill = (pressure / 12) * 100;
  // 10 Ω -> wide pipe, 2 kΩ -> a slit.
  const pipeWidth = 4 + 16 * (1 - Math.log10(narrow / 10) / Math.log10(200));

  return (
    <WidgetFrame
      title="Water in pipes"
      caption="A high tank pushes harder (voltage). A narrow pipe fights the flow (resistance). What actually moves is the water (current)."
    >
      <div className="grid gap-5 sm:grid-cols-[1fr_minmax(0,320px)]">
        <svg viewBox="0 0 320 180" className="w-full" role="img" aria-label="Water tank and pipe analogy">
          {/* tank */}
          <rect x="12" y="20" width="70" height="120" rx="4" fill="none" stroke="var(--color-line-strong)" strokeWidth="1.5" />
          <rect
            x="13.5"
            y={20 + (120 - (120 * tankFill) / 100)}
            width="67"
            height={(120 * tankFill) / 100}
            fill="var(--color-volt)"
            opacity="0.28"
          />
          <line
            x1="13.5"
            y1={20 + (120 - (120 * tankFill) / 100)}
            x2="80.5"
            y2={20 + (120 - (120 * tankFill) / 100)}
            stroke="var(--color-volt)"
            strokeWidth="2"
          />
          <text x="47" y="14" textAnchor="middle" className="font-sans" fontSize="10" fill="var(--color-volt)">
            pressure = {volts(pressure)}
          </text>

          {/* pipe: wide, narrow section, wide */}
          <path d="M82 125 H140" stroke="var(--color-line-strong)" strokeWidth="20" strokeLinecap="butt" />
          <path d="M82 125 H140" stroke="var(--color-bg)" strokeWidth="16" strokeLinecap="butt" />
          <path d="M140 125 H200" stroke="var(--color-ohm)" strokeWidth="20" opacity="0.5" />
          <path d="M140 125 H200" stroke="var(--color-bg)" strokeWidth={pipeWidth} />
          <path d="M200 125 H300" stroke="var(--color-line-strong)" strokeWidth="20" strokeLinecap="butt" />
          <path d="M200 125 H300" stroke="var(--color-bg)" strokeWidth="16" strokeLinecap="butt" />
          <text x="170" y="112" textAnchor="middle" className="font-sans" fontSize="10" fill="var(--color-ohm)">
            {trim(narrow)} Ω
          </text>

          {/* flowing water */}
          <path
            d="M84 125 H298"
            stroke="var(--color-amp)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="3 13"
            opacity="0.95"
          >
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to="-32"
              dur={`${flowSeconds}s`}
              repeatCount="indefinite"
            />
          </path>
          <text x="298" y="112" textAnchor="end" className="font-sans" fontSize="10" fill="var(--color-amp)">
            flow = {amps(i)}
          </text>
        </svg>

        <div className="flex flex-col gap-4 sm:justify-center">
          <Slider
            label="Tank height (voltage)"
            value={pressure}
            min={0}
            max={12}
            step={0.1}
            onChange={setPressure}
            display={volts(pressure)}
            color="var(--color-volt)"
          />
          <Slider
            label="Pipe narrowness (resistance)"
            value={narrow}
            min={10}
            max={2000}
            onChange={(x) => setNarrow(Math.round(x))}
            display={`${trim(narrow)} Ω`}
            color="var(--color-ohm)"
            logarithmic
          />
          <p className="m-0 font-sans text-[13px] leading-[1.55] text-ink-2">
            Empty the tank and the flow stops, however wide the pipe. Pinch the pipe shut and the
            flow stops, however high the tank. You need both.
          </p>
        </div>
      </div>
    </WidgetFrame>
  );
}
