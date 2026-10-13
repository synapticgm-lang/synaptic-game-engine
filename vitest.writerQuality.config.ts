import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

/** Replay-bank cases that only check recorded writer prose (no code owner). Reported apart from the bank pass score. */
export default defineConfig({
  ...viteConfig,
  test: {
    ...viteConfig.test,
    include: ['src/__tests__/replayBank/**/*.bank.ts'],
    testNamePattern: /\[writer-quality\]/,
    testTimeout: 300_000,
    hookTimeout: 900_000,
  },
});
