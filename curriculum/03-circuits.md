---
title: Circuits, shorts and ground
module: 3
summary: What a circuit actually is, the two ways it goes wrong, what "ground" really means, and how to read a schematic.
minutes: 100
prereqs: 2
needsParts: false
unlocks: switch, push-button
---

Four sections of about 25 minutes. Module 1 said current needs a complete loop. This module
takes that seriously: what a loop is, the two ways it fails, and how to draw one so another
person can build it.

## Section 1 — The loop

### Why this exists

Every circuit you will ever build is a loop. Not a line, not a tree — a loop. Once you see
circuits as loops you stop making the single most common beginner mistake, which is connecting
one wire to something and wondering why nothing happens.

### The definition

**Circuit.** A complete path from one terminal of a source, through whatever you want to
power, and back to the other terminal of that source.

The word is literally "circuit", as in circular. If you can put your finger on the + terminal
and trace a path through every part and arrive back at the − terminal without lifting your
finger, you have a circuit. If you cannot, you do not.

:::note{type=intuition title="The loop has to close for anything to move"}
Think of a bicycle chain. Push one link and the whole chain moves at once — but only because
it is a closed loop. Cut it anywhere and pushing does nothing, no matter how hard you push.

It does not matter *where* you cut it. A break at the far end stops the chain just as
completely as a break right under your hand.

**Where the picture breaks:** a chain is one object moving as a unit. Electrons do not travel
round the loop as a lump — in module 1 you saw they drift at a fraction of a millimetre per
second. The *effect* propagates almost instantly; the electrons barely move. But the "break it
anywhere and everything stops" part is exactly right, and it is the part that matters.
:::

### Tracing a loop

Take the circuit from module 1: a 5 V supply, a 220 Ω resistor and a red LED.

Start at the supply's **+** terminal. Follow the wire to the resistor's first leg. Through the
resistor, out of its second leg. Along the wire to the LED's long leg. Through the LED, out of
its short leg. Along the wire back to the supply's **−** terminal.

That is one loop, four components (counting the supply), and the **same current flows through
every part of it**. Not shared out, not divided — the same. If 6 mA leaves the supply, 6 mA
goes through the resistor, 6 mA through the LED, and 6 mA arrives back. Module 5 proves this
properly; for now, expect it.

:::check
1. What is the test for whether something is a circuit?
2. In a single loop with three parts, how does the current divide between them?
3. If you cut the wire at the far end of the loop, does the near end still work?

*(Answers: can you trace from one terminal of the source, through everything, back to the
other terminal, without lifting your finger; it does not divide — the same current flows
through all of them; no, a break anywhere stops everything.)*
:::

## Section 2 — The two ways a circuit fails

There are exactly two. Everything else is a variation.

### Open circuit

**Open circuit.** A break in the loop. No current flows anywhere in that loop.

Causes, in roughly the order you will meet them:

- A leg not actually in the breadboard hole, just resting beside it
- A wire in the wrong row — one row off looks identical
- A part in backwards (an LED is an open circuit the wrong way round)
- A switch that is off, which is an open circuit on purpose
- A broken wire inside intact-looking insulation
- A dead battery, which is an open circuit as far as useful current is concerned

**What you measure:** the supply still shows its full voltage, but nothing is drawing current,
and you will find the full supply voltage across the break itself. That last point is the
useful one: *the voltage appears across the gap*. Put your probes either side of a suspect
joint, and if you see the whole supply voltage there, you have found your break.

### Short circuit

**Short circuit.** A path from one side of the supply to the other with almost no resistance
in it, bypassing whatever was supposed to be there.

From Ohm's law, $I = V / R$. If R is nearly zero, I is enormous. The current is limited only
by what the supply can deliver and the small resistance of the wires.

What actually happens depends on the supply:

| Supply | What a short does |
|---|---|
| USB port | shuts itself off, or your computer complains and disables the port |
| Alkaline 9 V battery | gets hot quickly, voltage collapses, battery ruined |
| **LiPo cell** | **can vent, catch fire or explode. This is the dangerous one.** |
| Bench supply | current-limits, and shows you it is doing so |

