import { useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { IconPause, IconPlay } from '../ui/Icon';

export interface ConsoleLine {
  kind: 'serial' | 'warn' | 'error' | 'info';
  text: string;
}

const LINE_COLOR: Record<ConsoleLine['kind'], string> = {
  serial: 'var(--color-ink)',
  warn: 'var(--color-cal-warning)',
  error: 'var(--color-danger)',
  info: 'var(--color-ink-3)',
};

/** The code editor beside the bench. A plain textarea on purpose: a full code editor is
 *  half a megabyte of JavaScript, and at this stage the sketches are twenty lines long. */
export function CodePanel({
  code,
  onChange,
  running,
  onRun,
  onStop,
  lines,
  onClear,
}: {
  code: string;
  onChange: (next: string) => void;
  running: boolean;
  onRun: () => void;
  onStop: () => void;
  lines: ConsoleLine[];
  onClear: () => void;
}) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-line px-3 py-2">
        <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">
          Code
        </span>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant={running ? 'danger' : 'primary'} onClick={running ? onStop : onRun}>
            {running ? <IconPause size={14} /> : <IconPlay size={14} />}
            {running ? 'Stop' : 'Run'}
          </Button>
        </div>
      </header>

      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label="Arduino sketch"
        className="min-h-[200px] flex-1 resize-none bg-surface-2 px-3 py-2.5 font-mono text-[12.5px] leading-[1.6] text-ink outline-none"
      />

      <div className="flex items-center justify-between border-t border-line px-3 py-1.5">
        <span className="font-sans text-[11px] uppercase tracking-[0.08em] text-ink-3">
          Serial monitor
        </span>
        <button
          onClick={onClear}
          className="font-sans text-[11.5px] text-ink-3 transition-colors hover:text-ink"
        >
          clear
        </button>
      </div>

      <div
        ref={logRef}
        className="h-[132px] overflow-y-auto bg-bg px-3 py-2 font-mono text-[12px] leading-[1.55]"
      >
        {lines.length === 0 ? (
          <p className="m-0 text-ink-3">Nothing yet. Press Run.</p>
        ) : (
          lines.map((line, i) => (
            <p key={i} className="m-0 whitespace-pre-wrap" style={{ color: LINE_COLOR[line.kind] }}>
              {line.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
}
