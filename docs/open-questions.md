# Open questions and things that need verifying

Anything in here is **not** to be written into a lesson as fact until it has been checked
against a primary source. Primary sources are, in order: a PDF the learner has put in
`/docs`, the Espressif datasheet or technical reference manual for the exact variant, the
ESP-IDF documentation, and the Espressif Hardware Design Guidelines.

## Needs verification before the module that uses it

| # | Claim to verify | Needed by | Source to check |
|---|---|---|---|
| 1 | Exact absolute-maximum and recommended current per GPIO pin, and the total across all pins, for **ESP32**, **ESP32-S3** and **ESP32-C3** | Modules 13, 14, 21 | Datasheet, "Recommended Operating Conditions" and "Absolute Maximum Ratings" |
| 2 | Which GPIOs are **strapping pins** on each variant, their required levels at boot, and what happens if you load them | Module 27 | Datasheet, "Strapping Pins" section |
| 3 | Which GPIOs are **input-only**, and which are tied to the SPI flash and must not be used | Module 27 | Datasheet pin description table |
| 4 | **ADC** resolution, usable input range, non-linearity, the ADC2/Wi-Fi conflict, and whether attenuation settings change the usable range per variant | Module 22 | Datasheet + ESP-IDF ADC documentation |
| 5 | Real **current consumption** figures: active with Wi-Fi TX, active idle, modem sleep, light sleep, deep sleep, hibernation — per variant | Modules 26, 30 | Datasheet "Current Consumption" tables |
| 6 | Deep-sleep **wake sources** available per variant (timer, ext0/ext1, touch, ULP, GPIO) | Module 30 | ESP-IDF sleep-modes documentation |
| 7 | Minimum external circuit for a bare module: **decoupling values and placement**, EN pull-up and RC delay, boot button circuit, antenna keep-out dimensions | Module 34 | Espressif Hardware Design Guidelines |
| 8 | Whether the **ESP32-C6** is the right default recommendation in 2026 (Wi-Fi 6, Thread/Zigbee) versus the S3, for a beginner's first board | Modules 0c, 26 | Espressif product selector + current EU shop stock |
| 9 | **Flash and PSRAM** options per module (WROOM vs WROVER vs the -N4/-N8/-N16R8 suffixes) and what they mean | Module 26 | Module datasheets |
| 10 | USB behaviour: which variants have **native USB**, which need a USB-UART bridge, and what that means for the board design | Modules 26, 34 | Datasheet + Hardware Design Guidelines |

## Marked in lessons as approximate on purpose

- Module 1, section 2: the ESP32 current figures in the "feel for the scale" table are given as
  broad ranges rather than exact numbers, because they depend on variant, board and radio
  state. Exact figures come from item 5 above.

## Decisions taken that could be revisited

- **The circuit solver is hand-written TypeScript, not ngspice compiled to WebAssembly.**
  Reasoning in `docs/PROGRESS.md`. Revisit if the Lab ever needs AC analysis, noise analysis
  or SPICE model files for real parts.
- **The ESP32 simulator in the Lab will be a behavioural GPIO simulator, not Wokwi.**
  Not yet implemented; the tradeoff is written up in `docs/PROGRESS.md` and should be
  re-examined before module 21.
- **LED model:** forward voltages in `src/lib/circuit/parts.ts` (red 2.0 V, blue 3.2 V, etc. at
  20 mA) and the 15 Ω bulk resistance are *typical* values, not a specific manufacturer's part.
  Good enough for teaching; stated as typical in the UI. If the Lab ever claims to model a
  specific part number, those numbers must come from that part's datasheet.
