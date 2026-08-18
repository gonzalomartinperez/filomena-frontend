import { defineConfig, globalIgnores } from 'eslint/config'

import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

import prettierPlugin from 'eslint-plugin-prettier'
import prettierConfig from 'eslint-config-prettier'

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  prettierConfig,

  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          trailingComma: 'all',
          semi: false,
          tabWidth: 2,
          singleQuote: true,
          printWidth: 80,
          endOfLine: 'auto',
          arrowParens: 'always',
          plugins: ['prettier-plugin-tailwindcss'],
        },
        { usePrettierrc: true },
      ],

      'react/react-in-jsx-scope': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
    },
  },

  {
    files: ['next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },

  {
    files: ['postcss.config.mjs', 'next.config.ts', 'eslint.config.mjs'],
    languageOptions: {
      parserOptions: { project: false },
    },
  },

  globalIgnores([
    '.next/**',
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'public/**',
    'out/**',
  ]),
])
