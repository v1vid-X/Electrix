---
title: Resistance, power and energy
module: 2
summary: Why things get warm, what a watt actually is, and why every resistor has a number on it that is not its resistance.
minutes: 100
prereqs: 1
needsParts: false
unlocks: resistor
---

Four sections of about 25 minutes. Module 1 gave you voltage, current and a first look at
resistance. This one takes resistance seriously and adds the two ideas that decide whether a
part survives: **power** and **energy**.

## Section 1 — What resistance actually is

### Why this exists

In module 1 you learned that resistance opposes current, and that $I = V/R$. That is enough
to calculate with, but not enough to understand *why* a resistor gets warm, why it has a
wattage, or why a thin wire is more resistant than a thick one. All three come from the same
picture.

### The picture

Go back to the crowded corridor from module 1. The electrons are already there, and the push
(voltage) makes them shuffle along.

But the corridor is not empty space. It is full of atoms, vibrating in place. As an electron
drifts along, it bumps into them. Each bump slows the electron down and gives a little kick of
energy to the atom it hit. The atom vibrates harder.

**Atoms vibrating harder is exactly what heat is.**

So:

> **Resistance is how much a material obstructs drifting charge. The energy lost to that
> obstruction becomes heat. Always. Without exception.**

That last point is worth sitting with. A resistor does not "use up" current — the same current
comes out as went in. What it uses up is *energy*, and it turns all of it into heat.

:::note{type=intuition title="Four things change a wire's resistance"}
- **Material.** Copper obstructs less than steel; steel less than carbon. This is why wires
  are copper and heating elements are not.
- **Length.** A longer corridor means more bumps. Double the length, double the resistance.
- **Thickness.** A wider corridor means more routes through. Double the cross-section area,
  halve the resistance.
- **Temperature.** Hotter atoms vibrate more, so metals get *more* resistant when hot. This
  is why a light bulb's resistance when cold is far below its resistance when lit.

You will not need to calculate any of these for a long time. But they explain things you will
meet: why thin wires overheat, why long runs lose voltage, and why a resistor's value drifts
slightly as it warms up.
:::

:::note{type=mistake title="Resistance is not friction, and current is not used up"}
Friction is a surface rubbing on a surface. Resistance is charge carriers colliding with
vibrating atoms throughout the whole material. The maths looks similar, the mechanism does not.

And the current leaving a resistor is exactly the current that entered it. If you measure 10 mA
going in and 10 mA coming out, nothing is wrong — that is how it must be. Energy is what gets
spent, not charge.
:::

:::check
1. What physically happens inside a resistor when current flows?
2. If you double the length of a wire, what happens to its resistance?
3. Is the current leaving a resistor smaller than the current entering it?

*(Answers: drifting electrons collide with vibrating atoms, giving them energy, which is heat;
it doubles; no — it is identical. Energy is spent, charge is not.)*
:::

## Section 2 — Power: how fast energy is spent

### Why this exists

You can calculate the current through a resistor. That still does not tell you whether the
resistor will survive. A 220 Ω resistor is fine on 5 V and destroys itself on 50 V, and the
number that decides which is **power**.

### The definitions

**Energy** is the capacity to do something — to heat a thing, to move a thing, to light a
thing. Its unit is the **joule (J)**.

**Power** is how *fast* energy is being spent. Its unit is the **watt (W)**.

> **1 watt = 1 joule per second.**

That is the whole relationship. A 10 W part turns 10 joules into heat every second it runs.

:::note{type=intuition title="Water again, and where it breaks"}
Energy is the total amount of water that came out of the tap. Power is how fast it is coming
out right now.

You can have a slow trickle for an hour (low power, lots of energy) or a blast for a second
(high power, little energy).

**Where the picture breaks:** with water, you can see the amount that has come out. With
electricity there is no pile of used-up energy to look at — it has become heat and spread
into the air. That is also why you can only *feel* the power, never the energy: your finger
senses how fast heat is arriving.
:::

### The power law

For any component, at any instant:

$$ P = V \times I $$

**In words: power equals the voltage across the part, times the current through it.**

Why does that make sense? From module 1, voltage is energy *per unit of charge*, and current
is charge *per second*. Multiply them and the charge cancels:

$$ \frac{\text{joules}}{\text{coulomb}} \times \frac{\text{coulombs}}{\text{second}} = \frac{\text{joules}}{\text{second}} = \text{watts} $$

