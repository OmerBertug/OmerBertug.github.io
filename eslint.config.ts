// @ts-check
import { defineConfig } from 'eslint/config';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default defineConfig([
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.base.json', './packages/*/tsconfig.json', './apps/*/tsconfig.json'],
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // TypeScript strict rules
      ...tsPlugin.configs['strict-type-checked'].rules,
      ...tsPlugin.configs['stylistic-type-checked'].rules,

      // No any, no ts-ignore
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // No console.log in shipped code
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // Result types enforced
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',

      // Exhaustive switch
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Style
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    },
  },
]);
