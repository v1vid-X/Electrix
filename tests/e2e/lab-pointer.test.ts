/** Does the Lab agree with the pointer?
 *
 *  This exists because the invisible click targets once sat 4 mm below the board's visible
 *  surface, so with the camera at an angle every click landed about two holes from the
 *  cursor. No unit test could see that — it is a geometry bug that only exists on screen.
 *
 *  It works out where a hole should appear, using the same camera the Lab configures, moves
 *  the mouse there, and reads the hole id out of the Lab's status bar.
 *
 *  Needs a dev or preview server running:
 *      npm run dev -- --port 5181
 *      npm run test:lab
 */
import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { screenPositionOf, VIEWPORT } from './camera';

const require = createRequire(import.meta.url);
// Playwright is a developer tool, not something this app ships, so it is not a dependency.
const { chromium } = require('playwright') as typeof import('playwright');

const BASE = process.env.LAB_URL ?? 'http://localhost:5181';

let browser: Awaited<ReturnType<typeof chromium.launch>>;
let page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>;

const readHole = () =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('span')].find((s) =>
      /^(hole \S+|no hole)/.test((s.textContent || '').trim()),
    );
    const m = /^hole (\S+)/.exec((el?.textContent || '').trim());
    return m ? m[1] : null;
  });

/** The browser checks are about interaction, not rendering, and this machine has no GPU.
 *  Low quality keeps frames fast so polling for a UI update is not a lottery. */
async function useLowQuality() {
  for (const select of await page.$$('select')) {
    const value = await select.inputValue();
    if (['low', 'medium', 'high'].includes(value)) await select.selectOption('low');
  }
  await page.waitForTimeout(600);
}

beforeAll(async () => {
  browser = await chromium.launch({
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/#/lab?preset=led-basic`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
  await useLowQuality();
});

afterAll(async () => {
  await browser?.close();
});

/** The readout updates on the next animation frame, which can be late on a slow frame.
 *  Polling removes the flake without weakening what is asserted. */
async function holeUnderPointer(timeoutMs = 2000): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  let last = await readHole();
  while (Date.now() < deadline) {
    const now = await readHole();
    if (now !== null && now === last) return now;
    last = now;
    await page.waitForTimeout(60);
  }
  return last;
}

describe('the pointer lands where it looks like it lands', () => {
  // Spread across the board: both halves, both ends, the rails, and across the centre gap.
  const HOLES = ['a1', 'e1', 'f1', 'j1', 'a30', 'e30', 'f30', 'j30', 'c15', 'h15', 'TP:1', 'BP:30', 'e16', 'f16'];

  it.each(HOLES)('hovering over %s reports %s', async (expected) => {
    const { x, y } = screenPositionOf(expected);
    await page.mouse.move(x, y);
    expect(await holeUnderPointer()).toBe(expected);
  });

  it('places a part in the hole the pointer is over', async () => {
    const target = 'g12';
    const spot = screenPositionOf(target);
    await page.getByRole('button', { name: /^Resistor/ }).first().click();
    await page.mouse.move(spot.x, spot.y);
    expect(await holeUnderPointer()).toBe(target);
    await page.mouse.click(spot.x, spot.y);
    await page.waitForTimeout(400);

    const anchors = await page.evaluate(() => {
      const raw = localStorage.getItem('circuit-brain/lab/v1');
      if (!raw) return [];
      return (JSON.parse(raw).parts ?? [])
        .filter((p: { typeId: string }) => p.typeId === 'resistor')
        .map((p: { anchor: string }) => p.anchor);
    });
    expect(anchors).toContain(target);
  });

  it('reports no hole when the pointer is off the board', async () => {
    await page.mouse.move(VIEWPORT.width - 40, 160);
    await page.waitForTimeout(130);
    expect(await readHole()).toBe(null);
  });
});
