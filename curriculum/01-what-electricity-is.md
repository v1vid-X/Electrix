---
title: What electricity actually is
module: 1
summary: Charge, current, voltage and a first look at resistance — built from scratch, with the analogy and the exact places it lies to you.
minutes: 120
prereqs: 0
needsParts: false
unlocks: battery-9v, usb-5v, resistor, led
---

Four sections, about 25–30 minutes each. Stop at any "Check yourself" box and come back later;
nothing after it depends on you being in one sitting.

By the end you will know what the words *charge*, *current*, *voltage* and *resistance* mean,
you will be able to work out how much current flows in a simple circuit, and you will have
built one in the Lab and watched it work. No parts needed yet.

## Section 1 — Charge: the stuff that does the moving

### Why this exists

Every single thing you will build — an LED, a sensor, a whole ESP32 board — works by moving
something around a loop of wire. Before anything else makes sense, you need to know what that
something is.

Here is the honest answer: it is **electrons**, and they were already in the wire before you
plugged anything in.

### The terms, defined

**Atom.** Everything is made of atoms. An atom has a heavy middle (the nucleus) and light
**electrons** around the outside.

**Charge.** Charge is a property that some particles have, like mass is a property things have.
It comes in two kinds, which we call **negative** and **positive**. Electrons carry negative
charge. The nucleus carries positive charge. Those names are pure historical labels — there is
nothing more negative about an electron than there is about a hole in the ground. Benjamin
Franklin guessed which was which, and guessed wrong, and we never fixed it.

The one rule that matters: **like charges push each other apart, opposite charges pull together.**
That push and pull is the entire engine of electronics.

**Conductor.** A material whose electrons are not firmly attached to any one atom, so they can
drift from atom to atom. Metals are conductors. Copper is the one in your wires.

**Insulator.** A material whose electrons are held tight, so they cannot drift. The plastic
around a wire, glass, dry air, rubber.

**Coulomb (C).** The unit we measure charge in. One coulomb is a *lot* of charge — about
6.24 billion billion electrons. You will never think in coulombs again after this lesson, but
you need it once so the next definition makes sense.

:::note{type=intuition title="The crowded corridor"}
Picture a corridor packed shoulder to shoulder with people, all the way from one end to the
other. That is a copper wire: it is already completely full of electrons. Nothing needs to be
*added*.

If you push the person at one end, the shove travels down the corridor almost instantly and the
person at the far end steps forward — even though nobody walked very far at all.

That is why a light comes on the instant you hit the switch, even though the electrons
themselves barely shuffle along.
:::

### How fast do the electrons actually go?

This surprises almost everyone. In a copper wire 1 mm² thick carrying a typical 1 amp, the
electrons drift along at roughly **0.07 mm per second**. That is about 25 centimetres an hour.
Slower than a snail. You could outrun an electron while crawling.

What travels fast is the *push*, not the electrons — the shove down the corridor, which moves
at a good fraction of the speed of light.

:::note{type=mistake title="Electricity is not electrons racing through wires"}
It is a very common picture, and it leads to wrong predictions later: for example, you would
expect a long wire to make a light turn on noticeably later, and it does not. Hold on to the
crowded-corridor picture instead.
:::

:::check
1. If you cut a copper wire in half, does the charge leak out of the cut ends?
2. Why does a lamp light up straight away when the electrons move so slowly?
3. Is the plastic around a wire a conductor or an insulator, and what does that word mean?

If any of those were shaky, re-read "The terms, defined" and the crowded corridor box.
*(Answers: no — the wire was already full and stays full, it just has nowhere to flow to now;
because the push travels fast, not the electrons; insulator, meaning its electrons cannot drift
from atom to atom.)*
:::

## Section 2 — Current: charge that is actually moving

### Why this exists

"The wire is full of electrons" is not useful on its own. What does work is electrons *moving*.
We need a number for how much is moving, and that number is current.

### The definition

**Current** is how much charge flows past a point each second. Its symbol is **I** (from the
old French *intensité*), and its unit is the **ampere**, almost always shortened to **amp** or
just **A**.

