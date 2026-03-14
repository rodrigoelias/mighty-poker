import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@mighty-poker/core': resolve('../../packages/core/src/index.ts'),
    },
  },
  test: {
    globals: true,
    passWithNoTests: true,
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