:::note{type=safety title="Shorts, and the one battery that is genuinely dangerous"}
Nothing in this course involves mains voltage, so a short cannot electrocute you. It can still
burn you and it can start a fire.

An alkaline 9 V battery shorted across its terminals gets hot enough to burn a finger within
seconds. A **lithium polymer (LiPo)** cell shorted can deliver tens of amps, heat up in
seconds, and vent flame. That is not a cautionary exaggeration — it is why LiPo cells get their
own module (17) with its own rules, and why you will not use one until then.

If something is getting hot and you do not know why: **disconnect the power first**, then
look. Do not try to find the fault with the power on.
:::

### The short that is not obvious

Most shorts are not a dramatic wire across the battery. They are:

- A resistor leg touching a neighbouring leg
- Two wires in the same breadboard row by mistake — remember, five holes in a row are already
  joined
- A part placed across the centre channel when you meant it in one half
- A stray whisker of wire
- An LED in backwards *and* a resistor missing, so the one thing limiting current is gone

:::note{type=mistake title="A short does not have to go straight across the battery"}
Any path that bypasses the thing that was limiting the current is a short. Put a wire across
your 220 Ω resistor and the resistor is no longer in the circuit — the LED now has nothing
protecting it, and dies. The battery is fine; the LED is not.

This is worth trying in the Lab, because it looks harmless and is not.
:::

:::check
1. What are the two ways a circuit can fail?
2. Where do you find the supply voltage in an open circuit?
3. Why is a LiPo cell more dangerous to short than an alkaline battery?

*(Answers: open — a break, so no current; and short — a near-zero-resistance path, so far too
much current; across the break itself; a LiPo can deliver tens of amps and can vent or catch
fire.)*
:::

## Section 3 — Ground

### Why this exists

"Ground" is used constantly and almost never explained, which leaves beginners thinking it is
a special kind of wire, or something to do with the earth. It is neither.

### The definition

Module 1 said voltage is always a difference between two points, and that to measure anything
you have to pick a reference. **Ground is that chosen reference point: the one we agree to call
0 V.**

That is all it is. It is a decision, not a component.

When someone says "GPIO13 is at 3.3 V", the full sentence is "GPIO13 is 3.3 volts above the
point we chose to call ground". Everyone leaves off the second half.

:::note{type=intuition title="Sea level"}
Heights are given above sea level. Sea level is not special — it is not the bottom of anything,
there is plenty of ground below it. It is just a line everyone agreed to measure from, so that
numbers from different people can be compared.

Ground is sea level for voltage. Pick a different reference and every number changes, but all
the *differences* stay the same — and the differences are what make things work.

**Where it breaks down:** there is one sea level for the whole planet, but a circuit can have
more than one reference if it has separate supplies that are not joined. Two circuits with
separate grounds cannot meaningfully talk to each other until you connect their grounds
together. This catches people out constantly, and it is why almost every wiring diagram you
will see starts with "connect the grounds".
:::

### In practice

- On a battery, ground is the **−** terminal. Everything else is positive relative to it.
- On a dev board, the pins labelled **GND** are ground, and they are all the same point.
- In a schematic, ground has its own symbol — a short stack of shrinking horizontal lines —
  and every ground symbol in a drawing means *the same point*, even though no wire is drawn
  between them. That convention exists purely to stop drawings turning into spaghetti.

:::note{type=warning title="If two things do not share a ground, they cannot talk"}
Connect a sensor powered by one supply to a microcontroller powered by another, with only a
signal wire between them, and nothing works. There is no shared reference, so "3.3 V" on the
signal wire means nothing to the receiving end.

**The grounds must be connected.** It is the most common wiring omission there is, and the
symptom — "it works sometimes" or "it reads garbage" — never points at it.
:::

:::check
1. Is ground a component?
2. What does "this pin is at 5 V" leave unsaid?
3. Two boards, separate power supplies, one signal wire between them. What is missing?

*(Answers: no, it is a chosen reference point we agree to call 0 V; "...relative to ground";
a wire joining their grounds, so they share a reference.)*
:::

## Section 4 — Reading a schematic

### Why this exists

A photo of a breadboard tells you where the wires go. A **schematic** tells you what the
circuit *is*. It throws away the physical layout and keeps only what is electrically true,
which is why every datasheet, every reference design and every answer you will ever be given
is drawn as one.