> 1 amp = 1 coulomb of charge flowing past a point every second.

The corridor again: current is not how crowded the corridor is, and it is not how hard you are
pushing. It is **how many people walk past a given door per second**.

### Real numbers, so you have a feel for the scale

Numbers are useless without a sense of what is big and what is small. These are the ones worth
knowing by heart:

| Thing | Current it draws |
|---|---|
| An LED on an indicator panel | 2–20 mA |
| An ESP32 board idling with Wi-Fi on | roughly 40–100 mA |
| An ESP32 in deep sleep | tens of microamps |
| A small hobby servo motor, moving | 300–800 mA |
| A USB 2.0 port's limit | 500 mA |
| A car starter motor | 100–300 A |

So when you later measure 13 mA through an LED, you will know that is normal, and when you
measure 2 A you will know something is very wrong.

:::note{type=math title="Powers of ten and the prefixes"}
Electronics spans from microamps to hundreds of amps, so we never write all those zeros. We use
a prefix letter instead.

| Prefix | Means | Written out | Example |
|---|---|---|---|
| **M** mega | × 1 000 000 | $10^{6}$ | 1 MΩ = 1 000 000 Ω |
| **k** kilo | × 1 000 | $10^{3}$ | 4.7 kΩ = 4700 Ω |
| (none) | × 1 | $10^{0}$ | 5 V |
| **m** milli | ÷ 1 000 | $10^{-3}$ | 20 mA = 0.020 A |
| **µ** micro | ÷ 1 000 000 | $10^{-6}$ | 10 µF = 0.000010 F |
| **n** nano | ÷ 1 000 000 000 | $10^{-9}$ | 100 nF = 0.0000001 F |

**The only skill you need:** moving the decimal point three places.

- milli → base: move the point **three places left**. 20 mA → 0.020 A.
- base → milli: move it **three places right**. 0.0035 A → 3.5 mA.
- kilo → base: three places right. 2.2 kΩ → 2200 Ω.

$10^{6}$ just means "1 with 6 zeros after it" = 1 000 000. $10^{-3}$ means "divide by 1 with 3
zeros" = divide by 1000. That is all the exponent notation means.

**Try it:** 0.47 A in mA? 1500 Ω in kΩ? 0.000068 F in µF?
*(470 mA · 1.5 kΩ · 68 µF)*
:::

:::note{type=warning title="mA and A are a factor of a thousand apart"}
Mixing them up is the single most common arithmetic mistake in electronics, and it is a
thousand-fold error — the difference between a part that runs cool and a part that is on fire.
Write the unit down every single time. Not "I = 0.02", but "I = 0.02 A".
:::

### Which way does current flow?

Here is a genuinely annoying piece of history that you have to know about.

**Conventional current** is drawn as flowing from the **+** terminal, through the circuit, to
the **−** terminal. Every schematic, every datasheet and every explanation you will ever read
uses this.

The electrons actually move the other way, from **−** to **+**, because they are negatively
charged and are attracted to the positive terminal.

The convention was fixed before anyone knew electrons existed. Nobody is going to redraw every
schematic ever made, so we live with it.

:::note{type=intuition title="Just use conventional current"}
The maths comes out identical either way, so: use conventional current (+ to −) for everything,
forever. The only reason to know about electrons going backwards is so you are not confused the
day you read about it somewhere.
:::

:::check
1. What is the unit of current, and what does "1 amp" mean in words?
2. Write 20 mA in amps, and 0.4 A in milliamps.
3. In a schematic, which way is current drawn as flowing?

*(Answers: the ampere — one coulomb of charge past a point per second; 0.020 A and 400 mA; from
+ to −.)*
:::

## Section 3 — Voltage: the push

### Why this exists

Current does not happen by itself. The electrons in that corridor are perfectly happy standing
still. Something has to push them. Voltage is the size of that push.

### The definition

**Voltage** is the difference in electrical "pressure" between two points. Its symbol is **V**
and its unit is the **volt (V)**.

