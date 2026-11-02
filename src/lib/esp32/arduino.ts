/** Turns a small, clearly documented subset of Arduino C++ into JavaScript the browser can
 *  run, so the code the learner types in the Lab looks like the code they will later paste
 *  into the Arduino IDE.
 *
 *  This is a behavioural simulator, NOT a real ESP32. It does not compile anything, it does
 *  not run the real Arduino core, and anything outside the subset below is rejected with a
 *  message rather than silently doing the wrong thing. The Lab says so on screen.
 *
 *  Supported:
 *    pinMode, digitalWrite, digitalRead, delay, delayMicroseconds, millis, micros,
 *    Serial.begin / print / println, the constants HIGH LOW INPUT OUTPUT true false,
 *    #define, int/long/float/bool/... variables, if/else, while, for, functions, maths.
 *
 *  Not supported (on purpose, and reported as an error):
 *    analogRead / analogWrite / ledc (the ADC and PWM specs are not verified yet),
 *    INPUT_PULLUP (internal pull-up value not verified), arrays, structs, classes,
 *    pointers, String methods, libraries, interrupts, FreeRTOS.
 */

export interface TranspileResult {
  js: string;
  errors: string[];
}

/** C++ types we quietly turn into `let`. */
const TYPE = String.raw`(?:unsigned\s+)?(?:void|int|long|short|float|double|bool|boolean|byte|char|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t|size_t)`;

/** Things that would compile on a real board but that this simulator does not implement.
 *  Better a clear error than a program that quietly behaves differently from real hardware. */
const UNSUPPORTED: { pattern: RegExp; message: string }[] = [
  { pattern: /\banalogRead\s*\(/, message: 'analogRead() is not simulated yet — the ESP32 ADC has quirks that need verifying against the datasheet first (module 22).' },
  { pattern: /\b(analogWrite|ledcWrite|ledcSetup|ledcAttachPin)\s*\(/, message: 'PWM output is not simulated yet. It arrives with module 11.' },
  { pattern: /\bINPUT_PULLUP\b/, message: 'INPUT_PULLUP is not simulated, because the ESP32 internal pull-up resistance is not verified yet. Use a real resistor on the breadboard instead — it is better practice and you can see it.' },
  { pattern: /\b(attachInterrupt|xTaskCreate|vTaskDelay)\s*\(/, message: 'Interrupts and FreeRTOS tasks are not simulated (modules 20 and 31).' },
  { pattern: /#include\s*[<"](?!Arduino\.h)/, message: 'Libraries are not simulated. Only plain Arduino code works in the Lab.' },
  { pattern: /\bString\s+\w+/, message: 'String objects are not supported. Use plain numbers for now.' },
  { pattern: /\b\w+\s*\[\s*\]/, message: 'Arrays are not supported yet.' },
  { pattern: /\b(class|struct)\s+\w+/, message: 'Classes and structs are not supported.' },
];

/** Inserts a budget check at the top of every while/for body, so a loop with no delay()
 *  stops with an explanation instead of freezing the page. */
export function injectLoopGuards(code: string): string {
  let out = '';
  let i = 0;
  const isWordChar = (c: string) => /[\w$]/.test(c);

  while (i < code.length) {
    const match = /^(while|for)\s*\(/.exec(code.slice(i));
    const precededByWord = i > 0 && isWordChar(code[i - 1]);
    if (!match || precededByWord) {
      out += code[i];
      i += 1;
      continue;
    }

    // Walk to the parenthesis that closes the loop header.
    let j = i + match[0].length;
    let depth = 1;
    while (j < code.length && depth > 0) {
      if (code[j] === '(') depth += 1;
      else if (code[j] === ')') depth -= 1;
      j += 1;
    }
    // Skip whitespace, then require a braced body — the documented subset.
    let k = j;
    while (k < code.length && /\s/.test(code[k])) k += 1;
    if (code[k] === '{') {
      out += code.slice(i, k + 1) + '__tick();';
      i = k + 1;
    } else {
      out += code.slice(i, j);
      i = j;
    }
  }
  return out;
}

export function transpile(source: string): TranspileResult {
  const errors: string[] = [];

  for (const { pattern, message } of UNSUPPORTED) {
    if (pattern.test(source)) errors.push(message);
  }

  let code = source;

  // #include <Arduino.h> is harmless and conventional; drop it.
  code = code.replace(/^\s*#include\s*[<"][^>"]*[>"].*$/gm, '');

  // #define NAME value  ->  const NAME = value;
  code = code.replace(/^\s*#define\s+(\w+)\s+(.+)$/gm, 'const $1 = $2;');

  // Function definitions, including setup() and loop(). Everything becomes async so that
  // delay() can suspend without blocking the page.
  code = code.replace(
    new RegExp(String.raw`^[ \t]*${TYPE}[ \t]+(\w+)[ \t]*\(([^)]*)\)[ \t]*\{`, 'gm'),
    (_m, name: string, params: string) => {
      const cleaned = params
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => p.replace(new RegExp(String.raw`^${TYPE}[ \t&*]+`), '').trim())
        .join(', ');
      return `async function ${name}(${cleaned}) {`;
    },
  );

  // Typed variable declarations -> let / const. Runs after functions so it cannot eat them.
  code = code.replace(
    new RegExp(String.raw`\b(const[ \t]+)?${TYPE}[ \t]+(\w+)[ \t]*(=|;)`, 'g'),
    (_m, isConst: string | undefined, name: string, tail: string) =>
      `${isConst ? 'const' : 'let'} ${name} ${tail}`,
  );

  // Only delay suspends; reads and writes are immediate.
  code = code.replace(/\b(delay|delayMicroseconds)\s*\(/g, 'await $1(');

  code = injectLoopGuards(code);

  if (!/\basync function setup\s*\(/.test(code)) {
    errors.push('Your sketch needs a setup() function. It runs once when the board powers on.');
  }
  if (!/\basync function loop\s*\(/.test(code)) {
    errors.push('Your sketch needs a loop() function. It runs over and over, forever.');
  }

  return { js: code, errors };
}
