/** Can you tell what you are looking at, and what you are about to click?
 *
 *  Both were reported as missing: "you can't see what you are selecting" and "I don't know
 *  what shit is". The fix is the hover readout and the selection outline, so they get tests.
 *
 *  Needs a dev or preview server running (see npm run test:lab).
 */
import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { screenPositionOf, VIEWPORT } from './camera';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright') as typeof import('playwright');
const BASE = process.env.LAB_URL ?? 'http://localhost:5181';

let browser: Awaited<ReturnType<typeof chromium.launch>>;
let page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>;

const tooltip = () =>
  page.evaluate(() => {
    const el = document.querySelector('.fixed.z-50');
    return el ? (el as HTMLElement).innerText.replace(/\n+/g, ' | ') : null;
  });

/** Hovers until the readout says something, since a frame has to pass first. */
async function hoverUntilTooltip(x: number, y: number, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  await page.mouse.move(x, y);
  while (Date.now() < deadline) {
    const t = await tooltip();
    if (t) return t;
    // Nudge, because R3F only re-raycasts when the pointer actually moves.
    await page.mouse.move(x + 1, y);
    await page.mouse.move(x, y);
    await page.waitForTimeout(120);
  }
  return null;
}

beforeAll(async () => {
  browser = await chromium.launch({
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/#/lab?preset=esp32-blink`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  for (const select of await page.$$('select')) {
    const value = await select.inputValue();
    if (['low', 'medium', 'high'].includes(value)) await select.selectOption('low');
  }
  await page.waitForTimeout(800);
});

afterAll(async () => {
  await browser?.close();
});

describe('knowing what you are looking at', () => {
  it('a hole says which holes it is joined to, and what voltage it sits at', async () => {
    const { x, y } = screenPositionOf('e16');
    const text = await hoverUntilTooltip(x, y);
    expect(text).toBeTruthy();
    expect(text).toContain('e16');
    // The breadboard lesson, in the tooltip.
    expect(text).toMatch(/Joined to 4 other holes/);
    expect(text).toContain('a16 b16 c16 d16 e16');
    expect(text).toMatch(/\bV\b/);
  });

  it('does not claim a hole across the centre gap is joined', async () => {
    const { x, y } = screenPositionOf('j16');
    const text = await hoverUntilTooltip(x, y);
    expect(text).toContain('f16 g16 h16 i16 j16');
    expect(text).not.toContain('e16');
  });

  it('a part says what it is, what value it has, and what is flowing through it', async () => {
    // The resistor in the blink preset spans g18 to g21; its body floats above the holes.
    const { x, y } = screenPositionOf('g20', 1.5);
    const text = await hoverUntilTooltip(x, y);
    expect(text).toBeTruthy();
    expect(text).toContain('Resistor');
    expect(text).toMatch(/220 Ω/);
    expect(text).toMatch(/across it/);
    expect(text).toMatch(/through it/);
  });

  it('reports live current once the sketch is driving the LED', async () => {
    await page.getByRole('button', { name: 'Run' }).click();
    let lit = false;
    for (let i = 0; i < 80 && !lit; i++) {
      await page.waitForTimeout(90);
      lit = (await page.evaluate(() => document.body.innerText)).includes('IO13 HIGH');
    }
    expect(lit).toBe(true);
    // The LED blinks, so the reading is zero half the time. Watch until it is not.
    const { x, y } = screenPositionOf('g20', 1.5);
    let flowing: string | null = null;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline && !flowing) {
      await page.mouse.move(x + 1, y);
      await page.mouse.move(x, y);
      await page.waitForTimeout(110);
      const text = await tooltip();
      if (text && /through it \| [1-9]/.test(text)) flowing = text;
    }
    expect(flowing).toMatch(/through it \| [1-9]/);
    expect(flowing).toMatch(/Resistor/);
    await page.getByRole('button', { name: 'Stop' }).click();
  });

  it('selecting a part reports it in the status bar', async () => {
    const { x, y } = screenPositionOf('g20', 1.5);
    await page.mouse.move(x, y);
    await page.waitForTimeout(200);
    await page.mouse.click(x, y);
    await page.waitForTimeout(400);
    const bar = await page.evaluate(() => document.body.innerText);
    expect(bar).toMatch(/selected: resistor/);
  });
});

describe('parts you can operate', () => {
  it('a switch flips when it is clicked, and the circuit follows', async () => {
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Switch/ }).first().click();
    const spot = screenPositionOf('b18');
    await page.mouse.move(spot.x, spot.y);
    await page.waitForTimeout(160);
    await page.mouse.click(spot.x, spot.y);
    await page.waitForTimeout(400);

    const closedNow = () =>
      page.evaluate(() => {
        const raw = localStorage.getItem('circuit-brain/lab/v1');
        const parts = raw ? JSON.parse(raw).parts ?? [] : [];
        return parts.find((p: { typeId: string }) => p.typeId === 'switch')?.closed ?? null;
      });
    expect(await closedNow()).toBeFalsy();

    // Click the body of the switch itself to flip it.
    const body = screenPositionOf('b19', 2.1);
    await page.mouse.move(body.x, body.y);
    await page.waitForTimeout(160);
    await page.mouse.click(body.x, body.y);
    await page.waitForTimeout(400);
    expect(await closedNow()).toBe(true);
  });
});