The exact definition is energy per unit of charge: one volt means one joule of energy is given
to each coulomb of charge that passes. You do not need that for anything practical, but it does
tell you something important — voltage is about **energy**, and that is why voltage is what
determines whether something is dangerous.

A battery does not contain electricity waiting to come out. It contains a chemical reaction
that maintains a difference: a shortage of electrons at the **+** terminal and a surplus at the
**−** terminal. That difference is the push. It sits there doing nothing until you give the
charge a path.

### Voltage is always *between* two points

This is the single most important idea in this whole lesson, and the one most beginners never
quite internalise.

**There is no such thing as "the voltage at this point".** There is only the voltage *between*
two points. Voltage is a difference, like the height difference between two steps on a
staircase. Asking "how high is this step?" is meaningless until you say "measured from what?"

In practice we pick one point, call it **0 V**, and measure everything relative to it. That
chosen reference point is called **ground** (or **GND**, or the **0 V rail**). On a 9 V battery,
the **−** terminal is normally called ground, which makes the **+** terminal "9 V" — meaning
*9 volts higher than the terminal we decided to call zero*.

:::note{type=warning title="A multimeter needs two probes for a reason"}
When you measure voltage you must touch two points. A single probe can never tell you a
voltage, because a voltage between one point and nothing does not exist. When someone says
"pin 4 is at 3.3 volts", they mean "3.3 volts above ground" — they have just left the second
half of the sentence out, as everyone does.
:::

### The water analogy, and exactly where it breaks

Now that you have all three ideas coming, here is the standard picture.

::widget{id=water-analogy}

- A tall tank of water = **high voltage**. The water pressure is the push.
- Water flowing through the pipe = **current**. It is the thing that actually moves.
- A narrow section of pipe = **resistance**. It fights the flow.

Drag both sliders. The things worth noticing: empty the tank and the flow stops however wide
the pipe; pinch the pipe shut and the flow stops however full the tank. You need both a push
*and* a path.

:::note{type=mistake title="Where the water analogy lies to you"}
It is a good picture and I will keep using it. But it is wrong in five specific ways, and each
one bites later:

1. **Water can spill out of an open pipe. Charge cannot.** Electricity needs a complete loop
   back to where it came from. An open-ended wire does nothing at all — no current leaks out of
   the end. This is the biggest difference and the most common beginner error.
2. **The pipe is already full.** No water has to arrive from the tank for flow to start at the
   far end. (The crowded corridor is the better picture for this bit.)
3. **Water has mass and inertia; it sloshes.** Electrons, in simple DC circuits, do not
   meaningfully. Something *like* inertia shows up in module 10 with inductors, but it is not
   the electrons' own momentum.
4. **A thin pipe slows water down because of friction with the walls. A resistor is not
   friction.** It is more like the electrons constantly bumping into vibrating atoms, which
   turns the energy into heat. Which is why the way a resistor warms up matters later.
5. **Gravity makes water flow downhill only. Electricity has no "down".** Nothing is lost by
   going up a wire.

The honest summary: the analogy gets the *relationships* right — more push means more flow,
more resistance means less flow — and gets the *mechanism* wrong. Use it for intuition about
which way the numbers move, and throw it away when you need to know what is physically
happening.
:::

:::check
1. Why is "the voltage at pin 4" technically an incomplete sentence?
2. A 9 V battery is sitting on your desk with nothing connected. Is any current flowing? Is
   there still a voltage across its terminals?
3. Name one thing the water analogy gets badly wrong.

*(Answers: voltage is a difference, so you have to say "relative to what" — usually ground;
no current at all, but yes, the full 9 V push is still there; current needs a complete loop,
whereas water can pour out of an open pipe.)*
:::

## Section 4 — Resistance, and the three quantities together

### Why this exists

You now have a push (voltage) and a flow (current). The third quantity decides *how much* flow
you get for a given push, and it is the one you will spend the most money on: resistance.

