import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig({
  ...viteConfig,
  test: {
    ...viteConfig.test,
    include: ['src/__tests__/replayBank/**/*.bank.ts'],
    // Writer-quality cases check recorded writer prose; they run on their own (vitest.writerQuality.config.ts).
    testNamePattern: /^(?!.*\[writer-quality\])/,
    testTimeout: 300_000,
    hookTimeout: 900_000,
  },
});
