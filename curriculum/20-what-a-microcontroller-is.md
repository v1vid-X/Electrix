---
title: What a microcontroller actually is
module: 20
summary: A whole computer on one chip, and the five parts of it you actually need to understand before you write a line of code.
minutes: 70
prereqs: 1
needsParts: false
unlocks: esp32-devkit
---

:::note{type=warning title="You are jumping ahead"}
In the roadmap this module comes after eighteen others. You asked to get to the ESP32 early,
so here it is — but it leans on ideas the earlier modules teach properly:

- **voltage, current, resistance and Ohm's law** (module 1 — read that one first, it is written)
- resistors in practice (module 8), LEDs and why they need a resistor (module 12), and
  binary and logic levels (module 18) are *not* written yet

Where this module needs one of those, it explains just enough inline and says which module
covers it properly. Nothing here will mislead you — it will just be less complete than it
will eventually be.
:::

## Section 1 — The problem a microcontroller solves

### Why this exists

In module 1 you built a circuit where a resistor and an LED did exactly one thing, forever.
Connect it, the LED is on. Disconnect it, the LED is off. The circuit has no opinions.

Now suppose you want the LED to blink. Or to come on only when it gets dark. Or to come on
for exactly 30 seconds after someone presses a button. You could build each of those out of
pure components — people did, for decades, and it took a board full of parts for each one.

Or you could use one chip that you can *tell* what to do, in words, and change your mind
later without touching the wiring. That chip is a **microcontroller**.

### The definition

**Microcontroller.** A complete small computer on a single chip: a processor, memory, and a
set of pins it can control, all in one package. Usually costing a couple of euros.

The thing that makes it a *micro***controller** rather than just a computer is those pins. A
laptop computes things. A microcontroller computes things *and* can switch its pins on and
off, which is how it touches the physical world.

:::note{type=intuition title="A light switch you can write instructions for"}
A normal light switch does what your finger does, instantly, every time.

A microcontroller is a box of light switches — 20 or 30 of them — plus a little notebook of
instructions that it reads over and over, forever, flipping those switches as the
instructions say. "Switch 13 on. Wait half a second. Switch 13 off. Wait half a second.
Start again."

That is genuinely all a blinking LED is. No magic.

**Where the picture breaks down:** a real switch connects two wires together. A
microcontroller pin does not connect anything to anything — it connects the pin to either
3.3 V or 0 V *inside the chip*, through a tiny transistor. That is why it can only supply a
small current, which section 3 gets into, and it is the single most common way beginners
destroy an ESP32.
:::

:::check
1. What one thing makes a microcontroller different from a laptop?
2. Why would you use a microcontroller instead of just wiring components together?

*(Answers: pins it can switch on and off under program control, so it can affect physical
things; because you can change what it does by changing the program instead of rewiring,
and one chip replaces a boardful of parts.)*
:::

## Section 2 — The five parts you need to care about

A datasheet will list forty things inside an ESP32. Five of them matter at the start.

### The processor (CPU)

The part that reads your instructions and does them, one after another, very fast. "Fast"
here means a classic ESP32's processor steps through its instructions at up to **240 million
cycles per second**. A simple instruction takes a cycle or two.

That number is worth holding on to, because it explains something that confuses everyone at
first: when you write

```cpp
digitalWrite(13, HIGH);
digitalWrite(13, LOW);
```

the pin does go high and then low — but it stays high for something like a *few millionths of
a second*. Your eye sees nothing at all. That is why blinking needs `delay()`. The chip is
not slow enough to be visible unless you force it to wait.

### Memory

Two kinds, and mixing them up causes real bugs later:

- **Flash** — where your program is stored. It survives when the power goes off, the same way
  a file on a USB stick does. Your code lives here.
- **RAM** — the scratch paper the program uses while it is running. Wiped the instant power
  is lost.

An ESP32 has far more of both than you will need for a long time.

### GPIO pins

**GPIO** stands for **General Purpose Input/Output**, and the name is the whole idea:

- **General purpose** — not dedicated to one job, you decide what it is for.
- **Input** — the chip *reads* the voltage someone else put on the pin.
- **Output** — the chip *puts* a voltage on the pin itself.

Each pin is one or the other at any moment, and your code says which:

```cpp
pinMode(13, OUTPUT);   // I will be driving this pin
pinMode(14, INPUT);    // I will be reading this pin
```

A pin set to OUTPUT can be put at 3.3 V (`HIGH`) or at 0 V (`LOW`). A pin set to INPUT does
not drive anything at all — it sits there with very high resistance, effectively
disconnected, just sensing.

### The clock

A crystal on the board vibrating at a precise rate, which the chip uses to keep time and to
pace the processor. It is why `delay(500)` is actually half a second and not roughly half a
second. You will not think about it again until module 26.