Units cancelling like that is a good habit to check. If they do not cancel to what you expect,
you have used the wrong equation.

:::note{type=math title="Two more versions of the same law"}
You often know the resistance rather than both V and I. Substitute Ohm's law into the power
law and you get two shortcuts.

**Starting from $P = V \times I$ and $V = I \times R$:**

$$ P = (I \times R) \times I = I^2 R $$

**Starting from $P = V \times I$ and $I = V / R$:**

$$ P = V \times \frac{V}{R} = \frac{V^2}{R} $$

$I^2$ just means $I \times I$. So all three of these are the same statement:

$$ P = V I \qquad P = I^2 R \qquad P = \frac{V^2}{R} $$

Use whichever one matches the two numbers you already have. The $I^2$ one matters most in
practice, because it says **doubling the current quadruples the heat**.
:::

### Worked example, every step

> **A 220 Ω resistor has 5 V across it. How much power does it turn into heat?**

**Step 1 — knowns, with units.**

$$ V = 5\ \text{V} \qquad R = 220\ \Omega \qquad P = ? $$

**Step 2 — pick the version that uses what you have.** We have V and R, so:

$$ P = \frac{V^2}{R} $$

**Step 3 — substitute.**

$$ P = \frac{5^2}{220} = \frac{25}{220} $$

**Step 4 — arithmetic.** $25 \div 220 = 0.1136...$

$$ P = 0.114\ \text{W} $$

**Step 5 — sensible units.** 0.114 W is 114 milliwatts:

$$ P = 114\ \text{mW} $$

**Step 6 — sanity check.** A standard resistor is rated at 0.25 W. We are at 0.114 W, which is
under half of that. Fine. It will be noticeably warm to the touch and perfectly happy.

### The same resistor, four times the voltage

> **Now put 20 V across that same 220 Ω resistor.**

$$ P = \frac{20^2}{220} = \frac{400}{220} = 1.82\ \text{W} $$

Four times the voltage gave **sixteen times** the power. That is the $V^2$ doing its work, and
it is why power problems appear suddenly rather than gradually. 1.82 W in a part rated for
0.25 W: it will scorch, smell, and fail.

::widget{id=ohms-law}

Drag the sliders and watch the power figure, not just the current. Halve the resistance and
the current doubles — but the power *quadruples*.

:::check
1. What is a watt, in words?
2. Which equation would you use if you know current and resistance?
3. If the current through a resistor doubles, what happens to the heat it makes?

*(Answers: one joule of energy per second; $P = I^2R$; it goes up four times, because the
current is squared.)*
:::

## Section 3 — Why a resistor has a wattage

### The problem

A resistor has to get rid of the heat it makes, by passing it to the air. A bigger body has
more surface and can shed heat faster. So the limit is not really about electricity at all —
it is about how big the part is.

**Power rating** is the amount of power a part can turn into heat continuously without
damaging itself. It is a property of the *package*, not of the resistance.

### What you will actually own

| Rating | Body size | Where you meet it |
|---|---|---|
| 1/8 W (0.125 W) | tiny | surface-mount, cheap kits |
| **1/4 W (0.25 W)** | about 6 mm long | **the default, and what your assortment will be** |
| 1/2 W (0.5 W) | about 9 mm | when a quarter watt is marginal |
| 1 W and up | chunky, often ceramic | power supplies, current sensing |

Two 1/4 W resistors of different resistance are the same physical size. The rating is on the
body size, not the value.

:::note{type=warning title="Derate everything"}
The rating is the point of damage, not the design target. Engineers design to **half** the
rating, so a 1/4 W part is used up to about 0.125 W. Headroom costs almost nothing — resistors
are a cent each — and it means the part runs cool, drifts less, and lasts.

The Lab follows this: it warns you above the rating, and destroys the part above twice it.
:::

### Working backwards: what can this resistor take?

> **How much voltage can a 1/4 W, 220 Ω resistor stand?**

Rearrange $P = V^2 / R$ for V. Multiply both sides by R:

$$ P \times R = V^2 $$

Then take the square root of both sides:

$$ V = \sqrt{P \times R} $$

