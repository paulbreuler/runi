import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
      hot: !process.env.VITEST,
      // Disable SSR for tests
      compilerOptions: {
        dev: process.env.NODE_ENV !== 'production',
      },
    }),
    svelteTesting(),
  ],
  resolve: {
    alias: {
      $lib: path.resolve('./src/lib'),
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true,
    passWithNoTests: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      include: ['src/lib/**/*.{ts,svelte}'],
      exclude: [
        'src/lib/**/*.stories.svelte',
        'src/lib/**/*.test.ts',
        'src/lib/components/ui/**/*',
      ],
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
  define: {
    'import.meta.vitest': 'undefined',
  },
});
