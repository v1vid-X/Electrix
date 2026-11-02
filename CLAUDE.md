# Circuit Brain — project rules

An interactive app that teaches electronics from absolute zero up to designing,
ordering and debugging custom ESP32 boards. Read this before doing anything in this repo.

## The learner (never forget this)

- **Knows nothing about electronics.** Zero. Assume no prior knowledge, ever. Define every
  technical word in plain language the first time it appears.
- **Maths:** school arithmetic only — add, subtract, multiply, divide, fractions, percentages.
  Anything beyond that (simple algebra, powers of ten, reading a graph) gets taught first in a
  short "Math you need" callout, with examples. Never drop a formula on them.
- **Programming:** can follow instructions and copy/paste, cannot really code. Explain what
  every command and every line of code does. Give exact commands, say what success looks like,
  and say what to do when it fails.
- **Hardware:** owns nothing yet. See `curriculum/06-shopping-guide.md` for the buying stages.
- **Time:** 1–2 hours a day. Lessons can be substantial, but split them into 20–30 minute
  sections with clear stopping points.
- **Location:** Netherlands. Euros, metric, 230 V mains (dangerous — see Safety). Prefer EU
  shops: Tinytronics, Kiwi Electronics, Conrad, Reichelt, Mouser/DigiKey EU, AliExpress for
  cheap filler.
- **Tone:** casual and direct, like a smart friend who is good at explaining. No corporate
  voice, no lecturing, no cringe enthusiasm. Their swearing is just how they talk.

## Teaching philosophy (apply to every lesson)

1. Small steps, strictly in order. **No lesson may use a concept or word that has not been
   taught yet.** Check the dependency chain in `curriculum/00-roadmap.md`.
2. Intuition first, maths second. Give the analogy, then immediately say **where the analogy
   breaks down**, so no wrong mental model gets built.
3. Every concept follows this loop:
   *Why does this exist (what problem it solves) → intuition → the rule/equation → worked
   example with real numbers and every algebra step shown → interactive demo → "Build it"
   physical mini-project → quiz → common mistakes.*
4. Real values and real situations: "a 330 Ω resistor, a red LED and a 3.3 V pin", never
   "R1 and V1".
5. Always carry units, and teach sanity-checking: "does this number make sense?"
6. Connect to the ESP32 early and often — but only once the basics are there. The ESP32 is the
   destination, not the starting point.
7. Be honest about simplifications. Say what is simplified and what the full picture is.
8. Teach debugging as a skill. Every hands-on module answers: *what would you measure with a
   multimeter if this did not work?*
9. **Safety is serious.** Short circuits, LiPo batteries, hot irons, and above all 230 V mains
   get explicit warnings. Never guide the learner to work on anything plugged into the wall.
   Everything they build runs on USB power or small batteries.
10. End each section with "Check yourself": 2–3 questions answerable in their head, and what to
    re-read if they cannot.
11. Celebrate small wins briefly. The first LED lighting up is a genuine milestone. Do not
    be cringe about it.

## Accuracy rules (wrong info fries boards and hurts people)

- **Never state ESP32 pin numbers, pin functions, voltage or current limits, boot behaviour or
  ADC specs from memory.** Verify against the Espressif datasheet, the technical reference
  manual, ESP-IDF docs and the Espressif Hardware Design Guidelines. Use web search. PDFs the
  learner puts in `/docs` are the source of truth.
- Every lesson containing hard specs ends with a **Sources** list.
- Unsure? Write `NEEDS VERIFICATION` in the file and add it to `docs/open-questions.md`.
  Never guess.
- **ESP32 variants differ a lot.** Always say which variant a statement applies to
  (ESP32, S2, S3, C3, C6…).
- Every calculation used by a widget or the Lab lives in `src/lib/` and **has unit tests**.
- Explain everything in your own words. Never copy textbook or copyrighted text. Recommending
  books, channels and docs as further reading is encouraged.

## The curriculum is the learner's

Files in `curriculum/` are theirs to edit. **Never overwrite their edits without asking.**
Prefer additive changes, and ask before restructuring a file they have touched.

## The app

Vite + React + TypeScript + Tailwind v4, lessons as markdown in `curriculum/`, no backend, all
state in `localStorage`. Routing uses `HashRouter` so the built site works on any static host.