### Peripherals

Blocks of dedicated hardware next to the processor that do one job without the processor
babysitting them: the Wi-Fi radio, timers, the thing that reads analog voltages, the things
that talk to sensors. Modules 22 to 24 cover these. For now: they exist, and they are the
reason an ESP32 can do Wi-Fi while your code is doing something else.

:::check
1. What is the difference between flash and RAM, and which one holds your program?
2. What do the three words in "GPIO" each mean?
3. Why does an LED need a `delay()` to be visibly blinked?

*(Answers: flash keeps its contents without power and holds your program, RAM is working
space that is lost on power-off; General Purpose, Input, Output; because the processor runs
millions of instructions a second, so without a wait the on and off happen far too fast to
see.)*
:::

## Section 3 — A pin is not a power supply

This section exists because getting it wrong is the most common way to kill an ESP32, and the
damage is silent and permanent.

### The problem

A GPIO pin set HIGH gives you 3.3 V. It is tempting to treat it like a tiny battery and hang
things off it. It is not a battery. It is a very small transistor connecting the pin to the
chip's internal 3.3 V rail, and that transistor can only pass so much current before it
overheats and fails.

### The numbers

From the ESP32 datasheet's DC characteristics table:

| What | Value | Meaning |
|---|---|---|
| Drive current, sourcing (IOH) | about **40 mA** typical | current the pin can push *out* |
| Drive current, sinking (IOL) | about **28 mA** typical | current the pin can accept *in* |
| All pins together | **1200 mA** absolute maximum | the whole chip's limit |
| Output HIGH voltage (VOH) | at least **0.8 × VDD** = 2.64 V | it sags under load |
| Output LOW voltage (VOL) | at most **0.1 × VDD** = 0.33 V | not quite 0 V either |

Those last two rows are the honest part. A GPIO pin at HIGH is not exactly 3.3 V — the harder
you load it, the further it sags, down to about 2.64 V at its rated 40 mA. The Lab models
this, which is why the current you see there is slightly lower than naive arithmetic predicts.

:::note{type=math title="Turning a sag into a resistance"}
If a pin sits at 3.3 V with nothing connected, and sags to 2.64 V when 40 mA is drawn, then it
behaves like a perfect 3.3 V source with a small resistor in series. How big?

The resistor is what the missing voltage falls across:

$$ V_{\text{missing}} = 3.3 - 2.64 = 0.66\ \text{V} $$

And Ohm's law from module 1, rearranged to give resistance:

$$ R = \frac{V}{I} = \frac{0.66\ \text{V}}{0.040\ \text{A}} = 16.5\ \Omega $$

So a GPIO output behaves roughly like 3.3 V behind 16.5 Ω. That is a model, not a component
you could find inside the chip — but it predicts the right behaviour, and it is exactly what
the Lab uses.
:::

### What this means in practice

| Thing | Current it wants | Can a pin drive it directly? |
|---|---|---|
| An LED with a proper resistor | 5–15 mA | **Yes** |
| An LED with no resistor | 50 mA and up | No — and this is the classic mistake |
| A small relay coil | 70–100 mA | **No** |
| A hobby servo | 300–800 mA | **Absolutely not** |
| A motor | an amp or more | No, and it may destroy the chip instantly |

The fix for everything in the "no" column is a **transistor**: a part that lets a tiny current
from a pin control a large current from elsewhere. That is module 14, and it is the single
most useful component you have not met yet.

:::note{type=mistake title="Thinking the chip will protect itself"}
It will not. There is no fuse, no current limit, no warning. An ESP32 asked for too much
current from a pin will often keep working for a while, then that one pin stops working
forever while the rest of the chip is fine. People chase that bug for days.

The Lab warns you when a pin goes over its rated current. Real hardware does not.
:::

:::note{type=safety title="The usual rule still applies"}
An ESP32 runs from USB, 5 V in, 3.3 V inside. None of it can hurt you. Mains electricity —
230 V from a wall socket in the Netherlands — absolutely can, and no project in this course
goes anywhere near it. If you later want to switch a mains lamp, that is done with a
ready-made, properly enclosed relay module, and it is a module of its own.
:::

:::check
1. Roughly how much current can one ESP32 pin supply, and what happens if you ask for more?
2. Why is a GPIO pin at HIGH not exactly 3.3 V when something is connected to it?
3. You want to run a motor from an ESP32. What do you need in between?

*(Answers: about 40 mA; the pin is damaged, often permanently and silently; because the pin
behaves like a voltage source with a small resistance in series, so current through it causes
a voltage drop; a transistor — module 14.)*
:::

## Section 4 — What "running a program" actually looks like

### setup() and loop()

