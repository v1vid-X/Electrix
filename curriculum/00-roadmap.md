# Roadmap

Every module, in order, with what it needs before it, how long it takes, whether it needs
physical parts, and which Lab parts it unlocks.

**This file is yours.** Edit it, reorder it, delete modules you do not care about. The app reads
it but never rewrites it.

Legend: **Parts** = you need physical components on the desk. **Unlocks** = parts that become
available in the Lab when you finish the module. Hours are estimates for someone starting from
zero, including the hands-on part.

---

## What I changed from your outline, and why

1. **Split Phase 0 into three modules (0a, 0b, 0c).** Your module 0 contained "use a terminal",
   "install Node", "buy parts", "workspace safety" and "use a breadboard". That is four
   unrelated things and about four hours. Installing tools and using a breadboard belong in
   different places in your week.
2. **Moved the shopping guide to its own module (0c) and gave it a page in the app.** You will
   come back to it at three different points, so it should not be buried inside a setup lesson.
3. **Split your Module 1 in two: 1 (charge, voltage, current) and 2 (resistance, power,
   energy).** All six of those at once is too much for the first lesson. Voltage and current
   are where every beginner's mental model gets built or broken, so they get their own module.
4. **Moved "using a multimeter" earlier, to Module 6, right after Ohm's law.** You had it after
   series/parallel. A multimeter is how you *check* Ohm's law, so it should come as soon as you
   have something worth measuring. It is also the point where the course stops being theory.
5. **Split your Module 11 (transistors) into 12 (BJT) and 13 (MOSFET).** They are genuinely
   different parts with different mental models, and MOSFETs are what you will actually use
   with an ESP32.
6. **Added Module 25: debugging and instruments** (logic analyser, scope basics) before the
   ESP32 deep-dive, because by then you will be debugging things you cannot see.
7. **Added Module 36: certification, EMC and "what makes a design legal to sell"** as an
   optional appendix. Not needed for hobby boards, but you will wonder about it.
8. **Op-amps (your Module 12) moved later, to Module 15,** and marked optional-ish. You do not
   need them for ESP32 work, and they are much easier after you have seen transistors.
9. **Kirchhoff's laws got their own module (5)** instead of being tacked onto Ohm's law. They
   are the thing that lets you analyse a circuit you have never seen before, which is the
   actual goal of this course.

Everything else follows your outline.

---

## Phase 0 — Getting set up

| # | Module | Prereqs | Hours | Parts | Unlocks |
|---|---|---|---|---|---|
| 0a | **How to use this app, and the terminal** — what the app contains, how a lesson is laid out, the eight terminal commands you actually need, installing Node.js and an editor, running `npm run dev`. | — | 1.5 | no | — |
| 0b | **Your workspace and staying safe** — where to work, static, what a short circuit is in one paragraph, why we never touch mains (230 V), how to treat batteries. | 0a | 1 | no | — |
| 0c | **Shopping guide** — exactly what to buy in three stages, what to skip, which EU shops, what cheap junk to avoid. | 0b | 1 | no | — |

## Phase 1 — Fundamentals

| # | Module | Prereqs | Hours | Parts | Unlocks |
|---|---|---|---|---|---|
| 1 | **What electricity actually is** — charge, voltage, current, and a first look at resistance and Ohm's law. The water analogy and exactly where it lies. Powers of ten. *(written — the reference lesson)* | 0a | 2 | no | battery, USB supply, resistor, LED, wires |
| 2 | **Resistance, power and energy** — what resists, why things get warm, watts vs joules, why a resistor has a power rating. | 1 | 2 | no | — |
| 3 | **Circuits** — closed loops, open circuits, short circuits, what "ground" means, schematic symbols, reading your first schematic. | 2 | 2 | no | switch |
| 4 | **Ohm's law and the power law** — the two equations you will use forever, rearranged every way, with sanity checks. | 3 | 2 | no | — |
| 5 | **Series, parallel and Kirchhoff's laws** — why current is the same everywhere in a loop, why voltages add up to zero around it. | 4 | 2.5 | no | — |
| 6 | **Using a multimeter** — volts, ohms, continuity, current, and how to not blow the fuse. Measuring safely. | 5 | 2 | **yes** | virtual multimeter |
| 7 | **Voltage dividers** — the most useful circuit in existence, why it sags under load. | 5, 6 | 2 | **yes** | potentiometer |
| 8 | **Resistors in practice** — colour codes, tolerance, E-series values, power ratings, pull-ups and pull-downs. | 6 | 2 | **yes** | — |
| 9 | **Capacitors** — charge and discharge, RC time constants, decoupling, filtering. | 8 | 3 | **yes** | ceramic + electrolytic capacitor |
| 10 | **Inductors and magnetism** — why coils fight change, flyback spikes, why relays and motors need a diode. | 9 | 2.5 | optional | inductor |
| 11 | **DC, AC, frequency and PWM** — signals over time, and how a digital pin fakes an analog output. | 9 | 2.5 | **yes** | — |

## Phase 2 — Semiconductors and analog