### The symbols you need now

| Part | Symbol | How to remember it |
|---|---|---|
| Wire | a plain line | a connection with no resistance |
| Wires joined | a **dot** at the crossing | no dot means they cross without touching |
| Resistor | a zigzag (or a plain rectangle) | the zigzag is the long path current fights through |
| LED | a triangle pointing at a bar, with two arrows leaving | triangle points the way current flows; the arrows are the light coming out |
| Battery | long thin line (+) and short thick line (−), often repeated | the long line is the positive terminal |
| Ground | a stack of shrinking horizontal lines | points "down" to the reference |
| Switch | a line hinged away from a contact | drawn in the open position |

Two conventions that trip everyone up:

1. **A dot means connected.** Lines crossing without a dot are not connected — they just
   cross on the paper. Older drawings use a little hop instead; modern ones use the dot.
2. **Current is drawn flowing from + to −**, the conventional direction from module 1, even
   though the electrons go the other way.

### Reading your first one

In words, here is the circuit you already know, drawn as a schematic would be:

- At the top left, a battery symbol. Its long line is the + terminal.
- A line leaves the + terminal and goes right, into a zigzag (the resistor), labelled `R1`
  and `220 Ω`.
- Out of the resistor, a line goes down into a triangle-and-bar (the LED), labelled `D1`,
  with the triangle pointing downwards.
- Out of the LED's bar, a line goes to a ground symbol.
- Back at the battery, a line leaves the − terminal and goes to another ground symbol.

Those two ground symbols are **the same point**. That is how the loop closes, even though no
line is drawn between them. If you cannot see that, the drawing looks like it has two loose
ends — this is the single biggest hurdle in learning to read schematics, and once it clicks it
stays clicked.

:::note{type=intuition title="Designators"}
`R1`, `D1`, `C3`, `Q2` — a letter for the kind of part, and a number to tell several of them
apart. R is resistor, C capacitor, D diode (an LED is a diode), Q transistor, U an integrated
circuit, SW a switch. They are how a parts list lines up with a drawing, and you will use them
constantly in module 33 when you start drawing your own in KiCad.
:::

### Build it in the Lab

::lab{preset=led-basic goal="Build the loop, then break it in each of the two ways and watch what the panel says. A switch is now in your parts bin."}

:::note{type=build title="What to try, in order"}
1. Build the working circuit: 5 V supply, a 220 Ω resistor, a red LED, back to ground. Use the
   hover readout to check each hole is where you think it is.
2. **Make an open circuit.** Pull one wire out and drop it on the bench. The panel tells you no
   current is reaching the LED.
3. **Add a switch** from the parts bin, in series with the LED, and click it to flip it. That
   is an open circuit you control on purpose.
4. **Make a short.** Run a wire directly across the resistor, from one of its legs to the
   other. The resistor is now bypassed, the LED gets the full supply, and it dies — with the
   arithmetic to explain why.
5. **Make the dramatic short.** Wire the supply's + straight to its −. The Lab refuses to solve
   it and explains what a real supply would do.
6. Hover over any hole and read which other holes it is joined to. Then try putting the LED's
   two legs in the *same* row and see what happens — that is a short across the LED.
:::

:::check
1. In a schematic, how do you tell whether two crossing lines are connected?
2. Two ground symbols in different corners of a drawing. Are they connected?
3. What does `R1` mean?

*(Answers: a dot at the crossing means connected, no dot means they just cross; yes — every
ground symbol in a drawing is the same point; the first resistor in the circuit, used to match
the drawing to the parts list.)*
:::

## Common mistakes

:::note{type=mistake title="Connecting one wire and expecting something to happen"}
One wire is never a circuit. The minimum is a loop: out of the source, through the thing, back
to the source. If you are ever stuck with nothing happening, trace the loop with a finger.
:::

:::note{type=mistake title="Thinking a break only affects what is after it"}
A break anywhere stops everything in that loop. The LED does not light "a bit" because the
break is far away.
:::

