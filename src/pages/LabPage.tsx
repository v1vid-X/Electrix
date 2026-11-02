import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Vector3 } from 'three';
import { LabScene, type Quality } from '../components/lab/LabScene';
import { Button } from '../components/ui/Button';
import { IconCheck, IconChevron, IconMistake, IconWarning } from '../components/ui/Icon';
import { analyze, type Diagnostic } from '../lib/circuit/analyze';
import { COMMON_RESISTORS, LED_COLORS, partList } from '../lib/circuit/parts';
import { emptyCircuit, type Circuit, type Terminal } from '../lib/circuit/types';
import type { HoleId } from '../lib/circuit/board';
import { amps, ohms as fmtOhms, volts } from '../lib/format';
import { presetOrDefault } from '../components/lab/presets';
import { useAutoQuality } from '../components/lab/useAutoQuality';
import { CodePanel, type ConsoleLine } from '../components/lab/CodePanel';
import { findBoard, gpioVolts, withGpio } from '../components/lab/sketchHost';
import { Sketch, type GpioState, type SketchHost } from '../lib/esp32/runtime';
import { DEFAULT_SKETCH } from '../components/lab/sketches';

type Tool = { kind: 'select' } | { kind: 'place'; typeId: string } | { kind: 'wire' };

const WIRE_COLORS = ['#d8322a', '#1a1a1a', '#2c5fa8', '#e8cf3a', '#3f9e4d', '#f2f2f2'];
const LAB_SAVE_KEY = 'circuit-brain/lab/v1';

