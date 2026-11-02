---
title: First code — blink an LED
module: 21
summary: Write your first program, line by line, and make a real pin switch a real LED on and off. Then read a button and make the LED obey it.
minutes: 110
prereqs: 20
needsParts: false
unlocks: esp32-devkit
---

:::note{type=warning title="You are jumping ahead"}
This normally comes after twenty other modules. You asked to reach the ESP32 early, so it is
written now. It assumes module 1 (voltage, current, resistance, Ohm's law) and module 20
(what a microcontroller is) — both written — and it borrows from modules not yet written:
resistors in practice (8), LEDs (12) and logic levels (18). Where it does, it explains
enough inline and points at the module that will cover it properly.

**You do not need to own anything for this module.** Everything here runs in the Lab.
Section 5 tells you what to buy when you want to do it for real.
:::

## Section 1 — The circuit before the code

### Why this exists

You are about to write a program whose entire job is to put 3.3 V on a pin and then take it
away again. If you do not know what that pin is connected to, the program is meaningless. So:
circuit first, code second. Always, for the rest of your life in electronics.

### What we are building

Three things in a line:

1. **GPIO13** on the ESP32 — a pin your code can switch between 3.3 V and 0 V.
2. A **220 Ω resistor** — to limit the current.
3. A **red LED** — which lights up when current flows through it the right way.

Then back to **GND** on the board, which is 0 V, to complete the loop. Remember from module 1:
no complete loop, no current, no light.

### Why the resistor has to be there

An LED is not like a resistor. A resistor obeys Ohm's law: double the voltage, double the
current. An LED does not. Once it is conducting at all, an LED holds its voltage at roughly a
fixed value — about **2 V for a red one** — and then takes whatever current the rest of the
circuit allows. It has essentially no opinion about limiting itself.

So if you connect an LED straight across a supply, the only thing deciding the current is the
resistance of the wires, which is nearly zero. The current goes as high as the supply can
manage, and the LED dies. Module 12 goes into the physics; for now, the rule:

> **An LED always needs something in series to limit the current. Usually a resistor.**

### Working out the resistor value

This is module 1's arithmetic with one extra step.

**Step 1 — what do we know?**

$$ V_{\text{pin}} = 3.3\ \text{V} \qquad V_{\text{LED}} \approx 2\ \text{V} \qquad I_{\text{target}} = 6\ \text{mA} = 0.006\ \text{A} $$

6 mA is a comfortable brightness for an indicator. The LED is rated for 20 mA, but you rarely
need that much, and staying low keeps the pin well inside its limits.

**Step 2 — how much voltage is left for the resistor?**

The LED takes its ~2 V off the top. Whatever remains has to be dropped across the resistor,
because the voltages around a loop have to add up (that is Kirchhoff's voltage law, module 5):

$$ V_{\text{resistor}} = V_{\text{pin}} - V_{\text{LED}} = 3.3 - 2 = 1.3\ \text{V} $$

**Step 3 — Ohm's law, rearranged for resistance.**

From module 1, $I = V/R$. Multiply both sides by $R$, then divide both sides by $I$:

$$ R = \frac{V}{I} = \frac{1.3\ \text{V}}{0.006\ \text{A}} $$

**Step 4 — the arithmetic.** Dividing by 0.006 is the same as multiplying by 166.67:

$$ R = 1.3 \times 166.67 \approx 217\ \Omega $$

**Step 5 — pick a resistor you can actually buy.** 217 Ω does not exist as a standard value.
The nearest common one is **220 Ω**, which gives:

$$ I = \frac{1.3}{220} = 0.0059\ \text{A} = 5.9\ \text{mA} $$

Near enough. Module 8 explains why resistors only come in those odd-looking values.

**Step 6 — sanity check.** 5.9 mA: comfortably below the LED's 20 mA rating, and comfortably
below the pin's ~40 mA limit from module 20. Both boxes ticked.

:::note{type=intuition title="Why the real answer will be slightly lower"}
When you run this in the Lab it will say about **5.9 mA**, not 5.9 — it will say something
nearer 6.6 mA with the exact LED model, or slightly less than your hand calculation in other
setups. Two reasons, both honest:

- A real LED's forward voltage is not exactly 2.0 V. It shifts with current — at 6 mA a red
  LED sits lower, around 1.7–1.9 V, which leaves *more* for the resistor and so gives a bit
  more current than you predicted.
- The pin itself has that ~16.5 Ω of internal resistance from module 20, which takes a few
  tens of millivolts back.

Your hand calculation is not wrong. It is a first-order estimate, and first-order estimates
are what engineers actually use to choose a resistor. The simulator just has more decimal
places than your head does.
:::

:::check
1. Why can you not connect an LED straight to a pin without a resistor?
2. If the pin gives 3.3 V and the LED takes 2 V, how much is left for the resistor?
3. What current does 1.3 V across 220 Ω give?

*(Answers: an LED does not limit its own current, so it takes everything available and
destroys itself; 1.3 V; 1.3 ÷ 220 = 0.0059 A = 5.9 mA.)*
:::

## Section 2 — The program, line by line

Here is the whole thing. Then every line, explained.

```cpp
// Blink an LED on GPIO13.

#define LED 13

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(500);
  digitalWrite(LED, LOW);
  delay(500);
}
```

#### `// Blink an LED on GPIO13.`

A **comment**. Everything after `//` to the end of the line is ignored by the computer
entirely. It exists for humans. Write them.

#### `#define LED 13`

This says: *wherever you see the word `LED` below, read `13` instead*. It is a find-and-replace
that happens before anything runs.

Why bother? Because `digitalWrite(LED, HIGH)` tells a reader what is happening and
`digitalWrite(13, HIGH)` does not. And if you later move the LED to a different pin, you change
one line instead of hunting through the file.

**Note the missing semicolon.** Almost every line in C++ ends in `;`. Lines starting with `#`
are the exception — they are instructions to the compiler, not to the program.

#### `void setup() {`

Declares a **function** named `setup`, which is a named block of instructions.

- `void` means "this function hands nothing back when it is done".
- `()` is where inputs would go. Empty: it takes none.
- `{` opens the block. The matching `}` closes it. Everything between them is the function.

As module 20 said, the name `setup` is special: the board runs it once, automatically, at
power-up. You never call it yourself.

#### `pinMode(LED, OUTPUT);`

`pinMode` is a built-in function that configures a pin. Two inputs, separated by a comma:

- `LED` — which pin. Thanks to the `#define`, this is 13.
- `OUTPUT` — what it is for. The pin will now *drive* a voltage rather than sense one.

Until a pin is set to OUTPUT it is not driving anything, so `digitalWrite` on it does nothing
useful. This is the single most common reason a beginner's LED stays dark.

#### `void loop() {`

The other special name. Runs over and over, forever, immediately restarting each time it
finishes.

#### `digitalWrite(LED, HIGH);`

Put a voltage on the pin. `HIGH` means the pin's full 3.3 V, `LOW` means 0 V. Those two words
are the only values `digitalWrite` accepts — this is a *digital* output, fully on or fully
off, nothing in between. (Getting an in-between brightness is PWM, module 11.)

Current now flows: pin → resistor → LED → GND. The LED lights.

#### `delay(500);`

Stop and do nothing for 500 **milliseconds** — half a second. (1000 ms = 1 second.)

The pin keeps its state during the wait. Nothing resets it. It stays at 3.3 V for the whole
half second, which is why the light is visible.

:::note{type=math title="Milliseconds"}
A millisecond is a thousandth of a second — the same "milli" prefix as the milliamps in
module 1.

- `delay(1000)` = 1 second
- `delay(500)` = half a second
- `delay(100)` = a tenth of a second, which blinks about five times a second
- `delay(10)` = too fast to see as blinking; it just looks dimmer

To go from seconds to milliseconds, multiply by 1000 — move the decimal point three places
right. 0.25 seconds → 250 ms.
:::

#### `digitalWrite(LED, LOW);` and `delay(500);`

0 V on the pin, so no current flows and the LED goes dark. Wait another half second. Then
`loop()` ends, is immediately called again, and the whole thing repeats forever.

**One complete cycle:** 500 ms on + 500 ms off = 1000 ms = one blink per second.

:::check
1. What does `#define LED 13` actually do?
2. What happens if you forget `pinMode(LED, OUTPUT)`?
3. How would you make it blink twice a second instead of once?

*(Answers: replaces every later `LED` with `13` before compiling; the pin never becomes an
output, so nothing is driven and the LED stays dark; halve both delays to 250, giving
250 on + 250 off = 500 ms per cycle.)*
:::

## Section 3 — Build it in the Lab

::lab{preset=esp32-blink goal="Press Run. The LED should blink once a second. Then change the delays and watch what happens."}

:::note{type=build title="What to do, in order"}
1. The bench already has the ESP32, a 220 Ω resistor and a red LED wired from **GPIO13**
   through the resistor to the LED and back to **GND**. Orbit around and follow the wires
   with your eyes — red out of GPIO13, yellow between resistor and LED, black back to GND.
2. Press **Run**. The LED blinks once a second.
3. Watch the **What's happening?** panel while it blinks. It shows the real solved numbers:
   the LED's forward voltage, the voltage across the resistor, and the current. Check them
   against your own arithmetic from section 1.
4. Change both `delay(500)` to `delay(100)` and press Run again. Five blinks a second.
5. Change them to `delay(20)`. It stops looking like blinking and starts looking like a dim
   steady light — your eye cannot keep up. That is the doorway to PWM in module 11.
6. Now break it on purpose, one at a time, and watch what the panel says:
   - Delete the `pinMode` line. (The LED never lights, and you get told why.)
   - Change `13` to `7`. (GPIO6–11 are wired to the flash chip inside the module — the Lab
     refuses, because a real board would crash.)
   - Change `13` to `99`. (That pin does not exist on this board.)
:::

:::note{type=warning title="What the Lab is and is not"}
The Lab runs a real circuit solver — the voltages and currents it shows come from actually
solving the circuit, not from a lookup table. The LED model is calibrated to a typical red
5 mm LED's datasheet numbers, and the GPIO model uses the ESP32's published drive figures.

But it is a **simulation of a limited subset**. It does not compile your code the way the
Arduino IDE does, it supports only the handful of functions listed when you make a mistake,
and it cannot know about your specific board, your wiring mistakes, or a dodgy jumper wire.
**A circuit that works in the Lab is not a promise that it works on your desk.** It is a
promise that your *thinking* is right, which is most of the battle.
:::

## Section 4 — Reading a button

Making something happen is half of it. Noticing something is the other half.

### The problem with a bare button

A button is just two pieces of metal that touch when you press. Wire one side to 3.3 V and the
other to an input pin, and you would think: pressed = 3.3 V = `HIGH`, not pressed = `LOW`.

It does not work, and the reason matters.

When the button is **not** pressed, the pin is connected to **nothing at all**. Module 20 said
an INPUT pin drives nothing and just senses — so what is it sensing? Nothing is holding it
anywhere. The tiny amount of electrical noise in the air is enough to push it up and down at
random. This is called a **floating** input, and it reads randomly: `HIGH`, `LOW`, `HIGH`,
`HIGH`, `LOW`, with no pattern.

### The fix: a pull-down resistor

Add a resistor from the pin to GND. Now:

- **Button not pressed:** the pin is connected to GND through the resistor. It reads a solid
  `LOW`. No noise can shift it, because the resistor keeps pulling it down.
- **Button pressed:** the pin is connected directly to 3.3 V. It reads a solid `HIGH`. A little
  current flows through the resistor to GND and is wasted, which is why the resistor is big.

**What value?** Big enough that the wasted current is negligible, small enough to beat the
noise. **10 kΩ** is the standard answer everywhere. The wasted current while pressed:

$$ I = \frac{3.3\ \text{V}}{10\,000\ \Omega} = 0.00033\ \text{A} = 0.33\ \text{mA} $$

A third of a milliamp. Nothing. Module 8 covers pull-ups and pull-downs properly.

:::note{type=mistake title="A floating input is not a rare edge case"}
It is the default state of every unconnected input pin, and it is the cause of a huge share of
"my button works sometimes" problems. If an input is not connected to something that holds it
at a definite level, it is broken — even though nothing looks wrong.

The Lab warns you when a pin you read is sitting between the HIGH and LOW thresholds, which is
exactly what a floating pin does.
:::

### The code

```cpp
// LED on GPIO13 follows a button on GPIO14.

#define LED 13
#define BUTTON 14

void setup() {
  pinMode(LED, OUTPUT);
  pinMode(BUTTON, INPUT);
}

void loop() {
  int pressed = digitalRead(BUTTON);

  if (pressed == HIGH) {
    digitalWrite(LED, HIGH);
  } else {
    digitalWrite(LED, LOW);
  }

  delay(10);
}
```

Three new things:

**`int pressed = digitalRead(BUTTON);`** — `digitalRead` looks at the pin's voltage and gives
back `HIGH` or `LOW`. `int pressed =` makes a **variable** called `pressed` to hold that answer.
`int` means it holds a whole number.

**`if (pressed == HIGH) { ... } else { ... }`** — do the first block if the condition is true,
otherwise the second. Note **`==`**, two equals signs: that *asks whether* two things are equal.
A single `=` *makes* one thing equal another. Mixing them up is the most common beginner typo
in C, and in this case `if (pressed = HIGH)` would silently always be true.

**`delay(10);`** — a short pause so the loop runs a hundred times a second instead of a million.
Nothing needs checking faster than you can press a button, and it leaves the chip free.

### A sharper version

Once that works, this does the same job in one line:

```cpp
void loop() {
  digitalWrite(LED, digitalRead(BUTTON));
  delay(10);
}
```

Read the pin and feed the answer straight into the write. Shorter is not always better — but
when it reads this cleanly, it is.

:::note{type=build title="Try it in the Lab"}
The Lab's part set does not include a push button yet (it arrives with module 3). Until then
you can prove the idea by hand:

1. Open the Lab with the ESP32 and wire a **10 kΩ** resistor from **GPIO14** to **GND** — that
   is your pull-down.
2. Paste the button code and press Run. The LED stays off, because GPIO14 is being held low.
3. Now add a wire from **3V3** to **GPIO14**. That is what pressing the button would do. The
   LED comes on.
4. Remove the 10 kΩ resistor and the 3V3 wire, leaving GPIO14 connected to nothing, and press
   Run. The Lab warns you that the pin is floating — which is the bug this whole section
   exists to prevent.
:::

:::check
1. Why does a button with no pull-down resistor read unreliably?
2. What does the pull-down resistor do when the button is *not* pressed?
3. What is the difference between `=` and `==`?

*(Answers: the pin is connected to nothing and floats, picking up noise; it connects the pin
to GND so it reads a definite LOW; `=` assigns a value, `==` asks whether two values are
equal.)*
:::

## Section 5 — Doing it for real

When you want to leave the simulator:

| What | Roughly | Notes |
|---|---|---|
| ESP32 dev board | €6–12 | Module 26 covers which variant. Buy from Tinytronics or Kiwi Electronics rather than the cheapest AliExpress listing for your first one — a bad board will make you think you are the problem. |
| USB cable | €3–6 | **It must be a data cable.** Charge-only cables look identical and the board simply will not appear on your computer. This wastes more beginner hours than any other single thing. |
| Breadboard | €4–7 | A 400-point one is plenty. |
| Jumper wires | €5 | Male-to-male, assorted. |
| Resistor assortment | €8 | Gets you the 220 Ω and 10 kΩ used here, and everything else for a year. |
| LEDs | €4 | A bag of assorted 5 mm. |
| Push buttons | €4 | The little 4-leg tactile ones. |

About €35 all in. The full staged shopping guide is module 0c.

### What would you measure if it did not work?

The habit from module 1, applied here. LED stays dark, in this order:

1. **Is the board even running?** Add `Serial.begin(115200);` to `setup()` and
   `Serial.println("alive");` to `loop()`, then open the serial monitor. No output means the
   code is not running at all — wrong board selected, wrong port, or a charge-only USB cable.
2. **Measure GND to the LED's short leg** with a multimeter on DC volts. Should be 0 V. If
   not, your ground wire is not connected.
3. **Measure GND to GPIO13** while it should be on. Should be about 3.3 V, alternating with
   0 V. If it is stuck at 0 V, the pin is not an output — check `pinMode`.
4. **Measure across the resistor.** Should be about 1.3 V while lit. 0 V means no current is
   flowing: a break somewhere, or the LED is in backwards.
5. **Turn the LED around.** The commonest fault of all. An LED only conducts one way: long leg
   towards the positive side, short leg (and the flat edge on the plastic rim) towards ground.
6. **Check the breadboard row.** Five holes in a half-row are connected; the centre channel
   separates the two halves. A leg one row off looks identical and does nothing. Module 1's
   Lab section covers this.

Module 6 teaches the multimeter properly.

## Common mistakes

:::note{type=mistake title="No resistor, because it worked once"}
An LED straight on a GPIO pin often *does* light up, because the pin's own ~16.5 Ω internal
resistance limits the current to around 50 mA. But that is well over the pin's 40 mA rating
and over the LED's 20 mA rating. It works, then one day that pin stops working forever. The
Lab warns you about exactly this.
:::

:::note{type=mistake title="Forgetting pinMode"}
The pin never becomes an output, `digitalWrite` does nothing visible, and nothing complains.
:::

:::note{type=mistake title="LED in backwards"}
It conducts one way only. Long leg to positive, short leg (flat side) to ground. It will not
be damaged — it just will not light, which is more confusing.
:::

:::note{type=mistake title="Using = where you meant =="}
`if (x = HIGH)` assigns and is always true. `if (x == HIGH)` compares. The compiler usually
allows the first one without complaint.
:::

:::note{type=mistake title="Using GPIO6 to GPIO11"}
Those are wired to the flash chip inside the ESP32 module, where your program lives. Using
them crashes the board. Stick to the pins in the Lab's list.
:::

:::note{type=mistake title="A charge-only USB cable"}
It powers the board perfectly, its light comes on, and your computer never sees it. If the
port does not appear, try another cable before you try anything else.
:::

## Quiz

```quiz
[
  {
    "type": "mc",
    "q": "Why does an LED need a resistor in series with it?",
    "options": [
      { "text": "An LED does not limit its own current, so without one it takes as much as the supply can give", "correct": true },
      { "text": "The resistor makes the LED brighter", "why": "It does the opposite — the resistor reduces the current, and less current is less light. Its job is protection, not brightness." },
      { "text": "The resistor converts the voltage down to the LED's 2 V", "why": "Close, but backwards. The LED holds its own roughly 2 V by itself; the resistor's job is to decide the current, using whatever voltage is left over." },
      { "text": "Because the ESP32 outputs 5 V and the LED needs 3.3 V", "why": "An ESP32 GPIO pin outputs 3.3 V, not 5 V. And an LED does not need 3.3 V — it holds about 2 V of its own accord." }
    ],
    "explain": "The resistor sets the current. The LED sets its own voltage and would otherwise draw whatever it could."
  },
  {
    "type": "num",
    "q": "A 3.3 V pin drives a red LED (about 2 V) through a resistor, and you want 6 mA. What resistor value do you need, in ohms?",
    "answer": 217,
    "unit": "Ω",
    "tolerance": 0.06,
    "unitHint": "Convert 6 mA to amps first: 0.006 A. Dividing by 6 instead of 0.006 is out by a thousand.",
    "explain": "The resistor gets 3.3 − 2 = 1.3 V, and R = V / I = 1.3 / 0.006 = 217 Ω. The nearest resistor you can buy is 220 Ω."
  },
  {
    "type": "mc",
    "q": "You upload the blink sketch but delete the pinMode line. What happens?",
    "options": [
      { "text": "The LED stays dark, and nothing reports an error", "correct": true },
      { "text": "The code refuses to compile", "why": "It compiles perfectly — pinMode is not required by the language. That is exactly what makes this bug so common and so confusing." },
      { "text": "The LED blinks twice as fast", "why": "The delays are untouched, so the timing is unaffected. The problem is that the pin was never configured to drive anything." },
      { "text": "The board resets repeatedly", "why": "Nothing crashes. The pin simply remains an input, quietly doing nothing." }
    ],
    "explain": "Without pinMode(..., OUTPUT) the pin never becomes an output, so digitalWrite has nothing to drive. Silent failure."
  },
  {
    "type": "mc",
    "q": "A button is wired from 3.3 V to GPIO14, with nothing else connected. What does digitalRead(14) return when the button is not pressed?",
    "options": [
      { "text": "Unpredictable — the pin is floating and picks up noise", "correct": true },
      { "text": "Always LOW", "why": "There is nothing holding it low. An input pin drives nothing, so with no connection it is not pulled anywhere — it drifts with whatever noise is around." },
      { "text": "Always HIGH", "why": "Nothing is holding it high either. The button is open, so the pin is connected to nothing at all." },
      { "text": "It returns an error", "why": "digitalRead always returns HIGH or LOW. It has no way to tell you the reading is meaningless — which is why floating inputs are such a nasty bug." }
    ],
    "explain": "This is why you add a pull-down resistor: it gives the pin a definite level when the button is open."
  },
  {
    "type": "num",
    "q": "A 10 kΩ pull-down resistor is connected from a pin to GND, and the button connects that pin to 3.3 V. How much current flows through the resistor while the button is held down, in milliamps?",
    "answer": 0.33,
    "unit": "mA",
    "tolerance": 0.06,
    "unitHint": "In amps the answer is 0.00033. The question asks for milliamps, so multiply by 1000.",
    "explain": "I = V / R = 3.3 / 10000 = 0.00033 A = 0.33 mA. Tiny, which is the point of using a large resistor."
  },
  {
    "type": "mc",
    "q": "What is the difference between = and == in this code?",
    "options": [
      { "text": "= assigns a value, == asks whether two values are equal", "correct": true },
      { "text": "They are interchangeable in an if statement", "why": "They are not, and this is the trap: if (x = HIGH) assigns HIGH to x and is then always true, so the condition never fails. The compiler usually allows it without warning." },
      { "text": "== is only for numbers, = is for everything else", "why": "Both work on numbers. The difference is assignment versus comparison, not what type of data they handle." },
      { "text": "= is older C syntax and == is the modern form", "why": "Both are current and both mean different things. Neither replaces the other." }
    ],
    "explain": "A single = puts a value into a variable. A double == compares two values and gives back true or false."
  }
]
```

## Flashcards

```flashcards
[
  { "id": "m21-why-resistor", "front": "Why does an LED need a series resistor?", "back": "An LED holds roughly a fixed voltage (about 2 V for red) and does not limit its own current. Without a resistor it takes everything the supply can give and destroys itself." },
  { "id": "m21-resistor-calc", "front": "How do you choose an LED's series resistor?", "back": "Subtract the LED's forward voltage from the supply to get the resistor's voltage, then R = V / I at your target current. Example: (3.3 − 2) / 0.006 = 217 Ω, so use 220 Ω." },
  { "id": "m21-setup-loop", "front": "What do setup() and loop() do?", "back": "setup() runs once at power-up — pin configuration goes here. loop() runs over and over forever and holds the behaviour." },
  { "id": "m21-pinmode", "front": "What does pinMode(13, OUTPUT) do, and what happens if you forget it?", "back": "It configures GPIO13 to drive a voltage instead of sensing one. Forget it and digitalWrite does nothing visible — a silent failure with no error." },
  { "id": "m21-digitalwrite", "front": "What do HIGH and LOW mean in digitalWrite?", "back": "HIGH puts the pin at 3.3 V, LOW puts it at 0 V. Those are the only two options — it is a digital output, fully on or fully off." },
  { "id": "m21-delay", "front": "What does delay(500) do, and what happens to the pins during it?", "back": "Stops for 500 milliseconds (half a second). Pins keep whatever state they were last set to for the whole wait." },
  { "id": "m21-define", "front": "What does #define LED 13 do?", "back": "Replaces every later occurrence of LED with 13 before compiling. It makes code readable and means a pin change is a one-line edit. No semicolon on #define lines." },
  { "id": "m21-floating", "front": "What is a floating input, and why is it a bug?", "back": "An input pin connected to nothing. It drives nothing and senses nothing definite, so electrical noise makes it read HIGH and LOW at random." },
  { "id": "m21-pulldown", "front": "What does a pull-down resistor do and what value is typical?", "back": "Connects an input pin to GND so it reads a definite LOW when nothing else drives it. 10 kΩ is standard — large enough that the wasted current (0.33 mA at 3.3 V) is negligible." },
  { "id": "m21-equals", "front": "What is the difference between = and == ?", "back": "= assigns a value to a variable. == compares two values. if (x = HIGH) assigns and is always true — a classic silent bug." },
  { "id": "m21-flash-pins", "front": "Which ESP32 GPIO pins must you never use, and why?", "back": "GPIO6 to GPIO11. They are wired to the SPI flash chip inside the module, where your program is stored. Using them crashes the board." },
  { "id": "m21-usb-cable", "front": "The board powers up but the computer cannot see it. First thing to check?", "back": "The USB cable. Charge-only cables look identical to data cables and are a very common cause. Try a different cable before anything else." },
  { "id": "m21-debug-order", "front": "LED will not light. What do you check, in order?", "back": "1) Is the code running at all (Serial print)? 2) Is GND connected? 3) Does the pin actually go to 3.3 V? 4) Is there voltage across the resistor? 5) Is the LED backwards? 6) Are the breadboard rows what you think they are?" }
]
```

## Where this goes next

Module 22 is the ADC: reading a voltage that is not just on or off, so a sensor can tell you a
number instead of a yes or no. Module 11 is PWM: faking an in-between brightness with a pin
that only knows on and off. Module 14 is the transistor, which is what lets a pin control
something far bigger than an LED.

## Further reading (optional)

- The Arduino language reference for `pinMode`, `digitalWrite`, `digitalRead` and `delay`:
  <https://www.arduino.cc/reference/en/>
- Espressif's own getting-started guides, once you have hardware in hand:
  <https://docs.espressif.com/projects/esp-idf/en/stable/esp32/get-started/>
- Andreas Spiess on YouTube, for ESP32-specific material that is unusually careful about
  measuring rather than guessing.

## Sources

- GPIO drive current (IOH about 40 mA, IOL about 28 mA), output levels (VOH minimum
  0.8 × VDD, VOL maximum 0.1 × VDD) and input thresholds (VIH minimum 0.75 × VDD, VIL maximum
  0.25 × VDD): ESP32 series datasheet, DC Characteristics table.
  <https://www.espressif.com/en/support/documents/technical-documents>
- GPIO6–GPIO11 being connected to the SPI flash, and the strapping pins GPIO0, GPIO2, GPIO5,
  GPIO12 and GPIO15: ESP32 datasheet pin definitions, cross-checked against the ESP-IDF GPIO
  documentation.
  <https://github.com/espressif/esp-idf/blob/master/docs/en/api-reference/peripherals/gpio.rst>
- Red LED forward voltage of roughly 2 V at 20 mA: typical figure for a standard 5 mm red LED.
  This is a *typical* value, not one manufacturer's part — real parts vary, which is what a
  datasheet is for (module 32).

**Everything above applies to the classic ESP32** (ESP32-WROOM-32 family). The S2, S3, C3 and
C6 variants differ; module 26 covers which. Figures still to be confirmed directly against
the datasheet are listed in `docs/open-questions.md`.