- `curriculum/` — one markdown file per module, plus `00-roadmap.md`
- `docs/` — `DESIGN.md`, `PROGRESS.md`, `open-questions.md`, datasheets
- `src/lib/` — maths and simulation, framework-free and unit-tested
  (`ee.ts`, `format.ts`, `srs.ts`, `colorCode.ts`, `solver/`, `circuit/`)
- `src/components/` — `ui/`, `widgets/`, `lab/`
- `src/pages/` — one file per route
- `tests/` — vitest, mirrors `src/lib/`

Lesson markdown syntax (see `curriculum/01-what-electricity-is.md` as the reference lesson):

```
:::note{type=intuition title="Optional title"}   types: intuition, math, warning,
...                                              mistake, safety, datasheet, build
:::

:::check                 the "Check yourself" box
:::

::widget{id=ohms-law}    an interactive widget from src/components/widgets/index.ts
::lab{preset=led-basic goal="Light the LED without killing it."}

```quiz      — a JSON array of questions (mc / num). Wrong answers explain the misconception.
```flashcards — a JSON array of {id, front, back}; fed into the SM-2 scheduler.
```

Front matter: `title`, `module`, `summary`, `minutes`, `prereqs`, `needsParts`, `unlocks`.

## The Lab (3D sandbox)

A virtual workbench: 3D breadboard, drag parts in, wire them up, watch it work or burn.
Non-negotiable architecture:

- **Three separate layers.** The circuit data model (`src/lib/circuit/`) knows nothing about
  3D or about the solver. The solver (`src/lib/solver/`) knows nothing about React. The 3D
  scene (`src/components/lab/`) renders the model and sends events back.
- **Breadboard connectivity is modelled for real:** five holes per half-row, centre gap
  separating the halves, power rails along the sides, with split rails as an option (the
  classic beginner trap). Tested in `tests/board.test.ts`.
- **Solver:** hand-written modified nodal analysis with Newton-Raphson for diodes, in
  TypeScript, unit-tested against textbook answers. Rationale for not using ngspice-wasm is in
  `docs/PROGRESS.md`. Keep it separate and keep it tested.
- **Breaking things must teach.** Burnt parts stay burnt until replaced, and the message says
  exactly why it died, with the arithmetic.
- **Part registry:** one entry per part in `src/lib/circuit/parts.ts` — pins, limits,
  simulation model, tooltip, unlock module. Adding a part touches nothing else.
- Always be clear in the UI about what is simulated. A simulation is never a promise about
  real hardware.

## Design standards

`docs/DESIGN.md` is the contract: palette, type scale, spacing, radii, motion, icons. Read it
before writing UI, and keep it in sync with `src/styles/tokens.css`.

- Dark by default. Colour carries meaning, never decoration.
- **Signal colours are fixed across lessons, widgets and the Lab:** voltage = yellow,
  current = cyan, resistance = violet, ground = grey. Never reuse them for anything else.
- Avoid the AI-made tells: purple-blue gradients, glassmorphism, generic card grids, emoji as
  icons, centred hero slabs, gratuitous glow.
- Three fonts, each with a job: Archivo (UI/headings), Source Serif 4 (lesson prose),
  JetBrains Mono (code and every number).
- Colour must never be the only signal. Pair it with a label, unit, icon or line style.
- After building a screen: run it, screenshot desktop and mobile, look at it critically, fix
  spacing/alignment/contrast/hierarchy. Build → look → fix, as a loop.
- Contrast meets WCAG AA. Focus rings are never removed.

## Working style

- Explain in plain language what you did and what to look at. A few lines, not a recap.
- Numbered step-by-step instructions whenever the learner has to do something, with "what you
  should see" and "if it didn't work".
- Ask only when a wrong guess wastes real effort. Otherwise pick the sensible default and say
  what you picked.
- Simple, typed, lightly commented code. No over-engineering, no unnecessary dependencies.
- **Run the tests, the typecheck and the app yourself before saying something is done.** If
  you could not verify something, say so plainly.
- Keep `docs/PROGRESS.md` current: done, next, known issues.
- Disagree out loud and propose an alternative rather than silently changing the plan.

## Commands

```bash
npm run dev     # local dev server
npm test        # vitest, all the maths and simulation
npm run check   # tsc --noEmit
npm run build   # typecheck + production build
```