:::note{type=mistake title="Both legs of a part in the same breadboard row"}
Five holes in a half-row are already joined inside the board. Putting both legs of a resistor
or an LED in the same row shorts it out completely — the part is bypassed by the board itself,
and it looks perfectly fine.
:::

:::note{type=mistake title="Forgetting to join the grounds"}
Two supplies, one signal wire, no shared ground. Nothing works and nothing looks wrong.
:::

:::note{type=mistake title="Assuming ground means earth"}
In mains wiring, "earth" is a safety connection to the actual ground. In a battery or USB
circuit, "ground" is just the reference point we picked. They are different ideas that
unfortunately share a word.
:::

## Quiz

```quiz
[
  {
    "type": "mc",
    "q": "What is the test for whether you have built a circuit?",
    "options": [
      { "text": "You can trace from one terminal of the source, through every part, back to the other terminal", "correct": true },
      { "text": "Every component has a wire connected to it", "why": "Components can each have wires and still not form a loop. A tree of connections carries no current — only a closed path does." },
      { "text": "The supply is switched on and shows the right voltage", "why": "A supply shows its voltage whether or not anything is connected. Module 1 covered this: voltage can exist with no current at all." },
      { "text": "Nothing is getting hot", "why": "Nothing getting hot is equally consistent with nothing being connected. It tells you there is no short, not that there is a circuit." }
    ],
    "explain": "Circuits are loops. If your finger cannot get back to where it started without lifting, current cannot either."
  },
  {
    "type": "mc",
    "q": "A circuit has a break in one wire. Where will you find the supply voltage?",
    "options": [
      { "text": "Across the break itself", "correct": true },
      { "text": "Across the LED, because it is the last part in the loop", "why": "With no current flowing, no part drops any voltage — Ohm's law with I = 0 gives V = 0 across every resistor. The whole supply voltage appears across the gap." },
      { "text": "Nowhere — with the loop open there is no voltage anywhere", "why": "The supply still maintains its voltage. It has to appear somewhere, and with no current flowing, it appears across the one place current cannot cross." },
      { "text": "Split evenly between all the components", "why": "That would need current to be flowing. With an open circuit there is none, so no component drops anything." }
    ],
    "explain": "This is the single most useful fault-finding fact there is: put your probes either side of a suspect joint, and the full supply voltage means you found the break."
  },
  {
    "type": "mc",
    "q": "What is ground?",
    "options": [
      { "text": "The point in a circuit we choose to call 0 V and measure everything else against", "correct": true },
      { "text": "A connection to the earth outside the building", "why": "That is 'earth' in mains wiring, and it is a safety connection. In a battery or USB circuit, ground is a chosen reference point and goes nowhere near the planet." },
      { "text": "The place where current goes to be absorbed", "why": "Nothing absorbs current. Current flows in a loop back to the source — ground is part of the return path, not a destination." },
      { "text": "A special kind of low-resistance wire", "why": "A ground connection is an ordinary wire. What makes it ground is the decision to measure from it." }
    ],
    "explain": "Ground is sea level for voltage: a chosen reference, not a component and not a destination."
  },
  {
    "type": "num",
    "q": "A 5 V supply is shorted by a wire with 0.05 Ω of resistance. How much current would flow, in amps?",
    "answer": 100,
    "unit": "A",
    "tolerance": 0.03,
    "unitHint": "I = V / R, and the answer here really is in whole amps, not milliamps.",
    "explain": "I = 5 / 0.05 = 100 A. No real USB port can supply that, which is why it shuts down instead — but a LiPo cell will try, and that is why shorting one is dangerous."
  },
  {
    "type": "mc",
    "q": "You run an extra wire from one leg of the series resistor to the other. What happens?",
    "options": [
      { "text": "The resistor is bypassed, so the LED gets far too much current and dies", "correct": true },
      { "text": "Nothing, because the resistor is still connected", "why": "It is connected but no longer doing anything. Current takes the near-zero-resistance wire instead, so the LED has nothing limiting it." },
      { "text": "The supply shorts out and shuts down", "why": "Not quite — the LED is still in the loop, so the supply is not shorted to itself. The LED becomes the only thing limiting current, which it is very bad at." },
      { "text": "The LED gets brighter but is otherwise fine", "why": "It does get brighter, for a moment. An LED does not limit its own current, so without the resistor it draws whatever is available until it fails." }
    ],
    "explain": "A short does not have to be across the battery. Any path that bypasses the thing limiting the current is a short, and the part that was being protected is the one that dies."
  },
  {
    "type": "mc",
    "q": "Two lines cross in a schematic with no dot at the crossing. What does that mean?",
    "options": [
      { "text": "They are not connected — they just cross on the paper", "correct": true },
      { "text": "They are connected; the dot is optional", "why": "The dot is not decorative. No dot means no connection, and reading it the other way will have you building a circuit that is not the one drawn." },
      { "text": "It means the connection is made elsewhere", "why": "A crossing with no dot says nothing about elsewhere. It simply means these two lines do not touch here." },
      { "text": "It is a drawing error", "why": "It is standard notation, and extremely common — schematics are full of lines crossing without touching." }
    ],
    "explain": "Dot means joined. No dot means crossing. Every schematic you ever read depends on that one convention."
  }
]
```

