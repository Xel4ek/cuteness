import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig(() => ({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: '../../node_modules/.vite/libs/ui-kit',
  resolve: { tsconfigPaths: true },
  plugins: [angular({ tsconfig: 'tsconfig.spec.json' })],
  test: {
    name: 'ui-kit',
    watch: false,
    environment: 'jsdom',
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    setupFiles: ['src/test-setup.ts'],
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.spec.json',
      include: ['src/**/*.{test,spec}.ts'],
      ignoreSourceErrors: false,
    },
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/ui-kit',
      provider: 'v8' as const,
    },
  },
}));
