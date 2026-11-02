# Progress

Keep this current. Any future session should be able to pick up from this file alone.

Last updated: 2026-11-02 — end of the first build (addendum first steps 1–6).

---

## Done

### Foundations
- `CLAUDE.md` — learner profile, teaching philosophy, accuracy rules, Lab architecture rules,
  design standards, working style. Distilled from the brief and the addendum.
- `curriculum/00-roadmap.md` — all 39 modules plus 3 capstones, with prerequisites, hours,
  which need physical parts, and which Lab parts each unlocks. Nine changes from the original
  outline are listed at the top with reasons.
- `docs/DESIGN.md` — the design system: palette (including the four fixed signal colours),
  type scale, spacing, radii, elevation, motion, icons, layout, states, sound.
- `docs/open-questions.md` — ten ESP32 specifics that must be verified against Espressif
  sources before the modules that use them.

### App
- Vite + React 18 + TypeScript + Tailwind v4, `HashRouter` so a static build works anywhere.
- Design tokens in `src/styles/tokens.css`, mirroring `docs/DESIGN.md`, with a light theme
  defined behind `data-theme="light"` (not wired to a toggle yet).
- Lesson pipeline: markdown in `curriculum/` → react-markdown with GFM, KaTeX maths,
  `remark-directive` and a small custom plugin (`src/lib/remarkCustom.ts`).
  Supports `:::note{type=…}` callouts, `:::check`, `::widget{id=…}`, `::lab{preset=…}`,
  and fenced ` ```quiz ` / ` ```flashcards ` JSON blocks.
- Pages: home with progress, lesson index, lesson viewer (sticky table of contents with
  scroll-spy, prev/next, mark-complete), style tile, Lab.
- Quiz component: multiple choice with per-wrong-answer misconception explanations, and
  numeric answers with tolerance, units and a "you are out by a factor of a thousand" hint.
- Flashcards: SM-2 scheduling in `src/lib/srs.ts`, state in `localStorage`.
- Widgets: Ohm's law calculator with live sliders, water-pipe analogy animation.
- Lab is lazy-loaded, so the lesson bundle does not carry three.js (223 kB gzip vs 460 kB).

### Lesson content
- `curriculum/01-what-electricity-is.md` — the reference lesson. Four ~25-minute sections,
  every term defined, the water analogy with five explicit failures, a "Math you need" box on
  powers of ten, two fully worked examples with every algebra step, both widgets, a
  "what would you measure with a multimeter" section, a Lab link, four "Check yourself" boxes,
  five common mistakes, a five-question quiz, twelve flashcards, further reading and sources.

### The Lab (version 1)
- Three separate layers, as required: data model (`src/lib/circuit/`), solver
  (`src/lib/solver/`), 3D view (`src/components/lab/`). The solver has no React in it and the
  model has no three.js in it.
- Breadboard connectivity modelled properly: five holes per half-row, the centre gap as a real
  break, four power rails, and split rails as an option.
- Procedural 3D: 400-point breadboard with a generated silkscreen texture (numbered rows,
  lettered columns, red/blue rail stripes), resistors with correct colour bands for their
  value, LEDs that light with the actual current, bench power supplies, arcing jumper wires.
- Interaction: orbit/pan/zoom, place parts from the parts bin, wire hole-to-hole and
  hole-to-supply, select, rotate, delete, undo/redo, clear, keyboard shortcuts, quality
  setting, autosave to `localStorage`.
- Simulation: DC operating point on every change. LEDs light by current, do not light when
  reversed, overheat, and burn out permanently with a smoke puff and a written post-mortem
  that keeps the arithmetic on screen. Resistors burn when they exceed twice their rating.
  Dead shorts across the supply are caught before solving and explained.
- "What's happening?" panel writes the same arithmetic the lessons teach, from the solved
  values — verified output: *"So the current is (5 V − 1.89 V) ÷ 220 Ω = 14.1 mA."*

### Tests — 112 passing
`npm test`. Covers: Ohm's law and the power law, series/parallel, voltage dividers, LED
resistor sizing, RC time constants, battery life, engineering-notation formatting, SM-2
scheduling, front-matter parsing and table-of-contents generation (including duplicate
headings), quiz grading and the unit-slip detector, breadboard connectivity (centre gap,
split rails), board geometry and snapping, resistor colour codes, the linear solver, the MNA
solver against textbook circuits (series, parallel, bridge, current source, capacitor at DC),
the LED model against its datasheet point, and whole-circuit analysis including burnout,
reverse LEDs, the centre-gap trap and the split-rail trap.

