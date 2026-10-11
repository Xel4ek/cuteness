import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig(() => ({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: '../../node_modules/.vite/libs/travelling-salesman-problem',
  resolve: { tsconfigPaths: true },
  test: {
    name: 'travelling-salesman-problem',
    watch: false,
    environment: 'node',
    passWithNoTests: true,
    include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.spec.json',
      include: ['src/**/*.{test,spec}.ts'],
      ignoreSourceErrors: false,
    },
    coverage: {
      reportsDirectory: '../../coverage/libs/travelling-salesman-problem',
      provider: 'v8' as const,
    },
  },
}));
