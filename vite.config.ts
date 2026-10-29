import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { execSync } from 'node:child_process';

function gitShortSha(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

const SGM_GIT_SHA = gitShortSha();
const SGM_BUILD_TIME = new Date().toISOString();

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __SGM_GIT_SHA__: JSON.stringify(SGM_GIT_SHA),
    __SGM_BUILD_TIME__: JSON.stringify(SGM_BUILD_TIME),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['@xenova/transformers'],
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/pinDice.setup.ts'],
    env: {
      VITE_SUPABASE_URL: 'https://test.supabase.co',
      VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    },
  },
  build: {
    // Do not publish source maps — they reverse-engineer prompt/orchestration IP.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});
