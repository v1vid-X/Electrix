/** One slider style for the whole app: label, mono value, and a track that uses the
 *  signal colour of whatever quantity it controls. */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  color = 'var(--color-accent)',
  logarithmic = false,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display: string;
  color?: string;
  /** Use for resistance, where 100 Ω -> 1 MΩ needs a log feel. */
  logarithmic?: boolean;
}) {
  const toSlider = (v: number) => (logarithmic ? Math.log10(v) : v);
  const fromSlider = (v: number) => (logarithmic ? 10 ** v : v);
  const sMin = toSlider(min);
  const sMax = toSlider(max);
  const sVal = toSlider(value);
  const pct = ((sVal - sMin) / (sMax - sMin)) * 100;

  return (
    <label className="block select-none">
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-[13px] font-medium text-ink-2">{label}</span>
        <span className="font-mono text-[15px] tabular-nums" style={{ color }}>
          {display}
        </span>
      </span>
      <input
        type="range"
        min={sMin}
        max={sMax}
        step={logarithmic ? 0.01 : step}
        value={sVal}
        onChange={(e) => onChange(fromSlider(Number(e.target.value)))}
        className="cb-slider mt-2 w-full"
        style={
          {
            '--cb-fill': color,
            background: `linear-gradient(to right, ${color} ${pct}%, var(--color-line-strong) ${pct}%)`,
          } as React.CSSProperties
        }
      />
    </label>
  );
}