:::note{type=math title="Square roots"}
$\sqrt{x}$ asks: what number, multiplied by itself, gives $x$? $\sqrt{9} = 3$ because
$3 \times 3 = 9$. $\sqrt{55} \approx 7.4$ because $7.4 \times 7.4 \approx 55$.

You will not do these by hand — every phone and calculator has a √ button. You just need to
know what it is asking.
:::

Substituting:

$$ V = \sqrt{0.25 \times 220} = \sqrt{55} = 7.4\ \text{V} $$

So that resistor copes with 7.4 V across it at the absolute limit, and about 5.2 V if you
derate to half. Which tells you something useful: at 5 V you are already near the sensible
limit for a 220 Ω part, and this is exactly why low-value resistors on higher voltages need
bigger packages.

### Energy, and why your electricity bill is in kWh

Power is per second. Energy is power multiplied by time:

$$ E = P \times t $$

With P in watts and t in seconds, E comes out in joules. One joule is tiny, so for anything
real we use the **watt-hour**: one watt, for one hour. A **kilowatt-hour (kWh)** is 1000 of
those, and it is the unit on your energy bill — in the Netherlands, around €0.30 each.

This matters for you later: module 17 works out how long a battery lasts, and that is pure
energy arithmetic. An ESP32 drawing 80 mA at 3.3 V is using:

$$ P = 3.3 \times 0.08 = 0.264\ \text{W} $$

Run it for a year and that is about 2.3 kWh — roughly 70 cents. Electronics is cheap to run;
it is the batteries that are annoying.

:::check
1. What does a resistor's power rating actually depend on?
2. Why design to half the rating?
3. A part uses 0.5 W for 2 hours. How many watt-hours is that?

*(Answers: the physical size of its body, because that sets how fast it can shed heat; headroom
is nearly free and the part runs cooler and drifts less; 1 Wh.)*
:::

## Section 4 — Feeling it, and checking it

### What "warm" tells you

You can learn a lot with a fingertip, carefully.

| Power in a 1/4 W resistor | What you feel |
|---|---|
| under 0.05 W | nothing at all |
| around 0.1 W | slightly warm |
| around 0.25 W | too hot to hold for long |
| above 0.5 W | smells, discolours, then fails |

:::note{type=safety title="How to touch a circuit safely"}
Everything you build runs from USB or a small battery, so there is no shock risk. The risk is
a **burn**. Touch briefly, with the back of a fingertip, and only after the circuit has been
running a few seconds — a part that is going to get hot gets hot quickly.

Never touch a part while adjusting a supply upward. And a resistor that has already scorched
can stay hot long after you disconnect it.
:::

### Build it in the Lab

::lab{preset=ohms-law goal="Put a resistor straight across the 9 V battery and find the value where it starts to overheat. Work out the wattage first, then check your prediction."}

:::note{type=build title="What to try, in order"}
1. Place a **1 kΩ** resistor and wire it across the 9 V battery.
2. Before you look at the panel, work it out: $P = V^2/R = 81/1000 = 0.081$ W. Comfortably
   under a quarter watt. Check the panel agrees.
3. Swap it for **220 Ω**. Predict first: $81/220 = 0.37$ W. Over the rating — the Lab will
   warn you.
4. Swap it for **47 Ω**: $81/47 = 1.7$ W. Nearly seven times the rating. It dies, and the
   message shows the arithmetic.
5. Now go the other way. What is the smallest resistor you can safely put across 9 V? Solve
   $R = V^2 / P$ with P = 0.125 W (half the rating): $81 / 0.125 = 648\ \Omega$. So 680 Ω is
   the sensible floor. Try 680 Ω and check it is comfortable.
:::

### What you would measure if it did not work

The habit from module 1, applied to a heat problem. A part is getting hot and you do not know
why:

1. **Measure the voltage across the hot part.** Higher than you expected means something
   upstream is not dropping what you thought.
2. **Measure the current through the branch.** Higher than expected means a lower resistance
   somewhere — often a wrong resistor value, or two resistors accidentally in parallel.
3. **Multiply them.** That is the real power. Compare it with the part's rating.
4. **Check you have the resistor you think you have.** Colour bands are easy to misread, and
   220 Ω and 22 Ω look very similar if you miss a band. Module 8 covers reading them; a
   multimeter on the ohms setting settles it in two seconds.

:::check
1. A resistor is too hot to touch. What two things do you measure, and what do you do with them?
2. Why is a mis-read colour band a common cause of overheating?

