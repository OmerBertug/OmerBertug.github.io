import { defineConfig } from 'knip';

export default defineConfig({
  workspaces: {
    '.': {
      entry: [],
      project: [],
    },
    'packages/schemas': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/domain': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'packages/mock-data': {
      entry: ['src/index.ts'],
      project: ['src/**/*.ts'],
    },
    'apps/mobile': {
      entry: ['src/app/**/*.tsx', 'src/app/**/*.ts'],
      project: ['src/**/*.ts', 'src/**/*.tsx'],
    },
    'apps/web': {
      entry: ['src/app/**/*.tsx', 'src/app/**/*.ts', 'app.config.ts'],
      project: ['src/**/*.ts', 'src/**/*.tsx'],
    },
  },
  ignore: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/__tests__/**'],
});