---

## Decisions worth knowing about

**Solver: hand-written MNA in TypeScript, not ngspice compiled to WebAssembly.**
ngspice-wasm would be more capable (AC, noise, real SPICE models) but: it is 1–2 MB of
WebAssembly on a page that should load fast; it is GPL, which is friction for a site the
learner may put online; its errors are SPICE-speak rather than something a beginner can read;
and we need the internal node voltages and branch currents to *explain* in plain language, plus
our own burnout rules per part. Modified nodal analysis with Newton-Raphson for diodes is about
250 lines, is unit-tested against textbook answers, and gives us exactly those internals.
Revisit if the Lab ever needs AC or noise analysis.

**ESP32 in the Lab: plan for a behavioural GPIO simulator, not an embedded Wokwi.**
Not built yet, but the part registry and the data model are shaped for it. Wokwi runs real
compiled firmware, which is far more faithful, but it is a hosted third-party iframe: it would
own the UI, could not drive our own 3D parts, needs network access, and ties the course to
someone else's service. A behavioural simulator supporting a clearly documented subset of
Arduino calls (`pinMode`, `digitalWrite`, `digitalRead`, `analogRead`, `analogWrite`/LEDC,
`delay`, `millis`) drives our existing solver directly and stays honest about its limits.
Embedding Wokwi as an *extra*, for lessons where running real firmware matters, is still open.

**Physics in the solver is deliberately slightly more honest than the usual toy simulator.**
Diodes use the Shockley equation with an emission coefficient and a bulk series resistance, so
an LED with no resistor draws a realistic couple of hundred milliamps rather than infinity, and
the burnout message can quote a believable number.

---

## Not built yet

Roughly in the order the addendum asks for.

**Lab**
- Schematic view toggle (the 2D auto-generated schematic of the built circuit).
- Virtual multimeter with probes, a dial, continuity beep, and a blowable fuse.
- Transient analysis (capacitors charging over time) and the time controls that go with it —
  the solver stamps capacitors as open circuits at DC today and says so in a comment.
- Capacitors, switches, buttons, potentiometers as placeable parts.
- Transistors, MOSFETs, diodes, relays, motors.
- The ESP32 board, the code editor and simulated GPIO.
- Challenges mode with automatic goal checking, hints, and broken-circuit puzzles.
- Current-flow and voltage-colour visualisation layers.
- Part locking by module progress (the registry already carries `unlockModule`).
- Drag to move an already-placed part; copy/paste; multi-select.
- Export/import a circuit as a JSON file (autosave to `localStorage` works today).
- Oscilloscope.
- Sound effects (snap, click, pop) with the off-by-default toggle.

**App**
- Glossary with hover definitions, and the term index.
- Search across lessons.
- Shopping guide page (the module is in the roadmap; neither page nor lesson is written).
- Datasheet corner.
- Light theme toggle (tokens exist, no control).
- The remaining widgets: voltage divider explorer, series/parallel visualiser, RC plotter,
  LED resistor calculator, PWM duty cycle, logic gates, ADC resolution, battery life,
  I²C/SPI/UART waveforms, resistor colour decoder.
- "Build it" pages for hands-on modules (parts list, wiring, expected result, debug order).

**Curriculum**
- Modules 0a, 0b, 0c and 2 onwards. Module 1 is the template to copy.

---

## Known issues

- **No linter.** `npm run check` is `tsc --noEmit`, which catches type errors but not style.
  ESLint with typescript-eslint would add about 15 dependencies; worth adding if the codebase
  grows, not yet.
- **The Lab bundle is 238 kB gzipped**, nearly all three.js. Fine on a laptop, lazy-loaded so
  it only costs when opened, but it will never be small.
- **Lab parts can be placed overlapping each other.** Nothing checks whether two parts want the
  same hole. The simulation is still correct (they would genuinely be connected), but it looks
  wrong. Needs a placement validity check.
- **Bench supplies stack up** at roughly the same spot when several are added, and cannot be
  dragged to a new position yet.
- **Smoke is positioned at the part's anchor hole**, not at the centre of the part body, so it
  can look slightly offset on a resistor.
- **Only tested in Chromium** (headless, via Playwright). Not checked in Firefox or Safari.
- **Touch input in the Lab is untested.** Orbit controls support it, the placing and wiring
  interactions have not been tried on a tablet.

---

## How to work on this

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # 112 tests
npm run check   # typecheck
npm run build   # typecheck + production build
```

Next session, in priority order: the learner's feedback on the design direction, then the
multimeter and the schematic view, then modules 0a–0c and 2.