Arduino-style code for a microcontroller has exactly two required parts:

```cpp
void setup() {
  // runs ONCE, when the board powers up or is reset
}

void loop() {
  // runs over and over, forever, until the power is cut
}
```

That is not a convention someone chose to be friendly. It reflects what the hardware does: a
microcontroller powers up, does its start-up work, and then has nothing to go back to. There
is no desktop to return to, no program to quit into. So it loops. Forever. When `loop()`
reaches its last line, it is immediately called again.

**`setup()`** is where you say what each pin is for, start the serial connection, and anything
else that happens once.

**`loop()`** is the actual behaviour.

### What happens when you power it on

1. Power arrives, the chip resets.
2. The chip looks at a few specific pins to decide how to start — these are called
   **strapping pins**, and they are why some GPIOs come with warnings. Module 27.
3. It loads your program from flash into RAM and starts running it.
4. `setup()` runs once.
5. `loop()` runs, ends, runs again, ends, runs again… millions of times, forever.

:::check
1. Why does microcontroller code loop forever instead of finishing?
2. What belongs in `setup()` and what belongs in `loop()`?

*(Answers: there is nothing to return to — no operating system, no desktop — so the chip
would have nothing to do; one-time configuration like `pinMode` in setup, repeated behaviour
in loop.)*
:::

## Common mistakes

:::note{type=mistake title="Expecting the pin to stay high after loop() ends"}
It does. A pin keeps whatever state you last set until something changes it — including
across loop iterations, and including after your program crashes. "Set and forget" is exactly
how it behaves.
:::

:::note{type=mistake title="Putting pinMode() in loop()"}
It works, but it runs millions of times a second for no reason. `pinMode` configures the pin;
configuring it again and again is pointless. It belongs in `setup()`.
:::

:::note{type=mistake title="Thinking more voltage means more current available"}
These are separate things. The pin offers 3.3 V, and how much current flows depends on what
you connect — exactly as module 1 showed with the resistor. The limit is on the *current*,
not the voltage.
:::

:::note{type=mistake title="Treating 3.3 V and 5 V as interchangeable"}
An ESP32 runs its pins at 3.3 V. A lot of Arduino tutorials assume 5 V. Connecting a 5 V
signal to a 3.3 V ESP32 pin can damage it. Module 19 covers how to bridge the two safely.
:::

## Quiz

```quiz
[
  {
    "type": "mc",
    "q": "What makes a microcontroller different from an ordinary computer?",
    "options": [
      { "text": "It has pins it can switch on and off under program control", "correct": true },
      { "text": "It is much faster", "why": "It is far slower than a laptop — a classic ESP32 runs at up to 240 MHz against a laptop's billions of operations per second across many cores. Speed is not the point; control of physical pins is." },
      { "text": "It does not need any power", "why": "It absolutely needs power — that is the whole reason battery life is a topic later on. It just needs very little compared to a computer." },
      { "text": "It cannot run a program", "why": "Running a program is exactly what it does. The program is stored in its flash memory and starts automatically on power-up." }
    ],
    "explain": "A microcontroller computes and touches the physical world through its pins. That is the defining feature."
  },
  {
    "type": "mc",
    "q": "A pin is set with pinMode(14, INPUT). What is it doing?",
    "options": [
      { "text": "Nothing is being driven — the pin is sensing whatever voltage is put on it", "correct": true },
      { "text": "It is outputting 0 V", "why": "That is what LOW does on an OUTPUT pin. An INPUT pin drives nothing at all: it is effectively disconnected, with a very high resistance, just measuring." },
      { "text": "It is outputting 3.3 V", "why": "An input never drives anything. If it did, it would fight whatever you connected to it." },
      { "text": "It is switched off and unusable", "why": "It is very much in use — reading is a job. It simply is not pushing any current out." }
    ],
    "explain": "INPUT means high-impedance: the pin senses and does not drive. This also means an input with nothing connected is floating, which is a real bug, as module 21 shows."
  },
  {
    "type": "num",
    "q": "Roughly how much current can a single ESP32 GPIO pin source, in milliamps, according to the datasheet's typical figure?",
    "answer": 40,
    "unit": "mA",
    "tolerance": 0.15,
    "unitHint": "The datasheet gives this one in milliamps already — no conversion needed.",
    "explain": "About 40 mA typical for sourcing (IOH), and about 28 mA for sinking (IOL). Design for well under that: 5 to 15 mA for an LED is comfortable."
  },
  {
    "type": "num",
    "q": "A GPIO pin at HIGH sits at 3.3 V unloaded and sags to 2.64 V at 40 mA. What series resistance does that behave like, in ohms?",
    "answer": 16.5,
    "unit": "Ω",
    "tolerance": 0.05,
    "unitHint": "Work in amps: 40 mA is 0.040 A, not 40.",
    "explain": "The missing voltage is 3.3 − 2.64 = 0.66 V, and R = V / I = 0.66 / 0.040 = 16.5 Ω. This is why the Lab shows slightly less current than ideal arithmetic predicts."
  },
  {
    "type": "mc",
    "q": "Why does code for a microcontroller use loop() instead of just ending?",
    "options": [
      { "text": "There is nothing to return to — no operating system and no other program", "correct": true },
      { "text": "Because the chip would be damaged if the program ended", "why": "Nothing is damaged. The chip would simply have no instructions left to execute, which is a useless state for a device whose job is to keep controlling something." },
      { "text": "Because loop() makes the program run faster", "why": "Speed has nothing to do with it. loop() reflects the fact that a microcontroller's job never finishes." },
      { "text": "Because Arduino requires it for compatibility with old boards", "why": "It is not a compatibility quirk — it mirrors what the hardware genuinely does after it starts up." }
    ],
    "explain": "A microcontroller is dedicated to one job forever. setup() for the one-time configuration, loop() for the job."
  }
]
```