Module 2 goes properly into resistance, power and heat, and module 4 does the full algebra. This
section is just enough to make the three fit together.

### The definition

**Resistance** is how much a thing opposes current. Its symbol is **R**, and its unit is the
**ohm**, written with the Greek letter omega: **Ω**.

A **resistor** is a component built to have a specific, reliable resistance. It is the most
common component in existence, it costs under a cent, and its entire job is to limit current.

The three quantities are tied together by one relationship, which is **Ohm's law**:

$$ I = \frac{V}{R} $$

In words: **current equals voltage divided by resistance.** More push, more current. More
resistance, less current. That is exactly what the water picture told you, now with numbers
attached.

::widget{id=ohms-law}

Move both sliders and watch the relationship. Double the voltage and the current doubles.
Double the resistance and the current halves. Nothing subtle is going on.

### Worked example, every step shown

> **You have a pin on a microcontroller board that puts out 3.3 V. You connect a 330 Ω resistor
> from that pin to ground. How much current flows?**

**Step 1 — write down what you know, with units.**

$$ V = 3.3\ \text{V} \qquad R = 330\ \Omega \qquad I = ? $$

**Step 2 — pick the form of the equation that gives you what you want.**

We want $I$, and $I = V / R$ already has $I$ on its own. Nothing to rearrange.

**Step 3 — substitute the numbers, keeping the units attached.**

$$ I = \frac{3.3\ \text{V}}{330\ \Omega} $$

**Step 4 — do the arithmetic.**

$3.3 \div 330$. Both have a 3.3 in them, which makes it easy: $330 = 3.3 \times 100$, so
$3.3 \div 330 = 1 \div 100 = 0.01$.

$$ I = 0.01\ \text{A} $$

**Step 5 — convert to a sensible unit.**

0.01 A is an awkward way to say it. Moving the decimal point three places right gives
milliamps:

$$ I = 10\ \text{mA} $$

**Step 6 — sanity check. Does this number make sense?**

Look back at the table in section 2: an indicator LED runs at 2–20 mA. We got 10 mA, right in
that range, from a normal 3.3 V pin and a normal resistor. That is reassuring. If the answer
had come out as 10 A, we would know we had slipped a factor somewhere — 10 A would melt the
wire.

### A second one, backwards

> **You want only 5 mA to flow from that same 3.3 V pin. What resistor do you need?**

**Step 1 — knowns, with units.** Note the conversion straight away:

$$ V = 3.3\ \text{V} \qquad I = 5\ \text{mA} = 0.005\ \text{A} \qquad R = ? $$

**Step 2 — rearrange.** Starting from $I = V/R$, multiply both sides by $R$:

$$ I \times R = V $$

Then divide both sides by $I$:

$$ R = \frac{V}{I} $$

**Step 3 — substitute.**

$$ R = \frac{3.3\ \text{V}}{0.005\ \text{A}} $$

**Step 4 — arithmetic.** Dividing by 0.005 is the same as multiplying by 200 (because
$1 \div 0.005 = 200$):

$$ R = 3.3 \times 200 = 660\ \Omega $$

**Step 5 — sanity check, and a practical note.** We asked for half the current we had with
330 Ω, and we got double the resistance. That is exactly the relationship the slider showed, so
the answer is consistent.

In real life you cannot buy a 660 Ω resistor — resistors only come in a standard set of values.
The nearest common one is 680 Ω, which would give $3.3 / 680 = 4.9$ mA. Close enough for
anything. Module 8 covers why those odd values exist.

### What you would measure if it did not work

Get into this habit now, because it is the skill that separates people who can fix things from
people who buy another one. You build the circuit above and nothing happens. With a multimeter
you would check, **in this order**:

1. **Voltage across the battery or supply, from + to −.** Is the push even there? If it reads
   0 V, nothing downstream matters. Dead battery, or the supply is not on.
2. **Voltage across the resistor** (one probe each side). If the supply reads 3.3 V but the
   resistor has 0 V across it, current is not getting there — the loop is broken somewhere
   between them.
