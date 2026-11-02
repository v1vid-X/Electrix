# Circuit Brain — Design System

The one place design decisions live. If something in the app contradicts this file, the
file wins and the app gets fixed. Tokens are implemented in `src/styles/tokens.css`.

## 1. Mood

A beautiful technical notebook that happens to be a pro tool. Think: lab notebook paper,
oscilloscope phosphor, anodised aluminium, printed circuit silkscreen. Calm and dark, with
saturated colour used **only to carry meaning**, never decoration.

Deliberately avoided: purple→blue gradients, glassmorphism, glow for the sake of glow,
emoji as icons, centred hero text, generic 3-card feature grids, drop shadows on everything.

## 2. Colour

### Surfaces and ink (dark theme — the default)

| Token | Hex | Use |
|---|---|---|
| `--c-bg` | `#101312` | Page background. Near-black, very slightly green-grey, never pure `#000`. |
| `--c-surface` | `#161A19` | Cards, panels, sidebars. |
| `--c-surface-2` | `#1D2220` | Raised: popovers, hovered rows, code blocks. |
| `--c-line` | `#272D2B` | Hairline borders, dividers. |
| `--c-line-strong` | `#39413E` | Focused/active borders, table rules. |
| `--c-ink` | `#E9ECE7` | Primary text. |
| `--c-ink-2` | `#A5ACA6` | Secondary text, labels. |
| `--c-ink-3` | `#6F7873` | Muted: captions, disabled, metadata. |

Contrast: `--c-ink` on `--c-bg` ≈ 14.9:1, `--c-ink-2` ≈ 6.5:1, `--c-ink-3` ≈ 3.6:1
(so `--c-ink-3` is for non-essential text and large text only — never body copy).

### Brand / interactive

| Token | Hex | Use |
|---|---|---|
| `--c-accent` | `#C47A45` | Copper. Links, primary buttons, focus ring, active nav. |
| `--c-accent-hi` | `#DB9158` | Hover/active state of the above. |
| `--c-accent-dim` | `#2B1F16` | Tinted background behind accent elements. |

Copper, not blue: it reads as "hardware", and it leaves the blues and cyans free for
*meaning*, which matters more here.

### Signal colours — THE IMPORTANT ONES

These four mean the same thing in every lesson diagram, every widget, and in the Lab.
Never use them for decoration anywhere.

| Quantity | Token | Hex | Mnemonic |
|---|---|---|---|
| **Voltage** | `--c-volt` | `#F2C53D` | yellow = potential, "pressure" |
| **Current** | `--c-amp` | `#4FC3D9` | cyan = flow |
| **Resistance** | `--c-ohm` | `#A98BD9` | violet = opposition |
| **Ground / 0 V** | `--c-gnd` | `#8B938E` | neutral grey = reference |

Plus two state colours: `--c-danger` `#E0564A` (burnt, short circuit, mains, mistakes)
and `--c-ok` `#58B57C` (verified, passed, measured-correct).

Because colour alone must never carry meaning (colour-blind readers, printing), every
signal colour is always paired with a label, a unit, an icon, or a line style.

### Callout accents (kept separate on purpose)

Callouts use a muted, ink-tinted set so a callout border can never be mistaken for a
voltage or current colour:

| Callout | Hex | Icon |
|---|---|---|
| Intuition | `#3E8E7E` | lightbulb-ish nib |
| Math You Need | `#7B6BA8` | sigma |
| Warning | `#B8862B` | triangle |
| Common Mistake | `#B5604E` | crossed circle |
| Safety | `#D33B2C` | bolt + hatched top edge |
| Datasheet Tip | `#4A7190` | document |
| Try It / Build It | `#C47A45` | play |

### Light theme

Optional, toggled by `data-theme="light"` on `<html>`. Same hues, inverted lightness:
`--c-bg #F7F5F1` (warm paper), `--c-surface #FFFFFF`, `--c-ink #16191A`. Signal colours
darken for contrast on paper (`--c-volt #9A7400`, `--c-amp #156C7E`, `--c-ohm #5B4490`).

## 3. Type

Three faces, each with a job:

| Role | Face | Why |
|---|---|---|
| UI + headings | **Archivo** (500/600/700) | Grotesque, slightly technical, tight at display sizes without looking like Inter. |
| Lesson body | **Source Serif 4** (400/600) | A serif for long-form reading: better rhythm over a 1.5-hour session, and it instantly separates "the text I read" from "the tool I click". |
| Code + all numbers | **JetBrains Mono** (400/500/700) | Tabular figures, unambiguous `0O1lI`, made for code. Every measured number in the app is set in mono so numbers always look like numbers. |

Scale (1.25 ratio, clamped for fluidity):

| Token | Size | Use |
|---|---|---|
| `--t-display` | 2.75rem → 3.5rem | Page title, one per page |
| `--t-h1` | 2.125rem | Lesson title |
| `--t-h2` | 1.5rem | Section heading |
| `--t-h3` | 1.1875rem | Sub-section |
| `--t-body` | 1.125rem (18px) | Lesson prose |
| `--t-ui` | 0.9375rem (15px) | Buttons, nav, panels |
| `--t-small` | 0.8125rem (13px) | Captions, metadata |