*(Answers: the voltage across it and the current through it, then multiply to get the power
and compare with the rating; one band wrong can mean ten times less resistance, which is ten
times the current and a hundred times the heat.)*
:::

## Common mistakes

:::note{type=mistake title="Thinking a bigger resistor means a bigger wattage"}
The resistance value and the power rating are unrelated. A 1 MΩ 1/4 W and a 10 Ω 1/4 W are the
same size and the same rating. The value is printed in bands; the rating is implied by the
body size.
:::

:::note{type=mistake title="Forgetting that power goes up with the square"}
Doubling the voltage across a fixed resistor does not double the heat — it quadruples it.
Nearly every "it was fine yesterday" overheating story is this.
:::

:::note{type=mistake title="Using the supply voltage in the power equation"}
$P = V^2/R$ needs the voltage **across that resistor**, not the supply voltage. In a circuit
with several parts, they are different numbers. Module 5 makes this precise.
:::

:::note{type=mistake title="Thinking the resistor consumes the current"}
Same current in and out, always. It consumes energy, not charge.
:::

## Quiz

```quiz
[
  {
    "type": "mc",
    "q": "What physically happens inside a resistor when current flows through it?",
    "options": [
      { "text": "Drifting electrons collide with vibrating atoms, giving them energy, which is heat", "correct": true },
      { "text": "Some of the current is absorbed and does not come out the other side", "why": "The current leaving is exactly the current entering — always. Charge is conserved. What the resistor spends is energy, not charge." },
      { "text": "The electrons slow down and stay slow, storing the lost energy", "why": "Nothing is stored. The energy leaves immediately as heat, which is why a resistor's temperature settles rather than climbing forever." },
      { "text": "The voltage is destroyed inside the material", "why": "Voltage is not a substance that can be destroyed. There is a voltage difference across the resistor because energy is being spent pushing charge through it." }
    ],
    "explain": "Resistance is collisions. Collisions transfer energy to the atoms, and atoms vibrating harder is what heat is."
  },
  {
    "type": "num",
    "q": "A 330 Ω resistor has 3.3 V across it. How much power does it turn into heat, in milliwatts?",
    "answer": 33,
    "unit": "mW",
    "tolerance": 0.04,
    "unitHint": "In watts the answer is 0.033. The question asks for milliwatts, so multiply by 1000.",
    "explain": "P = V² / R = 3.3² / 330 = 10.89 / 330 = 0.033 W = 33 mW. Comfortably inside a quarter-watt part."
  },
  {
    "type": "mc",
    "q": "You double the voltage across a fixed resistor. What happens to the heat it produces?",
    "options": [
      { "text": "It goes up four times", "correct": true },
      { "text": "It doubles", "why": "The current doubles, and the voltage doubles. Power is their product, so it goes up by a factor of two times two." },
      { "text": "It stays the same, because the resistance has not changed", "why": "The resistance sets the relationship between voltage and current, but the power depends on both of those, and both have changed." },
      { "text": "It goes up eight times", "why": "That would be the cube. Power depends on the square of the voltage: P = V² / R." }
    ],
    "explain": "P = V²/R, so power follows the square of the voltage. Double the voltage, quadruple the heat."
  },
  {
    "type": "num",
    "q": "What is the largest voltage you should put across a 1 kΩ quarter-watt resistor, if you derate to half its rating (0.125 W)? Answer in volts.",
    "answer": 11.2,
    "unit": "V",
    "tolerance": 0.05,
    "unitHint": "Rearrange P = V²/R to V = √(P × R), and use 0.125 W, not 0.25 W.",
    "explain": "V = √(P × R) = √(0.125 × 1000) = √125 = 11.2 V. At the full 0.25 W rating it would be 15.8 V, but designing to half keeps it cool."
  },
  {
    "type": "mc",
    "q": "What does a resistor's power rating depend on?",
    "options": [
      { "text": "The physical size of its body, which sets how fast it can shed heat", "correct": true },
      { "text": "Its resistance in ohms", "why": "Unrelated. A 10 Ω and a 1 MΩ resistor of the same package are both quarter-watt parts and the same physical size." },
      { "text": "The voltage it is designed for", "why": "There is a maximum voltage in the datasheet, but it is derived from the power rating and the resistance, not the other way round." },
      { "text": "The colour of its body", "why": "Body colour hints at the type — beige for carbon film, blue for metal film — but it does not tell you the wattage. Size does." }
    ],
    "explain": "Power rating is about getting rid of heat, so it is about surface area. Bigger body, bigger rating."
  },
  {
    "type": "mc",
    "q": "A circuit works fine, but one resistor is too hot to touch. What is the right first move?",
    "options": [
      { "text": "Measure the voltage across it and the current through it, multiply, and compare with its rating", "correct": true },
      { "text": "Replace it with a higher-value resistor", "why": "That might fix the symptom but you do not yet know what is wrong. If the cause is a wiring error, a bigger resistor just hides it." },
      { "text": "Replace it with a higher-wattage resistor of the same value", "why": "Sometimes that is the right answer — but only once you know the power is genuinely needed by the design, rather than being the result of a fault." },
      { "text": "Lower the supply voltage until it cools down", "why": "It cools because everything else is now wrong too. Measure first, then decide." }
    ],
    "explain": "Measure, then decide. Voltage times current is the actual power, and comparing it with the rating tells you whether the part or the design is at fault."
  }
]
```