export function LabPage() {
  const [params] = useSearchParams();
  const preset = presetOrDefault(params.get('preset'));

  const [circuit, setCircuit] = useState<Circuit>(() => {
    if (params.get('preset')) return preset.build();
    try {
      const raw = localStorage.getItem(LAB_SAVE_KEY);
      if (raw) return JSON.parse(raw) as Circuit;
    } catch {
      // fall through to a fresh bench
    }
    return preset.build();
  });

  const [history, setHistory] = useState<Circuit[]>([]);
  const [future, setFuture] = useState<Circuit[]>([]);
  const [tool, setTool] = useState<Tool>({ kind: 'select' });
  const [hoveredHole, setHoveredHole] = useState<HoleId | null>(null);
  const [wireStart, setWireStart] = useState<Terminal | null>(null);
  const [wireColor, setWireColor] = useState(WIRE_COLORS[0]);
  const [pointer, setPointer] = useState<Vector3 | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [resistorValue, setResistorValue] = useState(330);
  const [ledColor, setLedColor] = useState('red');
  const [powered, setPowered] = useState(preset.startPowered !== false);
  // Why each burnt part died. Kept on screen after the part leaves the simulation.
  const [obituaries, setObituaries] = useState<Diagnostic[]>([]);
  const [quality, setQuality] = useState<Quality>('high');
  const { downgraded, fps } = useAutoQuality(quality, setQuality);
  const [panelOpen, setPanelOpen] = useState(true);
  const [smoke, setSmoke] = useState<{ partId: string; startedAt: number }[]>([]);
  const nextId = useRef(1);

  // --- the ESP32 sketch ---------------------------------------------------------------
  const [code, setCode] = useState(() => localStorage.getItem('circuit-brain/lab/sketch') ?? DEFAULT_SKETCH);
  const [consoleLines, setConsoleLines] = useState<ConsoleLine[]>([]);
  const [running, setRunning] = useState(false);
  // Pin state lives outside React so the sketch can read and write it synchronously.
  const gpioRef = useRef<Record<string, GpioState>>({});
  const circuitRef = useRef(circuit);
  const [gpioVersion, setGpioVersion] = useState(0);
  const flushQueued = useRef(false);
  const seenWarnings = useRef(new Set<string>());
  const sketchRef = useRef<Sketch | null>(null);
  circuitRef.current = circuit;

  const log = useCallback((line: ConsoleLine) => {
    setConsoleLines((c) => [...c.slice(-199), line]);
  }, []);

  // Commit a change and remember the previous state for undo.
  const apply = useCallback((fn: (c: Circuit) => Circuit) => {
    setCircuit((current) => {
      setHistory((h) => [...h.slice(-49), current]);
      setFuture([]);
      return fn(current);
    });
  }, []);

  const simCircuit = useMemo(
    () => withGpio(circuit, gpioRef.current),
    // gpioVersion is the signal that the sketch changed a pin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [circuit, gpioVersion],
  );

  const analysis = useMemo(
    () =>
      powered
        ? analyze(simCircuit)
        : analyze({
            ...simCircuit,
            parts: simCircuit.parts.filter(
              (p) => p.typeId !== 'usb-5v' && p.typeId !== 'battery-9v' && p.typeId !== 'esp32-devkit',
            ),
          }),
    [simCircuit, powered],
  );

  // Burnt is permanent: write it back into the circuit and puff some smoke.
  useEffect(() => {
    const dying = Object.values(analysis.results).filter((r) => r.burnsOut);
    if (dying.length === 0) return;
    const dyingIds = new Set(dying.map((d) => d.partId));
    // The explanation only exists in the analysis that killed the part, so keep a copy.
    setObituaries((o) => [
      ...o,
      ...analysis.diagnostics.filter(
        (d) => d.partId && dyingIds.has(d.partId) && d.severity === 'danger',
      ),
    ]);
    setSmoke((s) => [...s, ...dying.map((d) => ({ partId: d.partId, startedAt: performance.now() }))]);
    setCircuit((c) => ({
      ...c,
      parts: c.parts.map((p) => (dying.some((d) => d.partId === p.id) ? { ...p, burnt: true } : p)),
    }));
  }, [analysis]);

  useEffect(() => {
    try {
      localStorage.setItem(LAB_SAVE_KEY, JSON.stringify(circuit));
    } catch {
      // Private browsing: the bench just will not survive a reload.
    }
  }, [circuit]);

  const host = useMemo<SketchHost>(
    () => ({
      setPin: (gpio, state) => {
        if (gpioRef.current[String(gpio)] === state) return;
        gpioRef.current = { ...gpioRef.current, [String(gpio)]: state };
        // Re-render at most once per frame, however fast the sketch toggles pins.
        if (!flushQueued.current) {
          flushQueued.current = true;
          requestAnimationFrame(() => {
            flushQueued.current = false;
            setGpioVersion((v) => v + 1);
          });
        }
      },
      readVolts: (gpio) => gpioVolts(circuitRef.current, gpioRef.current, gpio),
      print: (text) => log({ kind: 'serial', text: text.replace(/\n$/, '') }),
      warn: (text) => {
        // The same warning every loop would bury everything else.
        if (seenWarnings.current.has(text)) return;
        seenWarnings.current.add(text);
        log({ kind: 'warn', text });
      },
      fail: (text) => {
        log({ kind: 'error', text });
        setRunning(false);
      },
    }),
    [log],
  );

  const runSketch = useCallback(() => {
    if (!findBoard(circuitRef.current)) {
      log({ kind: 'error', text: 'There is no ESP32 board on the bench. Add one from the parts panel first.' });
      return;
    }
    seenWarnings.current.clear();
    setConsoleLines([]);
    sketchRef.current ??= new Sketch(host);
    const errors = sketchRef.current.start(code);
    if (errors.length > 0) {
      errors.forEach((text) => log({ kind: 'error', text }));
      setRunning(false);
      return;
    }
    log({ kind: 'info', text: 'Running.' });
    setRunning(true);
  }, [code, host, log]);

  const stopSketch = useCallback(() => {
    sketchRef.current?.stop();
    setRunning(false);
    setGpioVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    localStorage.setItem('circuit-brain/lab/sketch', code);
  }, [code]);

  // Stop the sketch when the page goes away, so no timer keeps firing.
  useEffect(() => () => sketchRef.current?.stop(), []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setCircuit((current) => {
        setFuture((f) => [current, ...f]);
        return h[h.length - 1];
      });
      return h.slice(0, -1);
    });
  }, []);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      setCircuit((current) => {
        setHistory((h) => [...h, current]);
        return f[0];
      });
      return f.slice(1);
    });
  }, []);

  const deleteSelected = useCallback(() => {
    if (!selectedPartId) return;
    apply((c) => ({
      ...c,
      parts: c.parts.filter((p) => p.id !== selectedPartId),
      wires: c.wires.filter(
        (w) =>
          !(w.from.kind === 'pin' && w.from.partId === selectedPartId) &&
          !(w.to.kind === 'pin' && w.to.partId === selectedPartId),
      ),
    }));
    setSelectedPartId(null);
  }, [apply, selectedPartId]);

  const rotateSelected = useCallback(() => {
    if (!selectedPartId) return;
    apply((c) => ({
      ...c,
      parts: c.parts.map((p) =>
        p.id === selectedPartId ? { ...p, rotation: (((p.rotation + 1) % 4) as 0 | 1 | 2 | 3) } : p,
      ),
    }));
  }, [apply, selectedPartId]);

  // Keyboard shortcuts. The cheat sheet in the HUD lists exactly these.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key.toLowerCase() === 'r') {
        rotateSelected();
      } else if (e.key.toLowerCase() === 'w') {
        setTool({ kind: 'wire' });
      } else if (e.key === 'Escape') {
        setTool({ kind: 'select' });
        setWireStart(null);
        setSelectedPartId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, deleteSelected, rotateSelected]);

  const handleClickHole = (holeId: HoleId) => {
    if (tool.kind === 'place') {
      const id = `${tool.typeId}-${nextId.current++}`;
      apply((c) => ({
        ...c,
        parts: [
          ...c.parts,
          {
            id,
            typeId: tool.typeId,
            anchor: holeId,
            rotation: 0,
            value: tool.typeId === 'resistor' ? resistorValue : undefined,
            color: tool.typeId === 'led' ? ledColor : undefined,
          },
        ],
      }));
      setSelectedPartId(id);
      setTool({ kind: 'select' });
      return;
    }
    if (tool.kind === 'wire') {
      if (!wireStart) {
        setWireStart({ kind: 'hole', hole: holeId });
      } else {
        const to: Terminal = { kind: 'hole', hole: holeId };
        apply((c) => ({
          ...c,
          wires: [...c.wires, { id: `w-${nextId.current++}`, from: wireStart, to, color: wireColor }],
        }));
        setWireStart(null);
      }
    }
  };

  const handleClickSourcePin = (partId: string, pinId: string) => {
    if (tool.kind !== 'wire') return;
    const terminal: Terminal = { kind: 'pin', partId, pinId };
    if (!wireStart) setWireStart(terminal);
    else {
      apply((c) => ({
        ...c,
        wires: [...c.wires, { id: `w-${nextId.current++}`, from: wireStart, to: terminal, color: wireColor }],
      }));
      setWireStart(null);
    }
  };

  const selected = circuit.parts.find((p) => p.id === selectedPartId);
  const hasBoard = Boolean(findBoard(circuit));
  const available = partList().filter((p) => p.typeId !== 'wire-link');

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c0e0d]">
      <div className="absolute inset-0">
        <LabScene
          circuit={circuit}
          analysis={analysis}
          hoveredHole={hoveredHole}
          wireStart={wireStart}
          pointer={pointer}
          wireColor={wireColor}
          selectedPartId={selectedPartId}
          smoke={smoke}
          quality={quality}
          selectMode={tool.kind === 'select'}
          onHoverHole={setHoveredHole}
          onClickHole={handleClickHole}
          onClickPart={(id) => setSelectedPartId(id)}
          onClickSourcePin={handleClickSourcePin}
          onPointerMove={setPointer}
        />
      </div>

      {/* Top-left toolbar */}
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 p-3">
          <Link to="/" className="no-underline">
            <Button size="sm" variant="ghost">
              ← Circuit Brain
            </Button>
          </Link>
          <Panel className="flex items-center gap-1 px-1.5 py-1.5">
            <ToolButton active={tool.kind === 'select'} onClick={() => setTool({ kind: 'select' })}>
              Select
            </ToolButton>
            <ToolButton
              active={tool.kind === 'wire'}
              onClick={() => {
                setTool({ kind: 'wire' });
                setWireStart(null);
              }}
            >
              Wire
            </ToolButton>
            <span className="mx-1 h-5 w-px bg-line" />
            {WIRE_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setWireColor(c)}
                aria-label={`wire colour ${c}`}
                className={[
                  'h-5 w-5 rounded-full border transition-transform duration-[120ms]',
                  wireColor === c ? 'scale-110 border-ink' : 'border-line-strong hover:scale-105',
                ].join(' ')}
                style={{ background: c }}
              />
            ))}
          </Panel>
          <Panel className="flex items-center gap-1 px-1.5 py-1.5">
            <ToolButton onClick={undo} disabled={history.length === 0}>
              Undo
            </ToolButton>
            <ToolButton onClick={redo} disabled={future.length === 0}>
              Redo
            </ToolButton>
            <ToolButton onClick={rotateSelected} disabled={!selected}>
              Rotate
            </ToolButton>
            <ToolButton onClick={deleteSelected} disabled={!selected}>
              Delete
            </ToolButton>
            <ToolButton
              onClick={() => {
                apply(() => emptyCircuit());
                setSmoke([]);
                setObituaries([]);
                setSelectedPartId(null);
              }}
            >
              Clear
            </ToolButton>
          </Panel>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Parts bin */}
          <div className="pointer-events-auto flex max-h-full flex-col p-3 pt-0">
            <Panel className="flex max-h-full w-[268px] flex-col overflow-hidden">
              <button
                onClick={() => setPanelOpen((o) => !o)}
                className="flex items-center justify-between border-b border-line px-3 py-2.5 text-left"
              >
                <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                  Parts
                </span>
                <span
                  className="text-ink-3 transition-transform duration-[200ms]"
                  style={{ transform: panelOpen ? 'rotate(90deg)' : 'none' }}
                >
                  <IconChevron size={16} />
                </span>
              </button>

              {panelOpen && (
                <div className="overflow-y-auto p-2.5">
                  {available.map((def) => (
                    <div key={def.typeId} className="mb-1.5">
                      <button
                        onClick={() =>
                          def.onBoard
                            ? setTool({ kind: 'place', typeId: def.typeId })
                            : apply((c) => ({
                                ...c,
                                parts: [
                                  ...c.parts,
                                  {
                                    id: `${def.typeId}-${nextId.current++}`,
                                    typeId: def.typeId,
                                    anchor: null,
                                    rotation: 0,
                                    position: { x: -42, z: c.parts.length * 4 },
                                    value: def.defaultValue,
                                  },
                                ],
                              }))
                        }
                        className={[
                          'w-full rounded-[var(--radius-sm)] border px-2.5 py-2 text-left transition-colors duration-[120ms]',
                          tool.kind === 'place' && tool.typeId === def.typeId
                            ? 'border-accent bg-accent-dim'
                            : 'border-line bg-surface-2 hover:border-line-strong',
                        ].join(' ')}
                      >
                        <span className="block font-sans text-[13.5px] font-medium text-ink">
                          {def.name}
                        </span>
                        <span className="mt-0.5 block font-sans text-[12px] leading-[1.45] text-ink-3">
                          {def.summary}
                        </span>
                      </button>

                      {def.typeId === 'resistor' && (
                        <select
                          value={resistorValue}
                          onChange={(e) => setResistorValue(Number(e.target.value))}
                          className="mt-1.5 h-8 w-full rounded-[var(--radius-sm)] border border-line bg-surface px-2 font-mono text-[12.5px] text-ink"
                        >
                          {COMMON_RESISTORS.map((r) => (
                            <option key={r} value={r}>
                              {fmtOhms(r)}
                            </option>
                          ))}
                        </select>
                      )}
                      {def.typeId === 'led' && (
                        <div className="mt-1.5 flex gap-1.5">
                          {Object.entries(LED_COLORS).map(([key, spec]) => (
                            <button
                              key={key}
                              onClick={() => setLedColor(key)}
                              aria-label={spec.label}
                              title={`${spec.label} — about ${spec.vf} V forward`}
                              className={[
                                'h-6 flex-1 rounded-[var(--radius-sm)] border transition-transform duration-[120ms]',
                                ledColor === key ? 'border-ink' : 'border-line-strong hover:scale-[1.03]',
                              ].join(' ')}
                              style={{ background: spec.hex }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <p className="mt-2 border-t border-line pt-2 font-sans text-[11.5px] leading-[1.5] text-ink-3">
                    Transistors, capacitors and switches arrive with their modules.
                  </p>
                </div>
              )}
            </Panel>
          </div>

          <div className="flex-1" />

          {/* What's happening + diagnostics */}
          <div className="pointer-events-auto hidden max-h-full w-[348px] flex-col gap-3 p-3 pt-0 lg:flex">
            {hasBoard && (
              <Panel className="flex min-h-[260px] flex-[3] flex-col overflow-hidden">
                <CodePanel
                  code={code}
                  onChange={setCode}
                  running={running}
                  onRun={runSketch}
                  onStop={stopSketch}
                  lines={consoleLines}
                  onClear={() => setConsoleLines([])}
                />
              </Panel>
            )}
            <Panel className="min-h-[150px] flex-[2] overflow-y-auto">
              <div className="border-b border-line px-3 py-2.5">
                <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                  What&apos;s happening?
                </span>
              </div>
              <div className="px-3 py-2.5">
                {analysis.story.length === 0 ? (
                  <p className="m-0 font-sans text-[13px] text-ink-3">Nothing to report yet.</p>
                ) : (
                  analysis.story.map((line, i) => (
                    <p
                      key={i}
                      className="m-0 mb-2 font-sans text-[13px] leading-[1.6] text-ink-2 last:mb-0"
                    >
                      {line}
                    </p>
                  ))
                )}
              </div>

              {(() => {
                const explained = new Set(obituaries.map((o) => o.partId));
                const shown = [
                  ...obituaries,
                  ...analysis.diagnostics.filter((d) => !(d.partId && explained.has(d.partId))),
                ];
                return shown.length === 0 ? null : (
                <div className="border-t border-line px-3 py-2.5">
                  {shown.map((d, i) => (
                    <div key={i} className="mb-3 flex gap-2 last:mb-0">
                      <span
                        className="mt-0.5 shrink-0"
                        style={{
                          color:
                            d.severity === 'danger'
                              ? 'var(--color-danger)'
                              : d.severity === 'warning'
                                ? 'var(--color-cal-warning)'
                                : 'var(--color-ink-3)',
                        }}
                      >
                        {d.severity === 'danger' ? (
                          <IconMistake size={15} />
                        ) : d.severity === 'warning' ? (
                          <IconWarning size={15} />
                        ) : (
                          <IconCheck size={15} />
                        )}
                      </span>
                      <span>
                        <span className="block font-sans text-[13px] font-semibold text-ink">
                          {d.title}
                        </span>
                        <span className="block font-sans text-[12.5px] leading-[1.55] text-ink-2">
                          {d.detail}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                );
              })()}
            </Panel>

            <Panel className="px-3 py-2.5">
              <span className="font-sans text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-2">
                Goal
              </span>
              <p className="m-0 mt-1.5 font-sans text-[13px] leading-[1.55] text-ink-2">
                {preset.goal}
              </p>
            </Panel>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 p-3">
          <Panel className="flex items-center gap-3 px-3 py-2">
            <Button
              size="sm"
              variant={powered ? 'primary' : 'secondary'}
              onClick={() => {
                if (powered) stopSketch();
                setPowered((p) => !p);
              }}
            >
              {powered ? 'Power on' : 'Power off'}
            </Button>
            <span className="font-mono text-[12.5px] tabular-nums text-ink-2">
              {(() => {
                const src = circuit.parts.find((p) => p.typeId === 'usb-5v' || p.typeId === 'battery-9v');
                if (src) {
                  const current = analysis.sourceCurrents[src.id];
                  return `${volts(src.value ?? 0)} · ${current !== undefined ? amps(Math.abs(current)) : '— A'}`;
                }
                const board = findBoard(simCircuit);
                if (!board) return 'no supply on the bench';
                // Total current the board's pins are delivering right now.
                const pinCurrent = Object.entries(analysis.sourceCurrents)
                  .filter(([id]) => id.startsWith(`${board.id}:gpio`))
                  .reduce((sum, [, a]) => sum + Math.abs(a), 0);
                const on = Object.entries(board.gpio ?? {})
                  .filter(([, state]) => state === 'high')
                  .map(([pin]) => `IO${pin}`);
                return `3.3 V · ${amps(pinCurrent)} · ${on.length > 0 ? `${on.join(' ')} HIGH` : 'all pins off'}`;
              })()}
            </span>
          </Panel>

          <Panel className="flex items-center gap-2 px-3 py-2">
            <span className="font-sans text-[12px] text-ink-3">Quality</span>
            {downgraded && (
              <span
                className="font-mono text-[11px] text-cal-warning"
                title="Reflections and surface detail were turned down because the frame rate was low. Set it back to high if you want them."
              >
                auto
              </span>
            )}
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as Quality)}
              className="h-7 rounded-[var(--radius-sm)] border border-line bg-surface-2 px-1.5 font-mono text-[12px] text-ink"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            {fps !== null && <span className="font-mono text-[11px] text-ink-3">{fps} fps</span>}
          </Panel>

          <Panel className="px-3 py-2 font-mono text-[11.5px] text-ink-3">
            <span className={hoveredHole ? 'text-accent' : ''}>
              {hoveredHole ? `hole ${hoveredHole}` : 'no hole'}
            </span>
            {'  ·  '}drag to orbit · scroll to zoom · W wire · R rotate · Del delete · Ctrl+Z undo · Esc cancel
          </Panel>

          {selected && (
            <Panel className="px-3 py-2 font-mono text-[12px] text-ink-2">
              selected: {selected.typeId}
              {selected.value ? ` ${fmtOhms(selected.value)}` : ''}
              {selected.burnt ? ' (burnt out)' : ''}
            </Panel>
          )}
        </div>
      </div>

      {/* The Lab needs room. Say so rather than breaking. */}
      <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-bg px-8 text-center lg:hidden">
        <div>
          <h1 className="m-0 font-sans text-[1.25rem] font-semibold text-ink">
            The Lab needs a bigger screen
          </h1>
          <p className="mt-2 mb-5 font-sans text-[14px] leading-[1.6] text-ink-2">
            Building circuits by hand needs a laptop-sized window. The lessons work fine here
            though.
          </p>
          <Link to="/lessons" className="no-underline">
            <Button variant="primary">Go to the lessons</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Panel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-line bg-surface/95 backdrop-blur-sm ${className}`}
      style={{ boxShadow: 'var(--e-3)' }}
    >
      {children}
    </div>
  );
}

function ToolButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        'h-7 rounded-[var(--radius-sm)] px-2.5 font-sans text-[12.5px] transition-colors duration-[120ms]',
        'disabled:cursor-not-allowed disabled:opacity-35',
        active ? 'bg-accent-dim text-accent' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
      ].join(' ')}
    >
      {children}
    </button>
  );
}
