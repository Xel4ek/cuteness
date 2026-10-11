import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['apps/*/vitest.config.mts', 'libs/*/vitest.config.mts'],
  },
});