3. **Continuity along each wire** (the setting that beeps). A wire that looks fine can be broken
   inside the insulation, and on a breadboard a leg that looks plugged in can be sitting beside
   the hole rather than in it.
4. **Current, in series.** Last, because it means breaking the circuit and putting the meter in
   the gap. This is also the setting that blows the meter's fuse if you use it wrong, which is
   module 6's job to explain properly.

Module 6 teaches the meter itself. For now, just notice the pattern: **check the push, then
check the path, then check the flow.**

### Build it in the Lab

You have no parts yet, so build it virtually. Everything in the Lab is simulated with a real
circuit solver, so the numbers it shows you are the numbers this lesson's arithmetic predicts.
It is not a cartoon — but it is also not a promise about real hardware.

::lab{preset=ohms-law goal="Drop a resistor on the board, wire it across the 9 V battery, and check the current against your own arithmetic. Then try a 10 Ω resistor and read what the panel tells you about why it died."}

:::note{type=build title="What to try, in order"}
1. Click **Resistor** in the parts panel, pick **330 Ω**, then click a hole on the board to
   place it.
2. Click **Wire**, then click the battery's red **+** terminal, then a hole in the same
   five-hole row as one end of the resistor.
3. Wire the resistor's other end back to the battery's black **−** terminal.
4. Read the "What's happening?" panel. With 9 V and 330 Ω it should say about 27 mA. Check it
   yourself: $9 \div 330 = 0.0273$ A = 27.3 mA.
5. Now swap in a **10 Ω** resistor and watch what happens. The panel will explain why.
:::

:::note{type=safety title="This is the one safety rule for now"}
Everything you build in this course runs from a USB port or a small battery. **Never connect
anything you have built to a wall socket.** Mains electricity in the Netherlands is 230 V, it
can push enough current through a person to stop their heart, and there is nothing in this
course that needs it.

The 5 V from a USB port cannot hurt you. A 9 V battery cannot hurt you (though shorting one
will make it hot enough to burn your fingers). 230 V can kill you. That is the whole rule.
:::

:::check
1. What is the unit of resistance, and what is a resistor for?
2. 5 V across a 1000 Ω resistor — how much current, in mA?
3. You want 10 mA from a 5 V supply. What resistance do you need?

*(Answers: the ohm, Ω, and a resistor exists to limit current; $5 / 1000 = 0.005$ A = 5 mA;
$5 / 0.010 = 500$ Ω.)*
:::

## Common mistakes

:::note{type=mistake title="Thinking a wire can be \"at 5 volts\" on its own"}
Voltage is always a difference between two points. "This wire is at 5 V" is shorthand for "this
wire is 5 V above the point we called ground". When you start measuring real circuits, the
black probe has to go somewhere — and where you put it *defines* what every other reading means.
:::

:::note{type=mistake title="Mixing up amps and milliamps"}
A factor of a thousand. Always write the unit next to the number. If an answer comes out as
"20" and you are not sure if that is amps or milliamps, you do not have an answer yet.
:::

:::note{type=mistake title="Expecting current to flow out of a single wire"}
Current needs a complete loop, from the source, through everything, and back to the source. One
wire from the + terminal to an LED does nothing. Two wires, forming a loop, is the minimum.
This is why every circuit diagram you will ever see is a closed shape.
:::

:::note{type=mistake title="Thinking voltage \"gets used up\" and current \"gets used up\""}
In a single loop the **current is the same everywhere** — the same amps flow through every part,
one after another. It is the **voltage** that gets divided up between the parts. Module 5 proves
this properly, but start expecting it now, because the opposite intuition (current getting
"consumed" by the first component it meets) is very sticky and very wrong.
:::

:::note{type=mistake title="Trusting an analogy past its limits"}
The water picture is a tool, not the truth. The moment it predicts something odd, drop it and
go back to: push (voltage), flow (current), opposition (resistance), complete loop.
:::

## Quiz

