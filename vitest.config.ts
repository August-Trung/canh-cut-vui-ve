import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@penguin/types': path.resolve(__dirname, './packages/types/src/index.ts'),
      '@penguin/game-data': path.resolve(__dirname, './packages/game-data/src/index.ts'),
      '@': path.resolve(__dirname, './apps/web/src'),
    },
  },
  test: {
    setupFiles: [path.resolve(__dirname, './apps/web/src/test-setup.ts')],
  },
});
