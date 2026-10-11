import { defineConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default defineConfig({
  ...viteConfig,
  test: {
    ...viteConfig.test,
    include: ['src/__tests__/replayBank/**/*.bank.ts'],
    testTimeout: 300_000,
    hookTimeout: 900_000,
  },
});
