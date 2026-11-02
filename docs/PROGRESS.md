# Progress

Keep this current. Any future session should be able to pick up from this file alone.

Last updated: 2026-11-02 — Lab pointer and geometry fixes, found by using the installed app.

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

### Desktop app
- Electron wrapper (`electron/main.cjs`) around the same static build, with the renderer
  locked down (no Node integration, context isolation on, sandbox on) and external links
  pushed out to the real browser.
- `.github/workflows/windows-app.yml` builds the Windows installer on a `windows-latest`
  runner — a Linux container cannot produce a Windows binary — runs the tests first, and
  uploads `CircuitBrain-Setup-x.y.z.exe` as a run artifact, or attaches it to a Release on a
  `v*` tag.
- Verified by launching the real Electron app under Xvfb: home, lesson (33 KaTeX nodes, both
  widgets) and the Lab (3D canvas, lazy chunk) all render off disk.

### Making the Lab look real
- Filmic (ACES) tone mapping, and image-based lighting generated in code from three's own
  room scene — no asset to download, so it still works offline in the desktop app.
- Physically-based materials throughout: tinned-steel leads, painted ceramic resistor
  bodies, moulded ABS board, solder-mask PCB, stamped-steel shield.
- The LED is now a real LED: a translucent epoxy dome with the reflector cup and the anode
  post visible inside it, a flange with the flat on the cathode side, and a die that lights.
- Resistors are lathed with proper rounded shoulders instead of a cylinder with ball ends.
- The breadboard's holes are a bump map rather than paint, so they have edges.
- A shared tiling noise texture varies roughness, because uniform gloss is the clearest
  "this is CG" signal.
- **Two attempts were wrong and measured as such.** Refraction (`transmission`) on the LED
  forces the renderer to draw the whole scene again every frame: dropped, since on a 5 mm
  dome you cannot see the difference. And the first lighting pass used the environment at
  full strength, which blew the whole scene out to white and destroyed the dark theme — it
  is now dim and used for reflections only.

### Lab fixes after the first real install
Reported from a photo of the running app: "the wires just float and the mouse doesn't even
line up to the breadboard". Both were real, and both are now covered by browser tests.

- **The pointer missed by about two holes.** The invisible click targets sat at
  `BOARD_HEIGHT / 2`, 4.2 mm *below* the board's visible surface, which was at
  `BOARD_HEIGHT - 0.28`. With the camera at an angle the ray reached that depth a couple of
  holes further along. Hovering over `h15` selected `f13`. There is now one exported
  `BOARD_SURFACE_Y` that the surface, the click targets, the hover ring, part legs and wire
  ends all measure from.
- **Parts swallowed clicks meant for holes.** The ESP32 sits between the camera and the
  holes behind it, and its mesh called `stopPropagation`. Hover ignored parts, so the
  readout said one thing and clicking did another — the first wire click simply vanished.
  Parts are now transparent to clicks unless the select tool is active (bench supplies stay
  clickable, since their terminals are how you wire to them).
- **Wires ended in mid-air** above the board. They now end 1.1 mm *below* the surface, so
  they disappear into the hole like a real jumper.
- **Wires dived through the board.** The five-point Catmull-Rom spline overshot near its
  ends. Replaced with a quadratic Bezier, which is guaranteed by its convex hull to stay
  above the line joining its endpoints.
- **Part rotation did nothing.** `rotation={[Math.PI/2, angle, 0]}` applies the angle before
  the tilt, and the cylinder's axis *is* the Y axis, so the angle was a no-op and resistors
  always lay along one axis. Bodies and leads are now built from the real pin positions with
  a quaternion, so geometry follows the data.
- Smaller: sharper board silkscreen (26 px/mm), smoother wire tubes, a minimum zoom distance
  so texels do not show, and the hovered hole id is now displayed in the status bar — useful
  for learning the grid, and it makes pointer alignment observable.