## Flashcards

```flashcards
[
  { "id": "m3-circuit", "front": "What is a circuit, and what is the test for one?", "back": "A complete loop from one terminal of the source, through the parts, back to the other terminal. Test: can you trace it with a finger without lifting?" },
  { "id": "m3-same-current", "front": "In a single loop with several parts, how does the current divide?", "back": "It does not. The same current flows through every part of a single loop." },
  { "id": "m3-open", "front": "What is an open circuit, and where does the supply voltage appear?", "back": "A break in the loop, so no current flows anywhere in it. The full supply voltage appears across the break — which is how you find it with a multimeter." },
  { "id": "m3-short", "front": "What is a short circuit?", "back": "A path with almost no resistance that bypasses what was meant to be there. I = V/R with R near zero means enormous current." },
  { "id": "m3-short-subtle", "front": "Does a short have to go across the battery?", "back": "No. Any path that bypasses the thing limiting the current is a short — such as a wire across a series resistor, which then kills the LED it was protecting." },
  { "id": "m3-lipo", "front": "Which battery is genuinely dangerous to short, and why?", "back": "A LiPo cell. It can deliver tens of amps, heat up in seconds and vent flame. Alkaline cells just get hot and die." },
  { "id": "m3-ground", "front": "What is ground?", "back": "The point we choose to call 0 V and measure every other voltage against. A decision, not a component, and nothing to do with the earth." },
  { "id": "m3-shared-ground", "front": "Two boards on separate supplies, joined by one signal wire. What is missing?", "back": "A wire joining their grounds. Without a shared reference, a voltage on the signal wire means nothing to the other end." },
  { "id": "m3-dot", "front": "In a schematic, how do you tell if two crossing lines are connected?", "back": "A dot at the crossing means connected. No dot means they merely cross." },
  { "id": "m3-ground-symbols", "front": "Are two ground symbols in different corners of a schematic connected?", "back": "Yes — every ground symbol in a drawing is the same point. It is a convention that keeps drawings readable." },
  { "id": "m3-designators", "front": "What do R1, D1, C3 and Q2 mean?", "back": "Reference designators: R resistor, C capacitor, D diode (including LEDs), Q transistor, U integrated circuit, SW switch. The number distinguishes several of the same kind." },
  { "id": "m3-same-row", "front": "Why is putting both legs of a part in the same breadboard row a mistake?", "back": "The five holes in a half-row are already joined inside the board, so the part is shorted out by the board itself — and it looks perfectly fine." }
]
```

## Where this goes next

Module 4 drills Ohm's law and the power law until rearranging them is automatic. Module 5 proves
why the current is the same everywhere in a loop, and what happens when a loop branches.
Module 6 puts a real multimeter in your hand so you can find an open circuit in seconds.

## Sources

This module is standard circuit conventions rather than product specifications, so there are no
datasheet figures to check. Two notes on sources:

- Schematic symbols follow the IEC 60617 / IEEE 315 conventions used by KiCad and by
  essentially every datasheet you will read. KiCad's own symbol library is the practical
  reference: <https://www.kicad.org/>
- The hazard of shorting lithium polymer cells is covered properly in module 17, with
  manufacturer safety data rather than general advice.
