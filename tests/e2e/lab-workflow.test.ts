/** Builds the blink circuit by hand, the way a learner would: click a part, click a hole,
 *  drag wires between holes, then run the code and check the LED lights.
 *
 *  Needs a dev or preview server running:
 *      npm run dev -- --port 5181
 *      npm run test:lab
 */
import { createRequire } from 'node:module';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { screenPositionOf, VIEWPORT } from './camera';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright') as typeof import('playwright');

const BASE = process.env.LAB_URL ?? 'http://localhost:5181';

let browser: Awaited<ReturnType<typeof chromium.launch>>;
let page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newPage']>>;

interface SavedCircuit {
  parts: { id: string; typeId: string; anchor: string | null; value?: number }[];
  wires: { from: unknown; to: unknown }[];
}

const saved = (): Promise<SavedCircuit> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('circuit-brain/lab/v1') ?? '{"parts":[],"wires":[]}'));

const clickHole = async (hole: string) => {
  const { x, y } = screenPositionOf(hole);
  await page.mouse.move(x, y);
  await page.waitForTimeout(110);
  await page.mouse.click(x, y);
  await page.waitForTimeout(260);
};

const hud = () => page.evaluate(() => document.body.innerText);

beforeAll(async () => {
  browser = await chromium.launch({
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  // Start from a board and nothing else; the test does the building.
  await page.goto(`${BASE}/#/lab?preset=esp32-bare`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);
});

afterAll(async () => {
  await browser?.close();
});

describe('building a circuit by hand', () => {
  it('places a resistor where it is clicked', async () => {
    await page.getByRole('button', { name: /^Resistor/ }).first().click();
    await page.selectOption('select:near(:text("Resistor"))', '220').catch(() => undefined);
    await clickHole('g18');
    const c = await saved();
    const r = c.parts.find((p) => p.typeId === 'resistor');
    expect(r?.anchor).toBe('g18');
  });

  it('places an LED where it is clicked', async () => {
    await page.getByRole('button', { name: /^LED/ }).first().click();
    await clickHole('f24');
    const c = await saved();
    expect(c.parts.find((p) => p.typeId === 'led')?.anchor).toBe('f24');
  });

  it('draws a wire between the two holes that were clicked', async () => {
    await page.getByRole('button', { name: 'Wire', exact: true }).click();
    await clickHole('a7'); // same strip as the board's GPIO13 pin
    await clickHole('h18'); // same strip as the resistor's top leg
    const c = await saved();
    expect(c.wires).toHaveLength(1);
    expect(c.wires[0]).toMatchObject({
      from: { kind: 'hole', hole: 'a7' },
      to: { kind: 'hole', hole: 'h18' },
    });
  });

  it('finishes the loop with two more wires', async () => {
    await clickHole('h21');
    await clickHole('h24');
    await clickHole('h25');
    await clickHole('a4'); // same strip as the board's GND pin
    expect((await saved()).wires).toHaveLength(3);
  });

  it('runs the sketch and lights the LED it just wired', async () => {
    await page.getByRole('button', { name: 'Run' }).click();
    let lit = false;
    for (let i = 0; i < 60 && !lit; i++) {
      await page.waitForTimeout(90);
      lit = (await hud()).includes('IO13 HIGH');
    }
    expect(lit).toBe(true);
    const text = await hud();
    // The explanation has to show the real arithmetic, not a canned sentence.
    expect(text).toMatch(/The LED drops/);
    expect(text).toMatch(/÷/);
    await page.getByRole('button', { name: 'Stop' }).click();
  });

  it('undoes the last wire and redoes it', async () => {
    await page.getByRole('button', { name: 'Undo', exact: true }).click();
    await page.waitForTimeout(250);
    expect((await saved()).wires).toHaveLength(2);
    await page.getByRole('button', { name: 'Redo', exact: true }).click();
    await page.waitForTimeout(250);
    expect((await saved()).wires).toHaveLength(3);
  });

  it('clears the bench', async () => {
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.waitForTimeout(300);
    const c = await saved();
    expect(c.parts).toHaveLength(0);
    expect(c.wires).toHaveLength(0);
  });
});