```quiz
[
  {
    "type": "mc",
    "q": "What does a current of 1 amp actually mean?",
    "options": [
      { "text": "One coulomb of charge flows past a point every second", "correct": true },
      { "text": "One volt of push is being applied", "why": "That is voltage, not current. Voltage is the push; current is the flow that results from it. They are different quantities with different units." },
      { "text": "The wire contains one coulomb of charge", "why": "The wire is already full of charge whether or not anything is flowing. Current is about charge per second moving past a point, not how much is sitting there." },
      { "text": "The electrons are travelling at one metre per second", "why": "Electron drift speed is tiny — roughly 0.07 mm per second for 1 A in a 1 mm² copper wire. Current is about how much charge passes a point, not how fast each electron goes." }
    ],
    "explain": "Current is a rate: charge per second. One amp is one coulomb per second."
  },
  {
    "type": "mc",
    "q": "A 9 V battery sits on the desk with nothing connected to it. What is true?",
    "options": [
      { "text": "There is 9 V across its terminals and no current flowing", "correct": true },
      { "text": "There is no voltage until you connect something", "why": "The chemical reaction maintains the voltage difference whether or not anything is connected. The push is there; it just has nothing to push through." },
      { "text": "Current flows out of the + terminal into the air", "why": "Current needs a complete loop back to the source. With nothing connected there is no path at all, so nothing flows. This is the main place the water analogy misleads people." },
      { "text": "The battery slowly runs out at the same rate as when it is in use", "why": "It does self-discharge very slowly, but nothing like the rate of actually powering something. With no loop there is essentially no current." }
    ],
    "explain": "Voltage can exist with no current. Current requires a complete path; voltage does not."
  },
  {
    "type": "num",
    "q": "A 3.3 V supply is connected across a 220 Ω resistor. How much current flows, in milliamps?",
    "answer": 15,
    "unit": "mA",
    "tolerance": 0.04,
    "unitHint": "The answer in amps is 0.015 — the question asked for milliamps, so move the point three places right.",
    "explain": "I = V / R = 3.3 V / 220 Ω = 0.015 A, and 0.015 A = 15 mA. Sanity check: it is in the normal range for an indicator LED, so it is a believable number."
  },
  {
    "type": "num",
    "q": "You want 20 mA to flow from a 5 V supply. What resistance do you need, in ohms?",
    "answer": 250,
    "unit": "Ω",
    "tolerance": 0.04,
    "unitHint": "Convert 20 mA to amps first: 0.020 A. Dividing by 20 instead of 0.020 is out by a thousand.",
    "explain": "Rearranging I = V / R gives R = V / I = 5 V / 0.020 A = 250 Ω. The nearest resistor you can actually buy is 270 Ω, which would give 18.5 mA."
  },
  {
    "type": "mc",
    "q": "Which of these is a real way the water analogy misleads you?",
    "options": [
      { "text": "Water pours out of an open pipe, but charge will not flow out of an open wire", "correct": true },
      { "text": "Water pressure and voltage behave in opposite directions", "why": "They behave the same way — more pressure means more flow, more voltage means more current. That part of the analogy is exactly right." },
      { "text": "A narrow pipe increases flow, whereas a resistor decreases current", "why": "A narrow pipe decreases flow, just as resistance decreases current. The analogy is right here too." },
      { "text": "Water has no equivalent of voltage at all", "why": "Pressure is a good stand-in for voltage. The analogy fails on mechanism, not on which quantity maps to which." }
    ],
    "explain": "The headline failure is the closed loop. Electricity only flows in a complete circuit; water is happy to pour onto the floor."
  }
]
```

## Flashcards