## Flashcards

```flashcards
[
  { "id": "m20-mcu", "front": "What is a microcontroller?", "back": "A complete small computer on one chip — processor, memory and controllable pins — costing a couple of euros. The pins are what make it a controller rather than just a computer." },
  { "id": "m20-gpio", "front": "What does GPIO stand for, and what does each word mean?", "back": "General Purpose Input/Output. General purpose: you decide its job. Input: the chip reads the voltage on it. Output: the chip puts a voltage on it." },
  { "id": "m20-flash-ram", "front": "Flash vs RAM on a microcontroller?", "back": "Flash stores your program and survives power loss. RAM is working space while running and is wiped when power goes." },
  { "id": "m20-setup-loop", "front": "What is the difference between setup() and loop()?", "back": "setup() runs once at power-up — pin configuration and other one-time work. loop() runs over and over forever and holds the actual behaviour." },
  { "id": "m20-pin-current", "front": "How much current can one ESP32 GPIO pin supply, and what happens if you exceed it?", "back": "About 40 mA sourcing, 28 mA sinking (datasheet typical). Exceeding it damages the pin — often silently and permanently. The chip has no protection." },
  { "id": "m20-pin-not-supply", "front": "Why is a GPIO pin not a power supply?", "back": "It is a tiny transistor connecting the pin to the internal 3.3 V rail, not a battery. It sags under load (down to about 2.64 V at 40 mA) and fails if overloaded." },
  { "id": "m20-input-floating", "front": "What does a pin set to INPUT do?", "back": "Nothing — it drives no voltage at all and sits at very high resistance, just sensing. With nothing connected it floats, and reads unpredictably." },
  { "id": "m20-transistor", "front": "What do you need between an ESP32 pin and a motor or relay?", "back": "A transistor: a small current from the pin controls a large current from a separate supply. Covered in module 14." },
  { "id": "m20-clock-speed", "front": "Roughly how fast does a classic ESP32 processor run, and why does that matter for blinking an LED?", "back": "Up to 240 million cycles per second. Without a delay(), an on-then-off happens in microseconds — far too fast to see." },
  { "id": "m20-33v", "front": "What voltage do ESP32 pins use, and why is that a trap?", "back": "3.3 V. Many Arduino tutorials and parts assume 5 V, and putting 5 V onto a 3.3 V pin can damage it." }
]
```

## Where this goes next

Module 21 puts this to work: you wire an LED to a real pin, write the code, and make it blink
— first in the Lab, then on hardware if you have it.

## Sources

- GPIO drive current (IOH about 40 mA, IOL about 28 mA), output levels (VOH min 0.8 × VDD,
  VOL max 0.1 × VDD) and the 1200 mA cumulative absolute maximum: ESP32 series datasheet,
  DC Characteristics and Absolute Maximum Ratings tables.
  <https://www.espressif.com/en/support/documents/technical-documents>
- Strapping pins (GPIO0, GPIO2, GPIO5, GPIO12, GPIO15) and the SPI flash pins
  (GPIO6–GPIO11): ESP32 datasheet pin definitions, cross-checked against the ESP-IDF GPIO
  documentation. <https://github.com/espressif/esp-idf/blob/master/docs/en/api-reference/peripherals/gpio.rst>
- Maximum CPU clock of 240 MHz: ESP32 series datasheet, CPU and memory overview.

**All figures above apply to the classic ESP32** (the ESP32-WROOM-32 family). The S2, S3, C3
and C6 differ — module 26 covers the differences. Items still to be confirmed against the
datasheet directly are listed in `docs/open-questions.md`; espressif.com was not reachable
from the machine this was written on.