Reading rules: prose measure capped at **68ch**, line-height **1.7** for body / **1.25**
for headings, paragraph spacing 1em. Headings get `letter-spacing: -0.015em`.

## 4. Space, radius, elevation

- Spacing scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96` px. Nothing in between.
- Radius: `--r-sm 4px` (inputs, chips) · `--r-md 8px` (cards, callouts) · `--r-lg 12px`
  (panels, modals) · `--r-full` (pills, LED dots). No 20px+ blobs.
- Elevation: borders do the work, shadows are a last resort.
  `--e-1` = 1px hairline border only (cards).
  `--e-2` = `0 1px 2px rgb(0 0 0 / .4)` (raised rows).
  `--e-3` = `0 8px 24px -8px rgb(0 0 0 / .55)` (popovers, floating Lab toolbar).
  No coloured shadows, no glows — **except** a real LED in the Lab, which is a light source
  and is allowed to bloom.

## 5. Motion

- Durations: `--m-fast 120ms` (hover, focus), `--m-base 200ms` (panels, tabs),
  `--m-slow 320ms` (route change, drawer).
- Easing: `--ease-out cubic-bezier(.2,.8,.25,1)` for things entering,
  `--ease-in-out cubic-bezier(.45,0,.25,1)` for things moving.
- Only `transform` and `opacity` are animated. Never `height` on long content.
- A component snapping into the breadboard: 140ms scale 1.06 → 1.0 overshoot. That snap is
  the one piece of deliberate delight in the app.
- `@media (prefers-reduced-motion: reduce)` kills all of it (including the Lab's current-flow
  animation, which falls back to static arrows).

## 6. Icons and diagrams

- Icons: inline SVG, 1.5px stroke, 20×20 box, round caps, no fills. Drawn in-repo as needed,
  no icon-font dependency, **no emoji in UI**.
- Diagrams: hand-authored SVG in `public/diagrams/`. 2px stroke for conductors, 1.25px for
  annotation, signal colours from §2, labels in Archivo 13px, values in JetBrains Mono.
  Every diagram must be readable at 320px wide and must work in both themes (so: no baked-in
  white backgrounds, use `currentColor` where possible).

## 6b. The Lab's rendering

The 3D scene is lit the way a product photograph is, not the way a tech demo is:

- **Filmic tone mapping** (ACES) with exposure just under 1, so highlights roll off instead
  of clipping to white.
- **Image-based lighting**, generated in code from three's own room scene — no HDR file to
  download, which matters because the desktop app runs offline. Kept deliberately dim
  (`environmentIntensity` 0.32): it is there for reflections and a little bounce, not to
  light the scene. A bright studio washes out the dark workbench the rest of the app is
  designed around, which is exactly what happened on the first attempt.
- **One key light** with a soft shadow, plus a cool fill. The desk is given a low
  `envMapIntensity` so it stays near-black.
- **Nothing is uniformly glossy.** A shared tiling noise texture varies roughness across the
  breadboard and the resistor bodies. Perfectly even roughness is the single most obvious
  "this is CG" tell.
- **Geometry follows the data.** Bodies and leads are built between the part's real pin
  positions with a quaternion, never with a guessed Euler angle.

Quality tiers, because reflections and surface relief are close to free on a GPU and very
expensive without one:

| | reflections | surface relief | shadows | lens |
|---|---|---|---|---|
| high | yes | yes | soft | translucent, internals visible |
| medium | yes | no | hard | translucent |
| low | no | no | none | opaque, low-poly |

The Lab measures its own frame rate for the first couple of seconds and steps the quality
down if the machine cannot keep up. It only ever goes down, and it stops interfering the
moment the learner picks a level themselves.

## 7. Layout

- Lesson page: left ToC rail (sticky, 240px, hidden < 1024px), centre column 68ch, right
  gutter for margin notes ≥ 1280px.
- The Lab: full-bleed canvas, collapsible left parts panel (280px), floating top-left
  toolbar, bottom simulation bar, minimal HUD top-right. UI floats over the canvas with
  `--e-3`; the 3D scene is never boxed in.
- Breakpoints: `sm 640 · md 768 · lg 1024 · xl 1280`. Lessons work at 360px. The Lab asks
  for ≥ 1024px and says so politely instead of breaking.

## 8. States (non-negotiable)

Every interactive element defines all five: rest, hover, focus-visible, active, disabled.
Focus ring is always `2px --c-accent` + `2px` offset, never removed. Empty states get a
one-line explanation and the action that fixes them. Loading states are a skeleton in
`--c-surface-2`, never a spinner on a blank page.

## 9. Sound (optional, off by default)

Three samples max: `snap` (part into breadboard), `click` (switch/button), `pop` (component
burns out). Short, dry, quiet. A toggle in settings, persisted in `localStorage`, default off.
