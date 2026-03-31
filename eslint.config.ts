import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
  // ─── Ignored paths ──────────────────────────────────────────────────────────
  {
    ignores: ['dist', 'node_modules', 'public'],
  },

  // ─── Base JS rules ──────────────────────────────────────────────────────────
  js.configs.recommended,

  // ─── TypeScript rules ───────────────────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ─── Project rules ──────────────────────────────────────────────────────────
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // ── React Hooks ─────────────────────────────────────────────────────────
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off', // padrão de loading state é válido
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // ── TypeScript ──────────────────────────────────────────────────────────
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // ── General ─────────────────────────────────────────────────────────────
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'no-duplicate-imports': 'error',
      'object-shorthand': 'error',
    },
  },

  // ─── Context / lib files — allow exporting non-components ───────────────────
  {
    files: ['src/lib/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
