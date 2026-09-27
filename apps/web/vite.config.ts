import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@penguin/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@penguin/game-data': path.resolve(__dirname, '../../packages/game-data/src/index.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