| # | Module | Prereqs | Hours | Parts | Unlocks |
|---|---|---|---|---|---|
| 12 | **Diodes and LEDs** — one-way valves, forward voltage, current limiting, Zener, Schottky, protection diodes. | 11 | 2.5 | **yes** | diode, Zener, Schottky |
| 13 | **Transistors 1: the BJT as a switch** — current in, more current out, and why an ESP32 pin cannot drive a motor. | 12 | 2.5 | **yes** | NPN/PNP transistor |
| 14 | **Transistors 2: the MOSFET as a switch** — gate voltage, logic-level parts, the one you will actually use. | 13 | 2.5 | **yes** | N-channel + P-channel MOSFET |
| 15 | **Op-amps and comparators** — the basics, and why you mostly will not need them. *(can be skipped on a first pass)* | 13 | 2.5 | optional | op-amp |
| 16 | **Voltage regulators** — linear vs switching, dropout, efficiency, heat, and picking one. | 12 | 2.5 | **yes** | AMS1117 / buck module |
| 17 | **Batteries and power** — Li-ion and LiPo (and how to not set them on fire), charging modules, battery-life maths. | 16 | 2.5 | **yes** | LiPo cell, TP4056 module |

## Phase 3 — Digital and communication

| # | Module | Prereqs | Hours | Parts | Unlocks |
|---|---|---|---|---|---|
| 18 | **Binary and logic** — counting in twos, logic levels, gates, truth tables. | 11 | 2 | no | logic gate IC |
| 19 | **3.3 V vs 5 V and level shifting** — why mixing them breaks things, and the three ways to fix it. | 18 | 2 | **yes** | level shifter |
| 20 | **What a microcontroller actually is** — GPIO, clock, memory, peripherals, interrupts, timers. | 18 | 2 | no | — |
| 21 | **First code: blink and a button** — every line explained. **This is where you first touch the ESP32 for real.** | 20, 0a | 3 | **yes** | ESP32 dev board (Lab) |
| 22 | **ADC and DAC** — resolution, sampling, noise, and the ESP32's ADC quirks. | 21, 7 | 2.5 | **yes** | — |
| 23 | **UART, I²C and SPI** — what the wires actually do, not just which library to call. | 21 | 3 | **yes** | I²C sensor, SPI display |
| 24 | **Sensors and actuators** — temperature, motion, distance, servos, relays, displays. | 23 | 3 | **yes** | sensors, servo, relay module |
| 25 | **Debugging and instruments** — logic analyser, scope basics, and a systematic way to find faults. | 23 | 2.5 | optional | oscilloscope (Lab) |

## Phase 4 — ESP32 in depth

| # | Module | Prereqs | Hours | Parts | Unlocks |
|---|---|---|---|---|---|
| 26 | **ESP32 architecture and variants** — cores, memory, peripherals, and which of ESP32 / S2 / S3 / C3 / C6 to buy for what. | 21 | 2.5 | no | — |
| 27 | **Pins you must respect** — strapping pins, boot modes, flash pins, input-only pins, which GPIOs are safe. *(every claim verified against the datasheet)* | 26 | 2.5 | no | — |
| 28 | **Toolchains** — Arduino framework vs ESP-IDF vs PlatformIO vs MicroPython, and which one you start with and why. | 21 | 2 | no | — |
| 29 | **Wi-Fi, BLE and the internet** — HTTP, MQTT, a web server on the board, OTA updates. | 28 | 4 | **yes** | — |
| 30 | **Power management** — sleep modes, deep sleep, wake sources, and real current numbers. | 26, 17 | 3 | **yes** | — |
| 31 | **FreeRTOS basics** — tasks, queues, mutexes, and when you actually need them. | 28 | 3 | no | — |

## Phase 5 — Design your own hardware

| # | Module | Prereqs | Hours | Parts | Unlocks |
|---|---|---|---|---|---|
| 32 | **Reading datasheets** — absolute maximum ratings vs recommended operating conditions, and the pages that matter. | 26 | 2.5 | no | — |
| 33 | **Schematic design in KiCad** — install it, draw a circuit, assign footprints, run ERC. | 32, 3 | 4 | no | — |
| 34 | **A minimal ESP32 board** — power, USB-UART, reset/boot circuit, decoupling, antenna keep-out, following Espressif's design guidelines. | 33, 27, 16 | 5 | no | — |
| 35 | **PCB layout** — traces, current capacity, ground planes, return paths, EMI basics. | 34 | 5 | no | — |
| 36 | **Soldering and assembly** — iron temperature, through-hole, surface mount, flux, rework. | 0c | 3 | **yes** | — |
| 37 | **Manufacturing** — Gerbers, BOM, JLCPCB/PCBWay, assembly options, what it costs. | 35 | 3 | no | — |
| 38 | **Bringing up a new board** — the test checklist, in order, and what to do when it is dead. | 37, 6, 25 | 3 | **yes** | — |
| 39 | **Appendix: EMC, CE and selling things** — optional, for when you wonder what the rules are. | 35 | 2 | no | — |

## Phase 6 — Capstone projects

| # | Project | Prereqs | Hours |
|---|---|---|---|
| C1 | **Sensor with a web dashboard** — read a sensor, serve a page, chart the history. | 24, 29 | 6 |
| C2 | **Battery-powered sensor node** — deep sleep, MQTT, and a battery-life calculation you then verify with a multimeter. | 30, 17 | 8 |
| C3 | **Your own ESP32 PCB** — designed, ordered, assembled, brought up, working. | 38 | 20+ |

---

## Totals

Roughly **135 hours** of lessons plus the capstones. At 1–2 hours a day that is about four to
six months, which is a realistic timeline for going from zero to your own working board.

Phases 1–2 need Stage 1 parts (about €70). Phase 3 onwards needs Stage 2 (about €60).
Phase 5 needs Stage 3 (about €120, and some of it is skippable). See module 0c.