```flashcards
[
  { "id": "m1-charge", "front": "What is electric charge?", "back": "A property of particles that comes in two kinds, negative (electrons) and positive (nuclei). Like charges repel, opposite charges attract. Measured in coulombs." },
  { "id": "m1-current", "front": "What is current, and what is its unit?", "back": "How much charge flows past a point each second. Symbol I, unit the ampere (A). 1 A = 1 coulomb per second." },
  { "id": "m1-voltage", "front": "What is voltage, and why can it never be measured at a single point?", "back": "The difference in electrical pressure between two points — energy per unit charge. Symbol V, unit the volt. It is a difference, so it only exists between two points; 'the voltage here' means 'relative to ground'." },
  { "id": "m1-resistance", "front": "What is resistance, and what is its unit?", "back": "How much something opposes current. Symbol R, unit the ohm (Ω). A resistor is a part made to have a reliable resistance, in order to limit current." },
  { "id": "m1-ohms-law", "front": "State Ohm's law in words and symbols.", "back": "Current equals voltage divided by resistance: I = V / R. More push means more current; more resistance means less current." },
  { "id": "m1-ground", "front": "What is ground?", "back": "The point in a circuit we choose to call 0 V, and measure every other voltage relative to. Usually the negative terminal of the supply." },
  { "id": "m1-milli", "front": "Convert 20 mA to amps, and 2.2 kΩ to ohms.", "back": "20 mA = 0.020 A (decimal point three places left). 2.2 kΩ = 2200 Ω (three places right)." },
  { "id": "m1-conventional", "front": "Which way is conventional current drawn, and which way do electrons actually move?", "back": "Conventional current is drawn from + to −. Electrons move from − to +. The convention predates the discovery of the electron; always use conventional current." },
  { "id": "m1-loop", "front": "What is the minimum requirement for any current to flow?", "back": "A complete loop — a path from the source, through the circuit, and back to the source. No loop, no current, no matter how much voltage there is." },
  { "id": "m1-drift", "front": "Roughly how fast do electrons drift in a wire, and what moves fast instead?", "back": "About 0.07 mm per second for 1 A in 1 mm² copper — slower than a snail. The push (the electric field) travels at a large fraction of the speed of light, which is why things respond instantly." },
  { "id": "m1-analogy", "front": "Give the single biggest way the water analogy fails.", "back": "Water can pour out of an open pipe; charge cannot flow out of an open wire. Electricity needs a closed loop." },
  { "id": "m1-sanity", "front": "What is the sanity check for a current you just calculated?", "back": "Compare it to known scales: indicator LED 2–20 mA, ESP32 awake 40–100 mA, USB port limit 500 mA. An answer in amps where you expected milliamps usually means a prefix slip." }
]
```

## Where this goes next

Module 2 takes resistance seriously: why resistors get warm, what power and energy are, and why
a resistor has a wattage printed in its datasheet. Module 4 drills Ohm's law until rearranging
it is automatic. Module 6 puts a real multimeter in your hand.

## Further reading (optional)

- **Book:** *Practical Electronics for Inventors* by Scherz & Monk — dense but genuinely
  explains mechanisms rather than recipes.
- **Book:** *The Art of Electronics* by Horowitz & Hill — the reference every engineer owns.
  Too advanced for now; worth knowing it exists.
- **Video:** AlphaPhoenix on YouTube, "How electricity actually travels" — an experimental look
  at why the push, not the electrons, is what moves fast.
- **Video:** EEVblog's multimeter tutorials, for when you reach module 6.

## Sources

- Elementary charge (1 C ≈ 6.24 × 10¹⁸ electrons) — SI definition of the ampere and the
  elementary charge, BIPM/NIST: <https://physics.nist.gov/cgi-bin/cuu/Value?e>
- Electron drift velocity, ~0.07 mm/s for 1 A in 1 mm² copper, using copper's free-electron
  density of 8.5 × 10²⁸ m⁻³ — worked the standard way as $v = I / (n e A)$:
  <https://www.omnicalculator.com/physics/drift-velocity>
- USB 2.0 port current limit of 500 mA — USB 2.0 specification, chapter 7 (power distribution):
  <https://www.usb.org/documents>

Current figures for the ESP32 in the table in section 2 are deliberately given as broad ranges,
because they depend heavily on the variant, the board and what the radio is doing. Exact,
datasheet-verified numbers come in modules 26 and 30. See `docs/open-questions.md`.
