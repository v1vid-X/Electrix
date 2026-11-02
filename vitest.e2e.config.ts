import { defineConfig } from 'vitest/config';
import path from 'node:path';

/** The browser checks. Separate from `npm test` because they need a running dev server
 *  and a Chromium build, and they take seconds rather than milliseconds. */
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    fileParallelism: false,
  },
});