## Flashcards

```flashcards
[
  { "id": "m2-resistance", "front": "What is resistance, physically?", "back": "How much a material obstructs drifting charge. Electrons collide with vibrating atoms, transferring energy to them — and atoms vibrating harder is heat." },
  { "id": "m2-four-factors", "front": "Four things that change a wire's resistance?", "back": "Material, length (longer = more), cross-sectional area (thicker = less), and temperature (metals get more resistant when hot)." },
  { "id": "m2-power-def", "front": "What is a watt?", "back": "One joule of energy per second. Power is the rate at which energy is spent; energy is the total amount." },
  { "id": "m2-power-law", "front": "State the power law in its three forms.", "back": "P = V × I, P = I²R, P = V²/R. All the same statement; pick the one matching the two values you already know." },
  { "id": "m2-square", "front": "You double the current through a resistor. What happens to the heat?", "back": "It goes up four times. P = I²R, so power follows the square of the current." },
  { "id": "m2-rating", "front": "What does a resistor's power rating depend on?", "back": "The physical size of its body, which sets how fast it sheds heat to the air. Not its resistance — a 10 Ω and a 1 MΩ quarter-watt part are the same size." },
  { "id": "m2-derate", "front": "What is derating, and what is the usual figure?", "back": "Designing to well under the rating so the part runs cool. Usually half: a 0.25 W resistor is used up to about 0.125 W. Headroom costs almost nothing." },
  { "id": "m2-max-voltage", "front": "How do you find the maximum voltage for a resistor from its power rating?", "back": "Rearrange P = V²/R to V = √(P × R). For 0.125 W in 1 kΩ: √125 = 11.2 V." },
  { "id": "m2-current-conserved", "front": "Is the current leaving a resistor less than the current entering it?", "back": "No — it is identical. Charge is conserved. What the resistor spends is energy, which leaves as heat." },
  { "id": "m2-energy", "front": "How do you get energy from power, and what unit does a bill use?", "back": "E = P × t. Bills use kilowatt-hours: 1000 watts for one hour, about €0.30 in the Netherlands." },
  { "id": "m2-feel", "front": "Roughly how much power in a quarter-watt resistor is 'too hot to hold'?", "back": "Around 0.25 W. Under 0.05 W you feel nothing; around 0.1 W it is slightly warm; above 0.5 W it smells and fails." }
]
```

## Where this goes next

Module 3 builds the circuit itself: closed loops, short circuits, what ground really means, and
how to read a schematic. Module 4 drills Ohm's law and the power law until rearranging them is
automatic. Module 8 covers reading real resistors — colour codes, tolerance and the odd
standard values.

## Sources

Everything in this module is standard physics and standard component practice rather than a
product specification, so there are no datasheet figures to verify. The two numbers worth
naming a source for:

- Typical through-hole resistor power ratings (1/8 W, 1/4 W, 1/2 W, 1 W) and their body sizes:
  manufacturer series data, e.g. Vishay CCF/MRS and Yageo MF series datasheets.
- Dutch household electricity price of roughly €0.30 per kWh: varies by contract and year;
  treated as an order-of-magnitude figure only.