### The ESP32 in the Lab (built out of order, by request)
- `src/lib/esp32/pins.ts` — the board's electrical model. Logic thresholds, output levels and
  drive currents come from the ESP32 datasheet DC characteristics table; everything that
  could not be verified is **excluded rather than guessed** (GPIO34–39, INPUT_PULLUP, any
  specific product's physical header order) and is listed in `docs/open-questions.md`.
- `src/lib/esp32/arduino.ts` — transpiles a documented subset of Arduino C++ to JavaScript.
  Anything it cannot honestly simulate (analogRead, PWM, INPUT_PULLUP, libraries,
  interrupts) is rejected with an explanation rather than silently behaving differently.
- `src/lib/esp32/runtime.ts` — runs the sketch. Drives pins, reads them back through the
  solver, catches runaway loops, refuses the flash pins, warns about strapping pins and about
  floating inputs. No React or three.js in it.
- A GPIO output is modelled as 3.3 V behind ~16.5 Ω, derived from the datasheet's VOH and IOH
  figures, so a pin sags under load exactly as real hardware does — and the Lab warns when a
  pin is pushed past its rated drive current, which is the real hazard rather than the LED.
- `PartDef` gained `newNode()` (parts with internal structure), `groundPin` and a `diagnose`
  hook, so the board's knowledge stays entirely inside the part registry.
- 3D board mesh with silkscreen pin labels, a code editor and a serial monitor in the Lab,
  and two presets (`esp32-blink`, `esp32-bare`).
- Verified end to end in a real browser: the LED blinks, and the panel reads
  *"The LED drops 1.74 V … the resistor takes 1.45 V. So the current is 1.45 V ÷ 220 Ω =
  6.59 mA."*

### Lesson content, continued
- `curriculum/20-what-a-microcontroller-is.md` — what a microcontroller is, the five parts
  that matter, and why a GPIO pin is not a power supply.
- `curriculum/21-first-code.md` — blink, line by line, plus reading a button, pull-down
  resistors, floating inputs and a debugging order.
- Both open with a "you are jumping ahead" callout naming the modules they lean on that are
  not written yet.

### Tests — 164 unit + 23 browser
`npm test` runs the unit tests in about two seconds. `npm run test:lab` runs the browser
checks against a dev server (`npm run dev -- --port 5181`); they need Playwright and a
Chromium build, which is why they are a separate script and excluded from the typecheck.

The browser checks exist because the two worst bugs so far were invisible to unit tests:
they only existed on screen. `tests/e2e/lab-pointer.test.ts` works out where a hole *should*
appear using the same camera the Lab configures, moves the mouse there, and checks the Lab
agrees — across both halves, both ends, the rails and the centre gap. Reintroducing the old
4 mm offset makes it fail on 12 of 14 holes, which is how it was confirmed to be worth
having. `tests/e2e/lab-workflow.test.ts` builds the blink circuit entirely by clicking:
place a resistor, place an LED, draw three wires, run the sketch, check the LED lights with
the right arithmetic, then undo, redo and clear.

The unit tests cover: Ohm's law and the power law, series/parallel, voltage dividers, LED
resistor sizing, RC time constants, battery life, engineering-notation formatting, SM-2
scheduling, front-matter parsing and table-of-contents generation (including duplicate
headings), quiz grading and the unit-slip detector, breadboard connectivity (centre gap,
split rails), board geometry and snapping, resistor colour codes, the linear solver, the MNA
solver against textbook circuits (series, parallel, bridge, current source, capacitor at DC),
the LED model against its datasheet point, and whole-circuit analysis including burnout,
reverse LEDs, the centre-gap trap and the split-rail trap. Plus the Arduino transpiler and
its loop guards, the sketch runtime (blinking over time, floating inputs, refused pins,
runaway loops, Serial, millis), and the ESP32 driving a real circuit (pin sag under load,
GPIO overcurrent warning, and the blink preset's wiring).

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

**ESP32, still missing**
- A push button part, so module 21's button section can be built rather than faked with a wire.
- `analogRead`, PWM / `analogWrite`, and `INPUT_PULLUP` — all blocked on datasheet figures.
- Uploading to real hardware. The Lab simulates; it does not flash a board.

**Curriculum**
- Modules 0a, 0b, 0c, 2–19 and 22 onwards. Module 1 is the template to copy.

---

## Known issues

- **The installer is not code-signed**, so Windows SmartScreen warns on first run
  ("More info" → "Run anyway"). Signing needs a paid certificate.
- **Lessons are compiled into the build**, so editing `curriculum/` means re-running the dev
  server or rebuilding — the installed app cannot pick up edited markdown. If that becomes
  annoying, the fix is to read lessons from disk at runtime in the Electron build.
- **No Content-Security-Policy** on the renderer, so Electron logs a security warning in
  development. A strict CSP interacts badly with `file://` loading; the renderer is sandboxed,
  has no Node access, and loads nothing remote except Google Fonts.
- **The Windows packaging step itself is only verified in CI**, not locally — this container
  is Linux.

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
- **Real-GPU performance is unverified.** This container has no GPU, so everything renders
  through a software rasteriser with no texture hardware — which is precisely where
  environment maps and bump maps cost the most and on real hardware cost the least.
  Measured there, the realism work roughly halved the frame rate; measured there, the whole
  scene runs at 1-3 fps either way, so the numbers say little about a real machine. The
  mitigation is the automatic quality fallback plus the manual selector, not a guess.
- **A part can still hide a hole from the current camera angle.** Clicks pass through parts
  now, but if a part is physically on top of a hole you have to orbit to reach it — same as
  real life.
- **espressif.com is blocked** by this cloud session's network policy, which is why four
  ESP32 facts remain unverified. See `docs/open-questions.md` for the two ways to close them.
- **The Arduino subset is a regex transpiler, not a parser.** It handles the sketches these
  lessons teach; unusual formatting may confuse it. Loop bodies must use braces.
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
